import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  FileText, 
  BarChart2, 
  DollarSign, 
  Settings, 
  Menu, 
  X
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5 mr-3" /> },
    { href: "/listings", label: "My Listings", icon: <FileText className="h-5 w-5 mr-3" /> },
    { href: "/analytics", label: "Analytics", icon: <BarChart2 className="h-5 w-5 mr-3" /> },
    { href: "/billing", label: "Billing", icon: <DollarSign className="h-5 w-5 mr-3" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5 mr-3" /> },
  ];
  
  return (
    <>
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-30 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Menu Button */}
      <Button 
        variant="ghost" 
        className="fixed top-3 left-3 z-50 lg:hidden p-2" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold text-primary">OfferCompare</h1>
          <Button 
            variant="ghost"
            size="icon"
            className="lg:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div
                  className={`flex items-center rounded-lg px-4 py-2 cursor-pointer ${
                    (location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href)))
                      ? "bg-primary bg-opacity-10 text-primary"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            </div>
          ))}
        </nav>
        
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{user ? getInitials(user.username) : "U"}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-neutral-500">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => logoutMutation.mutate()}
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
