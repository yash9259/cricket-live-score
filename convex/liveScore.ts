import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./adminAuth";

const stripUndefined = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
};

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    // Get the most recently updated score record
    const current = await ctx.db
      .query("liveScores")
      .withIndex("by_updatedAt")
      .order("desc")
      .take(1);

    return current[0] ?? null;
  },
});

export const getByMatchId = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liveScores")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
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
    strikerFours: v.optional(v.number()),
    strikerSixes: v.optional(v.number()),
    nonStrikerRuns: v.optional(v.number()),
    nonStrikerBalls: v.optional(v.number()),
    nonStrikerFours: v.optional(v.number()),
    nonStrikerSixes: v.optional(v.number()),
    bowlerRuns: v.optional(v.number()),
    bowlerWickets: v.optional(v.number()),
    bowlerBalls: v.optional(v.number()),
    matchId: v.optional(v.id("matches")),
    ballHistory: v.optional(v.array(v.string())),
    showAnimation: v.optional(v.string()),
    animationId: v.optional(v.number()),
    outPlayers: v.optional(v.array(v.string())),
    tossWinner: v.optional(v.string()),
    tossDecision: v.optional(v.union(v.literal("bat"), v.literal("bowl"))),
    batsmenInning1: v.optional(v.array(v.object({ 
      name: v.string(), runs: v.number(), balls: v.number(), isOut: v.boolean(),
      fours: v.optional(v.number()), sixes: v.optional(v.number()),
      dots: v.optional(v.number()), points: v.optional(v.number()) 
    }))),
    bowlersInning1: v.optional(v.array(v.object({ 
      name: v.string(), runs: v.number(), wickets: v.number(), balls: v.number(),
      dots: v.optional(v.number()), maidens: v.optional(v.number()), extras: v.optional(v.number()), points: v.optional(v.number())
    }))),
    batsmenInning2: v.optional(v.array(v.object({ 
      name: v.string(), runs: v.number(), balls: v.number(), isOut: v.boolean(),
      fours: v.optional(v.number()), sixes: v.optional(v.number()),
      dots: v.optional(v.number()), points: v.optional(v.number()) 
    }))),
    bowlersInning2: v.optional(v.array(v.object({ 
      name: v.string(), runs: v.number(), wickets: v.number(), balls: v.number(),
      dots: v.optional(v.number()), maidens: v.optional(v.number()), extras: v.optional(v.number()), points: v.optional(v.number())
    }))),
    showScoreboard: v.optional(v.boolean()),
    detailedBallHistory: v.optional(v.array(v.object({
      over: v.number(),
      ball: v.number(),
      runs: v.number(),
      extraRuns: v.optional(v.number()),
      isWicket: v.boolean(),
      bowler: v.string(),
      batsman: v.string(),
      event: v.string(),
      inning: v.number(),
      timestamp: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    // Try to find by matchId first if provided
    let existing = null;
    if (args.matchId) {
      existing = await ctx.db
        .query("liveScores")
        .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
        .unique();
    }

    // Fallback to "main" key for compatibility or if no matchId
    if (!existing) {
      existing = await ctx.db
        .query("liveScores")
        .withIndex("by_key", (q) => q.eq("key", "main"))
        .unique();
    }

    const optionalData = stripUndefined({
      matchId: args.matchId,
      striker: args.striker,
      nonStriker: args.nonStriker,
      bowler: args.bowler,
      target: args.target,
      firstInningScore: args.firstInningScore,
      strikerRuns: args.strikerRuns,
      strikerBalls: args.strikerBalls,
      strikerFours: args.strikerFours,
      strikerSixes: args.strikerSixes,
      nonStrikerRuns: args.nonStrikerRuns,
      nonStrikerBalls: args.nonStrikerBalls,
      nonStrikerFours: args.nonStrikerFours,
      nonStrikerSixes: args.nonStrikerSixes,
      bowlerRuns: args.bowlerRuns,
      bowlerWickets: args.bowlerWickets,
      bowlerBalls: args.bowlerBalls,
      ballHistory: args.ballHistory,
      showAnimation: args.showAnimation,
      animationId: args.animationId,
      outPlayers: args.outPlayers,
      tossWinner: args.tossWinner,
      tossDecision: args.tossDecision,
      batsmenInning1: args.batsmenInning1,
      bowlersInning1: args.bowlersInning1,
      batsmenInning2: args.batsmenInning2,
      bowlersInning2: args.bowlersInning2,
      detailedBallHistory: args.detailedBallHistory,
      showScoreboard: args.showScoreboard,
    });

    const patchData = {
      battingTeam: args.battingTeam,
      bowlingTeam: args.bowlingTeam,
      runs: args.runs,
      wickets: args.wickets,
      overs: args.overs,
      balls: args.balls,
      lastEvent: args.lastEvent,
      inning: args.inning,
      ...optionalData,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patchData);
      return existing._id;
    }

    return await ctx.db.insert("liveScores", {
      key: args.matchId ? `match-${args.matchId}` : "main",
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

    const existingScores = await ctx.db
      .query("liveScores")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .take(2);
    const existing = existingScores[0] ?? null;

    if (existingScores.length > 1) {
      for (const duplicate of existingScores.slice(1)) {
        await ctx.db.delete(duplicate._id);
      }
    }

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
        outPlayers: [],
        strikerRuns: 0,
        strikerBalls: 0,
        strikerFours: 0,
        strikerSixes: 0,
        nonStrikerRuns: 0,
        nonStrikerBalls: 0,
        nonStrikerFours: 0,
        nonStrikerSixes: 0,
        bowlerRuns: 0,
        bowlerWickets: 0,
        bowlerBalls: 0,
        ballHistory: [],
        batsmenInning1: [],
        bowlersInning1: [],
        batsmenInning2: [],
        bowlersInning2: [],
        detailedBallHistory: [],
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
      lastEvent: "",
      inning: 1,
      outPlayers: [],
      strikerRuns: 0,
      strikerBalls: 0,
      nonStrikerRuns: 0,
      nonStrikerBalls: 0,
      bowlerRuns: 0,
      bowlerWickets: 0,
      bowlerBalls: 0,
      ballHistory: [],
      batsmenInning1: [],
      bowlersInning1: [],
      batsmenInning2: [],
      bowlersInning2: [],
      detailedBallHistory: [],
      updatedAt: Date.now(),
    });
  },
});
