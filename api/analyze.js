const Groq = require('groq-sdk');
const axios = require('axios');

// Initialize Groq
if (!process.env.GROQ_API_KEY) {
    console.error("[API] Error: GROQ_API_KEY is missing in environment variables.");
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

        // Groq/OpenAI compatible 'image_url' format requires Data URI
        // Client already sends Data URI, so we can use it directly.
        const imageUrl = image;

        // System prompt for strict JSON
        const systemPrompt = `You are a specialized Lego Brick Identifier.
        Identify all LEGO bricks in the image.
        Return ONLY a valid JSON array.
        Each item must have:
        - "part_num": The specific Lego element ID (e.g. '3001').
        - "color_id": The Rebrickable color ID (approximate if needed, e.g. 0 for Black, 15 for White).
        - "quantity": Count of this brick.
        - "name": Brief description.
        Do not include markdown formatting or backticks. Just the raw JSON string.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: systemPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                            },
                        },
                    ],
                },
            ],
            model: "llama-3.2-90b-vision-preview",
            temperature: 0.1,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            response_format: { type: "json_object" }, // Attempt to force JSON mode if supported
        });

        const responseText = chatCompletion.choices[0]?.message?.content;
        let identifiedParts = [];

        try {
            // Cleanup any potential markdown wrapper
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            // Llama sometimes returns an object wrapper like { "parts": [...] } or just the array
            const parsed = JSON.parse(cleanJson);

            if (Array.isArray(parsed)) {
                identifiedParts = parsed;
            } else if (parsed.parts && Array.isArray(parsed.parts)) {
                identifiedParts = parsed.parts;
            } else {
                // Fallback: try to find an array in values
                const values = Object.values(parsed);
                const arrayVal = values.find(v => Array.isArray(v));
                if (arrayVal) identifiedParts = arrayVal;
            }

        } catch (e) {
            console.error("Groq JSON Parse Error", e);
            console.log("Raw Response:", responseText);
            return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText });
        }

        if (!Array.isArray(identifiedParts) || identifiedParts.length === 0) {
            return res.json({ identified_parts: [], suggested_builds: [] });
        }

        // Rebrickable Logic (Existing Logic Preserved)
        const setMap = {};
        const fetchPromises = identifiedParts.map(async (part) => {
            try {
                // Ensure part_num and color_id are present
                if (!part.part_num || part.color_id === undefined) return;

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
                // Suppress 404s for invalid parts
                if (err.response && err.response.status === 404) {
                    console.warn(`Rebrickable: Part ${part.part_num} not found.`);
                } else {
                    console.warn(`Rebrickable lookup failed for ${part.part_num}`, err.message);
                }
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
