import { InsertListing, InsertListingPriorities, InsertOffer, InsertUser, InsertUsageEvent, Listing, ListingPriorities, Offer, User, UsageEvent, listings, listingPriorities, offers, sessions, usageEvents, users } from "@shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: number, stripeCustomerId: string): Promise<User>;
  
  // Listing methods
  createListing(listing: InsertListing, userId: number): Promise<Listing>;
  getListings(userId: number): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | undefined>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  
  // Offer methods
  createOffer(offer: InsertOffer, userId: number): Promise<Offer>;
  getOffers(listingId: number): Promise<Offer[]>;
  getOffer(id: number): Promise<Offer | undefined>;
  updateOffer(id: number, offer: Partial<InsertOffer>): Promise<Offer | undefined>;
  getOfferHistory(offerId: number): Promise<Offer[]>; // Get all versions of an offer (original + counters)
  
  // Listing priorities methods
  createListingPriorities(priorities: InsertListingPriorities): Promise<ListingPriorities>;
  getListingPriorities(listingId: number): Promise<ListingPriorities | undefined>;
  updateListingPriorities(listingId: number, priorities: Partial<InsertListingPriorities>): Promise<ListingPriorities | undefined>;
  
  // Usage tracking methods
  createUsageEvent(event: InsertUsageEvent): Promise<UsageEvent>;
  getUserUsageEvents(userId: number): Promise<UsageEvent[]>;
  markUsageEventAsProcessed(id: number, stripeInvoiceId?: string, stripeUsageRecordId?: string): Promise<UsageEvent>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private listingsData: Map<number, Listing>;
  private offersData: Map<number, Offer>;
  private listingPrioritiesData: Map<number, ListingPriorities>;
  private usageEventsData: Map<number, UsageEvent>;
  
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentListingId: number;
  currentOfferId: number;
  currentPriorityId: number;
  currentUsageEventId: number;

  constructor() {
    this.usersData = new Map();
    this.listingsData = new Map();
    this.offersData = new Map();
    this.listingPrioritiesData = new Map();
    this.usageEventsData = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
    
    this.currentUserId = 1;
    this.currentListingId = 1;
    this.currentOfferId = 1;
    this.currentPriorityId = 1;
    this.currentUsageEventId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.appleId === appleId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: timestamp,
      stripeCustomerId: null
    };
    this.usersData.set(id, user);
    return user;
  }

  async updateUserStripeInfo(userId: number, stripeCustomerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...user, stripeCustomerId };
    this.usersData.set(userId, updatedUser);
    return updatedUser;
  }

  // Listing methods
  async createListing(listing: InsertListing, userId: number): Promise<Listing> {
    const id = this.currentListingId++;
    const timestamp = new Date();
    const newListing: Listing = {
      ...listing,
      id,
      userId,
      createdAt: timestamp,
      listedDate: timestamp,
      status: "active"
    };
    this.listingsData.set(id, newListing);
    return newListing;
  }

  async getListings(userId: number): Promise<Listing[]> {
    return Array.from(this.listingsData.values()).filter(
      (listing) => listing.userId === userId
    );
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return this.listingsData.get(id);
  }

  async updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined> {
    const existingListing = await this.getListing(id);
    if (!existingListing) {
      return undefined;
    }
    
    const updatedListing = { ...existingListing, ...listing };
    this.listingsData.set(id, updatedListing);
    return updatedListing;
  }

  // Offer methods
  async createOffer(offer: InsertOffer, userId: number): Promise<Offer> {
    const id = this.currentOfferId++;
    const timestamp = new Date();
    
    // Calculate net proceeds based on price and commission
    const price = Number(offer.price);
    const commission = offer.agentCommission ? Number(offer.agentCommission) : 0.06 * price; // Default 6% if not specified
    const netProceeds = price - commission;
    
    // Calculate basic risk score and overall score
    const contingencies = offer.contingencies as string[] || [];
    const riskScore = Math.max(1, 10 - contingencies.length * 2); // More contingencies = higher risk
    
    // Simple overall score calculation (can be enhanced later)
    const overallScore = Math.round((price / 1000000 * 40) + (riskScore * 5) + (60 - offer.closingTimelineDays / 2));
    
    const newOffer: Offer = {
      ...offer,
      id,
      userId,
      netProceeds,
      riskScore,
      overallScore,
      createdAt: timestamp,
      contingencies: offer.contingencies || []
    };
    
    this.offersData.set(id, newOffer);
    return newOffer;
  }

  async getOffers(listingId: number): Promise<Offer[]> {
    return Array.from(this.offersData.values()).filter(
      (offer) => offer.listingId === listingId
    );
  }

  async getOffer(id: number): Promise<Offer | undefined> {
    return this.offersData.get(id);
  }

  async updateOffer(id: number, offer: Partial<InsertOffer>): Promise<Offer | undefined> {
    const existingOffer = await this.getOffer(id);
    if (!existingOffer) {
      return undefined;
    }
    
    const updatedOffer = { ...existingOffer, ...offer };
    this.offersData.set(id, updatedOffer);
    return updatedOffer;
  }
  
  async getOfferHistory(offerId: number): Promise<Offer[]> {
    const offer = await this.getOffer(offerId);
    if (!offer) {
      return [];
    }
    
    // Get the root ancestor (if this is a counter offer)
    const rootOfferId = offer.parentOfferId || offer.id;
    const rootOffer = await this.getOffer(rootOfferId);
    if (!rootOffer) {
      return [offer];
    }
    
    // Get all offers with this parent ID
    const counterOffers = Array.from(this.offersData.values()).filter(
      o => (o.parentOfferId === rootOfferId || o.id === rootOfferId)
    );
    
    // If this offer isn't a counter offer and has no counter offers, just return it
    if (counterOffers.length === 0) {
      return [offer];
    }
    
    // Sort by version number
    return counterOffers.sort((a, b) => 
      (a.versionNumber || 1) - (b.versionNumber || 1)
    );
  }

  // Listing priorities methods
  async createListingPriorities(priorities: InsertListingPriorities): Promise<ListingPriorities> {
    const id = this.currentPriorityId++;
    const timestamp = new Date();
    const newPriorities: ListingPriorities = {
      ...priorities,
      id,
      createdAt: timestamp
    };
    this.listingPrioritiesData.set(id, newPriorities);
    return newPriorities;
  }

  async getListingPriorities(listingId: number): Promise<ListingPriorities | undefined> {
    return Array.from(this.listingPrioritiesData.values()).find(
      (priority) => priority.listingId === listingId
    );
  }

  async updateListingPriorities(listingId: number, priorities: Partial<InsertListingPriorities>): Promise<ListingPriorities | undefined> {
    const existingPriorities = await this.getListingPriorities(listingId);
    
    if (!existingPriorities) {
      // Create new priorities if they don't exist
      return this.createListingPriorities({ ...priorities, listingId } as InsertListingPriorities);
    }
    
    const updatedPriorities = { ...existingPriorities, ...priorities };
    this.listingPrioritiesData.set(existingPriorities.id, updatedPriorities);
    return updatedPriorities;
  }

  // Usage tracking methods
  async createUsageEvent(event: InsertUsageEvent): Promise<UsageEvent> {
    const id = this.currentUsageEventId++;
    const timestamp = new Date();
    const newEvent: UsageEvent = {
      ...event,
      id,
      processed: false,
      stripeInvoiceId: null,
      stripeUsageRecordId: null,
      createdAt: timestamp
    };
    this.usageEventsData.set(id, newEvent);
    return newEvent;
  }

  async getUserUsageEvents(userId: number): Promise<UsageEvent[]> {
    return Array.from(this.usageEventsData.values()).filter(
      (event) => event.userId === userId
    );
  }

  async markUsageEventAsProcessed(id: number, stripeInvoiceId?: string, stripeUsageRecordId?: string): Promise<UsageEvent> {
    const event = this.usageEventsData.get(id);
    if (!event) {
      throw new Error('Usage event not found');
    }
    
    const updatedEvent: UsageEvent = {
      ...event,
      processed: true,
      stripeInvoiceId: stripeInvoiceId || event.stripeInvoiceId,
      stripeUsageRecordId: stripeUsageRecordId || event.stripeUsageRecordId
    };
    
    this.usageEventsData.set(id, updatedEvent);
    return updatedEvent;
  }
}

export const storage = new MemStorage();
