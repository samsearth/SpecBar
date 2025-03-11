const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { AzureOpenAI } = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const officegen = require('officegen');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'https://your-production-domain.com'],
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/generate-spec', apiLimiter);


// AZURE:
const apiKeyAzure = process.env.AZURE_API_KEY;
const azureUrl = "https://specck.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview"
const azureopenai = new AzureOpenAI({ 
    apiKey: apiKeyAzure,
    deployment: "gpt-4o",
    apiVersion: "2025-01-01-preview",
    endpoint: azureUrl,
    maxRetries: 3 // Added retry mechanism
});


/*

const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3 // Added retry mechanism
});

*/

// Function to perform competitor research directly via OpenAI
async function findCompetitors(productIdea) {
    const prompt = `Based on the product idea "${productIdea}", identify potential competitors in the market. 
    Please provide:
    1. At least 5-7 specific company names
    2. Their main product related to this space
    3. Their key differentiators and approach
    4. Pricing if available
    5. Target audience
    
    Format as a detailed table with columns for each aspect.
    Make sure to include actual company names - no placeholders.
    Specify what makes each competitor unique in their approach.`;

    try {
        const completion = await azureopenai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: "system", content: "You are an expert market researcher with deep knowledge of tech products across all industries. You know about both established players and emerging startups in every tech vertical. You always provide specific, factual information about real companies, not generalized descriptions." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2500
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Competitor Research Error:", error);
        return "Competitor research could not be completed.";
    }
}

// Function to generate comprehensive communication artifacts
async function generateCommunicationArtifacts(productIdea, generatedSpec) {
    const prompt = `Generate comprehensive communication artifacts for the following product idea and spec:

Product Idea: ${productIdea}

Spec Overview: ${generatedSpec.slice(0, 500)}

REQUIREMENTS FOR COMMUNICATION ARTIFACTS:

1. LinkedIn Post:
- 250-280 words (NOT characters)
- Highly engaging, provocative opening
- Professional yet exciting language
- Highlight key user benefits
- Discuss potential impact and innovation
- Use 2-3 strategic hashtags
- End with a call to action

2. Blog Post (1000+ words):
- Compelling headline
- Executive summary (2-3 paragraphs)
- Problem statement with industry context
- Solution overview
- Detailed feature breakdown with examples
- Customer impact stories
- Market positioning
- Technical innovation highlights
- Clear implementation timeline
- Call to action
- Must be publication-ready quality

3. Internal Communication:
- Slack/Viva Engage style post (300-400 words)
- Energetic, team-rallying language
- Strategic importance to company goals
- Recognition of key stakeholders
- Clear next steps and ownership
- Timeline expectations
- Areas where feedback is needed
- Resources and support available

Make each piece truly distinct and purpose-built for its platform and audience.`;

    try {
        const completion = await azureopenai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: "system", content: "You are a top-tier communications strategist and product marketing expert with experience crafting viral content for major tech companies." },
                { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 3000
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Communication Artifacts Generation Error:", error);
        return "Communication artifacts could not be generated.";
    }
}

// Comprehensive system prompt
const generateSystemPrompt = () => `
YOU ARE:
- A world-class Chief Product Officer with razor-sharp strategic insights
- An AI that transforms raw product ideas into meticulously crafted product requirement documents
- A relentless advocate for user-centric, impact-driven product development

CORE MANDATE:
Generate a comprehensive product specification that goes beyond traditional PRDs. Your output must be a strategic blueprint that:
- Tells a compelling product narrative
- Provides actionable, data-driven insights
- Anticipates challenges before they emerge
- Excites both technical and non-technical stakeholders

MANDATORY SPEC SECTIONS (NON-NEGOTIABLE):

1. 🎯 PROBLEM STATEMENT & MARKET CONTEXT
   - Articulate the precise user pain point
   - Quantify the problem with:
     * Market research data
     * Customer feedback quotes
     * Potential revenue/productivity impact
   - Urgency indicator: Why solve THIS now?

2. 👥 DETAILED USER PERSONAS
   - Minimum 2-3 distinct personas
   - For each persona, include:
     * Demographics
     * Professional context
     * Specific jobs-to-be-done
     * Current workarounds
     * Emotional journey

3. 🔍 COMPETITIVE LANDSCAPE ANALYSIS
   - Comprehensive competitor breakdown
   - Detailed table including:
     * Competitor name
     * Their current solution
     * Strengths
     * Weaknesses
     * Price point
     * Market share
   - Open source research required
   - Identify white spaces in current market solutions

4. 📋 PRODUCT REQUIREMENTS MATRIX
   - Structured, prioritized requirements
   - Columns must include:
     * Requirement description
     * Priority (P0-P3)
     * Estimated effort
     * User impact score
     * Technical complexity

5. 📊 METRICS & SUCCESS INDICATORS
   - Primary success metrics
   - Guard rail metrics
   - Leading and lagging indicators
   - Specific, measurable OKRs
   - Potential A/B testing frameworks

6. 🚨 RISK & MITIGATION STRATEGY
   - Potential failure modes
   - Abuse scenarios
   - Technical constraints
   - Detailed mitigation plans
   - Contingency approaches

7. 🚀 GO-TO-MARKET BLUEPRINT
   - Rollout strategy
   - Customer adoption playbook
   - Sales and marketing alignment
   - Training and enablement plan

8. 💻 TECHNICAL DEEP DIVE
   - System architecture overview
   - API and integration considerations
   - Performance expectations
   - Scalability projections
   - Potential tech debt

9. 💰 INVESTMENT & EFFORT ESTIMATION
   - Development effort sizing
   - Infrastructure costs
   - Potential ROI models
   - Resource allocation recommendations

TONE & STYLE GUIDELINES:
- Be brutally honest
- No corporate jargon
- Actionable > theoretical
- Data-driven narratives
- Create a sense of urgency and opportunity
- Demonstrate deep user empathy
- Make complex ideas simple and exciting

ADDITIONAL EXPECTATIONS:
- Predict potential pivots
- Challenge assumptions
- Provide strategic optionality
- Write as if you're presenting to both the CEO and the engineering team

OUTPUT FORMAT:
- Clean, professional markdown
- Use emojis for visual hierarchy
- Include section headers
- Provide clear, concise language
- Make it skimmable yet deeply informative

FINAL INSTRUCTION:
Produce a spec that doesn't just describe a product, but tells a compelling story of transformation, innovation, and user-centric design.
`;

// Simplified endpoint for competitor analysis
app.post('/analyze-competitors', async (req, res) => {
    const { productIdea } = req.body;
    
    if (!productIdea) {
        return res.status(400).json({ error: 'Product idea is required.' });
    }
    
    try {
        const competitorAnalysis = await findCompetitors(productIdea);
        
        res.json({ 
            competitorAnalysis,
            message: "Competitor analysis completed successfully"
        });
    } catch (error) {
        console.error("Competitor Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze competitors", details: error.message });
    }
});

app.post('/generate-spec', async (req, res) => {
    const { input } = req.body;
    
    if (!input || input.trim().length < 10) {
        return res.status(400).json({ error: 'Product description too short. Provide more details.' });
    }

    try {
        console.log("Received input:", input);
        
        // Generate main spec
        const specCompletion = await azureopenai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: "system", content: generateSystemPrompt() },
                { role: "user", content: `Product Idea: ${input}` }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        const generatedSpec = specCompletion.choices[0].message.content;

        // Get competitor research directly from OpenAI
        const competitorResearch = await findCompetitors(input);
        
        // Generate communication artifacts
        const communicationArtifacts = await generateCommunicationArtifacts(input, generatedSpec);
        
        // Combine results
        const completeSpec = `
${generatedSpec}

---

## 🔍 COMPETITIVE LANDSCAPE ANALYSIS
${competitorResearch}

---

## 📣 COMMUNICATION ARTIFACTS
${communicationArtifacts}
        `;

        res.json({ 
            spec: completeSpec,
            competitorResearch: competitorResearch,
            communicationArtifacts,
        });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        res.status(500).json({ 
            error: 'Error generating spec', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/download-spec', (req, res) => {
    const { spec } = req.body;
    if (!spec) {
        return res.status(400).json({ error: "No spec data provided." });
    }

    try {
        const docx = officegen('docx');
        
        // Add title
        const titleParagraph = docx.createP();
        titleParagraph.addText('Product Specification Document', { 
            font_face: 'Arial', 
            font_size: 16, 
            bold: true 
        });

        // Add timestamp
        const dateParagraph = docx.createP();
        dateParagraph.addText(`Generated: ${new Date().toLocaleString()}`, { 
            font_face: 'Arial', 
            font_size: 10, 
            italic: true 
        });
        
        // Add separator
        const separatorParagraph = docx.createP();
        separatorParagraph.addText('─'.repeat(50), { font_size: 11 });

        // Process the content
        const lines = spec.split('\n');
        let currentParagraph = docx.createP();
        
        for (const line of lines) {
            // Check if the line is a header
            if (line.startsWith('#') || line.startsWith('- ')) {
                currentParagraph = docx.createP();
                
                if (line.startsWith('##')) {
                    currentParagraph.addText(line.replace(/^##\s*/, ''), { 
                        font_face: 'Arial', 
                        font_size: 14, 
                        bold: true 
                    });
                } else if (line.startsWith('#')) {
                    currentParagraph.addText(line.replace(/^#\s*/, ''), { 
                        font_face: 'Arial', 
                        font_size: 16, 
                        bold: true 
                    });
                } else {
                    currentParagraph.addText(line, { font_face: 'Arial', font_size: 11 });
                }
            } else if (line.trim() === '') {
                // Empty line, create a new paragraph
                currentParagraph = docx.createP();
            } else {
                // Regular text
                currentParagraph.addText(line, { font_face: 'Arial', font_size: 11 });
                currentParagraph = docx.createP();
            }
        }

        res.setHeader('Content-Disposition', `attachment; filename=SpecBar_Spec_${Date.now()}.docx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        
        docx.generate(res);
    } catch (error) {
        console.error("Document Generation Error:", error);
        res.status(500).json({ error: 'Could not generate document', details: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.listen(port, () => {
    console.log(`🚀 SpecBar server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});