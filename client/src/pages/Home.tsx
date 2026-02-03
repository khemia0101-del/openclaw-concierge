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
          {/* Animated Crab/Logo Placeholder */}
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-float">
            <Cpu className="w-12 h-12 text-primary" />
          </div>
          
          <div className="space-y-4 max-w-4xl">
            <Badge variant="outline" className="border-secondary text-secondary px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-3 h-3 mr-1.5 inline" />
              NEW Introducing OpenClaw Concierge →
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              OpenClaw
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              THE AI THAT ACTUALLY DOES THINGS.
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your personal AI assistant deployed in under 60 seconds. No API keys. No Docker. No configuration files. Just answer a few questions, pay once, and your AI employee is ready to work.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-8 shadow-lg shadow-secondary/20"
              asChild
            >
              <Link href="/onboarding">
                Get Started →
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
          </div>
        </div>
      </section>

      {/* What It Does Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What It Does</h2>
          <p className="text-muted-foreground text-lg">
            Your personal AI assistant that actually gets things done
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Cpu,
              title: "Runs on Your Machine",
              description: "Deployed on DigitalOcean. Fully managed infrastructure. Your data stays yours.",
            },
            {
              icon: MessageSquare,
              title: "Any Chat App",
              description: "Talk to it on Telegram, WhatsApp, Discord, Slack, Signal, or any chat app you already use.",
            },
            {
              icon: Sparkles,
              title: "Persistent Memory",
              description: "Remembers you and becomes uniquely yours. Your preferences, your context, your AI.",
            },
            {
              icon: Zap,
              title: "Browser Control",
              description: "It can browse the web, fill forms, and interact with any website on your behalf.",
            },
            {
              icon: Shield,
              title: "Full System Access",
              description: "Read and write files, run shell commands, execute scripts. Full access to get work done.",
            },
            {
              icon: Sparkles,
              title: "Skills & Plugins",
              description: "Extend with community skills or build your own. It can even write its own skills.",
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground text-lg">
            Choose the plan that fits your needs
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: "Starter",
              setup: "$500",
              monthly: "$99",
              features: [
                "Basic AI capabilities",
                "Email support",
                "1,000 tokens/month",
                "Telegram integration",
              ],
            },
            {
              name: "Pro",
              setup: "$750",
              monthly: "$199",
              features: [
                "Advanced AI capabilities",
                "Priority support",
                "5,000 tokens/month",
                "Multi-channel integration",
                "Custom skills",
              ],
              popular: true,
            },
            {
              name: "Business",
              setup: "$1,000",
              monthly: "$299",
              features: [
                "Enterprise AI capabilities",
                "24/7 support",
                "Unlimited tokens",
                "All integrations",
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
                  <div className="text-sm text-muted-foreground">setup fee</div>
                  <div className="text-2xl font-semibold">{plan.monthly}/mo</div>
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

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="p-12 text-center border-2 border-dashed border-secondary bg-card/50">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Your AI Assistant?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of users who are already using OpenClaw to automate their workflows and boost productivity.
          </p>
          <Button 
            size="lg" 
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-12 shadow-lg shadow-secondary/20"
            asChild
          >
            <Link href="/onboarding">
              Start Your 60-Second Setup →
            </Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t border-secondary/20">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2026 OpenClaw Concierge. Built with ❤️ for non-technical users.</p>
        </div>
      </footer>
    </div>
  );
}
