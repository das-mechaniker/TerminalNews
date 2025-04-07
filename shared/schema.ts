import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// RSS Feed schema
export const rssFeeds = pgTable("rss_feeds", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  provider: text("provider").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertRssFeedSchema = createInsertSchema(rssFeeds).omit({
  id: true,
});

export type InsertRssFeed = z.infer<typeof insertRssFeedSchema>;
export type RssFeed = typeof rssFeeds.$inferSelect;

// News item schema
export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  link: text("link"),
  guid: text("guid").notNull(),
  pubDate: timestamp("pub_date").notNull(),
  originalPubDate: timestamp("original_pub_date"),
  feedId: integer("feed_id").notNull(),
  provider: text("provider").notNull(),
  isTopRanked: boolean("is_top_ranked").default(false),
  sentiment: text("sentiment").default("neutral"),
  category: text("category"),
  region: text("region").default("Global"),
  topics: text("topics").array(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  wasUpdated: boolean("was_updated").default(false),
});

export const insertNewsItemSchema = createInsertSchema(newsItems).omit({
  id: true,
  fetchedAt: true,
});

export type InsertNewsItem = z.infer<typeof insertNewsItemSchema>;
export type NewsItem = typeof newsItems.$inferSelect;

// User schema (needed for storing user filters/preferences)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User preferences schema
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filterCategory: text("filter_category"),
  filterProvider: text("filter_provider"),
  refreshInterval: integer("refresh_interval").default(60),
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({
  id: true,
});

export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
