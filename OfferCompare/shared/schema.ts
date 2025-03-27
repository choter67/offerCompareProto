import { pgTable, text, serial, integer, numeric, boolean, jsonb, timestamp, uuid, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
});

// Listings (properties) table
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  price: numeric("price").notNull(),
  loanBalance: numeric("loan_balance"),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: numeric("bathrooms").notNull(),
  sqft: integer("sqft"),
  description: text("description"),
  status: text("status").notNull().default("active"),
  listedDate: timestamp("listed_date").defaultNow().notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(listings)
  .extend({
    // Allow string or number for numeric fields 
    price: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ),
    loanBalance: z.union([z.string(), z.number(), z.undefined()]).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ).optional(),
    bathrooms: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ),
    bedrooms: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ),
    sqft: z.union([z.string(), z.number(), z.undefined()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ).optional(),
  })
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    listedDate: true,
  });

// Offers table
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  userId: integer("user_id").notNull().references(() => users.id),
  // Parent-child relationship for counter offers
  parentOfferId: integer("parent_offer_id").references(() => offers.id),
  versionNumber: integer("version_number").default(1).notNull(),
  isCounterOffer: boolean("is_counter_offer").default(false).notNull(),
  buyerName: text("buyer_name").notNull(),
  buyerType: text("buyer_type"), // e.g., "first-time", "cash", "pre-approved"
  price: numeric("price").notNull(),
  netProceeds: numeric("net_proceeds"),
  agentCommission: numeric("agent_commission"),
  // Store whether commission is dollar or percentage value
  commissionType: text("commission_type").default("dollar"),
  closingDate: timestamp("closing_date"),
  closingTimelineDays: integer("closing_timeline_days"),
  contingencies: jsonb("contingencies").default([]),
  riskScore: integer("risk_score"),
  overallScore: integer("overall_score"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOfferSchema = createInsertSchema(offers)
  .extend({
    // Allow string or number for numeric fields
    price: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ),
    agentCommission: z.union([z.string(), z.number(), z.undefined()]).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ).optional(),
    closingTimelineDays: z.union([z.string(), z.number(), z.undefined()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ).optional(),
  })
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    riskScore: true,
    overallScore: true,
    netProceeds: true,
  });

// Listing priorities table (for user weight preferences)
export const listingPriorities = pgTable("listing_priorities", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  offerPrice: integer("offer_price").default(5),
  netProceeds: integer("net_proceeds").default(5),
  closingTimeline: integer("closing_timeline").default(5),
  contingencies: integer("contingencies").default(5),
  buyerQualification: integer("buyer_qualification").default(5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertListingPrioritiesSchema = createInsertSchema(listingPriorities)
  .extend({
    // Allow string or number for integer fields
    offerPrice: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ),
    netProceeds: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ),
    closingTimeline: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ),
    contingencies: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ),
    buyerQualification: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ),
  })
  .omit({
    id: true,
    createdAt: true,
  });

// Usage tracking for pay-per-use billing
export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(), // e.g., "offer_creation", "document_upload"
  stripeInvoiceId: text("stripe_invoice_id"),
  stripeUsageRecordId: text("stripe_usage_record_id"),
  amount: numeric("amount").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUsageEventSchema = createInsertSchema(usageEvents).omit({
  id: true,
  stripeInvoiceId: true,
  stripeUsageRecordId: true,
  processed: true,
  createdAt: true,
});

// Sessions table for auth
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().default(uuidv4()),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});

// Define types for the schema
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

export type InsertListingPriorities = z.infer<typeof insertListingPrioritiesSchema>;
export type ListingPriorities = typeof listingPriorities.$inferSelect;

export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type UsageEvent = typeof usageEvents.$inferSelect;

export type Session = typeof sessions.$inferSelect;
