import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./adminAuth";

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
        registrationsEnabled: true,
      };
    }

    return {
      registrationOnlyMode: existing.registrationOnlyMode,
      registrationsEnabled: existing.registrationsEnabled ?? true,
    };
  },
});

export const setRegistrationOnlyMode = mutation({
  args: {
    enabled: v.boolean(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

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

export const setRegistrationsEnabled = mutation({
  args: {
    enabled: v.boolean(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "app"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        registrationsEnabled: args.enabled,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      key: "app",
      registrationOnlyMode: false,
      registrationsEnabled: args.enabled,
      updatedAt: Date.now(),
    });
  },
});
