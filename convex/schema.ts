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
        createdAt: v.number(),
      }),
    ),
  )
    .index("by_createdAt", ["createdAt"])
    .index("by_phone", ["phone"]),

  settings: defineTable({
    key: v.string(),
    registrationOnlyMode: v.boolean(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  liveScores: defineTable({
    key: v.string(),
    battingTeam: v.string(),
    bowlingTeam: v.string(),
    runs: v.number(),
    wickets: v.number(),
    overs: v.number(),
    balls: v.number(),
    lastEvent: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  adminSessions: defineTable({
    token: v.string(),
    email: v.string(),
    createdAt: v.number(),
    lastSeenAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_expiresAt", ["expiresAt"]),
});
