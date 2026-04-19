import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_EMAIL = "admin@vrpyuvasangthanbhuj.in";
const ADMIN_PASSWORD = "admin@vrpyova123";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type AuthCtx = QueryCtx | MutationCtx;

const createSessionToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const getValidSession = async (ctx: AuthCtx, token: string) => {
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    return null;
  }

  return session;
};

export const requireAdminSession = async (ctx: AuthCtx, token: string) => {
  const session = await getValidSession(ctx, token);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
};

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.email.trim().toLowerCase() !== ADMIN_EMAIL || args.password !== ADMIN_PASSWORD) {
      return {
        success: false,
        token: null,
        expiresAt: null,
        message: "Invalid admin email or password",
      } as const;
    }

    const now = Date.now();
    const token = createSessionToken();
    const expiresAt = now + SESSION_TTL_MS;

    await ctx.db.insert("adminSessions", {
      token,
      email: ADMIN_EMAIL,
      createdAt: now,
      lastSeenAt: now,
      expiresAt,
    });

    return {
      success: true,
      token,
      expiresAt,
      message: "Login successful",
    } as const;
  },
});

export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true } as const;
  },
});

export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getValidSession(ctx, args.token);

    if (!session) {
      return {
        authenticated: false,
        email: null,
        expiresAt: null,
      } as const;
    }

    return {
      authenticated: true,
      email: session.email,
      expiresAt: session.expiresAt,
    } as const;
  },
});
