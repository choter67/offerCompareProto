import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Check } from "lucide-react";

export default function Pricing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 text-transparent bg-clip-text cursor-pointer">
                OfferCompare
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-violet-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-violet-600 text-transparent bg-clip-text">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 text-gray-700">
            OfferCompare offers a straightforward pricing model designed to deliver exceptional value for real estate professionals.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Pay-Per-Listing Plan */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="p-8">
                <h3 className="text-xl font-semibold mb-4">Pay-Per-Listing</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$50</span>
                  <span className="text-gray-500 ml-2">per listing</span>
                </div>
                <p className="text-gray-700 mb-6">
                  Perfect for agents who want to manage offers for individual properties without a subscription.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>$50 flat fee per property listing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Unlimited offer comparisons per listing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>AI-powered document analysis</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Detailed insights and recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Access to listing for 90 days</span>
                  </li>
                </ul>
                {user ? (
                  <Link href="/dashboard">
                    <Button className="w-full">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <Link href="/auth">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Free Trial */}
            <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg shadow-lg overflow-hidden border border-blue-200">
              <div className="p-8">
                <h3 className="text-xl font-semibold mb-4">Free Trial</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">14 Days</span>
                  <span className="text-gray-500 ml-2">free</span>
                </div>
                <p className="text-gray-700 mb-6">
                  Try OfferCompare with no commitment for 14 days to experience all the benefits before you pay.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Create 1 listing during trial</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Full access to all features</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>AI-powered document extraction</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>No credit card required</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Full email support</span>
                  </li>
                </ul>
                {user ? (
                  <Link href="/dashboard">
                    <Button className="w-full">Start Your Trial</Button>
                  </Link>
                ) : (
                  <Link href="/auth">
                    <Button className="w-full">Start Your Trial</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How does the pay-per-listing model work?</h3>
                <p className="text-gray-700">
                  When you create a new listing on OfferCompare, a one-time fee of $50 is charged to your account. This gives you full access to all features for that specific property listing, including unlimited offer comparisons and AI analysis, for 90 days.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Are there any hidden fees?</h3>
                <p className="text-gray-700">
                  No, there are no hidden fees. You only pay $50 per property listing. All features, including AI document extraction and analysis, are included in this flat fee.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Can I extend my listing beyond 90 days?</h3>
                <p className="text-gray-700">
                  Yes, you can extend a listing for an additional 90 days for $25. This option becomes available when your listing is approaching its expiration date.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How does the 14-day free trial work?</h3>
                <p className="text-gray-700">
                  Sign up and get immediate access to all features for 14 days. You can create 1 listing during this period with no credit card required. After the trial, you can continue using OfferCompare with our standard $50 per listing fee.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What payment methods do you accept?</h3>
                <p className="text-gray-700">
                  We accept all major credit and debit cards, including Visa, Mastercard, American Express, and Discover.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to streamline your offer management?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join real estate professionals nationwide who trust OfferCompare to make better decisions.
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="lg" variant="secondary">
                Create Free Account
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-xl font-bold text-white mb-4">OfferCompare</h3>
              <p className="max-w-xs">
                The smart way to analyze and compare real estate offers.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><Link href="/"><a className="hover:text-white transition-colors">Features</a></Link></li>
                  <li><Link href="/pricing"><a className="hover:text-white transition-colors">Pricing</a></Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Testimonials</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} OfferCompare. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}