import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Offer } from "@shared/schema";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface OfferCardProps {
  offer: Offer;
  listingId: number;
}

export default function OfferCard({ offer, listingId }: OfferCardProps) {
  // Calculate risk level based on risk score
  const riskLevel = 
    offer.riskScore >= 8 ? "Low" :
    offer.riskScore >= 5 ? "Medium" : "High";
  
  // Get color classes for risk badge
  const riskBadgeClasses = 
    riskLevel === "Low" ? "bg-green-100 text-green-800" :
    riskLevel === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  
  // Get icon for risk level
  const RiskIcon = 
    riskLevel === "Low" ? CheckCircle :
    riskLevel === "Medium" ? AlertTriangle : AlertCircle;
  
  // Get buyer initials for avatar
  const initials = offer.buyerName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Format price values
  const priceValue = Number(offer.price);
  const netProceedsValue = Number(offer.netProceeds);
  
  // Calculate commission value for display
  const agentCommissionValue = Number(offer.agentCommission) || 0;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary bg-opacity-10 text-primary">
                <div className="flex h-full w-full items-center justify-center text-sm">{initials}</div>
              </div>
              <div className="ml-3">
                <h3 className="font-medium">{offer.buyerName}</h3>
                <p className="text-sm text-neutral-500">{offer.buyerType || "Buyer"}</p>
              </div>
            </div>
            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${riskBadgeClasses}`}>
              <RiskIcon className="mr-1 h-3 w-3" />
              {riskLevel}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-neutral-500">Offer Price</p>
              <p className="text-lg font-medium text-green-600">${priceValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Net Proceeds</p>
              <p className="text-lg font-medium">${netProceedsValue.toLocaleString()}</p>
              <div className="mt-1 text-xs text-neutral-500">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help underline underline-offset-2 decoration-dotted">
                        Calculation breakdown
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] p-4 z-50">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-1">
                          <p>Offer Price:</p>
                          <p className="text-right">${priceValue.toLocaleString()}</p>
                        </div>
                        {agentCommissionValue > 0 && (
                          <div className="grid grid-cols-2 gap-1">
                            <p>Agent Commission:</p>
                            <p className="text-right text-red-500">-${agentCommissionValue.toLocaleString()}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-1">
                          <p>Loan Balance:</p>
                          <p className="text-right text-red-500">-${(priceValue - agentCommissionValue - netProceedsValue).toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1 border-t pt-1 font-medium">
                          <p>Net Proceeds:</p>
                          <p className="text-right">${netProceedsValue.toLocaleString()}</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-neutral-500">Closing Timeline</p>
              <p className="text-base">{offer.closingTimelineDays} days</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Overall Score</p>
              <div className="inline-flex items-center">
                <span className="text-lg font-medium text-primary">{offer.overallScore}</span>
                <span className="ml-1 text-xs text-neutral-500">/100</span>
              </div>
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-sm text-neutral-500 mb-1">Contingencies</p>
            <div className="flex flex-wrap gap-1">
              {(offer.contingencies as string[])?.map((contingency, i) => (
                <Badge key={i} variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  {contingency}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-neutral-50 p-3 flex gap-2 justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/listings/${listingId}/offers/${offer.id}`}>
              View Details
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
            >
              <Link href={`/listings/${listingId}/offers/${offer.id}/counter`}>
                Counter Offer
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
