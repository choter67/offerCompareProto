# OfferCompare

OfferCompare is a full-stack web application designed to help real estate listing agents and sellers collect, manage, and analyze offers on properties. The platform leverages AI for document extraction and implements a pay-per-use billing model with Stripe.

## Features

- **User Authentication**: Sign in with Google or Apple accounts
- **Property Listing Management**: Create and manage property listings
- **Offer Management**: 
  - Manually create offers with detailed information
  - Upload and automatically extract offer details from documents using AI
  - Compare and analyze multiple offers
- **Custom Priority Weighting**: Set priorities for different offer aspects
- **Insights and Analysis**: Get recommendations, risk assessments, and negotiation opportunities
- **Pay-Per-Use Billing**: Integrated with Stripe for usage-based billing

## Tech Stack

### Backend
- Node.js with Express
- TypeScript for type safety
- PostgreSQL database with Drizzle ORM
- Passport.js for OAuth authentication
- OpenAI integration for document extraction
- Stripe for payment processing

### Frontend
- React with TypeScript
- Tailwind CSS with Shadcn UI components
- React Hook Form for form handling
- React Query for data fetching and caching
- Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL database
- Stripe account
- OpenAI API key
- Google and/or Apple developer accounts for OAuth

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/offercompare.git
   cd offercompare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example` and fill in your configuration values.

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5000.

## Setting Up OAuth

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Set up OAuth consent screen
4. Create OAuth credentials (Web application)
5. Add authorized JavaScript origins and redirect URIs
6. Copy the Client ID and Client Secret to your `.env` file

### Apple OAuth
1. Go to [Apple Developer Account](https://developer.apple.com/)
2. Register a new application in Certificates, Identifiers & Profiles
3. Enable "Sign In with Apple" capability
4. Create a new Services ID
5. Configure the domain and return URL
6. Generate a private key and note the Key ID and Team ID
7. Add these details to your `.env` file

## Setting Up Stripe

1. Create a [Stripe account](https://stripe.com/)
2. Get your API keys from the Stripe Dashboard
3. For subscription billing, create a product and pricing plan
4. Add your Stripe API keys and price ID to your `.env` file

## Setting Up OpenAI

1. Create an [OpenAI account](https://platform.openai.com/)
2. Generate an API key
3. Add the API key to your `.env` file

## Deployment

You can deploy the application using Docker:

```bash
docker-compose up -d
