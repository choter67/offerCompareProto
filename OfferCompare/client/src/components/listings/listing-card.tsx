import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Listing } from "@shared/schema";
import { Home } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  // Format price and calculate days on market
  const formattedPrice = Number(listing.price).toLocaleString();
  const daysOnMarket = Math.floor(
    (new Date().getTime() - new Date(listing.listedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Format address
  const formattedAddress = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zipCode}`;

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/listings/${listing.id}`}>
        <a className="block">
          <div className="h-48 w-full overflow-hidden">
            {listing.imageUrl ? (
              <img 
                src={listing.imageUrl} 
                alt={formattedAddress}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-neutral-200 flex items-center justify-center">
                <Home className="h-12 w-12 text-neutral-400" />
              </div>
            )}
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium line-clamp-1">{formattedAddress}</h3>
              <Badge className={getStatusBadgeColor(listing.status)}>
                {listing.status}
              </Badge>
            </div>
            
            <div className="text-2xl font-bold text-primary mb-2">
              ${formattedPrice}
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-center p-1 bg-neutral-100 rounded">
                <p className="text-sm font-medium">{listing.bedrooms}</p>
                <p className="text-xs text-neutral-500">Beds</p>
              </div>
              <div className="text-center p-1 bg-neutral-100 rounded">
                <p className="text-sm font-medium">{listing.bathrooms}</p>
                <p className="text-xs text-neutral-500">Baths</p>
              </div>
              <div className="text-center p-1 bg-neutral-100 rounded">
                <p className="text-sm font-medium">{listing.sqft ? `${listing.sqft.toLocaleString()}` : "—"}</p>
                <p className="text-xs text-neutral-500">Sq Ft</p>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Listed {new Date(listing.listedDate).toLocaleDateString()}</span>
              <span>{daysOnMarket} days on market</span>
            </div>
          </CardContent>
        </a>
      </Link>
    </Card>
  );
}
