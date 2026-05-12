import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./adminAuth";
import { calculateBattingPoints, calculateBowlingPoints } from "./points";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("desc").collect();
    return await Promise.all(
      matches.map(async (match) => {
        const teamA = await ctx.db.get(match.teamAId);
        const teamB = await ctx.db.get(match.teamBId);
        const winner = match.winnerId ? await ctx.db.get(match.winnerId) : null;

        // Fetch live score if status is live
        let liveScore = null;
        if (match.status === "live") {
          liveScore = await ctx.db
            .query("liveScores")
            .withIndex("by_matchId", (q) => q.eq("matchId", match._id))
            .unique();
        }

        return {
          ...match,
          teamAName: teamA?.teamName ?? "Unknown",
          teamBName: teamB?.teamName ?? "Unknown",
          captainAName: teamA?.captainName ?? "Unknown",
          captainBName: teamB?.captainName ?? "Unknown",
          phoneA: teamA?.phone ?? "",
          phoneB: teamB?.phone ?? "",
          winnerName: winner?.teamName ?? null,
          tossWinner: match.tossWinner || null,
          tossDecision: match.tossDecision || null,
          liveScore: liveScore ? {
            runs: liveScore.runs,
            wickets: liveScore.wickets,
            overs: liveScore.overs,
            balls: liveScore.balls,
            battingTeam: liveScore.battingTeam,
            bowlingTeam: liveScore.bowlingTeam,
            inning: liveScore.inning,
            firstInningScore: liveScore.firstInningScore,
          } : null,
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createManual = mutation({
  args: {
    token: v.string(),
    teamAId: v.id("registrations"),
    teamBId: v.id("registrations"),
    categoryId: v.string(),
    categoryLabel: v.string(),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
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
      date: args.date,
      time: args.time,
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

    // Cleanup associated live scores
    const liveScores = await ctx.db
      .query("liveScores")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.id))
      .collect();

    for (const score of liveScores) {
      await ctx.db.delete(score._id);
    }

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
        date: v.optional(v.string()),
        time: v.optional(v.string()),
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

export const completeMatch = mutation({
  args: {
    token: v.string(),
    matchId: v.optional(v.id("matches")),
    winnerId: v.optional(v.id("registrations")),
    finalScoreA: v.object({ runs: v.number(), wickets: v.number(), overs: v.number(), balls: v.number() }),
    finalScoreB: v.optional(v.object({ runs: v.number(), wickets: v.number(), overs: v.number(), balls: v.number() })),
    // Fallback if matchId is missing
    teamAName: v.optional(v.string()),
    teamBName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    let matchId = args.matchId;

    if (!matchId && args.teamAName && args.teamBName) {
      // Try to find the match by team names
      const allMatches = await ctx.db.query("matches").collect();
      const registrations = await ctx.db.query("registrations").collect();

      const teamA = registrations.find(r => r.teamName === args.teamAName);
      const teamB = registrations.find(r => r.teamName === args.teamBName);

      if (teamA && teamB) {
        const foundMatch = allMatches.find(m =>
          m.status !== "completed" &&
          ((m.teamAId === teamA._id && m.teamBId === teamB._id) ||
            (m.teamAId === teamB._id && m.teamBId === teamA._id))
        );
        if (foundMatch) {
          matchId = foundMatch._id;
        }
      }
    }

    if (!matchId) {
      throw new Error("Match not found. Please ensure teams are registered and a match is scheduled.");
    }

    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");

    // 1. Get liveScore for this match
    const liveScore = await ctx.db
      .query("liveScores")
      .withIndex("by_matchId", (q) => q.eq("matchId", matchId))
      .unique();

    let momName = undefined;

    if (liveScore) {
      const teamAReg = await ctx.db.get(match.teamAId);
      const teamBReg = await ctx.db.get(match.teamBId);
      const winner = args.winnerId ? await ctx.db.get(args.winnerId) : null;
      const winnerName = winner?.teamName;

      const playerStats: Record<string, {
        batting: number, bowling: number, total: number, teamId: any, teamName: string,
        runs: number, wickets: number, fours: number, sixes: number, balls: number, maidens: number
      }> = {};

      const initializePlayer = (name: string, teamId: any, teamName: string) => {
        const key = `${teamName}:${name}`;
        if (!playerStats[key]) {
          playerStats[key] = {
            batting: 0, bowling: 0, total: 0, teamId, teamName,
            runs: 0, wickets: 0, fours: 0, sixes: 0, balls: 0, maidens: 0
          };
        }
      };

      const processPlayer = (
        name: string,
        teamId: any,
        teamName: string,
        stats?: { runs?: number, wickets?: number, fours?: number, sixes?: number, balls?: number, maidens?: number }
      ) => {
        const key = `${teamName}:${name}`;
        initializePlayer(name, teamId, teamName);
        if (stats) {
          playerStats[key].runs += stats.runs || 0;
          playerStats[key].wickets += stats.wickets || 0;
          playerStats[key].fours += stats.fours || 0;
          playerStats[key].sixes += stats.sixes || 0;
          playerStats[key].balls += stats.balls || 0;
          playerStats[key].maidens += stats.maidens || 0;

          // Recalculate points based on new rules
          playerStats[key].batting = calculateBattingPoints({
            runs: playerStats[key].runs,
            fours: playerStats[key].fours,
            sixes: playerStats[key].sixes
          });
          playerStats[key].bowling = calculateBowlingPoints({
            wickets: playerStats[key].wickets,
            maidens: playerStats[key].maidens
          });
          playerStats[key].total = playerStats[key].batting + playerStats[key].bowling;
        }
      };

      // 1. Initialize all registered players with 0 points
      teamAReg?.players.forEach(p => initializePlayer(p.name, match.teamAId, teamAReg.teamName));
      teamBReg?.players.forEach(p => initializePlayer(p.name, match.teamBId, teamBReg.teamName));

      // 2. Process points from live score
      liveScore.batsmenInning1?.forEach(p => processPlayer(p.name, match.teamAId, teamAReg?.teamName ?? "", { runs: p.runs, fours: p.fours, sixes: p.sixes, balls: p.balls }));
      liveScore.bowlersInning1?.forEach(p => processPlayer(p.name, match.teamBId, teamBReg?.teamName ?? "", { wickets: p.wickets, balls: p.balls, maidens: p.maidens }));
      liveScore.batsmenInning2?.forEach(p => processPlayer(p.name, match.teamBId, teamBReg?.teamName ?? "", { runs: p.runs, fours: p.fours, sixes: p.sixes, balls: p.balls }));
      liveScore.bowlersInning2?.forEach(p => processPlayer(p.name, match.teamAId, teamAReg?.teamName ?? "", { wickets: p.wickets, balls: p.balls, maidens: p.maidens }));

      // 3. Find MoM
      let maxPoints = -Infinity;
      for (const [key, stats] of Object.entries(playerStats)) {
        const [, pName] = key.split(":");
        if (winnerName) {
          if (stats.teamName === winnerName && stats.total > maxPoints) {
            maxPoints = stats.total;
            momName = pName;
          }
        } else {
          if (stats.total > maxPoints) {
            maxPoints = stats.total;
            momName = pName;
          }
        }
      }

      // 4. Save stats to DB
      for (const [key, stats] of Object.entries(playerStats)) {
        const [, pName] = key.split(":");
        await ctx.db.insert("playerMatchStats", {
          matchId: matchId,
          teamId: stats.teamId,
          teamName: stats.teamName,
          playerName: pName,
          battingPoints: stats.batting,
          bowlingPoints: stats.bowling,
          totalPoints: stats.total,
          runs: stats.runs,
          wickets: stats.wickets,
          fours: stats.fours,
          sixes: stats.sixes,
          balls: stats.balls,
          maidens: stats.maidens,
          categoryLabel: match.categoryLabel,
          isMoM: momName === pName,
        });
      }
    }

    await ctx.db.patch(matchId, {
      status: "completed",
      winnerId: args.winnerId,
      finalScoreA: args.finalScoreA,
      finalScoreB: args.finalScoreB,
      manOfTheMatch: momName,
    });

    // Automatically start the next scheduled match in the same category
    const nextMatch = await ctx.db
      .query("matches")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", match.categoryId))
      .filter((q) => q.eq(q.field("status"), "scheduled"))
      .order("asc")
      .first();

    if (nextMatch) {
      const teamA = await ctx.db.get(nextMatch.teamAId);
      const teamB = await ctx.db.get(nextMatch.teamBId);

      if (teamA && teamB) {
        await ctx.db.patch(nextMatch._id, { status: "live" });

        const existingLive = await ctx.db
          .query("liveScores")
          .withIndex("by_key", (q) => q.eq("key", "main"))
          .unique();

        const patchData = {
          matchId: nextMatch._id,
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
          strikerFours: 0,
          strikerSixes: 0,
          nonStrikerRuns: 0,
          nonStrikerBalls: 0,
          nonStrikerFours: 0,
          nonStrikerSixes: 0,
          bowlerRuns: 0,
          bowlerWickets: 0,
          bowlerBalls: 0,

          updatedAt: Date.now(),
          ballHistory: [],
          detailedBallHistory: [],
          outPlayers: [],
          batsmenInning1: [],
          bowlersInning1: [],
          batsmenInning2: [],
          bowlersInning2: [],
        };

        if (existingLive) {
          await ctx.db.patch(existingLive._id, patchData);
        } else {
          await ctx.db.insert("liveScores", {
            key: "main",
            ...patchData,
          });
        }
      }
    }
  },
});


export const getSeriesLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("playerMatchStats").collect();
    const leaderboard: Record<string, { playerName: string, teamName: string, batting: number, bowling: number, total: number, matches: number, momCount: number }> = {};

    stats.forEach((s) => {
      const key = `${s.teamName}:${s.playerName}`;
      if (!leaderboard[key]) {
        leaderboard[key] = { playerName: s.playerName, teamName: s.teamName, batting: 0, bowling: 0, total: 0, matches: 0, momCount: 0 };
      }
      leaderboard[key].batting += s.battingPoints;
      leaderboard[key].bowling += s.bowlingPoints;
      leaderboard[key].total += s.totalPoints;
      leaderboard[key].matches += 1;
      if (s.isMoM) {
        leaderboard[key].momCount += 1;
      }
    });

    return Object.values(leaderboard).sort((a, b) => b.total - a.total);
  },
});

export const getTopPerformers = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("playerMatchStats").collect();

    const aggregated: Record<string, { playerName: string, teamName: string, runs: number, wickets: number, fours: number, sixes: number, balls: number, sr: number, economy: number }> = {};

    stats.forEach((s) => {
      const key = `${s.teamName}:${s.playerName}`;
      if (!aggregated[key]) {
        aggregated[key] = { playerName: s.playerName, teamName: s.teamName, runs: 0, wickets: 0, fours: 0, sixes: 0, balls: 0, sr: 0, economy: 0 };
      }
      aggregated[key].runs += s.runs || 0;
      aggregated[key].wickets += s.wickets || 0;
      aggregated[key].fours += s.fours || 0;
      aggregated[key].sixes += s.sixes || 0;
      aggregated[key].balls += s.balls || 0;
    });

    const list = Object.values(aggregated);

    // Calculate SR and Economy if needed (Economy needs overs)
    list.forEach(p => {
      if (p.balls > 0) {
        p.sr = Number(((p.runs / p.balls) * 100).toFixed(2));
      }
    });

    const topBatsmen = [...list].sort((a, b) => b.runs - a.runs).slice(0, 5);
    const topBowlers = [...list].sort((a, b) => b.wickets - a.wickets).slice(0, 5);

    return { topBatsmen, topBowlers };
  },
});

export const updateToss = mutation({
  args: {
    token: v.string(),
    matchId: v.id("matches"),
    tossWinner: v.string(),
    tossDecision: v.union(v.literal("bat"), v.literal("bowl")),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    await ctx.db.patch(args.matchId, {
      tossWinner: args.tossWinner,
      tossDecision: args.tossDecision,
    });
  },
});

export const updateStatus = mutation({
  args: {
    token: v.string(),
    matchId: v.id("matches"),
    status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    await ctx.db.patch(args.matchId, { status: args.status });
  },
});

export const getHomeStats = query({
  args: {},
  handler: async (ctx) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().slice(0, 10); 
    
    const allMatches = await ctx.db.query("matches").collect();
    const todayMatches = allMatches.filter(m => m.date === today);
    
    const teamIds = new Set();
    todayMatches.forEach(m => {
      teamIds.add(m.teamAId.toString());
      teamIds.add(m.teamBId.toString());
    });

    return {
      todayTeams: teamIds.size,
      todayMatches: todayMatches.length,
    };
  },
});

export const getMatchesWithMoM = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("desc").collect();
    return await Promise.all(
      matches.map(async (match) => {
        const teamA = await ctx.db.get(match.teamAId);
        const teamB = await ctx.db.get(match.teamBId);
        const winner = match.winnerId ? await ctx.db.get(match.winnerId) : null;
        
        return {
          _id: match._id,
          teamAName: teamA?.teamName ?? "Unknown",
          teamBName: teamB?.teamName ?? "Unknown",
          winnerName: winner?.teamName ?? null,
          status: match.status,
          manOfTheMatch: match.manOfTheMatch,
          date: match.date,
          time: match.time,
        };
      })
    );
  },
});
