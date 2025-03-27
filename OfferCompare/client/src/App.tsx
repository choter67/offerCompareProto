import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard";
import ListingDetails from "./pages/listing-details";
import CreateListing from "./pages/create-listing";
import CreateOffer from "./pages/create-offer";
import Billing from "./pages/billing";
import LandingPage from "./pages/landing-page";
import Pricing from "./pages/pricing";
import NotFound from "@/pages/not-found";
import CreateCounterOffer from "./pages/create-counter-offer";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/pricing" component={Pricing} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/listings/create" component={CreateListing} />
      <ProtectedRoute path="/listings/:id" component={ListingDetails} />
      <ProtectedRoute path="/listings/:listingId/offers/:offerId/counter" component={CreateCounterOffer} />
      <ProtectedRoute path="/listings/:id/offers/create" component={CreateOffer} />
      <ProtectedRoute path="/billing" component={Billing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
