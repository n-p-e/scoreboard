import "~/server/server-only"

import { sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  bigint,
  integer,
  jsonb,
  pgTable,
  pgView,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { uuidv7 } from "uuidv7"
import type { FinalScore } from "~/riichi/riichi-schema"

function createdUpdatedAtCols() {
  return {
    created_at: timestamp()
      .notNull()
      .defaultNow()
      .$default(() => new Date()),
    updated_at: timestamp()
      .notNull()
      .defaultNow()
      .$default(() => new Date())
      .$onUpdate(() => new Date()),
    deleted_at: timestamp().default(sql`null`),
  }
}

export const leaguesTable = pgTable("leagues", {
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedAlwaysAsIdentity({ startWith: 10000 }),
  league_id: varchar().notNull().unique(),
  display_name: varchar().notNull().unique(),
  ...createdUpdatedAtCols(),
})

export const standingsTable = pgTable("standings", {
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedAlwaysAsIdentity({ startWith: 10000 }),
  league_id: varchar()
    .notNull()
    .references((): AnyPgColumn => leaguesTable.league_id, {
      onDelete: "cascade",
    }),
  data: jsonb().notNull().$type<{ standings: FinalScore[] }>(),
  confirmed_at: timestamp(),
  ...createdUpdatedAtCols(),
})

export const standingsItemsView = pgView("standings_items", {
  league_id: varchar().notNull(),
  player_name: varchar().notNull(),
  player_name_lower: varchar().notNull(),
  points: integer().notNull(),
  final_score: integer().notNull(),
  rank: integer().notNull(),
}).as(sql`
  select
      ${standingsTable.league_id} as league_id,
      ${standingsTable.created_at} as created_at,
      ${standingsTable.updated_at} as updated_at,
      player_data->>'name' as player_name,
      coalesce(player_data->>'nameLower', lower(player_data->>'name')) as player_name_lower,
      (player_data->>'points')::int as points,
      (player_data->>'finalScore')::int as final_score,
      (player_data->>'rank')::int as rank
    from ${standingsTable}
    cross join lateral jsonb_array_elements(${standingsTable.data} -> 'standings') as player_data
    where ${standingsTable.deleted_at} is null
  `)

export const usersTable = pgTable("users", {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  username: varchar().notNull().unique(),
  password_hash: varchar(),
  ...createdUpdatedAtCols(),
})

export const rolesTable = pgTable(
  "user_roles",
  {
    user_id: uuid().notNull(),
    role: varchar().notNull(),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.role] })]
)

export const playersTable = pgTable("players", {
  id: bigint({ mode: "number" })
    .primaryKey()
    .generatedAlwaysAsIdentity({ startWith: 10000 }),
  name: varchar().notNull().unique(),
  name_lower: varchar().notNull().unique(),
  last_active: timestamp(),
  user_id: uuid().references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  ...createdUpdatedAtCols(),
})
