import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./adminAuth";

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
    token: v.string(),
    battingTeam: v.string(),
    bowlingTeam: v.string(),
    striker: v.optional(v.string()),
    nonStriker: v.optional(v.string()),
    bowler: v.optional(v.string()),
    runs: v.number(),
    wickets: v.number(),
    overs: v.number(),
    balls: v.number(),
    lastEvent: v.string(),
    inning: v.number(),
    target: v.optional(v.number()),
    firstInningScore: v.optional(
      v.object({
        runs: v.number(),
        wickets: v.number(),
        overs: v.number(),
        balls: v.number(),
      })
    ),
    strikerRuns: v.optional(v.number()),
    strikerBalls: v.optional(v.number()),
    nonStrikerRuns: v.optional(v.number()),
    nonStrikerBalls: v.optional(v.number()),
    bowlerRuns: v.optional(v.number()),
    bowlerWickets: v.optional(v.number()),
    bowlerBalls: v.optional(v.number()),
    matchId: v.optional(v.id("matches")),
    showAnimation: v.optional(v.string()),
    animationId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const existing = await ctx.db
      .query("liveScores")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();

    const patchData = {
      matchId: args.matchId,
      battingTeam: args.battingTeam,
      bowlingTeam: args.bowlingTeam,
      striker: args.striker,
      nonStriker: args.nonStriker,
      bowler: args.bowler,
      runs: args.runs,
      wickets: args.wickets,
      overs: args.overs,
      balls: args.balls,
      lastEvent: args.lastEvent,
      inning: args.inning,
      target: args.target,
      firstInningScore: args.firstInningScore,
      strikerRuns: args.strikerRuns,
      strikerBalls: args.strikerBalls,
      nonStrikerRuns: args.nonStrikerRuns,
      nonStrikerBalls: args.nonStrikerBalls,
      bowlerRuns: args.bowlerRuns,
      bowlerWickets: args.bowlerWickets,
      bowlerBalls: args.bowlerBalls,
      showAnimation: args.showAnimation,
      animationId: args.animationId,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patchData);
      return existing._id;
    }

    return await ctx.db.insert("liveScores", {
      key: "main",
      ...patchData,
    });
  },
});

export const reset = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const existing = await ctx.db
      .query("liveScores")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        battingTeam: "",
        bowlingTeam: "",
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        striker: "",
        nonStriker: "",
        bowler: "",
        lastEvent: "",
        inning: 1,
        matchId: undefined,
        showAnimation: undefined,
        animationId: undefined,
        target: undefined,
        firstInningScore: undefined,
        strikerRuns: 0,
        strikerBalls: 0,
        nonStrikerRuns: 0,
        nonStrikerBalls: 0,
        bowlerRuns: 0,
        bowlerWickets: 0,
        bowlerBalls: 0,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("liveScores", {
      key: "main",
      battingTeam: "",
      bowlingTeam: "",
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      striker: "",
      nonStriker: "",
      bowler: "",
      lastEvent: "",
      inning: 1,
      matchId: undefined,
      showAnimation: undefined,
      animationId: undefined,
      target: undefined,
      firstInningScore: undefined,
      strikerRuns: 0,
      strikerBalls: 0,
      nonStrikerRuns: 0,
      nonStrikerBalls: 0,
      bowlerRuns: 0,
      bowlerWickets: 0,
      bowlerBalls: 0,
      updatedAt: Date.now(),
    });
  },
});
