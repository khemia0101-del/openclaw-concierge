import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, Cpu, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Animated Logo Placeholder */}
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-float">
            <Cpu className="w-12 h-12 text-primary" />
          </div>
          
          <div className="space-y-4 max-w-4xl">
            <Badge variant="outline" className="border-secondary text-secondary px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-3 h-3 mr-1.5 inline" />
              NEW Integrate Fast OpenClaw Concierge →
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Integrate Fast
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              YOUR PERSONAL OPENCLAW AI IN 60 SECONDS.
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We deploy and configure your OpenClaw AI assistant so you don't have to. No API keys. No Docker. No technical knowledge required. Just answer a few questions, pay once, and your AI employee is ready to work.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-8 shadow-lg shadow-secondary/20"
              asChild
            >
              <Link href="/onboarding">
                Get Your OpenClaw AI →
              </Link>
            </Button>
            
            {isAuthenticated && (
              <Button 
                size="lg" 
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10 font-semibold px-8"
                asChild
              >
                <Link href="/dashboard">
                  View Dashboard
                </Link>
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-secondary" />
              <span>Zero Technical Knowledge Required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-secondary" />
              <span>60-Second Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-secondary" />
              <span>Fully Managed Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What You Get</h2>
          <p className="text-muted-foreground text-lg">
            A fully configured OpenClaw AI assistant, ready to work for you
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Cpu,
              title: "Deployed & Configured",
              description: "We handle all the technical setup on DigitalOcean. Your OpenClaw instance is provisioned, configured, and ready to use.",
            },
            {
              icon: MessageSquare,
              title: "Your Choice of Platform",
              description: "Connect to Telegram, WhatsApp, Discord, Slack, Signal, or any chat app. We configure it exactly how you want it.",
            },
            {
              icon: Sparkles,
              title: "Persistent Memory",
              description: "Your AI remembers conversations and context. It learns your preferences and becomes uniquely yours over time.",
            },
            {
              icon: Zap,
              title: "Full Capabilities",
              description: "Browser automation, file operations, shell commands, API integrations. Your AI has everything it needs to get work done.",
            },
            {
              icon: Shield,
              title: "Secure & Private",
              description: "Isolated instance on enterprise infrastructure. Your data stays yours. Bank-level security and encryption.",
            },
            {
              icon: Sparkles,
              title: "Ongoing Support",
              description: "We monitor your instance and provide support. Updates, maintenance, and troubleshooting included.",
            },
          ].map((feature, i) => (
            <Card 
              key={i} 
              className="p-6 bg-card border-2 border-dashed border-secondary/50 hover:border-secondary transition-colors"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-lg">
            One-time setup + monthly hosting. No hidden fees.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: "Starter",
              setup: "$500",
              monthly: "$99",
              features: [
                "Full OpenClaw deployment",
                "Email support",
                "1,000 AI tokens/month",
                "Single platform integration",
                "Basic monitoring",
              ],
            },
            {
              name: "Pro",
              setup: "$750",
              monthly: "$199",
              features: [
                "Full OpenClaw deployment",
                "Priority support",
                "5,000 AI tokens/month",
                "Multi-platform integration",
                "Advanced monitoring",
                "Custom skills installation",
              ],
              popular: true,
            },
            {
              name: "Business",
              setup: "$1,000",
              monthly: "$299",
              features: [
                "Full OpenClaw deployment",
                "24/7 dedicated support",
                "Unlimited AI tokens",
                "All platform integrations",
                "Real-time monitoring",
                "Custom development",
                "Dedicated account manager",
              ],
            },
          ].map((plan, i) => (
            <Card 
              key={i} 
              className={`p-8 relative ${
                plan.popular 
                  ? 'border-2 border-primary shadow-lg shadow-primary/20' 
                  : 'border-2 border-dashed border-secondary/50'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">{plan.setup}</div>
                  <div className="text-sm text-muted-foreground">one-time setup</div>
                  <div className="text-2xl font-semibold">{plan.monthly}/mo</div>
                  <div className="text-xs text-muted-foreground">hosting & support</div>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-primary hover:bg-primary/90' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                }`}
                asChild
              >
                <Link href="/onboarding">
                  Get Started
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Integrate Fast Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Integrate Fast?</h2>
          <p className="text-muted-foreground text-lg">
            We're AI implementation experts who make complex technology simple
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 border-2 border-dashed border-secondary/50">
            <h3 className="text-xl font-semibold mb-3 text-primary">No Technical Expertise Needed</h3>
            <p className="text-muted-foreground">
              OpenClaw is powerful but complex to set up. We handle all the technical details—Docker containers, environment variables, API configurations, platform integrations—so you don't have to learn any of it.
            </p>
          </Card>
          
          <Card className="p-8 border-2 border-dashed border-secondary/50">
            <h3 className="text-xl font-semibold mb-3 text-primary">Faster Than DIY</h3>
            <p className="text-muted-foreground">
              Setting up OpenClaw yourself takes days of research, troubleshooting, and configuration. With Integrate Fast, you're up and running in under 60 seconds. We've done this hundreds of times.
            </p>
          </Card>
          
          <Card className="p-8 border-2 border-dashed border-secondary/50">
            <h3 className="text-xl font-semibold mb-3 text-primary">Ongoing Support & Maintenance</h3>
            <p className="text-muted-foreground">
              Your AI assistant needs updates, monitoring, and occasional troubleshooting. We handle all of that. You just use it. If something breaks, we fix it.
            </p>
          </Card>
          
          <Card className="p-8 border-2 border-dashed border-secondary/50">
            <h3 className="text-xl font-semibold mb-3 text-primary">Enterprise-Grade Infrastructure</h3>
            <p className="text-muted-foreground">
              Your OpenClaw runs on DigitalOcean's managed infrastructure with automatic backups, security patches, and 99.9% uptime. We optimize performance and costs so you don't have to.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="p-12 text-center border-2 border-dashed border-secondary bg-card/50">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Your OpenClaw AI?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join professionals who've automated their workflows with Integrate Fast's OpenClaw Concierge service. Setup takes less than 60 seconds.
          </p>
          <Button 
            size="lg" 
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-12 shadow-lg shadow-secondary/20"
            asChild
          >
            <Link href="/onboarding">
              Start Your Setup Now →
            </Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t border-secondary/20">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2026 Integrate Fast. OpenClaw Concierge Service.</p>
          <p className="mt-2">AI Implementation Experts | <a href="https://integratefast.com" className="text-secondary hover:underline">integratefast.com</a></p>
        </div>
      </footer>
    </div>
  );
}
