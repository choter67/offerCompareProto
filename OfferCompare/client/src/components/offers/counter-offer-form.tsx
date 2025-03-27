import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Offer } from "@shared/schema";
import { BUYER_TYPES, CONTINGENCY_TYPES } from "@/lib/types";
import { ArrowLeftRight, ExternalLink, Save, FileText, RotateCcw } from "lucide-react";
import OfferDiff from "./offer-diff";

interface CounterOfferFormProps {
  form: UseFormReturn<any>;
  originalOffer: Offer;
  previewMode?: boolean;
  onTogglePreview?: () => void;
}

export default function CounterOfferForm({ 
  form, 
  originalOffer,
  previewMode = false,
  onTogglePreview
}: CounterOfferFormProps) {
  const [activeTab, setActiveTab] = useState<string>("form");
  const [commissionType, setCommissionType] = useState<"dollar" | "percent">("dollar");

  // Set default form values based on the original offer
  useEffect(() => {
    if (originalOffer) {
      // Calculate next version number
      const nextVersionNumber = (originalOffer.versionNumber || 0) + 1;
      
      // Get the offer's commission value
      let commission = originalOffer.agentCommission;
      let commissionType = "dollar";
      
      // Convert commission to percentage if it's less than 20 (likely a percentage)
      if (commission && commission > 0 && commission < 20) {
        commission = commission;
        commissionType = "percent";
      }
      
      // Set form values from the original offer, allowing for modifications
      form.reset({
        listingId: originalOffer.listingId,
        parentOfferId: originalOffer.id,
        isCounterOffer: true,
        versionNumber: nextVersionNumber,
        buyerName: originalOffer.buyerName,
        buyerType: originalOffer.buyerType,
        price: originalOffer.price,
        agentCommission: commission,
        commissionType: commissionType,
        closingTimelineDays: originalOffer.closingTimelineDays,
        contingencies: originalOffer.contingencies,
        notes: originalOffer.notes
      });
      
      setCommissionType(commissionType as any);
    }
  }, [originalOffer, form]);

  // Get a preview of the counter offer for comparison
  const getPreviewCounterOffer = (): Offer => {
    const formValues = form.getValues();
    
    // Convert commission to dollars if it's a percentage
    let agentCommission = Number(formValues.agentCommission || 0);
    if (formValues.commissionType === "percent") {
      agentCommission = (Number(formValues.price) * agentCommission) / 100;
    }
    
    // Calculate net proceeds based on the listing's loan balance
    const price = Number(formValues.price);
    const netProceeds = price - agentCommission;
    
    // Simple risk score calculation
    const contingencies = formValues.contingencies || [];
    const riskScore = Math.max(1, 10 - contingencies.length * 2);
    
    // Simple overall score calculation
    const overallScore = Math.round((price / 1000000 * 40) + (riskScore * 5) + (60 - Number(formValues.closingTimelineDays) / 2));
    
    // Create the counter offer object
    return {
      ...formValues,
      id: originalOffer.id + 1000, // Just for preview, not the real ID
      netProceeds,
      riskScore,
      overallScore,
      createdAt: new Date(),
      agentCommission
    } as Offer;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="form">
              <FileText className="h-4 w-4 mr-2" />
              Edit Counter Offer
            </TabsTrigger>
            <TabsTrigger value="diff">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Compare Changes
            </TabsTrigger>
          </TabsList>
          
          {onTogglePreview && (
            <Button variant="outline" type="button" onClick={onTogglePreview}>
              {previewMode ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Changes
                </>
              )}
            </Button>
          )}
        </div>
        
        <TabsContent value="form" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Buyer Information</CardTitle>
              <CardDescription>
                Enter the buyer details for this counter offer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="buyerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buyer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="buyerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buyer Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select buyer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUYER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>
                Enter the financial details of this counter offer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5">$</span>
                        <Input 
                          type="number" 
                          placeholder="500000" 
                          className="pl-7" 
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>Agent Commission</FormLabel>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <RadioGroup value={commissionType} onValueChange={(v) => {
                      setCommissionType(v as "dollar" | "percent");
                      form.setValue("commissionType", v as "dollar" | "percent");
                    }} className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dollar" id="dollar" />
                        <Label htmlFor="dollar">$</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percent" id="percent" />
                        <Label htmlFor="percent">%</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name="agentCommission"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5">
                                {commissionType === "dollar" ? "$" : ""}
                              </span>
                              <Input 
                                type="number" 
                                className={commissionType === "dollar" ? "pl-7" : "pl-3"}
                                placeholder={commissionType === "dollar" ? "15000" : "3"} 
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                              {commissionType === "percent" && (
                                <span className="absolute right-3 top-2.5">%</span>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            {commissionType === "dollar" 
                              ? "The total commission amount in dollars"
                              : "The commission percentage of the offer price"
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardHeader>
              <CardTitle>Timeline & Contingencies</CardTitle>
              <CardDescription>
                Specify closing timeline and any applicable contingencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="closingTimelineDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Timeline (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="30" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contingencies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contingencies</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {CONTINGENCY_TYPES.map((contingency) => (
                        <div key={contingency} className="flex items-start space-x-2">
                          <Checkbox
                            id={`contingency-${contingency}`}
                            checked={field.value?.includes(contingency)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...(field.value || []), contingency]);
                              } else {
                                field.onChange(field.value?.filter(c => c !== contingency));
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`contingency-${contingency}`}
                            className="text-sm font-normal leading-none"
                          >
                            {contingency}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any additional information or notes about this counter offer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional details about this counter offer..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Submit Counter Offer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="diff" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Compare Changes</CardTitle>
              <CardDescription>
                Review the differences between the original offer and your counter offer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OfferDiff 
                originalOffer={originalOffer} 
                newOffer={getPreviewCounterOffer()} 
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setActiveTab("form")}>
                Back to Form
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Submit Counter Offer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}