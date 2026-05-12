import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminSession } from "./adminAuth";

export const getById = query({
  args: { id: v.id("registrations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

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
        try {
          if (reg.paymentScreenshotId) {
            paymentScreenshotUrl = await ctx.storage.getUrl(reg.paymentScreenshotId);
          }
        } catch (e) {
          console.error("Error getting storage URL", e);
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

export const renamePlayer = mutation({
  args: {
    token: v.string(),
    registrationId: v.id("registrations"),
    oldName: v.string(),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const cleanOld = args.oldName.trim().toLowerCase();
    const cleanNew = args.newName.trim();

    const team = await ctx.db.get(args.registrationId);
    if (!team) throw new Error("Team not found");

    let updated = false;
    let newPlayers = [...team.players];

    // Check captain name
    let newCaptainName = team.captainName;
    if (team.captainName.trim().toLowerCase() === cleanOld) {
      newCaptainName = cleanNew;
      updated = true;
    }

    // Check players array
    newPlayers = newPlayers.map(p => {
      if (p.name.trim().toLowerCase() === cleanOld) {
        updated = true;
        return { ...p, name: cleanNew };
      }
      return p;
    });

    if (updated) {
      await ctx.db.patch(team._id, {
        captainName: newCaptainName,
        players: newPlayers as any
      });
    }

    return { success: updated };
  },
});

export const renamePlayerGlobally = mutation({
  args: {
    token: v.string(),
    oldName: v.string(),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    const allTeams = await ctx.db.query("registrations").collect();
    let totalUpdated = 0;
    const cleanOld = args.oldName.trim().toLowerCase();
    const cleanNew = args.newName.trim();

    for (const team of allTeams) {
      let updated = false;
      let newPlayers = [...team.players];

      // Check captain name
      let newCaptainName = team.captainName;
      if (team.captainName.trim().toLowerCase() === cleanOld) {
        newCaptainName = cleanNew;
        updated = true;
      }

      // Check players array
      newPlayers = newPlayers.map(p => {
        if (p.name.trim().toLowerCase() === cleanOld) {
          updated = true;
          return { ...p, name: cleanNew };
        }
        return p;
      });

      if (updated) {
        await ctx.db.patch(team._id, {
          captainName: newCaptainName,
          players: newPlayers as any
        });
        totalUpdated++;
      }
    }

    return { success: totalUpdated > 0, count: totalUpdated };
  },
});

export const createQuick = mutation({
  args: {
    token: v.string(),
    teamName: v.string(),
    categoryId: v.string(),
    categoryLabel: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.token);

    return await ctx.db.insert("registrations", {
      teamName: args.teamName,
      categoryId: args.categoryId,
      categoryLabel: args.categoryLabel,
      captainName: "Captain",
      captainAge: 18,
      phone: "0000000000",
      players: [],
      fee: 0,
      paymentStatus: "paid",
      createdAt: Date.now(),
    });
  },
});

