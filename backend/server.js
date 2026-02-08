import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Master Logic helpers
const calculateMatchScore = (foundQty, totalSetParts) => {
    if (totalSetParts === 0) return 0;
    return (foundQty / totalSetParts) * 100;
};

// Routes
app.post('/analyze', async (req, res) => {
    try {
        const { image } = req.body; // Expecting "data:image/jpeg;base64,..."

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        console.log('1. Received image for analysis...');

        // 1. Prepare Image for Gemini
        // Remove header "data:image/jpeg;base64," if present to get raw base64
        const base64Data = image.split(',')[1] || image;
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        // 2. Call Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Identify all LEGO bricks in this image. Return ONLY a valid JSON array. Each item must have:
        - \`part_num\`: The specific Lego element ID (e.g. '3001').
        - \`color_id\`: The Rebrickable color ID (approximate if needed, e.g. 0 for Black, 15 for White).
        - \`quantity\`: Count of this brick.
        - \`name\`: Brief description.
        Do not include markdown formatting or backticks.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const responseText = result.response.text();
        console.log('2. Gemini Response received.');

        // Parse Gemini Response
        let identifiedParts = [];
        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            identifiedParts = JSON.parse(cleanJson);
        } catch (e) {
            console.error('Failed to parse Gemini JSON:', responseText);
            return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText });
        }

        if (!Array.isArray(identifiedParts) || identifiedParts.length === 0) {
            return res.json({ identified_parts: [], suggested_builds: [] }); // Return empty if nothing found
        }

        console.log(`3. Identified ${identifiedParts.length} parts. Querying Rebrickable...`);

        // 3. Query Rebrickable for each part
        // We use a simple loop (Promise.all) to fetch sets for each part
        const setMap = {}; // key: set_num, value: Set Object

        const fetchPromises = identifiedParts.map(async (part) => {
            try {
                // Rebrickable API: Get sets containing this part+color
                // URL: /lego/parts/{part_num}/colors/{color_id}/sets/
                const url = `https://rebrickable.com/api/v3/lego/parts/${part.part_num}/colors/${part.color_id}/sets/`;

                const rebrickableRes = await axios.get(url, {
                    headers: {
                        'Authorization': `key ${process.env.REBRICKABLE_API_KEY}`
                    }
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

                    // Record the match
                    const match = {
                        part_num: part.part_num,
                        part_name: part.name,
                        color_id: part.color_id,
                        owned_qty: part.quantity || 1,
                        set_qty: set.quantity_in_set || 1
                    };

                    // Prevent duplicate part recording if same part appears multiple times differently?
                    // For now, simpler is better.
                    setMap[set.set_num].matched_parts.push(match);

                    // Simple logic: we have min(owned, required) of this part
                    setMap[set.set_num].total_matched_quantity += Math.min(match.owned_qty, match.set_qty);
                });

            } catch (err) {
                console.warn(`Rebrickable lookup failed for ${part.part_num}:`, err.message);
                // Continue despite errors on individual parts
            }
        });

        await Promise.all(fetchPromises);

        console.log('4. Aggregating and Scoring results...');

        // 4. Master Logic: Score and Filter
        const results = Object.values(setMap).map(set => {
            const score = calculateMatchScore(set.total_matched_quantity, set.num_parts);
            return {
                ...set,
                match_score: parseFloat(score.toFixed(2))
            };
        })
            .filter(s => s.match_score > 5) // Filter < 5% matches
            .sort((a, b) => b.match_score - a.match_score); // Sort Descending

        res.json({
            identified_parts: identifiedParts,
            suggested_builds: results
        });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
