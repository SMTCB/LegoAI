const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    try {
        console.log("Testing Gemini Text Generation...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = "Explain Lego in 5 words.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ status: 'ok', text: text });
    } catch (error) {
        console.error("Gemini Test Error:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};
