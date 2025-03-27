import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, Search } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import OfferTable from "@/components/offers/offer-table";
import PrioritySlider from "@/components/priorities/priority-slider";
import OfferAnalysis from "@/components/offers/offer-analysis";
import { Listing, Offer, ListingPriorities } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ListingDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch listing details
  const { data: listing, isLoading: isListingLoading } = useQuery<Listing>({
    queryKey: [`/api/listings/${id}`],
  });
  
  // Fetch offers for this listing
  const { data: offers = [], isLoading: isOffersLoading } = useQuery<Offer[]>({
    queryKey: [`/api/listings/${id}/offers`],
    enabled: !!id,
  });
  
  // Fetch priorities for this listing
  const { data: priorities, isLoading: isPrioritiesLoading } = useQuery<ListingPriorities>({
    queryKey: [`/api/listings/${id}/priorities`],
    enabled: !!id,
  });
  
  // Update priorities mutation
  const updatePrioritiesMutation = useMutation({
    mutationFn: async (data: Partial<ListingPriorities>) => {
      const res = await apiRequest("PATCH", `/api/listings/${id}/priorities`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${id}/priorities`] });
      toast({
        title: "Priorities updated",
        description: "Your priorities have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle priority change
  const handlePriorityChange = (field: keyof ListingPriorities, value: number) => {
    if (priorities) {
      updatePrioritiesMutation.mutate({
        [field]: value
      });
    }
  };
  
  // Filter offers by search query
  const filteredOffers = offers.filter(offer => 
    offer.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (isListingLoading || !listing) {
    return <div className="flex justify-center items-center h-screen">Loading listing details...</div>;
  }
  
  const formattedAddress = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">{formattedAddress}</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search offers..."
                  className="w-full pl-8 md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button variant="outline" onClick={() => navigate(`/listings/${id}/offers/create?mode=upload`)}>
                <Upload className="mr-2 h-4 w-4" /> 
                Upload Offer
              </Button>
              
              <Button onClick={() => navigate(`/listings/${id}/offers/create`)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Offer Manually
              </Button>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6">
          {/* Page Header */}
          <div className="mb-6 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Offer Comparison</h1>
              <p className="text-sm text-neutral-600">Compare and analyze offers for your property</p>
            </div>
          </div>
          
          {/* Main Layout with Side priorities bar */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Priority Settings Sidebar */}
            <div className="md:w-64 flex-shrink-0">
              <Card className="sticky top-6">
                <CardContent className="p-4">
                  <h3 className="mb-2 text-base font-medium">Set Your Priorities</h3>
                  <p className="mb-4 text-xs text-neutral-600">Adjust these sliders to reflect your priorities when comparing offers.</p>
                  
                  {isPrioritiesLoading ? (
                    <div className="space-y-4">
                      <div className="h-6 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="h-6 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="h-6 bg-neutral-200 rounded animate-pulse"></div>
                    </div>
                  ) : priorities ? (
                    <div className="space-y-4">
                      <PrioritySlider
                        label="Offer Price"
                        value={priorities.offerPrice}
                        onChange={(value) => handlePriorityChange('offerPrice', value)}
                      />
                      
                      <PrioritySlider
                        label="Net Proceeds"
                        value={priorities.netProceeds}
                        onChange={(value) => handlePriorityChange('netProceeds', value)}
                      />
                      
                      <PrioritySlider
                        label="Closing Timeline"
                        value={priorities.closingTimeline}
                        onChange={(value) => handlePriorityChange('closingTimeline', value)}
                      />
                      
                      <PrioritySlider
                        label="Contingencies"
                        value={priorities.contingencies}
                        onChange={(value) => handlePriorityChange('contingencies', value)}
                      />
                      
                      <PrioritySlider
                        label="Buyer Qualification"
                        value={priorities.buyerQualification}
                        onChange={(value) => handlePriorityChange('buyerQualification', value)}
                      />
                    </div>
                  ) : (
                    <div>Failed to load priorities</div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1">
              {/* Property Info Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="col-span-2">
                      <div className="mb-4 flex items-center">
                        <h2 className="text-xl font-bold">{formattedAddress}</h2>
                        <span className="ml-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">{listing.status}</span>
                      </div>
                      
                      <div className="mb-4 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-neutral-500">Listing Price</p>
                          <p className="text-lg font-medium">${Number(listing.price).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Loan Balance</p>
                          <p className="text-lg font-medium">${Number(listing.loanBalance || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Sq. Footage</p>
                          <p className="text-lg font-medium">{listing.sqft ? `${listing.sqft} sq ft` : "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-neutral-500">Bedrooms</p>
                          <p className="text-lg font-medium">{listing.bedrooms}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Bathrooms</p>
                          <p className="text-lg font-medium">{listing.bathrooms}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">
                            Days on market: <span className="text-neutral-700">
                              {Math.floor((new Date().getTime() - new Date(listing.listedDate).getTime()) / (1000 * 60 * 60 * 24))}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-neutral-500">Description</p>
                        <p className="text-neutral-700">{listing.description || "No description provided"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <img 
                        src={listing.imageUrl || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"} 
                        alt={formattedAddress} 
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <div className="mt-3 flex justify-between">
                        <Button variant="link" onClick={() => navigate(`/listings/${id}`)}>View Listing Details</Button>
                        <Button variant="link">Edit Listing</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Offer Comparison Table */}
              <OfferTable offers={filteredOffers} isLoading={isOffersLoading} listingId={Number(id)} />
              
              {/* Insights Panel */}
              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <OfferAnalysis listingId={Number(id)} offers={offers} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
