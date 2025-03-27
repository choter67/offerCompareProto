import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Home, Search } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import ListingCard from "@/components/listings/listing-card";
import { Listing } from "@shared/schema";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });
  
  // Filter listings by search query
  const filteredListings = listings.filter(listing => 
    listing.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.state.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group listings by status
  const activeListings = filteredListings.filter(listing => listing.status === "active");
  const pendingListings = filteredListings.filter(listing => listing.status === "pending");
  const soldListings = filteredListings.filter(listing => listing.status === "sold");
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
              <h2 className="text-lg font-medium">Dashboard</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search listings..."
                  className="w-full pl-8 md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button onClick={() => navigate("/listings/create")}>
                <Plus className="mr-2 h-4 w-4" />
                New Listing
              </Button>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6">
          {/* Welcome Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Welcome, {user?.username}</h1>
                  <p className="text-neutral-600">Manage your listings and compare offers effectively</p>
                </div>
                <Button className="mt-4 md:mt-0" onClick={() => navigate("/listings/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Listing
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Listings section */}
          <div>
            <Tabs defaultValue="active">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="active">Active ({activeListings.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingListings.length})</TabsTrigger>
                  <TabsTrigger value="sold">Sold ({soldListings.length})</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="active">
                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-0">
                          <div className="h-48 bg-neutral-200 rounded-t-lg" />
                          <div className="p-4">
                            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-neutral-200 rounded w-1/2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : activeListings.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 flex flex-col items-center">
                      <Home className="h-12 w-12 text-neutral-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No active listings</h3>
                      <p className="text-neutral-500 text-center mb-6">
                        You don't have any active listings yet. Create your first listing to get started.
                      </p>
                      <Button onClick={() => navigate("/listings/create")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Listing
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="pending">
                {pendingListings.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 flex flex-col items-center">
                      <Home className="h-12 w-12 text-neutral-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No pending listings</h3>
                      <p className="text-neutral-500 text-center">
                        You don't have any listings in pending status.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="sold">
                {soldListings.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {soldListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 flex flex-col items-center">
                      <Home className="h-12 w-12 text-neutral-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No sold listings</h3>
                      <p className="text-neutral-500 text-center">
                        You don't have any sold listings yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
