import { publicProcedure, router } from "../../../_core/trpc";
import { z } from "zod";
import { invokeLLM, type Message } from "../../../_core/llm";

const GATHERING_SYSTEM_PROMPT = `You are an expert M&A due diligence analyst and business acquisition consultant. Your job is to gather the information needed to produce a comprehensive due diligence report for a potential acquisition target.

Conduct a friendly but thorough intake conversation. Ask about:
- Business name, industry, and years in operation
- Annual revenue and profitability (gross/net margins if known)
- Business model (B2B, B2C, or both) and primary customers
- Number of employees and organizational structure
- Products/services offered
- Key technology, tools, and systems in use
- Existing processes and documentation (SOPs)
- Revenue channels and growth trajectory
- Owner involvement and key person dependencies
- Any current government contracts or interest in pursuing them
- Major challenges or opportunities they see

Ask 2-3 questions at a time. Be conversational. After you have gathered enough information (typically 4-6 exchanges covering the key areas), end your message with exactly this line:
"✅ I have enough information. Click **Generate Full Analysis** when you're ready."`;

const SECTION_SYSTEM_PROMPT = `You are a senior M&A due diligence analyst and business consultant. Produce thorough, professional, actionable analysis. Use clear markdown formatting with ## headers, bullet points, and tables where helpful. Be specific and quantitative where possible. Where data is unavailable, note it and provide benchmarks or ranges based on industry norms.`;

const REPORT_SECTIONS = [
  {
    title: "Quality of Earnings",
    prompt: (context: string) =>
      `Based on the following business profile, produce a Quality of Earnings (QoE) analysis. Cover:
- EBITDA calculation and normalization (owner add-backs, one-time items)
- Recurring vs. non-recurring revenue breakdown
- Revenue concentration risk (customer/product/channel)
- Working capital requirements and cash conversion cycle
- Revenue quality score and key risks

Business Profile:
${context}`,
  },
  {
    title: "Cost Reduction Opportunities",
    prompt: (context: string) =>
      `Based on the following business profile, identify specific cost reduction opportunities. Cover:
- Labor and staffing efficiency (overstaffing, role gaps, contractor vs. FTE optimization)
- Vendor and supplier consolidation opportunities
- Technology and software spend rationalization
- Operational waste and process inefficiencies
- Facilities and overhead reduction
- Estimated annualized savings for each opportunity

Business Profile:
${context}`,
  },
  {
    title: "SOP Identification",
    prompt: (context: string) =>
      `Based on the following business profile, identify the critical SOPs this business needs. Cover:
- Core operational SOPs by department (sales, operations, finance, HR, delivery/fulfillment)
- Assessment of what is likely documented vs. undocumented based on company stage
- Key-person dependency risks tied to undocumented processes
- SOP gaps that represent acquisition risk
- Priority ranking: which SOPs must be documented before or immediately after acquisition

Business Profile:
${context}`,
  },
  {
    title: "SOP Tightening & Automation",
    prompt: (context: string) =>
      `Based on the following business profile, provide specific recommendations for tightening SOPs and automating key processes. Cover:
- Top 5 processes that should be automated and which tools to use (with specific tool names)
- Workflow automation opportunities (Zapier, Make, n8n, etc.)
- CRM/ERP improvements or implementations
- Reporting and dashboards to implement
- AI/LLM automation opportunities specific to this business type
- Estimated ROI and time-to-implement for each recommendation

Business Profile:
${context}`,
  },
  {
    title: "New Revenue Streams",
    prompt: (context: string) =>
      `Based on the following business profile, identify realistic new revenue stream opportunities. Cover:
- Adjacent market expansion (with market size estimates)
- Upsell and cross-sell opportunities within existing customer base
- New product or service lines to develop or acquire
- Strategic partnership and channel opportunities
- Subscription/recurring revenue models that could be introduced
- Pricing optimization opportunities
- Prioritized roadmap with estimated revenue potential for each stream

Business Profile:
${context}`,
  },
  {
    title: "Government Contracting Pathway",
    prompt: (context: string) =>
      `Based on the following business profile, produce a government contracting pathway analysis. Cover:
- SAM.gov registration steps and timeline
- Most applicable NAICS codes for this business
- Relevant certifications to pursue (8(a), SDVOSB, WOSB, HUBZone, SBA certifications) with eligibility assessment
- Target federal agencies and departments based on the business's capabilities
- GSA Schedule applicability and recommended SINs
- Subcontracting opportunities as an entry strategy
- State and local government contracting as a stepping stone
- Step-by-step 12-month pathway to winning the first government contract
- Realistic revenue potential in years 1–3

Business Profile:
${context}`,
  },
];

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const dueDiligenceRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(MessageSchema),
      })
    )
    .mutation(async ({ input }) => {
      const messages: Message[] = [
        { role: "system", content: GATHERING_SYSTEM_PROMPT },
        ...input.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      const result = await invokeLLM({ messages });
      const content = result.choices[0]?.message?.content;
      return {
        message: typeof content === "string" ? content : "",
      };
    }),

  generateReport: publicProcedure
    .input(
      z.object({
        messages: z.array(MessageSchema),
      })
    )
    .mutation(async ({ input }) => {
      // Step 1: Extract structured company profile from the conversation
      const profileMessages: Message[] = [
        {
          role: "system",
          content:
            "You are a business analyst. Summarize all the information gathered in the following conversation into a comprehensive, structured business profile. Include every detail mentioned: business name, industry, revenue, employees, business model, products/services, technology used, existing SOPs, revenue channels, growth trajectory, government contracting interest, and any other relevant context. Be thorough.",
        },
        ...input.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as Message["role"], content: m.content })),
        {
          role: "user",
          content:
            "Please write the complete structured business profile based on everything discussed.",
        },
      ];

      const profileResult = await invokeLLM({ messages: profileMessages });
      const companyProfile =
        profileResult.choices[0]?.message?.content ?? "No profile available.";

      const profileText =
        typeof companyProfile === "string"
          ? companyProfile
          : JSON.stringify(companyProfile);

      // Step 2: Generate each section sequentially
      const sections: Array<{ title: string; content: string }> = [];

      for (const section of REPORT_SECTIONS) {
        const messages: Message[] = [
          { role: "system", content: SECTION_SYSTEM_PROMPT },
          { role: "user", content: section.prompt(profileText) },
        ];

        const result = await invokeLLM({ messages });
        const content = result.choices[0]?.message?.content;
        sections.push({
          title: section.title,
          content: typeof content === "string" ? content : "",
        });
      }

      return { sections };
    }),
});
