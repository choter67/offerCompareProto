import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { InsertOffer } from "@shared/schema";
import { X, DollarSign, Percent } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CONTINGENCY_TYPES } from "@/lib/types";

interface OfferFormProps {
  form: UseFormReturn<any>;
}

export default function OfferForm({ form }: OfferFormProps) {
  const [commissionType, setCommissionType] = useState<"dollar" | "percent">("dollar");
  const [customContingency, setCustomContingency] = useState("");
  
  // Initialize contingencies array if it doesn't exist
  useEffect(() => {
    if (!form.getValues("contingencies")) {
      form.setValue("contingencies", []);
    }
  }, [form]);
  
  // Handle commission type change
  const handleCommissionTypeChange = (type: "dollar" | "percent") => {
    setCommissionType(type);
    
    // Convert current value to the new type
    const currentPrice = Number(form.getValues("price")) || 0;
    const currentCommission = Number(form.getValues("agentCommission")) || 0;
    
    if (type === "percent" && currentCommission > 0) {
      // Convert dollar amount to percentage
      const percentage = (currentCommission / currentPrice) * 100;
      form.setValue("agentCommission", Math.round(percentage * 100) / 100); // Round to 2 decimal places
    } else if (type === "dollar" && currentCommission > 0) {
      // Convert percentage to dollar amount
      const dollarAmount = (currentCommission / 100) * currentPrice;
      form.setValue("agentCommission", Math.round(dollarAmount * 100) / 100); // Round to 2 decimal places
    }
  };
  
  // Handle contingency checkbox change
  const handleContingencyChange = (contingency: string, checked: boolean) => {
    const currentContingencies = form.getValues("contingencies") || [];
    
    if (checked) {
      // Add contingency if it doesn't exist
      if (!currentContingencies.includes(contingency)) {
        form.setValue("contingencies", [...currentContingencies, contingency]);
      }
    } else {
      // Remove contingency
      form.setValue(
        "contingencies", 
        currentContingencies.filter(item => item !== contingency)
      );
    }
  };
  
  // Handle adding custom contingency
  const handleAddCustomContingency = () => {
    if (!customContingency.trim()) return;
    
    const currentContingencies = form.getValues("contingencies") || [];
    
    // Add new contingency if it doesn't already exist
    if (!currentContingencies.includes(customContingency)) {
      form.setValue("contingencies", [...currentContingencies, customContingency]);
    }
    
    // Clear input
    setCustomContingency("");
  };
  
  // Handle removing contingency
  const handleRemoveContingency = (contingency: string) => {
    const currentContingencies = form.getValues("contingencies") || [];
    form.setValue(
      "contingencies", 
      currentContingencies.filter(item => item !== contingency)
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="buyerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Buyer Name</FormLabel>
              <FormControl>
                <Input placeholder="John Smith" {...field} />
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
                  <SelectItem value="first-time">First-time buyer</SelectItem>
                  <SelectItem value="cash">Cash buyer</SelectItem>
                  <SelectItem value="pre-approved">Pre-approved</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Helps assess buyer qualification and risk
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Offer Price</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00"
                    className="pl-7"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormField
            control={form.control}
            name="agentCommission"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Agent Commission</FormLabel>
                  
                  <div className="flex items-center space-x-1 border rounded-md p-1">
                    <Button
                      variant={commissionType === "dollar" ? "default" : "ghost"}
                      size="sm"
                      type="button"
                      className="flex items-center gap-1 h-6 px-2"
                      onClick={() => handleCommissionTypeChange("dollar")}
                    >
                      <DollarSign className="h-3 w-3" />
                      <span>$</span>
                    </Button>
                    <Button
                      variant={commissionType === "percent" ? "default" : "ghost"}
                      size="sm"
                      type="button"
                      className="flex items-center gap-1 h-6 px-2"
                      onClick={() => handleCommissionTypeChange("percent")}
                    >
                      <Percent className="h-3 w-3" />
                      <span>%</span>
                    </Button>
                  </div>
                </div>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      {commissionType === "dollar" ? "$" : "%"}
                    </span>
                    <Input 
                      type="number" 
                      placeholder={commissionType === "dollar" ? "0.00" : "0.0"}
                      className="pl-7"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  {commissionType === "dollar" 
                    ? "Enter dollar amount of commission" 
                    : "Enter commission percentage (e.g., 6 for 6%)"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <FormField
        control={form.control}
        name="closingTimelineDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Closing Timeline (days)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="30" 
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="space-y-4">
        <FormLabel>Contingencies</FormLabel>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CONTINGENCY_TYPES.map((contingency) => {
            const currentContingencies = form.getValues("contingencies") || [];
            const isChecked = currentContingencies.includes(contingency);
            
            return (
              <div key={contingency} className="flex items-start space-x-2 border p-3 rounded-md hover:bg-muted/50">
                <Checkbox 
                  id={`contingency-${contingency}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => 
                    handleContingencyChange(contingency, checked as boolean)
                  }
                />
                <label
                  htmlFor={`contingency-${contingency}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {contingency}
                </label>
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Add custom contingency"
            value={customContingency}
            onChange={(e) => setCustomContingency(e.target.value)}
            className="max-w-[250px]"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleAddCustomContingency}
            disabled={!customContingency.trim()}
          >
            Add Custom
          </Button>
        </div>
        
        <FormDescription>
          Select all contingencies included in the offer. These affect the risk assessment.
        </FormDescription>
      </div>
      
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Additional notes about the offer..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
