import "~/server/server-only"
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  type InferSelectModel,
  isNull,
  lt,
  sql,
  sum,
} from "drizzle-orm"

import { db, Transaction } from "~/db/connection"
import { playersTable, standingsItemsView, standingsTable } from "~/db/schema"
import { withTxn } from "~/db/transaction"
import { HttpStatusError } from "~/error/http-error"
import { recordHistoryItem } from "~/history/history-store"
import { canUpdateLeague, findLeague } from "~/league/league-store"
import { getLogger } from "~/logger"
import type {
  LeaderboardResult,
  PartialFinalScore,
  PlayerData,
  StandingsItem,
  SubmitMatchResultRequest,
} from "~/riichi/riichi-schema"
import { calculateMatchStandings, sortStandings } from "~/riichi/scores"
import { checkAdminRole, checkAuth } from "~/users/auth"
import type { AuthStatus } from "~/users/users-schema"

const logger = getLogger("riichi-store")

export async function submitRiichi(params: SubmitMatchResultRequest["data"]) {
  logger.info({ params }, "submitRiichi")

  const league = await findLeague(params.leagueId)
  if (league == null || !canUpdateLeague(league)) {
    throw new HttpStatusError(400, "invalid league to submit scores", {
      leagueId: league?.leagueId,
      leagueStatus: league?.status,
    })
  }

  const standings = sortStandings(
    calculateMatchStandings(params.matchResult).map((item, index) => ({
      ...item,
      finalScore:
        params.matchResult[index].adjustedFinalScore ?? item.finalScore,
      nameLower: item.name.toLowerCase(),
    }))
  )

  return await db.transaction(async (tx) => {
    const res = await tx
      .insert(standingsTable)
      .values({
        league_id: params.leagueId,
        data: { standings },
      })
      .returning()
    // load the players
    await addPlayers(tx, res[0].data.standings)

    await recordHistoryItem(tx, {
      sourceUser: null,
      record: {
        action: "createMatchRecord",
        reportedMatch: params,
        standings,
      },
    })
    return res[0]
  })
}

/**
 * Add first-time players to database, and update existing players' last active time
 */
async function addPlayers(tx: Transaction, standings: PartialFinalScore[]) {
  const players = standings.map((s) => s.name)
  const now = new Date()
  await tx
    .insert(playersTable)
    .values(
      players.map((name) => ({
        name,
        name_lower: name.toLowerCase(),
        last_active: now,
      }))
    )
    .onConflictDoUpdate({
      target: playersTable.name_lower,
      set: {
        // `excluded` is the row proposed for insertion
        // See https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
        name: sql`excluded.name`,
        last_active: now,
      },
    })
}

export async function listMatches(params: {
  leagueId: string
  matchId?: string
  limit?: number
  before?: string
  after?: string
}) {
  logger.info({ params }, "listMatches")

  let query = db.select().from(standingsTable).$dynamic()

  const conditions = [
    eq(standingsTable.league_id, params.leagueId),
    isNull(standingsTable.deleted_at),
  ]

  if (params.matchId) {
    query = query.where(eq(standingsTable.id, parseInt(params.matchId, 10)))
  }

  const tokenPrefix = "m_"
  const parsePaginationToken = (token: string | null | undefined) => {
    if (token == null) {
      return null
    }
    const res = Number(token.slice(tokenPrefix.length))
    if (!isNaN(res)) {
      return res
    }
  }

  const before = parsePaginationToken(params.before)
  const after = parsePaginationToken(params.after)

  const limit = params.limit ?? 50

  const queryResult = await (async () => {
    if (before) {
      const res = await query
        .where(and(...conditions, gt(standingsTable.id, before)))
        .orderBy(asc(standingsTable.id), asc(standingsTable.created_at))
        .limit(limit)
      res.reverse()
      return res
    }
    if (after) {
      query = query.where(and(...conditions, lt(standingsTable.id, after)))
    }
    return await query
      .orderBy(desc(standingsTable.id), desc(standingsTable.created_at))
      .limit(limit)
  })()
  const data = queryResult.map(toStandingsItem)

  let prevPage: string | null = null
  let nextPage: string | null = null
  if (data.length > 1) {
    prevPage = "m_" + data[0].matchId
    nextPage = "m_" + data[data.length - 2].matchId
  }

  console.log({ prevPage, nextPage })
  const hasMore = data.length === limit
  return { data: data.slice(0, limit), prev: prevPage, next: nextPage, hasMore }
}

export async function updateMatch(
  params: StandingsItem & { auth: AuthStatus }
): Promise<StandingsItem> {
  return await db.transaction(async (tx) => {
    const before = await tx
      .select()
      .from(standingsTable)
      .where(eq(standingsTable.id, parseInt(params.matchId, 10)))

    const updated = await tx
      .update(standingsTable)
      .set({
        created_at: params.createdAt,
        data: {
          standings: sortStandings(params.standings),
        },
      })
      .where(eq(standingsTable.id, parseInt(params.matchId, 10)))
      .returning()

    if ((updated.length ?? 0) <= 0) {
      throw new HttpStatusError(400, "Unable to update match")
    }
    await addPlayers(tx, params.standings)

    await recordHistoryItem(tx, {
      sourceUser: checkAuth(params.auth).user.uid,
      record: {
        action: "updateMatchRecord",
        before: toStandingsItem(before[0]),
        after: toStandingsItem(updated[0]),
      },
    })

    return (
      await listMatches({
        leagueId: params.leagueId,
        matchId: params.matchId,
        limit: 1,
      })
    ).data[0]
  })
}

export async function listPlayers(params: {
  name?: string
  nameSearch?: string
  limit?: number
}) {
  let { name, nameSearch, limit } = params

  nameSearch = nameSearch?.trim().toLowerCase()
  if (nameSearch != null && nameSearch.length > 0) {
    return await searchPlayers({ nameSearch, limit: limit ?? 10 })
  }

  const res = await db
    .select()
    .from(playersTable)
    .where(
      and(
        isNull(playersTable.deleted_at),
        name != null ? eq(playersTable.name, name) : undefined
      )
    )
    .orderBy(desc(playersTable.last_active))
    .limit(limit ?? 50)

  return res.map(toPlayerItem)
}

async function searchPlayers(params: { nameSearch: string; limit: number }) {
  const { nameSearch, limit } = params

  const searchThrehold = 0.1
  const similaritySql = () =>
    sql`similarity(${playersTable.name_lower}, ${nameSearch})`

  const res = await db
    .select({
      ...getTableColumns(playersTable),
      sim: similaritySql(),
    })
    .from(playersTable)
    .where(
      and(isNull(playersTable.deleted_at), gt(similaritySql(), searchThrehold))
    )
    .orderBy(
      desc(similaritySql()),
      desc(playersTable.last_active),
      asc(playersTable.name_lower)
    )
    .limit(limit)

  return res.map((item) => ({ ...toPlayerItem(item), searchScore: item.sim }))
}

export async function queryLeaderboard(params: {
  leagueId: string
  limit?: number
}): Promise<LeaderboardResult> {
  logger.info({ params }, "queryLeaderboard")

  return await db.transaction(async () => {
    if ((await findLeague(params.leagueId)) == null) {
      throw new HttpStatusError(404, "League not found", {
        tag: "league-not-found",
        leagueId: params.leagueId,
      })
    }

    const t = standingsItemsView
    const res = await db
      .select({
        playerName: sql`min(${t.player_name})`.mapWith(String),
        playerNameLower: t.player_name_lower,
        standing: sum(t.final_score),
        averagePoints: avg(t.points),
        averageRank: avg(t.rank),
        numGames: count(t.final_score),
        // hack: hard code calculation logic here, need to properly migrate
        numPenalties: sql`sum(case when ${t.points} + ${t.uma_points} - 250 <> ${t.final_score} then 1 else 0 end)`,
      })
      .from(t)
      .where(eq(t.league_id, params.leagueId))
      .groupBy(t.player_name_lower)
      .orderBy(desc(sum(t.final_score)), asc(t.player_name_lower))
      .limit(params.limit ?? 25)
    return {
      leagueId: params.leagueId,
      leaderboard: res.map((o) => ({
        playerName: o.playerName,
        playerNameLower: o.playerNameLower,
        standing: Number(o.standing),
        averagePoints: Number(o.averagePoints),
        averageRank: Number(o.averageRank),
        numGames: Number(o.numGames),
        numPenalties: Number(o.numPenalties),
      })),
    }
  })
}

export const patchStanding = withTxn(
  async (
    tx,
    params: {
      leagueId: string
      matchId: string
      patchArgs: {
        confirmed: boolean
      }
      auth: AuthStatus
    }
  ) => {
    const uid = checkAdminRole(params.auth).user.uid
    const before = await tx
      .select()
      .from(standingsTable)
      .where(
        and(
          eq(standingsTable.league_id, params.leagueId),
          eq(standingsTable.id, parseInt(params.matchId, 10))
        )
      )

    const updateRes = await tx
      .update(standingsTable)
      .set({
        confirmed_at: (() => {
          if (params.patchArgs.confirmed) return new Date()
          return null
        })(),
      })
      .where(
        and(
          eq(standingsTable.league_id, params.leagueId),
          eq(standingsTable.id, parseInt(params.matchId, 10))
        )
      )
      .returning()
    if ((updateRes.length ?? 0) > 0) {
      await recordHistoryItem(tx, {
        record: {
          action: "updateMatchRecord",
          before: toStandingsItem(before[0]),
          after: toStandingsItem(updateRes[0]),
        },
        sourceUser: uid,
      })

      return updateRes
    }

    throw new HttpStatusError(400, "Could not update standing")
  }
)

export const deleteStanding = withTxn(
  async (
    tx,
    params: {
      leagueId: string
      matchId: string
      auth: AuthStatus
    }
  ) => {
    checkAdminRole(params.auth)

    const updateRes = await tx
      .update(standingsTable)
      .set({
        deleted_at: new Date(),
      })
      .where(
        and(
          eq(standingsTable.league_id, params.leagueId),
          eq(standingsTable.id, parseInt(params.matchId, 10))
        )
      )
    if ((updateRes.rowCount ?? 0) > 0) {
      return
    }
    throw new HttpStatusError(400, "Could not delete standing")
  }
)

function toStandingsItem(
  obj: InferSelectModel<typeof standingsTable>
): StandingsItem {
  return {
    matchId: String(obj.id),
    leagueId: obj.league_id,
    standings: obj.data.standings,
    confirmed: obj.confirmed_at != null,
    createdAt: obj.created_at!,
    updatedAt: obj.updated_at!,
  }
}

function toPlayerItem(obj: InferSelectModel<typeof playersTable>) {
  return {
    id: String(obj.id),
    name: obj.name,
    nameLower: obj.name_lower,
    lastActive: obj.last_active ?? obj.created_at,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
  } satisfies PlayerData
}
