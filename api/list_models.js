const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
        }
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Strategy 1: Test specific likely candidates
        const modelsToTest = [
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-pro",
            "gemini-1.0-pro"
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
            tests: testResults,
            note: "If all fail, your API key might be invalid or region-blocked."
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
