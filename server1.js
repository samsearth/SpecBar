const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const fs = require('fs');
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

const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3 // Added retry mechanism
});

// Comprehensive system prompt for nuanced spec generation
const generateSystemPrompt = (input) => `
You are a world-class Chief Product Officer with a strategic mindset and an ability to transform raw product ideas into compelling, actionable product requirements documents (PRDs).

Product Idea: ${input}

Your mission is to craft a comprehensive PRD that not only captures the essence of the product but also provides a strategic roadmap for successful implementation. Break down your response into clear, structured sections that tell a compelling product story.

OUTPUT FORMAT:
1. 🎯 Problem Statement
2. 📍 Product Vision
3. 🚀 Target Audience & Market Positioning
4. 🔑 Key Value Propositions
5. 👥 User Personas
6. 📋 Detailed User Stories
7. 🗺️ User Journey Mapping
8. 🎨 Feature Breakdown
9. 🔬 Technical Considerations
10. 📊 Success Metrics & KPIs
11. ⚠️ Potential Risks & Mitigation Strategies
12. 🗓️ Proposed Development Phases

Deliver insights that are:
- Brutally honest
- Strategically sound
- Actionable
- Backed by implied market research
- Free of corporate jargon

Your spec should read like a compelling narrative that gets stakeholders excited and engineers motivated.`;

app.post('/generate-spec', async (req, res) => {
    const { input } = req.body;
    
    if (!input || input.trim().length < 10) {
        return res.status(400).json({ error: 'Product description too short. Provide more details.' });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo', // Upgraded model
            messages: [
                { role: "system", content: generateSystemPrompt(input) },
                { role: "user", content: input }
            ],
            temperature: 0.7, // Balanced creativity
            max_tokens: 4000,
            top_p: 1.0,
            frequency_penalty: 0.5,
            presence_penalty: 0.5
        });

        const generatedSpec = completion.choices[0].message.content;
        
        // Optional: Log successful generations for future improvement
        console.log(`Spec generated for input: ${input.substring(0, 50)}...`);
        
        res.json({ 
            spec: generatedSpec,
            inputLength: input.length,
            timestamp: new Date().toISOString()
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
        const p = docx.createP();
        p.addText(spec, { font_size: 11 });

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