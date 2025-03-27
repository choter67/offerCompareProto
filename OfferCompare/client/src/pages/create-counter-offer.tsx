import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronLeft, FileText, RotateCcw } from "lucide-react";
import CounterOfferForm from "@/components/offers/counter-offer-form";
import { Offer, insertOfferSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import OfferDiff from "@/components/offers/offer-diff";

export default function CreateCounterOffer() {
  const [_, navigate] = useLocation();
  const params = useParams<{ listingId: string; offerId: string }>();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  
  const listingId = parseInt(params.listingId);
  const offerId = parseInt(params.offerId);

  // Fetch the original offer data
  const { data: originalOffer, isLoading: isLoadingOffer } = useQuery<Offer>({
    queryKey: ["/api/offers", offerId],
    enabled: !isNaN(offerId),
  });

  // Create form schema for counter offer
  const counterOfferSchema = insertOfferSchema
    .extend({
      // Add fields for counter offer
      parentOfferId: z.number(),
      isCounterOffer: z.boolean(),
      versionNumber: z.number(),
      commissionType: z.enum(["dollar", "percent"]).default("dollar"),
    });
  
  const form = useForm<z.infer<typeof counterOfferSchema>>({
    resolver: zodResolver(counterOfferSchema),
    defaultValues: {
      listingId,
      parentOfferId: offerId,
      isCounterOffer: true,
      versionNumber: 1, // Will be updated when the original offer is loaded
    },
  });

  // Mutation for submitting counter offer
  const counterOfferMutation = useMutation({
    mutationFn: async (data: z.infer<typeof counterOfferSchema>) => {
      const response = await apiRequest("POST", "/api/offers", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Counter offer created",
        description: "Your counter offer has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", listingId, "offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers", offerId] });
      navigate(`/listings/${listingId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating counter offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: z.infer<typeof counterOfferSchema>) {
    counterOfferMutation.mutate(data);
  }

  // Toggle preview mode
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (isLoadingOffer || !originalOffer) {
    return (
      <div className="p-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/listings">Listings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/listings/${listingId}`}>Listing Details</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Create Counter Offer</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create Counter Offer</h1>
          <Button variant="outline" size="sm" onClick={() => navigate(`/listings/${listingId}`)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Listing
          </Button>
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/listings">Listings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/listings/${listingId}`}>Listing Details</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Create Counter Offer</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Counter Offer</h1>
          <p className="text-neutral-500">Counter to offer from {originalOffer.buyerName}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/listings/${listingId}`)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Listing
        </Button>
      </div>
      
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-base font-medium">Original Offer Summary</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Price</p>
              <p className="font-medium">${Number(originalOffer.price).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Net Proceeds</p>
              <p className="font-medium">${Number(originalOffer.netProceeds).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Timeline</p>
              <p className="font-medium">{originalOffer.closingTimelineDays} days</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Contingencies</p>
              <p className="font-medium">{Array.isArray(originalOffer.contingencies) ? originalOffer.contingencies.length : 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CounterOfferForm 
            form={form} 
            originalOffer={originalOffer}
            previewMode={showPreview}
            onTogglePreview={togglePreview}
          />
        </form>
      </Form>
    </div>
  );
}