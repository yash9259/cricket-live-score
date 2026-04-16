import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPublicSettings = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "app"))
      .unique();

    if (!existing) {
      return {
        registrationOnlyMode: false,
      };
    }

    return {
      registrationOnlyMode: existing.registrationOnlyMode,
    };
  },
});

export const setRegistrationOnlyMode = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "app"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        registrationOnlyMode: args.enabled,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      key: "app",
      registrationOnlyMode: args.enabled,
      updatedAt: Date.now(),
    });
  },
});
