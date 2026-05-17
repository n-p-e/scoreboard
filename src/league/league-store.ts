import "~/server/server-only"
import {
  and,
  desc,
  eq,
  gte,
  type InferSelectModel,
  isNull,
  lt,
  sql,
} from "drizzle-orm"

import { db } from "~/db/connection"
import { leaguesTable, standingsTable } from "~/db/schema"
import { HttpStatusError } from "~/error/http-error"
import { recordHistoryItem } from "~/history/history-store"
import type {
  LeagueData,
  LeaguePlayerGames,
  LeagueStats,
  LeagueStatsItem,
  PatchLeagueRequest,
  StatsPeriod,
} from "~/league/league-schema"
import { getLogger } from "~/logger"
import { checkAdminRole } from "~/users/auth"
import type { AuthStatus } from "~/users/users-schema"

const logger = getLogger("league-store")

export async function findLeague(leagueId: string) {
  const res = await db
    .select()
    .from(leaguesTable)
    .where(
      and(isNull(leaguesTable.deleted_at), eq(leaguesTable.league_id, leagueId))
    )

  if (res.length === 0) return null
  return toLeagueModel(res[0])
}

export async function listLeagues(params: { limit?: number }) {
  const res = await db
    .select()
    .from(leaguesTable)
    .where(isNull(leaguesTable.deleted_at))
    .orderBy(desc(leaguesTable.created_at))
    .limit(params.limit ?? 50)
  return res.map(toLeagueModel)
}

export async function queryLeagueStats(params: {
  leagueId: string
  period: StatsPeriod
  timezone?: string
  start?: string
  end?: string
}): Promise<LeagueStats> {
  if ((await findLeague(params.leagueId)) == null) {
    throw new HttpStatusError(404, "League not found", {
      tag: "league-not-found",
      leagueId: params.leagueId,
    })
  }

  const timezoneOffsetMinutes = parseTimezoneOffsetMinutes(params.timezone)
  const { startAt, endBefore } = resolveStatsRange({
    start: params.start,
    end: params.end,
    timezoneOffsetMinutes,
  })

  const matches = await db
    .select({
      createdAt: standingsTable.created_at,
      standings: standingsTable.data,
    })
    .from(standingsTable)
    .where(
      and(
        isNull(standingsTable.deleted_at),
        eq(standingsTable.league_id, params.leagueId),
        gte(standingsTable.created_at, startAt),
        endBefore == null ? undefined : lt(standingsTable.created_at, endBefore)
      )
    )
    .orderBy(desc(standingsTable.created_at))

  const periodsMap = new Map<
    string,
    {
      startDate: string
      endDate: string
      players: Map<string, LeaguePlayerGames>
    }
  >()

  for (const match of matches) {
    const { startDate, endDate } = getPeriodBounds(
      match.createdAt,
      params.period,
      timezoneOffsetMinutes
    )
    const key = `${startDate}:${endDate}`
    let item = periodsMap.get(key)

    if (item == null) {
      item = {
        startDate,
        endDate,
        players: new Map(),
      }
      periodsMap.set(key, item)
    }

    for (const player of match.standings.standings) {
      const playerNameLower = player.name.toLowerCase()
      const current = item.players.get(playerNameLower)
      if (current == null) {
        item.players.set(playerNameLower, {
          playerName: player.name,
          playerNameLower,
          games: 1,
        })
        continue
      }

      current.games += 1
    }
  }

  const periods = Array.from(periodsMap.values())
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map<LeagueStatsItem>((item) => ({
      startDate: item.startDate,
      endDate: item.endDate,
      players: Array.from(item.players.values()).sort((a, b) => {
        if (b.games !== a.games) return b.games - a.games
        return a.playerNameLower.localeCompare(b.playerNameLower)
      }),
    }))

  return {
    leagueId: params.leagueId,
    period: params.period,
    items: periods,
  }
}

export async function patchLeague(params: {
  leagueId: string
  auth: AuthStatus
  patch: PatchLeagueRequest
}) {
  const { leagueId, patch } = params
  logger.info(params, "patchLeague")

  const auth = checkAdminRole(params.auth)

  return await db.transaction(async (tx) => {
    const updateResult = await tx
      .update(leaguesTable)
      .set({
        status: (() => {
          if (patch.enabled === undefined) return leaguesTable.status
          if (patch.enabled) return sql`null`
          return "disabled"
        })(),
      })
      .where(eq(leaguesTable.league_id, leagueId))
      .returning()

    await recordHistoryItem(tx, {
      sourceUser: auth.user.uid,
      record: {
        action: "updateLeague",
        patch,
      },
    })

    return updateResult
  })
}

export function canUpdateLeague(league: LeagueData) {
  return league.status !== "disabled"
}

function toLeagueModel(obj: InferSelectModel<typeof leaguesTable>): LeagueData {
  return {
    leagueId: obj.league_id,
    displayName: obj.display_name,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
    status: obj.status,
  }
}

function getPeriodBounds(
  date: Date,
  period: StatsPeriod,
  timezoneOffsetMinutes: number
) {
  const shifted = new Date(date.getTime() + timezoneOffsetMinutes * 60_000)
  const start = new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate()
    )
  )

  if (period === "week") {
    const dayOffset = (start.getUTCDay() + 6) % 7
    start.setUTCDate(start.getUTCDate() - dayOffset)
  }

  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + (period === "week" ? 6 : 0))

  return {
    startDate: toDateString(start),
    endDate: toDateString(end),
  }
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

function resolveStatsRange(params: {
  start?: string
  end?: string
  timezoneOffsetMinutes: number
}) {
  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() - 32)

  const startAt =
    params.start == null
      ? defaultStart
      : parseDateBoundary(params.start, params.timezoneOffsetMinutes, "start")

  const endBefore =
    params.end == null
      ? null
      : parseDateBoundary(params.end, params.timezoneOffsetMinutes, "end")

  if (endBefore != null && startAt >= endBefore) {
    throw new HttpStatusError(400, "Invalid date range", {
      tag: "invalid-date-range",
      start: params.start ?? null,
      end: params.end ?? null,
    })
  }

  return {
    startAt,
    endBefore,
  }
}

function parseDateBoundary(
  input: string,
  timezoneOffsetMinutes: number,
  mode: "start" | "end"
) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [yearText, monthText, dayText] = input.split("-")
    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)

    const utcMillis =
      Date.UTC(year, month - 1, day + (mode === "end" ? 1 : 0)) -
      timezoneOffsetMinutes * 60_000
    return new Date(utcMillis)
  }

  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpStatusError(400, "Invalid date parameter", {
      tag: "invalid-date-parameter",
      value: input,
    })
  }
  return parsed
}

function parseTimezoneOffsetMinutes(input?: string) {
  if (input == null || input.length === 0) return 0

  const offset = extractTimezoneOffset(input)
  if (offset === "Z") return 0

  const match = /^([+-])(\d{2}):?(\d{2})$/.exec(offset)
  if (match == null) {
    throw new HttpStatusError(400, "Invalid timezone offset", {
      tag: "invalid-timezone-offset",
      timezone: input,
    })
  }

  const [, sign, hoursText, minutesText] = match
  const hours = Number(hoursText)
  const minutes = Number(minutesText)

  if (hours > 23 || minutes > 59) {
    throw new HttpStatusError(400, "Invalid timezone offset", {
      tag: "invalid-timezone-offset",
      timezone: input,
    })
  }

  const totalMinutes = hours * 60 + minutes
  return sign === "+" ? totalMinutes : -totalMinutes
}

function extractTimezoneOffset(input: string) {
  const directOffset = /^(Z|[+-]\d{2}:?\d{2})$/.exec(input)
  if (directOffset != null) return directOffset[0]

  const timestampOffset = /(Z|[+-]\d{2}:?\d{2})$/.exec(input)
  if (timestampOffset != null) return timestampOffset[1]

  throw new HttpStatusError(400, "Invalid timezone offset", {
    tag: "invalid-timezone-offset",
    timezone: input,
  })
}
