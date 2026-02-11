import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

type DeploymentStep = {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "error";
};

type DeploymentProgressProps = {
  userId: number;
  sessionId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
};

const DEPLOYMENT_STEPS: DeploymentStep[] = [
  { id: "verify", label: "Verifying payment", status: "completed" },
  { id: "subscription", label: "Creating subscription", status: "completed" },
  { id: "provision", label: "Provisioning server", status: "in-progress" },
  { id: "configure", label: "Configuring AI assistant", status: "pending" },
  { id: "deploy", label: "Deploying to production", status: "pending" },
  { id: "ready", label: "AI Employee ready!", status: "pending" },
];

// Map instance status to step progress
function getStepIndexForStatus(instanceStatus: string | undefined): number {
  switch (instanceStatus) {
    case "running": return 6; // all done
    case "error": return -1; // error state
    case "provisioning":
    default: return 2; // still provisioning
  }
}

export default function DeploymentProgress({ userId, sessionId, onComplete, onError }: DeploymentProgressProps) {
  const [steps, setSteps] = useState<DeploymentStep[]>(DEPLOYMENT_STEPS);
  const [error, setError] = useState<string | null>(null);
  const completedRef = useRef(false);
  const pollCountRef = useRef(0);

  const updateStepsForIndex = useCallback((targetIndex: number) => {
    setSteps(DEPLOYMENT_STEPS.map((step, idx) => {
      if (idx < targetIndex) return { ...step, status: "completed" as const };
      if (idx === targetIndex) return { ...step, status: "in-progress" as const };
      return { ...step, status: "pending" as const };
    }));
  }, []);

  // Poll real deployment status
  useEffect(() => {
    if (error || completedRef.current) return;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/trpc/onboarding.getInstanceStatus?input=${encodeURIComponent(JSON.stringify({ userId, sessionId }))}`
        );
        const json = await response.json();
        const data = json?.result?.data;

        if (!data) {
          // Instance not created yet, stay on provisioning
          pollCountRef.current++;
          // Advance visual steps based on poll count to show progress
          if (pollCountRef.current > 2) updateStepsForIndex(3); // configuring
          if (pollCountRef.current > 5) updateStepsForIndex(4); // deploying
          return;
        }

        const instanceStatus = data.status;

        if (instanceStatus === "error") {
          setError(data.errorMessage || "Deployment failed");
          setSteps(prev => prev.map((step, idx) =>
            idx === 2 ? { ...step, status: "error" as const } : step
          ));
          onError?.(data.errorMessage || "Deployment failed");
          return;
        }

        if (instanceStatus === "running" && !completedRef.current) {
          completedRef.current = true;
          // Mark all steps complete
          setSteps(DEPLOYMENT_STEPS.map(step => ({ ...step, status: "completed" as const })));
          setTimeout(() => onComplete?.(), 1500);
          return;
        }

        // Still provisioning — advance visual steps based on poll count
        pollCountRef.current++;
        if (pollCountRef.current > 6) updateStepsForIndex(4); // deploying
        else if (pollCountRef.current > 3) updateStepsForIndex(3); // configuring
        else updateStepsForIndex(2); // provisioning
      } catch {
        // Network error, just keep polling
        pollCountRef.current++;
      }
    };

    // Start polling every 3 seconds
    const interval = setInterval(poll, 3000);
    // Also run immediately
    poll();

    // Timeout after 5 minutes
    const timeout = setTimeout(() => {
      if (!completedRef.current) {
        setError("Deployment is taking longer than expected. Check your dashboard for status.");
        onError?.("Deployment timeout — check your dashboard");
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [userId, sessionId, error, onComplete, onError, updateStepsForIndex]);

  const getStepIcon = (step: DeploymentStep) => {
    switch (step.status) {
      case "completed":
        return <Check className="w-5 h-5 text-green-500" />;
      case "in-progress":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const completedCount = steps.filter(s => s.status === "completed").length;
  const progress = Math.min(100, Math.round((completedCount / steps.length) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">Deploying Your AI Employee</CardTitle>
          <CardDescription className="text-gray-600">
            This usually takes 30-60 seconds. Please don't close this window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  step.status === "in-progress" 
                    ? "bg-blue-50 border border-blue-200" 
                    : step.status === "completed"
                    ? "bg-green-50"
                    : step.status === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-gray-50"
                }`}
              >
                {getStepIcon(step)}
                <span className={`flex-1 text-gray-900 ${
                  step.status === "in-progress" ? "font-semibold" : ""
                }`}>
                  {step.label}
                </span>
                {step.status === "in-progress" && (
                  <span className="text-sm text-gray-500">
                    working...
                  </span>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">Deployment Failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          <div className="text-center text-sm text-gray-600">
            <p>Your AI employee is being configured with your selected channels and integrations.</p>
            <p className="mt-1">You'll be redirected to your dashboard once deployment is complete.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
