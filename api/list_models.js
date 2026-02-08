const axios = require('axios');

module.exports = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
        }

        const keyPreview = apiKey.substring(0, 5) + "...";

        // Direct REST API call to list models
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        try {
            const response = await axios.get(url);
            const models = response.data.models || [];

            // Filter for "generateContent" support
            const contentModels = models.filter(m =>
                m.supportedGenerationMethods &&
                m.supportedGenerationMethods.includes("generateContent")
            ).map(m => m.name.replace('models/', '')); // Clean name

            res.json({
                status: 'ok',
                key_preview: keyPreview,
                available_models: contentModels,
                raw_count: models.length
            });

        } catch (apiError) {
            res.status(apiError.response?.status || 500).json({
                error: 'Google API Error',
                details: apiError.response?.data || apiError.message
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
