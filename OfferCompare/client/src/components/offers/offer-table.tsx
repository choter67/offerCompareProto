import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Offer, Listing } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface OfferTableProps {
  offers: Offer[];
  isLoading: boolean;
  listingId: number;
}

export default function OfferTable({ offers, isLoading, listingId }: OfferTableProps) {
  // Fetch listing details to get loan balance
  const { data: listing } = useQuery<Listing>({
    queryKey: [`/api/listings/${listingId}`],
    enabled: !!listingId,
  });
  
  // Sort offers by overall score (highest first)
  const sortedOffers = [...offers].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

  if (isLoading) {
    return (
      <Card className="overflow-hidden animate-pulse">
        <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
          <h3 className="text-lg font-medium">Offer Comparison</h3>
        </div>
        <div className="p-6">
          <div className="h-80 bg-neutral-100 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
          <h3 className="text-lg font-medium">Offer Comparison</h3>
        </div>
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="bg-neutral-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No offers yet</h3>
          <p className="text-neutral-500 text-center mb-6 max-w-md">
            Start adding offers to compare them and make data-driven decisions
          </p>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href={`/listings/${listingId}/offers/create?mode=upload`}>
                Upload Offer Document
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/listings/${listingId}/offers/create`}>
                Add Offer Manually
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
        <h3 className="text-lg font-medium">Offer Comparison</h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50">
              <TableHead className="whitespace-nowrap">Buyer</TableHead>
              <TableHead className="whitespace-nowrap">Offer Price</TableHead>
              <TableHead className="whitespace-nowrap">Net Proceeds</TableHead>
              <TableHead className="whitespace-nowrap">Closing Date</TableHead>
              <TableHead className="whitespace-nowrap">Contingencies</TableHead>
              <TableHead className="whitespace-nowrap">Risk Score</TableHead>
              <TableHead className="whitespace-nowrap">Overall Score</TableHead>
              <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-neutral-200">
            {sortedOffers.map((offer, index) => {
              // Determine risk level based on risk score
              const riskScore = offer.riskScore || 0;
              const riskLevel = 
                riskScore >= 8 ? "Low" :
                riskScore >= 5 ? "Medium" : "High";
              
              // Get color classes for risk badge
              const riskBadgeClasses = 
                riskLevel === "Low" ? "bg-green-100 text-green-800" :
                riskLevel === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
              
              // Get icon for risk level
              const RiskIcon = riskLevel === "Low" ? CheckCircle : AlertCircle;
              
              // Get buyer initials for avatar
              const initials = offer.buyerName
                .split(' ')
                .map(part => part[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              
              // Calculate net proceeds based on loan balance and commission
              const priceValue = Number(offer.price);
              const netProceedsValue = Number(offer.netProceeds || 0);
              const loanBalance = Number(listing?.loanBalance || 0);
              
              // Calculate the net proceeds if it's not already set
              const calculatedNetProceeds = netProceedsValue || (priceValue - loanBalance);
              const commissionsAndFees = priceValue - calculatedNetProceeds;
              const commissionPercentage = ((commissionsAndFees) / priceValue * 100).toFixed(1);
              
              return (
                <TableRow key={offer.id} className={index % 2 === 1 ? "bg-neutral-50" : ""}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary bg-opacity-10 text-primary">
                        <div className="flex h-full w-full items-center justify-center text-sm">{initials}</div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">{offer.buyerName}</div>
                        <div className="text-sm text-neutral-500">{offer.buyerType || "Buyer"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">${priceValue.toLocaleString()}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm font-medium">${calculatedNetProceeds.toLocaleString()}</div>
                    <div className="text-xs text-neutral-500">
                      {loanBalance > 0 ? 
                        <>After loan balance (${loanBalance.toLocaleString()}) and {commissionPercentage}% in fees</> : 
                        <>After {commissionPercentage}% in fees</>
                      }
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {offer.closingTimelineDays} days
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {(offer.contingencies as string[])?.map((contingency, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          {contingency}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${riskBadgeClasses}`}>
                      <RiskIcon className="mr-1 h-3 w-3" />
                      {riskLevel}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="inline-flex items-center">
                      <span className="text-lg font-bold text-primary">{offer.overallScore}</span>
                      <span className="ml-1 text-xs text-neutral-500">/100</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="link" className="mr-2" size="sm">View</Button>
                    <Button variant="link" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
