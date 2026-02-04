import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, AlertCircle } from "lucide-react";

type DeploymentStep = {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "error";
  duration?: number; // estimated duration in seconds
};

type DeploymentProgressProps = {
  onComplete?: () => void;
  onError?: (error: string) => void;
};

const DEPLOYMENT_STEPS: DeploymentStep[] = [
  { id: "verify", label: "Verifying payment", status: "pending", duration: 2 },
  { id: "subscription", label: "Creating subscription", status: "pending", duration: 3 },
  { id: "provision", label: "Provisioning server", status: "pending", duration: 15 },
  { id: "configure", label: "Configuring AI assistant", status: "pending", duration: 10 },
  { id: "deploy", label: "Deploying to production", status: "pending", duration: 8 },
  { id: "ready", label: "AI Employee ready!", status: "pending", duration: 2 },
];

export default function DeploymentProgress({ onComplete, onError }: DeploymentProgressProps) {
  const [steps, setSteps] = useState<DeploymentStep[]>(DEPLOYMENT_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      // All steps completed
      setTimeout(() => {
        onComplete?.();
      }, 1000);
      return;
    }

    if (error) {
      return;
    }

    const currentStep = steps[currentStepIndex];
    
    // Mark current step as in-progress
    setSteps(prev => prev.map((step, idx) => 
      idx === currentStepIndex 
        ? { ...step, status: "in-progress" as const }
        : step
    ));

    // Simulate step completion after duration
    const timer = setTimeout(() => {
      setSteps(prev => prev.map((step, idx) => 
        idx === currentStepIndex 
          ? { ...step, status: "completed" as const }
          : step
      ));
      setCurrentStepIndex(prev => prev + 1);
    }, (currentStep.duration || 5) * 1000);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps.length, onComplete, error]);

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

  const totalDuration = DEPLOYMENT_STEPS.reduce((sum, step) => sum + (step.duration || 0), 0);
  const completedDuration = steps
    .slice(0, currentStepIndex)
    .reduce((sum, step) => sum + (step.duration || 0), 0);
  const progress = Math.min(100, Math.round((completedDuration / totalDuration) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Deploying Your AI Employee</CardTitle>
          <CardDescription>
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
                <span className={`flex-1 ${
                  step.status === "in-progress" ? "font-semibold" : ""
                }`}>
                  {step.label}
                </span>
                {step.status === "in-progress" && (
                  <span className="text-sm text-gray-500">
                    ~{step.duration}s
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

          <div className="text-center text-sm text-gray-500">
            <p>Your AI employee is being configured with your selected channels and integrations.</p>
            <p className="mt-1">You'll be redirected to your dashboard once deployment is complete.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
