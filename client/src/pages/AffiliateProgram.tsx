import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, TrendingUp, Check, Zap, Clock, Shield } from "lucide-react";
import { Link } from "wouter";

export default function AffiliateProgram() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-4 bg-primary text-primary-foreground">
            💰 EARN PASSIVE INCOME
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Earn 30% Lifetime Commission
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Join the Integrate Fast Affiliate Program and earn recurring commissions for every customer you refer. No limits, no caps, just passive income.
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
                <Link href="/affiliate">Go to Affiliate Dashboard →</Link>
              </Button>
            ) : (
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
                <a href={getLoginUrl()}>Join the Program (Free) →</a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Commission Calculator */}
      <section className="container py-16 bg-card/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Commission Calculator</h2>
          <p className="text-muted-foreground text-lg">
            See exactly how much you can earn with our 30% lifetime commission structure
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-8 border-2 border-secondary/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Starter Plan</h3>
              <div className="text-sm text-muted-foreground">$250 setup + $49/month</div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">Setup Commission:</span>
                <span className="font-bold text-primary">$75</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">Monthly Commission:</span>
                <span className="font-bold text-primary">$14.70</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm font-semibold">Year 1 Total:</span>
                <span className="font-bold text-secondary text-xl">$251.40</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Year 2 Total:</span>
                <span className="font-bold text-secondary text-xl">$176.40</span>
              </div>
            </div>
          </Card>
          
          <Card className="p-8 border-2 border-primary bg-primary/5 relative">
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">MOST POPULAR</Badge>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
              <div className="text-sm text-muted-foreground">$250 setup + $99/month</div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">Setup Commission:</span>
                <span className="font-bold text-primary">$75</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">Monthly Commission:</span>
                <span className="font-bold text-primary">$29.70</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm font-semibold">Year 1 Total:</span>
                <span className="font-bold text-secondary text-xl">$431.40</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Year 2 Total:</span>
                <span className="font-bold text-secondary text-xl">$356.40</span>
              </div>
            </div>
          </Card>
          
          <Card className="p-8 border-2 border-secondary/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Business Plan</h3>
              <div className="text-sm text-muted-foreground">$250 setup + $149/month</div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">Setup Commission:</span>
                <span className="font-bold text-primary">$75</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-muted-foreground">Monthly Commission:</span>
                <span className="font-bold text-primary">$44.70</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm font-semibold">Year 1 Total:</span>
                <span className="font-bold text-secondary text-xl">$611.40</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Year 2 Total:</span>
                <span className="font-bold text-secondary text-xl">$536.40</span>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <Card className="p-6 max-w-3xl mx-auto bg-secondary/10 border-secondary/30">
            <h3 className="text-2xl font-bold mb-2">💡 Lifetime Recurring Commissions</h3>
            <p className="text-muted-foreground">
              You earn <strong>30% commission every single month</strong> for as long as your referral stays subscribed. 
              If they stay for 3 years, you earn for 3 years. 5 years? You earn for 5 years. Forever.
            </p>
          </Card>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Join Our Affiliate Program?</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">30% Lifetime Commission</h3>
            <p className="text-muted-foreground text-sm">
              Earn 30% of both setup fees AND monthly subscriptions for the entire lifetime of every customer you refer. No caps, no limits.
            </p>
          </Card>
          
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Passive Recurring Income</h3>
            <p className="text-muted-foreground text-sm">
              Refer once, earn forever. As long as your referrals stay subscribed, you keep earning monthly commissions automatically.
            </p>
          </Card>
          
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy to Promote</h3>
            <p className="text-muted-foreground text-sm">
              Our product sells itself. 60-second setup, no technical skills needed, 50% OFF sale. Your audience will love it.
            </p>
          </Card>
          
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Tracking</h3>
            <p className="text-muted-foreground text-sm">
              Track every click, signup, and commission in your affiliate dashboard. See your earnings grow in real-time.
            </p>
          </Card>
          
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Monthly Payouts</h3>
            <p className="text-muted-foreground text-sm">
              Get paid monthly via PayPal or bank transfer once you reach $100 in commissions. Fast, reliable, hassle-free.
            </p>
          </Card>
          
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Risk, All Reward</h3>
            <p className="text-muted-foreground text-sm">
              Free to join, no quotas, no obligations. Share your link when you want. We handle all customer support and billing.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-16 bg-card/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg">
            Start earning in 3 simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 text-center border-2 border-secondary/30">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Sign Up Free</h3>
            <p className="text-muted-foreground text-sm">
              Create your free affiliate account in seconds. Get your unique referral link instantly.
            </p>
          </Card>
          
          <Card className="p-8 text-center border-2 border-secondary/30">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Share Your Link</h3>
            <p className="text-muted-foreground text-sm">
              Share your referral link on social media, your blog, email list, or anywhere your audience hangs out.
            </p>
          </Card>
          
          <Card className="p-8 text-center border-2 border-secondary/30">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Earn Forever</h3>
            <p className="text-muted-foreground text-sm">
              When someone signs up through your link, you earn 30% commission every month they stay subscribed.
            </p>
          </Card>
        </div>
      </section>

      {/* Example Earnings */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Real Earning Potential</h2>
          <p className="text-muted-foreground text-lg">
            See what's possible with just a few referrals
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 border-2 border-primary">
            <div className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4 pb-4 border-b font-semibold">
                <div>Referrals</div>
                <div>Monthly Income</div>
                <div>Year 1 Income</div>
                <div>Year 2 Income</div>
              </div>
              
              {[
                { refs: "5 Pro Plan", monthly: "$148.50", year1: "$2,157", year2: "$1,782" },
                { refs: "10 Pro Plan", monthly: "$297", year1: "$4,314", year2: "$3,564" },
                { refs: "20 Pro Plan", monthly: "$594", year1: "$8,628", year2: "$7,128" },
                { refs: "50 Pro Plan", monthly: "$1,485", year1: "$21,570", year2: "$17,820" },
              ].map((row, i) => (
                <div key={i} className="grid md:grid-cols-4 gap-4 py-3 border-b last:border-0">
                  <div className="font-medium">{row.refs}</div>
                  <div className="text-primary font-bold">{row.monthly}</div>
                  <div className="text-secondary font-bold">{row.year1}</div>
                  <div className="text-secondary font-bold">{row.year2}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-secondary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Pro tip:</strong> These numbers assume Pro Plan referrals. Mix of Starter, Pro, and Business plans will vary your earnings.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="p-12 text-center border-2 border-dashed border-secondary bg-card/50">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of affiliates earning passive income with Integrate Fast. Free to join, no obligations, unlimited earning potential.
          </p>
          {isAuthenticated ? (
            <Button 
              size="lg" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-12 shadow-lg shadow-secondary/20"
              asChild
            >
              <Link href="/affiliate">Go to Affiliate Dashboard →</Link>
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-12 shadow-lg shadow-secondary/20"
              asChild
            >
              <a href={getLoginUrl()}>Join the Program (Free) →</a>
            </Button>
          )}
        </Card>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t border-secondary/20">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2026 Integrate Fast. OpenClaw Concierge Service.</p>
          <p className="mt-2">
            <Link href="/" className="text-secondary hover:underline">Home</Link>
            {" | "}
            <a href="https://integratefast.com" className="text-secondary hover:underline">integratefast.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
