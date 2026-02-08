const Groq = require('groq-sdk');

module.exports = async (req, res) => {
    try {
        console.log("Testing Groq Connectivity...");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Explain Lego in 5 words.' }],
            model: 'llama-3.2-90b-vision-preview',
        });

        res.json({
            status: 'ok',
            response: chatCompletion.choices[0]?.message?.content
        });
    } catch (error) {
        console.error("Groq Test Error:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
