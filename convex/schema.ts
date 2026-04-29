import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  registrations: defineTable(
    v.union(
      v.object({
        categoryId: v.string(),
        categoryLabel: v.string(),
        teamName: v.string(),
        captainName: v.string(),
        captainAge: v.number(),
        phone: v.string(),
        players: v.array(
          v.object({
            name: v.string(),
            age: v.number(),
          }),
        ),
        fee: v.number(),
        paymentStatus: v.union(v.literal("pending"), v.literal("paid")),
        paymentRef: v.optional(v.string()),
        paymentScreenshotId: v.optional(v.id("_storage")),
        createdAt: v.number(),
      }),
      v.object({
        categoryId: v.string(),
        categoryLabel: v.string(),
        teamName: v.string(),
        captainName: v.string(),
        captainDob: v.string(),
        phone: v.string(),
        players: v.array(
          v.object({
            name: v.string(),
            dob: v.string(),
          }),
        ),
        fee: v.number(),
        paymentStatus: v.union(v.literal("pending"), v.literal("paid")),
        paymentRef: v.optional(v.string()),
        paymentScreenshotId: v.optional(v.id("_storage")),
        createdAt: v.number(),
      }),
    ),
  )
    .index("by_createdAt", ["createdAt"])
    .index("by_phone", ["phone"]),

  adminSessions: defineTable({
    token: v.string(),
    email: v.string(),
    createdAt: v.number(),
    lastSeenAt: v.number(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  settings: defineTable({
    key: v.string(),
    registrationOnlyMode: v.boolean(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  liveScores: defineTable({
    key: v.string(),
    matchId: v.optional(v.id("matches")),
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
    inning: v.optional(v.number()),
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
    ballHistory: v.optional(v.array(v.string())),
    showAnimation: v.optional(v.string()),
    animationId: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  matches: defineTable({
    teamAId: v.id("registrations"),
    teamBId: v.id("registrations"),
    categoryId: v.string(),
    categoryLabel: v.string(),
    status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("completed")),
    winnerId: v.optional(v.id("registrations")),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_categoryId", ["categoryId"]),
});
