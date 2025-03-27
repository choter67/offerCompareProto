import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Offer } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, TrendingUp, DollarSign, Handshake } from "lucide-react";

interface OfferAnalysisProps {
  listingId: number;
  offers: Offer[];
}

interface InsightsData {
  recommendation: string;
  riskAssessment: string;
  netProceedsComparison: string;
  negotiationOpportunities: string;
}

export default function OfferAnalysis({ listingId, offers }: OfferAnalysisProps) {
  // Fetch insights data
  const { data: insights, isLoading } = useQuery<InsightsData>({
    queryKey: [`/api/listings/${listingId}/insights`],
    enabled: offers.length > 0,
  });

  // Prepare data for chart visualization
  const chartData = offers.map(offer => {
    // Get buyer initials for labels
    const initials = offer.buyerName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
      
    return {
      name: initials,
      price: Number(offer.price),
      netProceeds: Number(offer.netProceeds),
      score: offer.overallScore,
      risk: offer.riskScore * 10, // Scale to match other metrics
      timeline: 100 - offer.closingTimelineDays, // Inverse (shorter is better)
    };
  });

  // If no offers, show empty state
  if (offers.length === 0) {
    return (
      <Card className="col-span-2">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Offers to Analyze</h3>
            <p className="text-neutral-500 text-center max-w-md">
              Add at least one offer to see comparative analysis and recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <Card>
          <CardContent className="p-6 animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-40 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-5/6" />
              <div className="h-4 bg-neutral-200 rounded w-4/6" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-40 mb-4" />
            <div className="h-64 bg-neutral-200 rounded w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Analysis Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center text-lg font-medium">
            <TrendingUp className="mr-2 text-primary" size={20} />
            Offer Analysis
          </h3>
          
          {insights ? (
            <>
              <div className="mb-6 rounded-lg bg-neutral-50 p-4">
                <h4 className="mb-2 text-base font-medium">Recommendation</h4>
                <p className="text-neutral-700">
                  {insights.recommendation}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 flex items-center text-base font-medium">
                    <AlertCircle className="mr-1 text-yellow-500" size={16} />
                    Risk Assessment
                  </h4>
                  <p className="text-sm text-neutral-700">
                    {insights.riskAssessment}
                  </p>
                </div>
                
                <div>
                  <h4 className="mb-2 flex items-center text-base font-medium">
                    <DollarSign className="mr-1 text-green-500" size={16} />
                    Net Proceeds Comparison
                  </h4>
                  <p className="text-sm text-neutral-700">
                    {insights.netProceedsComparison}
                  </p>
                </div>
                
                <div>
                  <h4 className="mb-2 flex items-center text-base font-medium">
                    <Handshake className="mr-1 text-blue-500" size={16} />
                    Negotiation Opportunities
                  </h4>
                  <p className="text-sm text-neutral-700">
                    {insights.negotiationOpportunities}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-neutral-500">
              Unable to load analysis. Please try again later.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Visualization Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 flex items-center text-lg font-medium">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="mr-2 text-primary" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            Offer Comparison
          </h3>
          
          <div className="mb-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "price") return [`$${value.toLocaleString()}`, "Offer Price"];
                    if (name === "netProceeds") return [`$${value.toLocaleString()}`, "Net Proceeds"];
                    if (name === "score") return [value, "Overall Score"];
                    if (name === "risk") return [value/10, "Risk Score"];
                    if (name === "timeline") return [100-value, "Timeline (days)"];
                    return [value, name];
                  }}
                />
                <Bar dataKey="score" fill="hsl(var(--chart-1))" name="Overall Score" />
                <Bar dataKey="price" fill="hsl(var(--chart-2))" name="Offer Price" />
                <Bar dataKey="netProceeds" fill="hsl(var(--chart-3))" name="Net Proceeds" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-base font-medium">Offer Scores By Category</h4>
              
              {offers.map((offer, index) => {
                // Get buyer initials for labels
                const initials = offer.buyerName
                  .split(' ')
                  .map(part => part[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);
                
                return (
                  <div key={offer.id} className="mb-4">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-primary-light bg-opacity-10 text-xs font-medium text-primary">
                          <div className="flex h-full w-full items-center justify-center">{initials}</div>
                        </div>
                        <span className="ml-2 text-sm font-medium">{offer.buyerName}</span>
                      </div>
                      <span className="text-sm font-medium">{offer.overallScore}/100</span>
                    </div>
                    
                    <div className="h-2 w-full rounded-full bg-neutral-200">
                      <div 
                        className="h-2 rounded-full bg-primary" 
                        style={{ width: `${offer.overallScore}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <div 
                          className="mb-1 h-1.5 rounded-full bg-primary mx-auto" 
                          style={{ 
                            width: `${90 * Number(offer.price) / Math.max(...offers.map(o => Number(o.price)))}%` 
                          }}
                        ></div>
                        <span>Price</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="mb-1 h-1.5 rounded-full bg-primary mx-auto" 
                          style={{ 
                            width: `${90 * Number(offer.netProceeds) / Math.max(...offers.map(o => Number(o.netProceeds)))}%` 
                          }}
                        ></div>
                        <span>Net</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="mb-1 h-1.5 rounded-full bg-primary mx-auto" 
                          style={{ 
                            width: `${90 * (Math.min(...offers.map(o => o.closingTimelineDays)) / offer.closingTimelineDays)}%` 
                          }}
                        ></div>
                        <span>Timeline</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="mb-1 h-1.5 rounded-full bg-primary mx-auto" 
                          style={{ 
                            width: `${90 * (offer.riskScore / 10)}%` 
                          }}
                        ></div>
                        <span>Cont.</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="mb-1 h-1.5 rounded-full bg-primary mx-auto" 
                          style={{ width: "75%" }}
                        ></div>
                        <span>Buyer</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
