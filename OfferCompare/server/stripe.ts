import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

// Initialize Stripe with the API key
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy",
  { apiVersion: "2023-10-16" }
);

export function setupStripeRoutes(app: Express) {
  /**
   * Process a one-time charge for a usage event
   */
  app.post("/api/billing/process-usage", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { usageEventId } = req.body;
      
      if (!usageEventId) {
        return res.status(400).json({ message: "Missing usage event ID" });
      }
      
      // Get the usage event
      const events = await storage.getUserUsageEvents(req.user.id);
      const event = events.find(e => e.id === parseInt(usageEventId));
      
      if (!event) {
        return res.status(404).json({ message: "Usage event not found" });
      }
      
      if (event.processed) {
        return res.status(400).json({ message: "Usage event already processed" });
      }
      
      // Get or create customer
      let customerId = req.user.stripeCustomerId;
      
      if (!customerId) {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.username,
          metadata: {
            userId: req.user.id.toString()
          }
        });
        
        customerId = customer.id;
        await storage.updateUserStripeInfo(req.user.id, customerId);
      }
      
      // Create a payment intent
      const amount = Math.round(Number(event.amount) * 100); // Convert to cents
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          usageEventId: event.id.toString(),
          eventType: event.eventType,
          userId: req.user.id.toString()
        }
      });
      
      // Update the usage event with the payment intent ID
      await storage.markUsageEventAsProcessed(event.id, paymentIntent.id);
      
      res.json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error("Stripe payment error:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });
  
  /**
   * Get customer's active subscription
   */
  app.get("/api/billing/subscription", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const customerId = req.user.stripeCustomerId;
      
      if (!customerId) {
        return res.json({ subscription: null });
      }
      
      // Fetch all active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });
      
      if (subscriptions.data.length === 0) {
        return res.json({ subscription: null });
      }
      
      res.json({ subscription: subscriptions.data[0] });
    } catch (error) {
      console.error("Stripe subscription fetch error:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });
  
  /**
   * Create a subscription for usage-based billing
   */
  app.post("/api/billing/create-subscription", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Get or create customer
      let customerId = req.user.stripeCustomerId;
      
      if (!customerId) {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.username,
          metadata: {
            userId: req.user.id.toString()
          }
        });
        
        customerId = customer.id;
        await storage.updateUserStripeInfo(req.user.id, customerId);
      }
      
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret
      });
    } catch (error) {
      console.error("Stripe subscription creation error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });
  
  /**
   * Report usage for metered billing
   */
  app.post("/api/billing/report-usage", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { usageEventId } = req.body;
      
      if (!usageEventId) {
        return res.status(400).json({ message: "Missing usage event ID" });
      }
      
      // Get the usage event
      const events = await storage.getUserUsageEvents(req.user.id);
      const event = events.find(e => e.id === parseInt(usageEventId));
      
      if (!event) {
        return res.status(404).json({ message: "Usage event not found" });
      }
      
      if (event.processed) {
        return res.status(400).json({ message: "Usage event already processed" });
      }
      
      // Get customer's subscription
      const customerId = req.user.stripeCustomerId;
      
      if (!customerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }
      
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });
      
      if (subscriptions.data.length === 0) {
        return res.status(400).json({ message: "No active subscription found" });
      }
      
      const subscription = subscriptions.data[0];
      const subscriptionItem = subscription.items.data[0];
      
      // Report usage for the subscription item
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: Number(event.amount),
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        }
      );
      
      // Update the usage event
      await storage.markUsageEventAsProcessed(event.id, null, usageRecord.id);
      
      res.json({ success: true, usageRecord });
    } catch (error) {
      console.error("Stripe usage reporting error:", error);
      res.status(500).json({ message: "Failed to report usage" });
    }
  });
}
