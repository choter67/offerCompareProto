import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, DollarSign, FileText } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { UsageEvent } from "@shared/schema";

export default function Billing() {
  const { toast } = useToast();
  
  // Fetch usage events
  const { data: usageEvents = [], isLoading } = useQuery<UsageEvent[]>({
    queryKey: ["/api/usage"],
  });

  // Calculate totals
  const totalUsage = usageEvents.reduce((total, event) => total + Number(event.amount), 0);
  const unpaidUsage = usageEvents
    .filter(event => !event.processed)
    .reduce((total, event) => total + Number(event.amount), 0);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center px-4 md:px-6">
            <h2 className="text-lg font-medium">Billing</h2>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Billing & Usage</h1>
            
            {/* Billing Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      Total Usage
                    </CardTitle>
                    <CardDescription>All time</CardDescription>
                  </div>
                  <DollarSign className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalUsage.toFixed(2)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      Unpaid Usage
                    </CardTitle>
                    <CardDescription>Pending payment</CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${unpaidUsage.toFixed(2)}</div>
                  {unpaidUsage > 0 && (
                    <Button 
                      className="mt-2 w-full" 
                      size="sm"
                      onClick={() => toast({
                        title: "Payment initiated",
                        description: "Redirecting to payment page...",
                      })}
                    >
                      Pay Now
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      Current Period
                    </CardTitle>
                    <CardDescription>This month</CardDescription>
                  </div>
                  <Calendar className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${usageEvents
                      .filter(event => {
                        const eventDate = new Date(event.createdAt);
                        const now = new Date();
                        return eventDate.getMonth() === now.getMonth() &&
                               eventDate.getFullYear() === now.getFullYear();
                      })
                      .reduce((total, event) => total + Number(event.amount), 0)
                      .toFixed(2)
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Payment Methods and Usage */}
            <Tabs defaultValue="usage">
              <TabsList className="mb-6">
                <TabsTrigger value="usage">Usage History</TabsTrigger>
                <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
              </TabsList>
              
              <TabsContent value="usage">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage History</CardTitle>
                    <CardDescription>
                      Track your usage charges across all features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <p>Loading usage data...</p>
                      </div>
                    ) : usageEvents.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usageEvents.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>
                                {new Date(event.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {event.eventType === "offer_creation" ? "Offer Creation" : 
                                 event.eventType === "document_extraction" ? "Document Extraction" : 
                                 event.eventType}
                              </TableCell>
                              <TableCell>${Number(event.amount).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={event.processed ? "outline" : "secondary"}>
                                  {event.processed ? "Paid" : "Pending"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-neutral-500">No usage events found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="payment-methods">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>
                      Manage your payment methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="h-8 w-8 mr-4 text-primary" />
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-neutral-500">Expires 12/2025</p>
                        </div>
                      </div>
                      <Badge>Default</Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => toast({
                        title: "Feature coming soon",
                        description: "Adding new payment methods will be available soon",
                      })}
                    >
                      Add Payment Method
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>
                      View and download your invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-64 flex items-center justify-center">
                    <p className="text-neutral-500">No invoices found</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
