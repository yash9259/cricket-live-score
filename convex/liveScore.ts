import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("liveScores")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    battingTeam: v.string(),
    bowlingTeam: v.string(),
    runs: v.number(),
    wickets: v.number(),
    overs: v.number(),
    balls: v.number(),
    lastEvent: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("liveScores")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("liveScores", {
      key: "main",
      ...args,
      updatedAt: Date.now(),
    });
  },
});

export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("liveScores")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        lastEvent: "",
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("liveScores", {
      key: "main",
      battingTeam: "Team A",
      bowlingTeam: "Team B",
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      lastEvent: "",
      updatedAt: Date.now(),
    });
  },
});
