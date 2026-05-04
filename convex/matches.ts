import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./adminAuth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("desc").collect();
    return await Promise.all(
      matches.map(async (match) => {
        const teamA = await ctx.db.get(match.teamAId);
        const teamB = await ctx.db.get(match.teamBId);
        return {
          ...match,
          teamAName: teamA?.teamName ?? "Unknown",
          teamBName: teamB?.teamName ?? "Unknown",
          captainAName: teamA?.captainName ?? "Unknown",
          captainBName: teamB?.captainName ?? "Unknown",
          phoneA: teamA?.phone ?? "",
          phoneB: teamB?.phone ?? "",
        };
      })
    );
  },
});

export const createManual = mutation({
  args: {
    token: v.string(),
    teamAId: v.id("registrations"),
    teamBId: v.id("registrations"),
    categoryId: v.string(),
    categoryLabel: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    if (args.teamAId === args.teamBId) {
      throw new Error("A team cannot play against itself.");
    }

    return await ctx.db.insert("matches", {
      teamAId: args.teamAId,
      teamBId: args.teamBId,
      categoryId: args.categoryId,
      categoryLabel: args.categoryLabel,
      status: "scheduled",
      createdAt: Date.now(),
    });
  },
});

export const generateAutomatic = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    // Get all registrations
    const registrations = await ctx.db.query("registrations").collect();

    // Group by category
    const byCategory: Record<string, any[]> = {};
    registrations.forEach((reg) => {
      if (!byCategory[reg.categoryId]) {
        byCategory[reg.categoryId] = [];
      }
      byCategory[reg.categoryId].push(reg);
    });

    let matchesCreated = 0;

    // For each category, shuffle and pair
    for (const categoryId in byCategory) {
      const teams = byCategory[categoryId];
      const categoryLabel = teams[0].categoryLabel;

      // Fisher-Yates Shuffle
      for (let i = teams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teams[i], teams[j]] = [teams[j], teams[i]];
      }

      // Pair them up
      for (let i = 0; i < teams.length - 1; i += 2) {
        await ctx.db.insert("matches", {
          teamAId: teams[i]._id,
          teamBId: teams[i + 1]._id,
          categoryId,
          categoryLabel,
          status: "scheduled",
          createdAt: Date.now(),
        });
        matchesCreated++;
      }
    }

    return matchesCreated;
  },
});

export const deleteMatch = mutation({
  args: {
    token: v.string(),
    id: v.id("matches"),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    await ctx.db.delete(args.id);
  },
});

export const deleteAllScheduled = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    const scheduled = await ctx.db
      .query("matches")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();
    
    for (const match of scheduled) {
      await ctx.db.delete(match._id);
    }
  },
});

export const startMatch = mutation({
  args: {
    token: v.string(),
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    const teamA = await ctx.db.get(match.teamAId);
    const teamB = await ctx.db.get(match.teamBId);

    if (!teamA || !teamB) throw new Error("Teams not found");

    // Update match status
    await ctx.db.patch(args.matchId, { status: "live" });

    // Update live scores
    const existing = await ctx.db
      .query("liveScores")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .unique();

    const patchData = {
      matchId: args.matchId,
      battingTeam: teamA.teamName,
      bowlingTeam: teamB.teamName,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      striker: "",
      nonStriker: "",
      bowler: "",
      lastEvent: "Match Started",
      inning: 1,
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
    };

    if (existing) {
      await ctx.db.patch(existing._id, patchData);
    } else {
      await ctx.db.insert("liveScores", {
        key: "main",
        ...patchData,
      });
    }
  },
});

export const createMany = mutation({
  args: {
    token: v.string(),
    matches: v.array(
      v.object({
        teamAId: v.id("registrations"),
        teamBId: v.id("registrations"),
        categoryId: v.string(),
        categoryLabel: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    for (const match of args.matches) {
      await ctx.db.insert("matches", {
        ...match,
        status: "scheduled",
        createdAt: Date.now(),
      });
    }
    return args.matches.length;
  },
});
