import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Sidebar from "@/components/layout/sidebar";
import ListingForm from "@/components/listings/listing-form";
import { insertListingSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
      description: "",
      imageUrl: ""
    }
  });
  
  const createListingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/listings", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Listing created",
        description: "Your listing has been created successfully",
      });
      navigate(`/listings/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: any) {
    // No need to manually convert numeric values as the schema handles it
    createListingMutation.mutate(data);
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow">
          <div className="flex h-16 items-center px-4 md:px-6">
            <h2 className="text-lg font-medium">Create New Listing</h2>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Listing Form Fields */}
                <ListingForm form={form} />
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/dashboard")} 
                    type="button"
                    disabled={createListingMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createListingMutation.isPending}
                  >
                    {createListingMutation.isPending ? "Creating..." : "Create Listing"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </main>
      </div>
    </div>
  );
}
