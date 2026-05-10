import { query } from "./_generated/server";

export const tableCounts = query({
  args: {},
  handler: async (ctx) => {
    const tables = ["registrations", "matches", "liveScores", "playerMatchStats", "settings"];
    const counts: Record<string, number> = {};
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      counts[table] = docs.length;
    }
    return counts;
  },
});
