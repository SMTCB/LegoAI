const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
        }
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Note: listModels is not directly available on the client instance in some versions,
        // but we can try to infer or just test the standard ones. 
        // Actually, the SDK *does* have a model listing method via the API if using the right manager.
        // For simplicity in this serverless context, we will just test the two main ones.

        const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro-vision"];
        const results = {};

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Light test
                const prompt = "Hi";
                await model.generateContent(prompt);
                results[modelName] = "OK";
            } catch (e) {
                results[modelName] = e.message; // Full error
            }
        }

        res.json({ status: 'ok', models: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
