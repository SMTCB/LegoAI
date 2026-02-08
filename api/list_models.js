const Groq = require('groq-sdk');

module.exports = async (req, res) => {
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const models = await groq.models.list();
        res.json({ models: models.data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
