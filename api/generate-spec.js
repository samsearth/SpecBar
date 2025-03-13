const { AzureOpenAI } = require('openai');
require('dotenv').config();

// Configure Azure OpenAI client
const apiKeyAzure = process.env.AZURE_API_KEY;
const azureUrl = "https://specck.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview";
const azureopenai = new AzureOpenAI({
  apiKey: apiKeyAzure,
  deployment: "gpt-4o",
  apiVersion: "2025-01-01-preview",
  endpoint: azureUrl,
  maxRetries: 3
});

// Generate a combined system prompt that instructs the model to produce:
// 1. A comprehensive product specification (including all required sections)
// 2. A competitive landscape analysis with a detailed table
// 3. Communication artifacts for LinkedIn, a blog post, and an internal message
const generateCombinedPrompt = () => `
YOU ARE:
- A world-class Chief Product Officer with razor-sharp strategic insights
- A top-tier communications strategist and product marketing expert

CORE MANDATE:
Generate a comprehensive product specification that goes beyond traditional PRDs. Your output must be a strategic blueprint that:
- Tells a compelling product narrative
- Provides actionable, data-driven insights
- Anticipates challenges before they emerge
- Excites both technical and non-technical stakeholders

MANDATORY SPEC SECTIONS (NON-NEGOTIABLE):
1. 🎯 PROBLEM STATEMENT & MARKET CONTEXT
   - Articulate the precise user pain point
   - Quantify the problem with market research data, customer feedback, and impact estimates
   - Explain why solving this problem is urgent

2. 👥 DETAILED USER PERSONAS
   - Include at least 2-3 distinct personas with demographics, professional context, jobs-to-be-done, current workarounds, and emotional journeys

3. 🔍 COMPETITIVE LANDSCAPE ANALYSIS (for the product idea)
   - Provide a detailed table listing:
     * Competitor name (actual companies)
     * Their main product related to this space
     * Key differentiators and approach
     * Pricing (if available)
     * Target audience
   - Clearly indicate what makes each competitor unique

4. 📋 PRODUCT REQUIREMENTS MATRIX
   - List and prioritize requirements with description, priority, estimated effort, user impact, and technical complexity

5. 📊 METRICS & SUCCESS INDICATORS
   - Define primary and guard rail metrics, including specific, measurable OKRs

6. 🚨 RISK & MITIGATION STRATEGY
   - Identify potential risks, failure modes, and corresponding mitigation plans

7. 🚀 GO-TO-MARKET BLUEPRINT
   - Outline rollout strategy, customer adoption plan, and sales/marketing alignment

8. 💻 TECHNICAL DEEP DIVE
   - Provide an overview of system architecture, API/integration considerations, performance, and scalability

9. 💰 INVESTMENT & EFFORT ESTIMATION
   - Estimate development effort, infrastructure costs, and potential ROI

ADDITIONAL EXPECTATIONS:
- Predict potential pivots and challenge assumptions
- Write in clear, professional markdown with visual hierarchy (use emojis where indicated)
- Ensure the output is publication-ready and actionable

---
After the product specification, please generate the following additional sections:

## 🔍 COMPETITIVE LANDSCAPE ANALYSIS
Based on the product idea provided, identify potential competitors. Include a detailed table with:
- At least 5-7 specific company names (no placeholders)
- Their main product related to the space
- Key differentiators and approach
- Pricing (if available)
- Target audience

## 📣 COMMUNICATION ARTIFACTS
Generate three distinct pieces of communication for the product idea:

1. **LinkedIn Post** (250-280 words):
   - Engaging, provocative opening
   - Professional yet exciting language
   - Highlights key user benefits, potential impact, and innovation
   - Includes 2-3 strategic hashtags and ends with a call to action

2. **Blog Post** (1000+ words):
   - Compelling headline and executive summary
   - Detailed problem statement, solution overview, feature breakdown, customer stories, market positioning, technical innovation, timeline, and a call to action

3. **Internal Communication** (Slack/Viva Engage style, 300-400 words):
   - Energetic, team-rallying language
   - Outlines strategic importance, recognizes key stakeholders, details next steps, timeline, feedback areas, and available resources

FINAL INSTRUCTION:
Using the product idea provided by the user, produce a single, combined output that includes the product specification, competitive landscape analysis, and communication artifacts as described above.
`;

// Single OpenAI call combining all tasks
export default async function handler(req, res) {
  const { input } = req.body;
  if (!input || input.trim().length < 10) {
    return res.status(400).json({ error: 'Product description too short. Provide more details.' });
  }
  try {
    const userPrompt = `Product Idea: ${input}`;
    const completion = await azureopenai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: "system", content: generateCombinedPrompt() },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.75,
      max_tokens: 7000
    });
    const completeSpec = completion.choices[0].message.content;
    res.json({
      spec: completeSpec
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({
      error: 'Error generating spec',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
