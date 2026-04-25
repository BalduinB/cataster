import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
  }).index("by_userId", ["userId"]),
});
