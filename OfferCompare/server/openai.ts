import OpenAI from "openai";
import { Listing } from "@shared/schema";

// Initialize OpenAI API client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key"
});

// Types for extraction response
interface ExtractedOffer {
  buyerName: string;
  buyerType: string; // "cash", "first-time", "pre-approved", etc.
  price: number;
  agentCommission: number | null;
  closingTimelineDays: number;
  contingencies: string[];
  notes: string;
}

/**
 * Extract offer details from document text using OpenAI
 */
export async function extractOfferDetails(documentText: string, listing: Listing): Promise<ExtractedOffer> {
  try {
    // If no API key, return fallback data
    if (process.env.OPENAI_API_KEY === "sk-dummy-key") {
      return getFallbackOffer(listing);
    }
    
    const prompt = `
      You are an expert real estate assistant that extracts structured information from real estate offer documents.
      Analyze the following offer document for property at ${listing.address} and extract these key details:
      
      - Buyer's full name
      - Buyer type (cash buyer, first-time homebuyer, pre-approved, etc.)
      - Offer price in dollars
      - Agent commission percentage or amount (if specified)
      - Closing timeline in days
      - Contingencies (list all that apply: financing, inspection, appraisal, home sale, etc.)
      - Any important notes or special conditions
      
      Return the information in a structured JSON format with these fields:
      {
        "buyerName": "Full name of buyer",
        "buyerType": "Type of buyer",
        "price": number (without $ or commas),
        "agentCommission": number or null (percentage as decimal or amount),
        "closingTimelineDays": number,
        "contingencies": ["array", "of", "contingencies"],
        "notes": "Any important notes or conditions"
      }
      
      Document text:
      ${documentText}
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Error extracting offer details:", error);
    // Return fallback data if API call fails
    return getFallbackOffer(listing);
  }
}

/**
 * Generate fallback offer data when OpenAI is not available
 */
function getFallbackOffer(listing: Listing): ExtractedOffer {
  return {
    buyerName: "Extracted Buyer",
    buyerType: "pre-approved",
    price: Number(listing.price) + 10000, // Slightly above listing price
    agentCommission: 0.06, // 6% is common
    closingTimelineDays: 30,
    contingencies: ["financing", "inspection", "appraisal"],
    notes: "This is fallback data as document extraction failed. Please review document manually."
  };
}
