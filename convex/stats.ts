import { query } from "./_generated/server";

export const calculateManOfTheSeries = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").collect();
    const momCounts: Record<string, number> = {};

    matches.forEach((match) => {
      if (match.status === "completed" && match.manOfTheMatch) {
        momCounts[match.manOfTheMatch] = (momCounts[match.manOfTheMatch] || 0) + 1;
      }
    });

    const sorted = Object.entries(momCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return sorted;
  },
});
