import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupStripeRoutes } from "./stripe";
import { extractOfferDetails } from "./openai";
import { insertListingSchema, insertOfferSchema, insertListingPrioritiesSchema, insertUsageEventSchema } from "@shared/schema";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { z } from "zod";

const uploadsDir = path.join(process.cwd(), 'uploads');
// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniquePrefix = randomUUID();
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage_config });

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up Stripe payment routes
  setupStripeRoutes(app);
  
  // Listings routes
  app.post("/api/listings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const validatedData = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(validatedData, req.user.id);
      
      // Create default priorities
      await storage.createListingPriorities({
        listingId: listing.id,
        offerPrice: 5,
        netProceeds: 5,
        closingTimeline: 5,
        contingencies: 5,
        buyerQualification: 5
      });
      
      res.status(201).json(listing);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to create listing" });
    }
  });
  
  app.get("/api/listings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const listings = await storage.getListings(req.user.id);
      res.json(listings);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });
  
  app.get("/api/listings/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const listing = await storage.getListing(parseInt(req.params.id));
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(listing);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });
  
  app.patch("/api/listings/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const listing = await storage.getListing(parseInt(req.params.id));
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedListing = await storage.updateListing(parseInt(req.params.id), req.body);
      res.json(updatedListing);
    } catch (err) {
      res.status(500).json({ message: "Failed to update listing" });
    }
  });
  
  // Offers routes
  app.post("/api/offers", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const validatedData = insertOfferSchema.parse(req.body);
      
      // Check if user owns the listing and get loan balance to calculate net proceeds
      const listing = await storage.getListing(validatedData.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to add offers to this listing" });
      }
      
      // Calculate net proceeds (price - loan balance - commission)
      const price = Number(validatedData.price);
      const loanBalance = Number(listing.loanBalance || 0);
      
      // Handle commission calculation based on whether it's a dollar amount or percentage
      let agentCommission = Number(validatedData.agentCommission || 0);
      // If commission is provided as a percentage (typically < 20), convert to dollar amount
      if (agentCommission > 0 && agentCommission <= 20) {
        agentCommission = (price * agentCommission) / 100;
      }
      
      // Set the calculated net proceeds
      const offerWithNetProceeds = {
        ...validatedData,
        netProceeds: price - loanBalance - agentCommission
      };
      
      // Create the offer
      const offer = await storage.createOffer(offerWithNetProceeds, req.user.id);
      
      // Create usage event for billing
      await storage.createUsageEvent({
        userId: req.user.id,
        eventType: "offer_creation",
        amount: 1.00 // $1.00 per offer creation
      });
      
      res.status(201).json(offer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to create offer" });
    }
  });
  
  app.get("/api/listings/:listingId/offers", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const listingId = parseInt(req.params.listingId);
      
      // Check if user owns the listing
      const listing = await storage.getListing(listingId);
      if (!listing || listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view offers for this listing" });
      }
      
      const offers = await storage.getOffers(listingId);
      res.json(offers);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });
  
  app.get("/api/offers/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const offer = await storage.getOffer(parseInt(req.params.id));
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      // Check if user owns the listing related to this offer
      const listing = await storage.getListing(offer.listingId);
      if (!listing || listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view this offer" });
      }
      
      res.json(offer);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch offer" });
    }
  });
  
  // Get offer history (all versions of an offer)
  app.get("/api/offers/:id/history", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.getOffer(offerId);
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      // Check if user owns the listing related to this offer
      const listing = await storage.getListing(offer.listingId);
      if (!listing || listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view this offer history" });
      }
      
      const offerHistory = await storage.getOfferHistory(offerId);
      res.json(offerHistory);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch offer history" });
    }
  });
  
  // Listing priorities routes
  app.get("/api/listings/:listingId/priorities", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const listingId = parseInt(req.params.listingId);
      
      // Check if user owns the listing
      const listing = await storage.getListing(listingId);
      if (!listing || listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view priorities for this listing" });
      }
      
      // Get the priorities or return defaults if not set
      let priorities = await storage.getListingPriorities(listingId);
      if (!priorities) {
        priorities = await storage.createListingPriorities({
          listingId,
          offerPrice: 5,
          netProceeds: 5,
          closingTimeline: 5,
          contingencies: 5,
          buyerQualification: 5
        });
      }
      
      res.json(priorities);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch priorities" });
    }
  });
  
  app.patch("/api/listings/:listingId/priorities", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const listingId = parseInt(req.params.listingId);
      
      // Check if user owns the listing
      const listing = await storage.getListing(listingId);
      if (!listing || listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update priorities for this listing" });
      }
      
      const validatedData = insertListingPrioritiesSchema.partial().parse(req.body);
      const priorities = await storage.updateListingPriorities(listingId, validatedData);
      
      res.json(priorities);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to update priorities" });
    }
  });
  
  // Insights and analysis
  app.get("/api/listings/:listingId/insights", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const listingId = parseInt(req.params.listingId);
      
      // Check if user owns the listing
      const listing = await storage.getListing(listingId);
      if (!listing || listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view insights for this listing" });
      }
      
      // Get offers and priorities
      const offers = await storage.getOffers(listingId);
      const priorities = await storage.getListingPriorities(listingId);
      
      if (offers.length === 0) {
        return res.json({
          recommendation: "No offers to analyze yet",
          riskAssessment: null,
          netProceedsComparison: null,
          negotiationOpportunities: null
        });
      }
      
      // Simple analysis based on priorities
      let bestOffer = offers[0];
      let lowestRiskOffer = offers[0];
      let highestNetProceedsOffer = offers[0];
      
      for (const offer of offers) {
        if (offer.overallScore > bestOffer.overallScore) {
          bestOffer = offer;
        }
        
        if (offer.riskScore > lowestRiskOffer.riskScore) {
          lowestRiskOffer = offer;
        }
        
        if (Number(offer.netProceeds) > Number(highestNetProceedsOffer.netProceeds)) {
          highestNetProceedsOffer = offer;
        }
      }
      
      // Prepare insights
      const insights = {
        recommendation: `Based on your priorities, the offer from ${bestOffer.buyerName} is the strongest overall option with a score of ${bestOffer.overallScore}/100.`,
        riskAssessment: `The ${lowestRiskOffer.buyerName} offer has the lowest risk with ${(lowestRiskOffer.contingencies as string[]).length} contingencies. Consider this option if certainty of closing is your highest priority.`,
        netProceedsComparison: `The ${highestNetProceedsOffer.buyerName} offer provides the highest net proceeds at $${Number(highestNetProceedsOffer.netProceeds).toLocaleString()}, which is ${Number(highestNetProceedsOffer.netProceeds) - Number(offers[1].netProceeds) > 0 ? '$' + (Number(highestNetProceedsOffer.netProceeds) - Number(offers[1].netProceeds)).toLocaleString() + ' more' : '$' + (Number(offers[1].netProceeds) - Number(highestNetProceedsOffer.netProceeds)).toLocaleString() + ' less'} than the next best offer.`,
        negotiationOpportunities: "Consider asking buyers to reduce contingencies or improve their offer price to strengthen their position."
      };
      
      res.json(insights);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });
  
  // Document upload and extraction
  app.post("/api/offers/extract", upload.single('document'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No document uploaded" });
      }
      
      // Extract listing ID from request
      const listingId = parseInt(req.body.listingId);
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      // Check if user owns the listing
      const listing = await storage.getListing(listingId);
      if (!listing || listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to add offers to this listing" });
      }
      
      // Read the file
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Use OpenAI to extract offer details
      const extractedData = await extractOfferDetails(fileContent, listing);
      
      // Calculate net proceeds based on loan balance
      const price = Number(extractedData.price);
      const loanBalance = Number(listing.loanBalance || 0);
      
      // Handle commission calculation based on whether it's a dollar amount or percentage
      let agentCommission = Number(extractedData.agentCommission || 0);
      // If commission is provided as a percentage (typically < 20), convert to dollar amount
      if (agentCommission > 0 && agentCommission <= 20) {
        agentCommission = (price * agentCommission) / 100;
      }
      
      // Add net proceeds to extracted data
      const extractedDataWithNetProceeds = {
        ...extractedData,
        netProceeds: price - loanBalance - agentCommission
      };
      
      // Create usage event for billing
      await storage.createUsageEvent({
        userId: req.user.id,
        eventType: "document_extraction",
        amount: 2.50 // $2.50 per document extraction (more expensive than manual entry)
      });
      
      res.json({
        extractedData: extractedDataWithNetProceeds,
        documentUrl: req.file.path
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to extract offer details" });
    }
  });
  
  // Usage events
  app.get("/api/usage", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const usageEvents = await storage.getUserUsageEvents(req.user.id);
      res.json(usageEvents);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch usage events" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
