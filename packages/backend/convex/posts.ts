import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUserId } from "./utils";

// Get all posts (public)
export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("posts").order("desc").take(100);
  },
});

// Get a single post by ID (public)
export const getPost = query({
  args: {
    id: v.optional(v.string()),
  },
  handler: async (ctx, { id }) => {
    if (!id) return null;

    const normalizedId = ctx.db.normalizeId("posts", id);
    if (!normalizedId) return null;

    return await ctx.db.get(normalizedId);
  },
});

// Create a new post (protected)
export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { title, content }) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("posts", { userId, title, content });
  },
});

// Delete a post (protected — owner only)
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => {
    const userId = await requireUserId(ctx);
    const post = await ctx.db.get(postId);

    if (!post) throw new Error(`Post '${postId}' could not be found`);
    if (post.userId !== userId)
      throw new Error(`User '${userId}' cannot delete post '${postId}'`);

    await ctx.db.delete(postId);
  },
});
