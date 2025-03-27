import { storage } from "../server/storage";
import { InsertListing, InsertOffer, Listing } from "../shared/schema";
import crypto from "crypto";
import { promisify } from "util";

// Copy of the password hashing function from auth.ts
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function addDemoListingAndOffers() {
  try {
    // Find the user by username
    let user = await storage.getUserByUsername("chopeter67");
    
    if (!user) {
      console.log("User chopeter67 not found. Creating user...");
      // Create the user
      const hashedPassword = await hashPassword("password123");
      user = await storage.createUser({
        username: "chopeter67",
        email: "chopeter67@example.com",
        password: hashedPassword,
        googleId: null,
        appleId: null
      });
      console.log(`User created: ${user.username} (ID: ${user.id})`);
    }
    
    console.log(`Found user: ${user.username} (ID: ${user.id})`);
    
    // Create a demo listing
    const listingData = {
      address: "123 Maple Avenue",
      city: "Lakewood",
      state: "CO",
      zipCode: "80228",
      price: 725000,
      bedrooms: 4,
      bathrooms: 3.5,
      sqft: 2800,
      description: "Beautiful modern home in desirable Lakewood neighborhood. Open floor plan, updated kitchen with stainless steel appliances, hardwood floors, and a finished basement. Large backyard with covered patio and sprinkler system. Close to parks, shopping, and schools.",
      status: "active",
      closingDate: null,
      userId: user.id
    };
    
    console.log("Creating demo listing...");
    const listing = await storage.createListing(listingData, user.id);
    console.log(`Created listing at: "${listing.address}" (ID: ${listing.id})`);
    
    // Create default priorities
    await storage.createListingPriorities({
      listingId: listing.id,
      offerPrice: 8,
      netProceeds: 6,
      closingTimeline: 5,
      contingencies: 7,
      buyerQualification: 7
    });
    console.log("Created custom priorities for listing");
    
    // Create several offers
    const offers = [
      {
        buyerName: "James & Sarah Robinson",
        buyerType: "pre-approved",
        price: 710000,
        downPayment: 142000,
        earnestMoney: 15000,
        loanType: "conventional",
        contingencies: ["financing", "inspection", "appraisal"],
        closingTimelineDays: 45,
        sellerConcessions: 0,
        includedItems: ["refrigerator", "washer/dryer"],
        additionalTerms: "Flexible on closing date.",
        status: "pending",
        agentName: "Rebecca Miller",
        agentCommission: 2.5,
        documentUrl: null
      },
      {
        buyerName: "Michael Chen",
        buyerType: "cash",
        price: 695000,
        downPayment: 695000,
        earnestMoney: 20000,
        loanType: "cash",
        contingencies: ["inspection"],
        closingTimelineDays: 21,
        sellerConcessions: 0,
        includedItems: [],
        additionalTerms: "Can close within 3 weeks. No financing needed.",
        status: "pending",
        agentName: "David Wong",
        agentCommission: 2.5,
        documentUrl: null
      },
      {
        buyerName: "Olivia & Thomas Johnson",
        buyerType: "first-time",
        price: 730000,
        downPayment: 73000,
        earnestMoney: 10000,
        loanType: "FHA",
        contingencies: ["financing", "inspection", "appraisal", "home sale"],
        closingTimelineDays: 60,
        sellerConcessions: 5000,
        includedItems: ["refrigerator", "washer/dryer", "all window treatments"],
        additionalTerms: "Requesting seller assist with closing costs. Need 60 days to close due to sale of current home.",
        status: "pending",
        agentName: "Jennifer Reed",
        agentCommission: 3,
        documentUrl: null
      },
      {
        buyerName: "Robert Garcia",
        buyerType: "investor",
        price: 700000,
        downPayment: 210000,
        earnestMoney: 25000,
        loanType: "conventional",
        contingencies: ["inspection"],
        closingTimelineDays: 30,
        sellerConcessions: 0,
        includedItems: [],
        additionalTerms: "Experienced investor with multiple properties. Can close quickly.",
        status: "pending",
        agentName: "Carlos Mendez",
        agentCommission: 2.5,
        documentUrl: null
      }
    ];
    
    console.log("Creating demo offers...");
    for (const offerData of offers) {
      const offer = await storage.createOffer({ ...offerData, listingId: listing.id }, user.id);
      console.log(`Created offer from: "${offer.buyerName}" for $${offer.price}`);
    }
    
    console.log("Demo data created successfully!");
    
  } catch (error) {
    console.error("Error creating demo data:", error);
  }
}

// Execute the function
addDemoListingAndOffers();