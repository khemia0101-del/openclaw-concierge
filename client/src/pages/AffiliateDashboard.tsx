import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Copy, DollarSign, Users, TrendingUp, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function AffiliateDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  
  // Fetch affiliate data
  const { data: affiliate, isLoading: affiliateLoading } = trpc.affiliate.getMyAffiliate.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: stats } = trpc.affiliate.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated && !!affiliate }
  );
  
  const { data: referrals } = trpc.affiliate.getReferrals.useQuery(
    undefined,
    { enabled: isAuthenticated && !!affiliate }
  );
  
  const { data: commissions } = trpc.affiliate.getCommissions.useQuery(
    undefined,
    { enabled: isAuthenticated && !!affiliate }
  );
  
  const createAffiliate = trpc.affiliate.createAffiliate.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });
  
  const updatePaymentInfo = trpc.affiliate.updatePaymentInfo.useMutation();
  
  const [paypalEmail, setPaypalEmail] = useState("");
  
  if (!isAuthenticated) {
    return (
      <div className="container py-20">
        <Card className="p-8 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to access the affiliate program.
          </p>
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }
  
  if (affiliateLoading) {
    return (
      <div className="container py-20">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  // If user is not an affiliate yet, show signup
  if (!affiliate) {
    return (
      <div className="container py-20">
        <Card className="p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Join Our Affiliate Program</h1>
            <p className="text-xl text-muted-foreground">
              Earn <span className="text-primary font-bold">30% lifetime commission</span> on every customer you refer
            </p>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">30% Recurring Commission</h3>
                <p className="text-muted-foreground text-sm">
                  Earn 30% of both setup fees AND monthly subscriptions for the lifetime of the customer
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Easy Tracking</h3>
                <p className="text-muted-foreground text-sm">
                  Get your unique referral link and track every click, signup, and commission in real-time
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Monthly Payouts</h3>
                <p className="text-muted-foreground text-sm">
                  Receive payments via PayPal or bank transfer once you reach $100 in commissions
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => createAffiliate.mutate()}
            disabled={createAffiliate.isPending}
          >
            {createAffiliate.isPending ? "Creating..." : "Become an Affiliate →"}
          </Button>
        </Card>
      </div>
    );
  }
  
  // Affiliate dashboard
  const referralUrl = `${window.location.origin}?ref=${affiliate.affiliateCode}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">
          Track your referrals and earnings
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Earnings</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold">${affiliate.totalEarnings || "0.00"}</div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Pending</span>
            <TrendingUp className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold">${affiliate.pendingEarnings || "0.00"}</div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Paid Out</span>
            <Check className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-3xl font-bold">${affiliate.paidEarnings || "0.00"}</div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Referrals</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold">{stats?.totalReferrals || 0}</div>
        </Card>
      </div>
      
      {/* Referral Link */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
        <div className="flex gap-2">
          <Input 
            value={referralUrl} 
            readOnly 
            className="font-mono text-sm"
          />
          <Button onClick={copyToClipboard} variant="outline">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Share this link to earn 30% commission on all referrals
        </p>
      </Card>
      
      {/* Commission Calculator */}
      <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
        <h2 className="text-xl font-semibold mb-4">Commission Calculator</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Starter Plan</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Setup Fee:</span>
                <span className="font-semibold">$250 × 30% = <span className="text-primary">$75</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly:</span>
                <span className="font-semibold">$49 × 30% = <span className="text-primary">$14.70/mo</span></span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Year 1:</span>
                <span className="font-bold text-primary">$251.40</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Pro Plan</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Setup Fee:</span>
                <span className="font-semibold">$250 × 30% = <span className="text-primary">$75</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly:</span>
                <span className="font-semibold">$99 × 30% = <span className="text-primary">$29.70/mo</span></span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Year 1:</span>
                <span className="font-bold text-primary">$431.40</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Business Plan</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Setup Fee:</span>
                <span className="font-semibold">$250 × 30% = <span className="text-primary">$75</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly:</span>
                <span className="font-semibold">$149 × 30% = <span className="text-primary">$44.70/mo</span></span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Year 1:</span>
                <span className="font-bold text-primary">$611.40</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          💡 These are <strong>lifetime recurring commissions</strong> - you earn every month the customer stays subscribed!
        </p>
      </Card>
      
      {/* Payment Info */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="paypal">PayPal Email</Label>
            <div className="flex gap-2">
              <Input 
                id="paypal"
                type="email"
                placeholder="your@email.com"
                value={paypalEmail || affiliate.paypalEmail || ""}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
              <Button 
                onClick={() => updatePaymentInfo.mutate({ paypalEmail })}
                disabled={updatePaymentInfo.isPending || !paypalEmail}
              >
                {updatePaymentInfo.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Minimum payout: $100. Payouts are processed monthly on the 1st.
          </p>
        </div>
      </Card>
      
      {/* Recent Referrals */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Referrals</h2>
        {referrals && referrals.length > 0 ? (
          <div className="space-y-3">
            {referrals.map((referral: any) => (
              <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{referral.referredEmail || "Pending signup"}</div>
                  <div className="text-sm text-muted-foreground">
                    Clicked: {new Date(referral.clickedAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={
                  referral.status === "subscribed" ? "default" :
                  referral.status === "signed_up" ? "secondary" :
                  "outline"
                }>
                  {referral.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No referrals yet. Start sharing your link!
          </p>
        )}
      </Card>
    </div>
  );
}
