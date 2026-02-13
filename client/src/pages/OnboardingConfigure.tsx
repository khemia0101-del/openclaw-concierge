import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Check, Sparkles } from "lucide-react";
import DeploymentProgress from "@/components/DeploymentProgress";

export default function OnboardingConfigure() {
  const [, navigate] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  
  // Form state
  const [aiRole, setAiRole] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [communicationChannels, setCommunicationChannels] = useState<string[]>(["telegram"]);
  const [connectedServices, setConnectedServices] = useState<string[]>([]);
  const [tier, setTier] = useState<string>("");
  const [customApiKey, setCustomApiKey] = useState("");
  
  const deployInstance = trpc.onboarding.deployInstance.useMutation();
  const verifyPayment = trpc.onboarding.verifyPayment.useMutation();

  useEffect(() => {
    // Get session_id from URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    
    if (!sid) {
      toast.error("Invalid payment session");
      navigate("/");
      return;
    }
    
    setSessionId(sid);
    
    // Verify payment and create subscription
    const verifyAndSetup = async () => {
      try {
        const result = await verifyPayment.mutateAsync({
          sessionId: sid,
        });

        setUserId(result.userId);
        setUserEmail(result.email);
        setTier(result.tier);
        setVerifying(false);
      } catch (error: any) {
        toast.error("Failed to verify payment: " + error.message);
        setTimeout(() => navigate("/"), 2000);
      }
    };
    
    verifyAndSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const TELEGRAM_TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]{20,}$/;

  const handleDeploy = async () => {
    if (!aiRole) {
      toast.error("Please describe your AI employee's role");
      return;
    }

    if (!userId || !userEmail || !sessionId) {
      toast.error("Session expired. Please start over.");
      return;
    }

    if (telegramBotToken && !TELEGRAM_TOKEN_REGEX.test(telegramBotToken)) {
      toast.error("Invalid Telegram bot token format. Expected format: 123456789:ABCdefGHI_jklMNO-pqrsTUVwxyz");
      return;
    }

    // Show deployment progress UI
    setDeploying(true);

    // Kick off deployment — server returns immediately, provisioning runs in background.
    // DeploymentProgress polls getInstanceStatus for real-time updates.
    try {
      await deployInstance.mutateAsync({
        sessionId,
        userId,
        userEmail,
        aiRole,
        telegramBotToken: telegramBotToken || undefined,
        communicationChannels,
        connectedServices,
        customApiKey: customApiKey || undefined,
      });
      // DeploymentProgress will handle success/error via polling
    } catch (error: any) {
      // This only fires if the mutation itself fails (auth, validation, DB)
      // — not if the DO provisioning fails (that's handled by polling)
      toast.error(error.message || "Failed to start deployment");
      setDeploying(false);
    }
  };

  const toggleChannel = (channel: string) => {
    setCommunicationChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleService = (service: string) => {
    setConnectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600 mb-4" />
            <p className="text-lg font-medium">Verifying payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (deploying) {
    return (
      <DeploymentProgress
        userId={userId!}
        sessionId={sessionId!}
        onComplete={() => {
          toast.success("AI Employee deployed successfully!");
          navigate("/dashboard");
        }}
        onError={() => {
          // Redirect to dashboard where the error details are shown
          navigate("/dashboard");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success indicator */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Now let's configure your AI employee</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Configure Your AI Employee
            </CardTitle>
            <CardDescription>
              Tell us what you want your AI to do and how you want to communicate with it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Role */}
            <div>
              <Label htmlFor="aiRole">AI Employee Role & Responsibilities</Label>
              <Textarea
                id="aiRole"
                placeholder="Example: Customer support assistant that answers questions about our products, handles refunds, and escalates complex issues to human agents."
                value={aiRole}
                onChange={(e) => setAiRole(e.target.value)}
                className="mt-1 min-h-[120px]"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Be specific about what tasks your AI should handle
              </p>
            </div>

            {/* Communication Channels */}
            <div>
              <Label className="mb-3 block">Communication Channels</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="telegram"
                    checked={communicationChannels.includes("telegram")}
                    onCheckedChange={() => toggleChannel("telegram")}
                  />
                  <Label htmlFor="telegram" className="cursor-pointer">
                    Telegram
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsapp"
                    checked={communicationChannels.includes("whatsapp")}
                    onCheckedChange={() => toggleChannel("whatsapp")}
                  />
                  <Label htmlFor="whatsapp" className="cursor-pointer">
                    WhatsApp
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="discord"
                    checked={communicationChannels.includes("discord")}
                    onCheckedChange={() => toggleChannel("discord")}
                  />
                  <Label htmlFor="discord" className="cursor-pointer">
                    Discord
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={communicationChannels.includes("email")}
                    onCheckedChange={() => toggleChannel("email")}
                  />
                  <Label htmlFor="email" className="cursor-pointer">
                    Email
                  </Label>
                </div>
              </div>
            </div>

            {/* Telegram Bot Token (conditional) */}
            {communicationChannels.includes("telegram") && (
              <div>
                <Label htmlFor="telegramBotToken">Telegram Bot Token (Optional)</Label>
                <Input
                  id="telegramBotToken"
                  type="text"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to use our managed bot, or provide your own bot token
                </p>
              </div>
            )}

            {/* Bring Your Own API Key (Pro & Business only) */}
            {(tier === "pro" || tier === "business") && (
              <div>
                <Label htmlFor="customApiKey">Your Own AI API Key (Optional)</Label>
                <Input
                  id="customApiKey"
                  type="password"
                  placeholder="sk-... or sk-or-v1-..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Bring your own OpenAI, Anthropic, or OpenRouter key for a model of your choice. Leave empty to use our default model.
                </p>
              </div>
            )}

            {/* Connected Services */}
            <div>
              <Label className="mb-3 block">Connected Services (Optional)</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="calendar"
                    checked={connectedServices.includes("calendar")}
                    onCheckedChange={() => toggleService("calendar")}
                  />
                  <Label htmlFor="calendar" className="cursor-pointer">
                    Calendar Integration
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="crm"
                    checked={connectedServices.includes("crm")}
                    onCheckedChange={() => toggleService("crm")}
                  />
                  <Label htmlFor="crm" className="cursor-pointer">
                    CRM Integration
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email_service"
                    checked={connectedServices.includes("email_service")}
                    onCheckedChange={() => toggleService("email_service")}
                  />
                  <Label htmlFor="email_service" className="cursor-pointer">
                    Email Service Integration
                  </Label>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <Button
              onClick={handleDeploy}
              disabled={deploying || !aiRole}
              className="w-full"
              size="lg"
            >
              {deploying ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Deploying Your AI Employee...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 w-4 h-4" />
                  Deploy AI Employee
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
