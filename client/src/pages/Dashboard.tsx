import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Loader2, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle, Copy, Globe, Key, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { data: status, isLoading, refetch } = trpc.dashboard.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: (data) => {
      // Poll while provisioning, stop when running/error
      const instanceStatus = data?.state?.data?.instance?.status;
      return instanceStatus === "provisioning" ? 5000 : false;
    },
  });
  const restartInstance = trpc.dashboard.restartInstance.useMutation();
  const retryDeploy = trpc.dashboard.retryDeploy.useMutation();
  const { data: logsData } = trpc.dashboard.getLogs.useQuery(undefined, {
    enabled: isAuthenticated && !!status?.instance?.doAppId && status.instance.status === "running",
    refetchInterval: 30000,
  });
  const [showToken, setShowToken] = useState(false);

  const handleRestart = async () => {
    try {
      await restartInstance.mutateAsync();
      toast.success("Instance restart initiated");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to restart instance");
    }
  };

  const handleRetryDeploy = async () => {
    try {
      await retryDeploy.mutateAsync();
      toast.success("Retrying deployment...");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to retry deployment");
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (instanceStatus?: string) => {
    switch (instanceStatus) {
      case "running":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Running</Badge>;
      case "provisioning":
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> Deploying...</Badge>;
      case "stopped":
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Stopped</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Extract access info from the instance config JSON
  const instanceConfig = status?.instance?.config as Record<string, any> | null;
  const instanceUrl = instanceConfig?.instanceUrl;
  const gatewayToken = instanceConfig?.gatewayToken;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OpenClaw Concierge</h1>
            <p className="text-sm text-gray-600">Welcome back, {user?.name || user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* AI Instance — Primary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your AI Employee</CardTitle>
                <CardDescription>OpenClaw instance status and access</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {status?.instance && status.instance.status === "running" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestart}
                    disabled={restartInstance.isPending}
                  >
                    {restartInstance.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Restart
                      </>
                    )}
                  </Button>
                )}
                {status?.instance && getStatusBadge(status.instance.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {status?.instance ? (
              <div className="space-y-5">
                {/* Error message with retry */}
                {status.instance.status === "error" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-900">Deployment failed</p>
                    {status.instance.errorMessage && (
                      <p className="text-sm text-red-700 mt-1">{status.instance.errorMessage}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleRetryDeploy}
                      disabled={retryDeploy.isPending}
                    >
                      {retryDeploy.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Retry Deployment
                    </Button>
                  </div>
                )}

                {/* Provisioning state */}
                {status.instance.status === "provisioning" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Deploying your AI employee...</p>
                      <p className="text-sm text-blue-700 mt-1">This usually takes 1-3 minutes. This page will update automatically.</p>
                    </div>
                  </div>
                )}

                {/* Access Info — only show when running with actual URL */}
                {status.instance.status === "running" && instanceUrl && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-green-900">Your instance is live</p>

                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-700 shrink-0" />
                      <a
                        href={instanceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-green-800 underline break-all"
                      >
                        {instanceUrl}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => copyToClipboard(instanceUrl, "URL")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    {gatewayToken && (
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-green-700 shrink-0" />
                        <span className="text-sm text-green-800">Gateway Token:</span>
                        <code className="text-xs font-mono bg-green-100 px-2 py-0.5 rounded">
                          {showToken ? gatewayToken : "••••••••••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setShowToken(!showToken)}
                        >
                          {showToken ? "Hide" : "Show"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => copyToClipboard(gatewayToken, "Gateway token")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Running but no URL — DO might have been skipped */}
                {status.instance.status === "running" && !instanceUrl && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-900">Instance is being finalized</p>
                    <p className="text-sm text-yellow-700 mt-1">Your instance URL will appear here once deployment completes. If this persists, please contact support.</p>
                  </div>
                )}

                <Separator />

                {/* Configuration details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">AI Role</p>
                    <p className="font-medium text-sm mt-0.5">{status.instance.aiRole || "Not configured"}</p>
                  </div>

                  {status.instance.telegramBotToken && (
                    <div>
                      <p className="text-sm text-gray-500">Telegram</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                        <p className="font-medium text-sm">
                          {status.instance.telegramBotUsername
                            ? `@${status.instance.telegramBotUsername}`
                            : "Connected"}
                        </p>
                        {status.instance.telegramBotUsername && (
                          <Button variant="link" size="sm" asChild className="h-auto p-0 ml-1">
                            <a
                              href={`https://t.me/${status.instance.telegramBotUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {instanceConfig?.communicationChannels && (
                    <div>
                      <p className="text-sm text-gray-500">Channels</p>
                      <p className="font-medium text-sm mt-0.5 capitalize">
                        {(instanceConfig.communicationChannels as string[]).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No AI instance deployed yet</p>
                <Button asChild>
                  <a href="/onboarding">Deploy Your AI Employee</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {status?.subscription ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold capitalize">{status.subscription.tier} Plan</p>
                  <p className="text-sm text-gray-600">${status.subscription.monthlyPrice}/month</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {status.subscription.renewalDate && (
                    <p>Renews {new Date(status.subscription.renewalDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No active subscription</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        {status?.instance?.status === "running" && logsData?.logs && logsData.logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
                {logsData.logs.map((log, idx) => (
                  <div key={idx} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        {status?.billingRecords && status.billingRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {status.billingRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium capitalize">{record.type.replace(/_/g, " ")}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${record.amount}</p>
                      <Badge variant={record.status === "completed" ? "default" : "secondary"}>
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
