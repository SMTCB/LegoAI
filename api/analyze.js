const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error("[API] Error: GEMINI_API_KEY is missing in environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const calculateMatchScore = (foundQty, totalSetParts) => {
    if (totalSetParts === 0) return 0;
    return (foundQty / totalSetParts) * 100;
};

module.exports = async (req, res) => {
    console.log(`[API] Analyze Request received: ${req.method}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        const base64Data = image.split(',')[1] || image;
        const mimeType = image.split(';')[0] || 'image/jpeg';
        // Extract strictly the mime type string "image/jpeg"
        const mimeTypeClean = mimeType.split(':')[1] || mimeType;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `Identify all LEGO bricks in this image. Return ONLY a valid JSON array. Each item must have:
        - \`part_num\`: The specific Lego element ID (e.g. '3001').
        - \`color_id\`: The Rebrickable color ID (approximate if needed, e.g. 0 for Black, 15 for White).
        - \`quantity\`: Count of this brick.
        - \`name\`: Brief description.
        Do not include markdown formatting or backticks.`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: mimeTypeClean } }
        ]);

        const responseText = result.response.text();
        let identifiedParts = [];
        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            identifiedParts = JSON.parse(cleanJson);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText });
        }

        if (!Array.isArray(identifiedParts) || identifiedParts.length === 0) {
            return res.json({ identified_parts: [], suggested_builds: [] });
        }

        // Rebrickable Logic
        const setMap = {};

        const fetchPromises = identifiedParts.map(async (part) => {
            try {
                const url = `https://rebrickable.com/api/v3/lego/parts/${part.part_num}/colors/${part.color_id}/sets/`;
                const rebrickableRes = await axios.get(url, {
                    headers: { 'Authorization': `key ${process.env.REBRICKABLE_API_KEY}` }
                });

                const foundSets = rebrickableRes.data.results || [];

                foundSets.forEach(set => {
                    if (!setMap[set.set_num]) {
                        setMap[set.set_num] = {
                            set_id: set.set_num,
                            name: set.name,
                            num_parts: set.num_parts || 9999,
                            set_img_url: set.set_img_url,
                            matched_parts: [],
                            total_matched_quantity: 0
                        };
                    }

                    const match = {
                        part_num: part.part_num,
                        part_name: part.name,
                        color_id: part.color_id,
                        owned_qty: part.quantity || 1,
                        set_qty: set.quantity_in_set || 1
                    };

                    setMap[set.set_num].matched_parts.push(match);
                    setMap[set.set_num].total_matched_quantity += Math.min(match.owned_qty, match.set_qty);
                });
            } catch (err) {
                console.warn(`Rebrickable lookup failed for ${part.part_num}`, err.message);
            }
        });

        await Promise.all(fetchPromises);

        const results = Object.values(setMap).map(set => {
            const score = calculateMatchScore(set.total_matched_quantity, set.num_parts);
            return {
                ...set,
                set_url: set.set_url || `https://rebrickable.com/sets/${set.set_id}`,
                match_score: parseFloat(score.toFixed(2))
            };
        })
            .filter(s => s.match_score > 5)
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 5);

        res.json({
            identified_parts: identifiedParts,
            suggested_builds: results
        });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: error.message });
    }
};
