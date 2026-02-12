import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Check, ArrowRight, ArrowLeft } from "lucide-react";

type Tier = "starter" | "pro" | "business";

const PRICING_TIERS = {
  starter: {
    name: "Starter",
    setupFee: 250,
    monthly: 49,
    features: ["Llama 3.1 AI model", "Email support", "1,000 tokens/month", "Telegram integration"],
  },
  pro: {
    name: "Pro",
    setupFee: 250,
    monthly: 99,
    features: ["Claude 3.5 Haiku AI model", "Priority support", "5,000 tokens/month", "Multi-channel integration", "Custom skills"],
  },
  business: {
    name: "Business",
    setupFee: 250,
    monthly: 149,
    features: ["Claude Sonnet 4.5 AI model", "24/7 support", "Unlimited tokens", "All integrations", "Custom development", "Dedicated account manager"],
  },
};

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [selectedTier, setSelectedTier] = useState<Tier>("starter");
  
  const createCheckout = trpc.onboarding.createCheckout.useMutation();

  const handleNext = () => {
    if (step === 1 && !email) {
      toast.error("Please enter your email");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Temporary user ID for MVP: use seconds (not ms) to fit within MySQL INT range (max 2,147,483,647)
      const tempUserId = Math.floor(Date.now() / 1000);
      
      const result = await createCheckout.mutateAsync({
        email,
        tier: selectedTier,
        userId: tempUserId,
        origin: window.location.origin,
      });
      
      // Redirect to Stripe Checkout
      if (result.sessionUrl) {
        window.location.href = result.sessionUrl;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create checkout session");
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s < step
                      ? "bg-green-500 text-white"
                      : s === step
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 2 && (
                  <div
                    className={`h-1 w-20 mx-2 ${
                      s < step ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step === 1 ? "font-semibold" : ""}>Email</span>
            <span className={step === 2 ? "font-semibold" : ""}>Plan & Payment</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && "Welcome to OpenClaw Concierge"}
              {step === 2 && "Choose Your Plan"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Let's get you set up with your personal AI employee"}
              {step === 2 && "Select the plan that best fits your needs"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Email */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleNext} className="w-full">
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Pricing */}
            {step === 2 && (
              <div className="space-y-6">
                <RadioGroup value={selectedTier} onValueChange={(v) => setSelectedTier(v as Tier)}>
                  {Object.entries(PRICING_TIERS).map(([key, tier]) => (
                    <Card key={key} className={`cursor-pointer transition-all ${selectedTier === key ? "ring-2 ring-indigo-600" : ""}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <RadioGroupItem value={key} id={key} />
                            <div>
                              <Label htmlFor={key} className="text-lg font-semibold cursor-pointer">
                                {tier.name}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                ${tier.setupFee} setup + ${tier.monthly}/month
                              </p>
                              <ul className="mt-3 space-y-1">
                                {tier.features.map((feature, idx) => (
                                  <li key={idx} className="text-sm flex items-center">
                                    <Check className="w-4 h-4 mr-2 text-green-500" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button onClick={handlePayment} disabled={loading} className="flex-1">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Proceed to Payment"}
                  </Button>
                </div>
              </div>
            )}


          </CardContent>
        </Card>
      </div>
    </div>
  );
}
