import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./adminAuth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

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
    // Check if registrations are enabled
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "app"))
      .unique();
    
    if (settings && settings.registrationsEnabled === false) {
      throw new Error("Registrations are currently closed by the administrator.");
    }

    return await ctx.db.insert("registrations", {
      ...args,
      paymentStatus: "paid",
    });
  },
});

export const listRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const registrations = await ctx.db.query("registrations").withIndex("by_createdAt").order("desc").take(200);
    return await Promise.all(
      registrations.map(async (reg) => {
        let paymentScreenshotUrl = null;
        if (reg.paymentScreenshotId) {
          paymentScreenshotUrl = await ctx.storage.getUrl(reg.paymentScreenshotId);
        }
        return {
          ...reg,
          paymentScreenshotUrl,
        };
      })
    );
  },
});

export const registrationStats = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("registrations").collect();
    
    const byCategory: Record<string, { id: string, label: string, count: number }> = {};
    rows.forEach(reg => {
      if (!byCategory[reg.categoryId]) {
        byCategory[reg.categoryId] = { id: reg.categoryId, label: reg.categoryLabel, count: 0 };
      }
      byCategory[reg.categoryId].count++;
    });

    return {
      total: rows.length,
      pending: rows.filter((r) => r.paymentStatus === "pending").length,
      paid: rows.filter((r) => r.paymentStatus === "paid").length,
      byCategory: Object.values(byCategory),
    };
  },
});

export const markPaid = mutation({
  args: {
    token: v.string(),
    id: v.id("registrations"),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    await ctx.db.patch(args.id, { paymentStatus: "paid" });
  },
});

export const updateRegistration = mutation({
  args: {
    token: v.string(),
    id: v.id("registrations"),
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
    categoryId: v.string(),
    categoryLabel: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    const { token, id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const deleteRegistration = mutation({
  args: {
    token: v.string(),
    id: v.id("registrations"),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);
    
    // Also delete the screenshot if it exists
    const reg = await ctx.db.get(args.id);
    if (reg?.paymentScreenshotId) {
      await ctx.storage.delete(reg.paymentScreenshotId);
    }
    
    await ctx.db.delete(args.id);
  },
});
