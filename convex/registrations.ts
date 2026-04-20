import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRegistration = mutation({
  args: {
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
    paymentRef: v.optional(v.string()),
    paymentScreenshotId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("registrations", {
      ...args,
      paymentStatus: "paid",
    });
  },
});

export const listRegistrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("registrations").withIndex("by_createdAt").order("desc").take(200);
  },
});

export const registrationStats = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("registrations").withIndex("by_createdAt").order("desc").take(200);
    return {
      total: rows.length,
      pending: rows.filter((r) => r.paymentStatus === "pending").length,
      paid: rows.filter((r) => r.paymentStatus === "paid").length,
    };
  },
});

export const markPaid = mutation({
  args: {
    id: v.id("registrations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { paymentStatus: "paid" });
  },
});
