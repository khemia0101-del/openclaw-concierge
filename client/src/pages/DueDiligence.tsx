import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ClipboardCopy,
  Download,
  FileSearch,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Phase = "chat" | "generating" | "report";

const SECTION_TITLES = [
  "Quality of Earnings",
  "Cost Reduction Opportunities",
  "SOP Identification",
  "SOP Tightening & Automation",
  "New Revenue Streams",
  "Government Contracting Pathway",
];

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm your Acquisition Due Diligence Agent. I'll help you analyze a business for acquisition by working through Quality of Earnings, Cost Reduction Opportunities, SOPs, New Revenue Streams, and Government Contracting potential.\n\nTo get started, tell me about the business you're evaluating — what's the company name, what industry are they in, and what do they do?",
};

export default function DueDiligence() {
  const [phase, setPhase] = useState<Phase>("chat");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [reportSections, setReportSections] = useState<
    Array<{ title: string; content: string }>
  >([]);
  const [completedSections, setCompletedSections] = useState(0);
  const [showGenerateButton, setShowGenerateButton] = useState(false);

  const chatMutation = trpc.dueDiligence.chat.useMutation({
    onSuccess: (data) => {
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Check if agent signals readiness
      if (data.message.includes("Generate Full Analysis")) {
        setShowGenerateButton(true);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to get response");
    },
  });

  const reportMutation = trpc.dueDiligence.generateReport.useMutation({
    onSuccess: (data) => {
      setReportSections(data.sections);
      setCompletedSections(data.sections.length);
      setPhase("report");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate report");
      setPhase("chat");
    },
  });

  const handleSendMessage = (content: string) => {
    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    chatMutation.mutate({
      messages: updatedMessages.filter((m) => m.role !== "system"),
    });
  };

  const handleGenerateReport = () => {
    setPhase("generating");
    setCompletedSections(0);

    // Simulate section-by-section progress (actual completion comes from mutation)
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCompletedSections(Math.min(step, SECTION_TITLES.length - 1));
      if (step >= SECTION_TITLES.length - 1) {
        clearInterval(interval);
      }
    }, 4000);

    reportMutation.mutate({
      messages: messages.filter((m) => m.role !== "system"),
    });
  };

  const buildExportText = () => {
    const lines: string[] = ["# Acquisition Due Diligence Report", ""];
    for (const section of reportSections) {
      lines.push(`## ${section.title}`, "", section.content, "", "---", "");
    }
    return lines.join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildExportText());
    toast.success("Report copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([buildExportText()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "due-diligence-report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileSearch className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                Acquisition Due Diligence Agent
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis across 6 key acquisition dimensions
              </p>
            </div>
            {phase === "report" && (
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <ClipboardCopy className="mr-2 size-4" />
                  Copy Report
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 size-4" />
                  Download .md
                </Button>
              </div>
            )}
          </div>

          {/* Section badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {SECTION_TITLES.map((title, i) => (
              <Badge
                key={title}
                variant={
                  phase === "report" || completedSections > i
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {title}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Chat phase */}
        {phase === "chat" && (
          <div className="flex flex-col gap-4">
            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
              placeholder="Describe the business you're evaluating..."
              height="560px"
              emptyStateMessage="Tell me about the acquisition target"
            />
            {showGenerateButton && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleGenerateReport}
                  className="px-8"
                >
                  <FileSearch className="mr-2 size-5" />
                  Generate Full Analysis
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Generating phase */}
        {phase === "generating" && (
          <div className="flex flex-col items-center gap-8 py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-10 animate-spin text-primary" />
              <h2 className="text-lg font-semibold">
                Generating Due Diligence Report
              </h2>
              <p className="text-sm text-muted-foreground">
                Analyzing across all 6 dimensions — this takes about a minute
              </p>
            </div>

            <div className="w-full max-w-sm space-y-3">
              {SECTION_TITLES.map((title, i) => {
                const done = completedSections > i;
                return (
                  <div key={title} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    ) : i === completedSections ? (
                      <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                    )}
                    <span
                      className={
                        done
                          ? "text-sm font-medium"
                          : i === completedSections
                            ? "text-sm text-foreground"
                            : "text-sm text-muted-foreground"
                      }
                    >
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Report phase */}
        {phase === "report" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Due Diligence Report Complete
                </h2>
                <p className="text-sm text-muted-foreground">
                  6 sections analyzed — expand each section to review the
                  findings
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhase("chat");
                  setMessages([INITIAL_MESSAGE]);
                  setReportSections([]);
                  setShowGenerateButton(false);
                }}
              >
                Start New Analysis
              </Button>
            </div>

            <Accordion type="multiple" className="space-y-3">
              {reportSections.map((section, i) => (
                <AccordionItem
                  key={section.title}
                  value={`section-${i}`}
                  className="rounded-lg border bg-card px-1 shadow-sm"
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-5 shrink-0 text-primary" />
                      <span className="font-medium">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{section.content}</Streamdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" onClick={handleCopy}>
                <ClipboardCopy className="mr-2 size-4" />
                Copy Full Report
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 size-4" />
                Download as Markdown
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
