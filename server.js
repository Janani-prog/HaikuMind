require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');  // Add this line
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
    try {
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || 'http://localhost:3000',
                'X-Title': 'Secure ChatBot'
            },
            body: JSON.stringify(req.body)
        });
        
        if (!openRouterResponse.ok) {
            const errorText = await openRouterResponse.text();
            throw new Error(`OpenRouter error: ${errorText}`);
        }
        
        const data = await openRouterResponse.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure your OPENROUTER_API_KEY is set in .env file');
});