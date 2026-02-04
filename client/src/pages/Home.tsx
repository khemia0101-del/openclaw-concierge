import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, Cpu, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  // SEO: Set page title and meta tags
  useEffect(() => {
    document.title = "OpenClaw AI Deployment in 60 Seconds | Integrate Fast - No Technical Skills Required";
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Deploy your personal OpenClaw AI assistant in under 60 seconds. No coding, no Docker, no API keys. Fully managed service with 24/7 support. 50% OFF limited time offer. 30-day money-back guarantee.');
    
    // Add keywords meta tag
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'OpenClaw AI, AI assistant deployment, personal AI employee, managed AI service, no-code AI setup, OpenClaw hosting, AI automation, business AI assistant, Telegram AI bot, WhatsApp AI, Discord AI, automated AI deployment, Integrate Fast, OpenClaw concierge');
    
    // Open Graph tags for social sharing
    const ogTags = [
      { property: 'og:title', content: 'Deploy OpenClaw AI in 60 Seconds | Integrate Fast' },
      { property: 'og:description', content: 'Get your personal OpenClaw AI assistant deployed instantly. No technical knowledge required. 50% OFF limited time.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://openclaw.integratefast.com' },
      { property: 'og:image', content: 'https://openclaw.integratefast.com/og-image.png' },
    ];
    
    ogTags.forEach(tag => {
      let meta = document.querySelector(`meta[property="${tag.property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', tag.property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', tag.content);
    });
    
    // Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Deploy OpenClaw AI in 60 Seconds | Integrate Fast' },
      { name: 'twitter:description', content: 'Get your personal OpenClaw AI assistant deployed instantly. No technical knowledge required.' },
      { name: 'twitter:image', content: 'https://openclaw.integratefast.com/twitter-image.png' },
    ];
    
    twitterTags.forEach(tag => {
      let meta = document.querySelector(`meta[name="${tag.name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', tag.name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', tag.content);
    });
    
    // Structured data (JSON-LD) for rich snippets
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "OpenClaw AI Concierge by Integrate Fast",
      "description": "Fully managed OpenClaw AI assistant deployment service. Get your personal AI employee in 60 seconds.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "49",
        "highPrice": "149",
        "offerCount": "3"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "500"
      },
      "provider": {
        "@type": "Organization",
        "name": "Integrate Fast",
        "url": "https://integratefast.com"
      }
    };
    
    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);
  }, []);

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
              Deploy OpenClaw AI in 60 Seconds →
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Integrate Fast
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              YOUR PERSONAL OPENCLAW AI IN 60 SECONDS.
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Deploy your personal OpenClaw AI assistant instantly. We handle all the technical setup—no API keys, no Docker, no coding required. Answer a few questions, pay once, and your AI employee starts working immediately.
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

      {/* Time Comparison Section */}
      <section className="container py-16 bg-card/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Businesses Choose Us</h2>
          <p className="text-muted-foreground text-lg">
            Skip the complexity. Get your AI assistant in 60 seconds, not 30 minutes.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 border-2 border-dashed border-muted-foreground/30">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-muted-foreground mb-2">Traditional Setup</div>
              <div className="text-5xl font-bold text-primary">30+ Minutes</div>
            </div>
            <div className="space-y-3">
              {[
                { task: "Purchase cloud server", time: "10 min" },
                { task: "SSH keys & security", time: "3 min" },
                { task: "Install dependencies", time: "5 min" },
                { task: "Configure OpenClaw", time: "5 min" },
                { task: "Set up integrations", time: "4 min" },
                { task: "Debug & troubleshoot", time: "3+ min" },
              ].map((step, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{step.task}</span>
                  <span className="font-semibold">{step.time}</span>
                </div>
              ))}
              <div className="pt-3 border-t flex justify-between items-center font-bold">
                <span>Total Time</span>
                <span className="text-primary">30+ minutes</span>
              </div>
            </div>
          </Card>
          
          <Card className="p-8 border-2 border-secondary bg-secondary/5 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground">RECOMMENDED</Badge>
            </div>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2">Integrate Fast</div>
              <div className="text-6xl font-bold text-secondary">&lt;60 Seconds</div>
            </div>
            <div className="space-y-3">
              {[
                { task: "Answer 3 questions", time: "20 sec" },
                { task: "Choose your plan", time: "10 sec" },
                { task: "Complete payment", time: "15 sec" },
                { task: "AI deploys automatically", time: "15 sec" },
              ].map((step, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-secondary" />
                    {step.task}
                  </span>
                  <span className="font-semibold">{step.time}</span>
                </div>
              ))}
              <div className="pt-3 border-t flex justify-between items-center font-bold">
                <span>Total Time</span>
                <span className="text-secondary">&lt;60 seconds</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-background/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-secondary">30x Faster</div>
              <div className="text-sm text-muted-foreground">Save 29+ minutes of setup time</div>
            </div>
          </Card>
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
          <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 mb-4 animate-pulse">
            🎉 LIMITED TIME: 50% OFF ALL PLANS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-lg">
            One-time setup + monthly hosting. No hidden fees. Sale ends soon!
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: "Starter",
              setup: "$250",
              originalSetup: "$500",
              monthly: "$49",
              originalMonthly: "$99",
              features: [
                "Full OpenClaw deployment",
                "Email support (24hr response)",
                "1,000 AI tokens/month",
                "Single platform integration",
                "Basic monitoring",
                "Free setup & configuration",
                "30-day money-back guarantee",
              ],
              bonusValue: "$500",
            },
            {
              name: "Pro",
              setup: "$250",
              originalSetup: "$500",
              monthly: "$99",
              originalMonthly: "$199",
              features: [
                "Full OpenClaw deployment",
                "Priority support (2hr response)",
                "5,000 AI tokens/month",
                "Multi-platform integration",
                "Advanced monitoring & alerts",
                "Custom skills installation",
                "Free monthly optimization call",
                "30-day money-back guarantee",
              ],
              bonusValue: "$1,200",
              popular: true,
            },
            {
              name: "Business",
              setup: "$250",
              originalSetup: "$500",
              monthly: "$149",
              originalMonthly: "$299",
              features: [
                "Full OpenClaw deployment",
                "24/7 dedicated support (30min response)",
                "Unlimited AI tokens",
                "All platform integrations",
                "Real-time monitoring & alerts",
                "Custom development hours",
                "Dedicated account manager",
                "Weekly strategy sessions",
                "30-day money-back guarantee",
              ],
              bonusValue: "$2,500",
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
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg text-muted-foreground line-through">{plan.originalSetup}</span>
                    <span className="text-3xl font-bold text-primary">{plan.setup}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">one-time setup</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base text-muted-foreground line-through">{plan.originalMonthly}</span>
                    <span className="text-2xl font-semibold">{plan.monthly}/mo</span>
                  </div>
                  <div className="text-xs text-muted-foreground">hosting & support</div>
                </div>
              </div>
              
              {plan.bonusValue && (
                <div className="mb-4 p-3 bg-secondary/10 border border-secondary/30 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                  <div className="text-lg font-bold text-secondary">{plan.bonusValue}</div>
                </div>
              )}
              
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

      {/* Social Proof Section */}
      <section className="container py-16 bg-card/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Professionals Worldwide</h2>
          <p className="text-muted-foreground text-lg">
            Join hundreds of businesses automating their workflows with OpenClaw
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Active Deployments</div>
          </Card>
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="text-4xl font-bold text-primary mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
          </Card>
          <Card className="p-6 border-2 border-dashed border-secondary/50">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">AI Uptime Guaranteed</div>
          </Card>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 border-2 border-secondary/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                JM
              </div>
              <div>
                <div className="font-semibold mb-1">James Martinez</div>
                <div className="text-sm text-muted-foreground mb-2">CEO, Tech Startup</div>
                <p className="text-sm">
                  "Integrate Fast saved us weeks of development time. Our OpenClaw AI handles customer support, scheduling, and data analysis. Best investment we've made this year."
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-2 border-secondary/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                SC
              </div>
              <div>
                <div className="font-semibold mb-1">Sarah Chen</div>
                <div className="text-sm text-muted-foreground mb-2">Marketing Director</div>
                <p className="text-sm">
                  "I'm not technical at all, but Integrate Fast made it effortless. My AI assistant manages my calendar, drafts emails, and even handles research. It's like having a personal assistant 24/7."
                </p>
              </div>
            </div>
          </Card>
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
          <p className="mt-2">
            AI Implementation Experts | <a href="https://integratefast.com" className="text-secondary hover:underline">integratefast.com</a>
            {" | "}
            <Link href="/affiliate-program" className="text-secondary hover:underline">Affiliate Program (Earn 30%)</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
