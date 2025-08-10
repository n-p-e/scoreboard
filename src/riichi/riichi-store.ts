import "~/server/server-only"

import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  type InferSelectModel,
  isNull,
  sql,
  sum,
} from "drizzle-orm"
import { db, Transaction } from "~/db/connection"
import { playersTable, standingsItemsView, standingsTable } from "~/db/schema"
import { permissionDenied } from "~/error/errors"
import { HttpStatusError } from "~/error/http-error"
import { findLeague } from "~/league/league-store"
import { getLogger } from "~/logger"
import type {
  FinalScore,
  LeaderboardResult,
  MatchResultSubmission,
  PlayerData,
  StandingsItem,
} from "~/riichi/riichi-schema"
import { calculateMatchStandings } from "~/riichi/scores"
import type { AuthStatusResult } from "~/users/users-schema"

const logger = getLogger("riichi-store")

export async function submitRiichi(params: MatchResultSubmission) {
  logger.info({ params }, "submitRiichi")

  const standings = calculateMatchStandings(params.matchResult)
    .sort((a, b) => a.rank - b.rank)
    .map((item) => ({
      ...item,
      nameLower: item.name.toLowerCase(),
    }))

  // Apply adjusts
  params.matchResult.forEach((result, index) => {
    if (result.adjustedFinalScore != null) {
      standings[index].finalScore = result.adjustedFinalScore
    }
  })

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
    return res[0]
  })
}

/**
 * Add first-time players to database, and update existing players' last active time
 */
async function addPlayers(tx: Transaction, standings: FinalScore[]) {
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
}) {
  logger.info({ params }, "listMatches")

  let query = db
    .select()
    .from(standingsTable)
    .$dynamic()
    .where(
      and(
        isNull(standingsTable.deleted_at),
        eq(standingsTable.league_id, params.leagueId)
      )
    )

  if (params.matchId) {
    query = query.where(eq(standingsTable.id, parseInt(params.matchId, 10)))
  }

  const res = await query
    .orderBy(desc(standingsTable.created_at))
    .limit(params.limit ?? 50)

  return res.map(toStandingsItem)
}

export async function updateMatch(
  params: StandingsItem
): Promise<StandingsItem> {
  return await db.transaction(async (tx) => {
    const updated = await tx.update(standingsTable).set({
      data: {
        standings: params.standings
          .slice()
          .sort((a, b) => b.finalScore - a.finalScore)
          .map((item, index) => ({
            ...item,
            rank: index,
          })),
      },
    })

    if ((updated.rowCount ?? 0) <= 0) {
      throw new HttpStatusError(400, "Unable to update match")
    }
    await addPlayers(tx, params.standings)

    return (
      await listMatches({
        leagueId: params.leagueId,
        matchId: params.matchId,
        limit: 1,
      })
    )[0]
  })
}

export async function listPlayers(params: { name?: string; limit?: number }) {
  const res = await db
    .select()
    .from(playersTable)
    .where(
      and(params.name != null ? eq(playersTable.name, params.name) : undefined)
    )
    .orderBy(desc(playersTable.last_active))
    .limit(params.limit ?? 50)

  return res.map(toPlayerItem)
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

    const res = await db
      .select({
        playerName: sql`min(${standingsItemsView.player_name})`.mapWith(String),
        playerNameLower: standingsItemsView.player_name_lower,
        standing: sum(standingsItemsView.final_score),
        averagePoints: avg(standingsItemsView.points),
        averageRank: avg(standingsItemsView.rank),
        numGames: count(standingsItemsView.final_score),
      })
      .from(standingsItemsView)
      .where(eq(standingsItemsView.league_id, params.leagueId))
      .groupBy(standingsItemsView.player_name_lower)
      .orderBy(
        desc(sum(standingsItemsView.final_score)),
        asc(standingsItemsView.player_name_lower)
      )
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
      })),
    }
  })
}

export async function patchStanding(params: {
  leagueId: string
  matchId: string
  patchArgs: {
    confirmed: boolean
  }
  auth: AuthStatusResult
}) {
  if (!params.auth.loggedIn || !params.auth.roles.includes("admin")) {
    permissionDenied()
  }

  const updateRes = await db
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
  if ((updateRes.rowCount ?? 0) > 0) {
    return
  }
  throw new HttpStatusError(400, "Could not update standing")
}

export async function deleteStanding(params: {
  leagueId: string
  matchId: string
  user: AuthStatusResult
}) {
  if (!params.user.loggedIn || !params.user.roles.includes("admin")) {
    permissionDenied()
  }

  const updateRes = await db
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

function toPlayerItem(obj: InferSelectModel<typeof playersTable>): PlayerData {
  return {
    id: String(obj.id),
    name: obj.name,
    lastActive: obj.last_active ?? obj.created_at,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
  }
}
