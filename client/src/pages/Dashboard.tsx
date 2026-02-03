import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Loader2, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { data: status, isLoading, refetch } = trpc.dashboard.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const restartInstance = trpc.dashboard.restartInstance.useMutation();
  const { data: logsData } = trpc.dashboard.getLogs.useQuery(undefined, {
    enabled: isAuthenticated && !!status?.instance,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleRestart = async () => {
    try {
      await restartInstance.mutateAsync();
      toast.success("Instance restart initiated");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to restart instance");
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Running</Badge>;
      case "provisioning":
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> Provisioning</Badge>;
      case "stopped":
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Stopped</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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
        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Your current plan and billing information</CardDescription>
          </CardHeader>
          <CardContent>
            {status?.subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg capitalize">{status.subscription.tier} Plan</p>
                    <p className="text-sm text-gray-600">
                      ${status.subscription.monthlyPrice}/month
                    </p>
                  </div>
                  <Badge className={status.subscription.status === "active" ? "bg-green-500" : ""}>
                    {status.subscription.status}
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Start Date</p>
                    <p className="font-medium">
                      {status.subscription.startDate
                        ? new Date(status.subscription.startDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Next Renewal</p>
                    <p className="font-medium">
                      {status.subscription.renewalDate
                        ? new Date(status.subscription.renewalDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Setup Fee</p>
                    <p className="font-medium">
                      {status.subscription.setupFeePaid ? "Paid" : "Pending"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No active subscription found</p>
            )}
          </CardContent>
        </Card>

        {/* AI Instance Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Employee Instance</CardTitle>
                <CardDescription>Your deployed OpenClaw instance details</CardDescription>
              </div>
              {status?.instance && (
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
            </div>
          </CardHeader>
          <CardContent>
            {status?.instance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Status</p>
                  {getStatusBadge(status.instance.status)}
                </div>
                
                {status.instance.status === "error" && status.instance.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{status.instance.errorMessage}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">AI Role</p>
                    <p className="font-medium">{status.instance.aiRole || "Not configured"}</p>
                  </div>

                  {status.instance.telegramBotUsername && (
                    <div>
                      <p className="text-sm text-gray-600">Telegram Bot</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">@{status.instance.telegramBotUsername}</p>
                        <Button variant="link" size="sm" asChild className="h-auto p-0">
                          <a
                            href={`https://t.me/${status.instance.telegramBotUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {status.instance.aiEmail && (
                    <div>
                      <p className="text-sm text-gray-600">AI Email</p>
                      <p className="font-medium">{status.instance.aiEmail}</p>
                    </div>
                  )}

                  {status.instance.doAppId && (
                    <div>
                      <p className="text-sm text-gray-600">Deployment ID</p>
                      <p className="font-mono text-sm">{status.instance.doAppId}</p>
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

        {/* Recent Logs */}
        {status?.instance && logsData?.logs && logsData.logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
              <CardDescription>Latest activity from your AI instance</CardDescription>
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
              <CardDescription>Your recent transactions</CardDescription>
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
