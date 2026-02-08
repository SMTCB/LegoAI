const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
        }

        // Preview the key to ensure it's not empty or malformed
        const keyPreview = process.env.GEMINI_API_KEY.substring(0, 5) + "...";

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Strategy 2: Direct List Query (Standard Candidates)
        const modelsToTest = [
            "gemini-1.5-flash-8b",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-pro-vision"
        ];

        const testResults = {};

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = "Hi";
                await model.generateContent(prompt);
                testResults[modelName] = "OK";
            } catch (e) {
                testResults[modelName] = e.message;
            }
        }

        res.json({
            status: 'ok',
            key_preview: keyPreview,
            tests: testResults,
            note: "Checking key prefix and new model variants."
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
