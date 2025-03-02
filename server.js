const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/generate-spec', async (req, res) => {
    const { input } = req.body;
    
    try {
        const completion = await openai.completions.create({
            model: 'gpt-4',
            prompt: `Generate a detailed product spec for: ${input}`,
            max_tokens: 800
        });
        res.json({ spec: completion.choices[0].text });
    } catch (error) {
        res.status(500).json({ error: 'Error generating spec' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

