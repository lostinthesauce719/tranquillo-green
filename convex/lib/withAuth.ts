import { queryGeneric, mutationGeneric } from "convex/server";

/**
 * Auth-wrapped query builder.
 * Requires a valid Clerk identity via ctx.auth.getUserIdentity().
 * The handler receives (ctx, args, identity) where identity is the verified user.
 */
export const authQuery = (args: any, handler: any) =>
  queryGeneric({
    args,
    handler: async (ctx: any, fnArgs: any) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthenticated");
      }
      return handler(ctx, fnArgs, identity);
    },
  });

/**
 * Auth-wrapped mutation builder.
 * Requires a valid Clerk identity via ctx.auth.getUserIdentity().
 * The handler receives (ctx, args, identity) where identity is the verified user.
 */
export const authMutation = (args: any, handler: any) =>
  mutationGeneric({
    args,
    handler: async (ctx: any, fnArgs: any) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthenticated");
      }
      return handler(ctx, fnArgs, identity);
    },
  });
