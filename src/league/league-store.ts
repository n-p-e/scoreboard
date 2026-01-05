import "~/server/server-only"

import { and, eq, type InferSelectModel, isNull } from "drizzle-orm"
import { db } from "~/db/connection"
import { leaguesTable } from "~/db/schema"
import type { LeagueData } from "~/league/league-schema"

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
    .limit(params.limit ?? 50)
  return res.map(toLeagueModel)
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
