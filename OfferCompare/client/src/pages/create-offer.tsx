import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import OfferForm from "@/components/offers/offer-form";
import FileUpload from "@/components/file-upload";
import { insertOfferSchema, Listing } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CreateOffer() {
  const { id: listingId } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if we should default to upload tab
  const params = new URLSearchParams(location.split("?")[1]);
  const defaultTab = params.get("mode") === "upload" ? "upload" : "manual";
  
  // Fetch listing details
  const { data: listing } = useQuery<Listing>({
    queryKey: [`/api/listings/${listingId}`],
  });
  
  const form = useForm({
    resolver: zodResolver(insertOfferSchema),
    defaultValues: {
      listingId: Number(listingId),
      buyerName: "",
      buyerType: "",
      price: 0,
      agentCommission: 0,
      closingTimelineDays: 30,
      contingencies: [],
      notes: "",
      status: "pending"
    }
  });
  
  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/offers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${listingId}/offers`] });
      toast({
        title: "Offer created",
        description: "The offer has been created successfully",
      });
      navigate(`/listings/${listingId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: any) {
    // Handle contingencies
    if (typeof data.contingencies === 'string') {
      data.contingencies = data.contingencies.split(',').map((c: string) => c.trim());
    }
    
    // No need to manually convert numeric values as the schema handles it
    createOfferMutation.mutate(data);
  }
  
  // Handle uploaded document data
  const handleExtractedData = (extractedData: any) => {
    // Pre-fill the form with extracted data
    form.reset({
      ...form.getValues(),
      ...extractedData,
      listingId: Number(listingId),
    });
    
    // Switch to manual tab to review and submit
    document.getElementById("manual-tab")?.click();
    
    toast({
      title: "Document parsed",
      description: "Please review the extracted information before submitting",
    });
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center px-4 md:px-6">
            <h2 className="text-lg font-medium">
              Add Offer for {listing?.address}
            </h2>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue={defaultTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="manual" id="manual-tab">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Upload Document</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Offer Form Fields */}
                    <OfferForm form={form} />
                    
                    <div className="flex justify-end space-x-4">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/listings/${listingId}`)} 
                        type="button"
                        disabled={createOfferMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createOfferMutation.isPending}
                      >
                        {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="upload">
                <FileUpload 
                  listingId={Number(listingId)} 
                  onExtracted={handleExtractedData} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
