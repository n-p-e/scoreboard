import * as z from "zod/mini"

export const LeagueDataZ = z.object({
  leagueId: z.string(),
  displayName: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type LeagueData = z.infer<typeof LeagueDataZ>
