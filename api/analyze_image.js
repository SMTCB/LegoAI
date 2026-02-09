const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error("[API] Error: GEMINI_API_KEY is missing in environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
    console.log(`[API] Analyze Image Request received: ${req.method}`);

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
        const { images } = req.body; // Expecting an array of base64 strings

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        // Prepare image parts for Gemini
        const imageParts = images.map(img => {
            const base64Data = img.split(',')[1] || img;
            const mimeType = img.split(';')[0] || 'image/jpeg';
            const mimeTypeClean = mimeType.split(':')[1] || mimeType;
            return {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeTypeClean
                }
            };
        });

        // Using gemini-2.0-flash with loose safety settings
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        });

        // Advanced System Prompt with Chain-of-Thought
        const prompt = `You are an expert LEGO Part Identifier.
        You are viewing multiple photos of the SAME batch of Lego parts from different angles.
        
        CRITICAL PROCESS:
        1. **Analyze Shape**: Is it a Brick (tall), Plate (flat), or Tile (smooth)?
        2. **Count Studs**: Count the studs precisely (e.g., 2 rows of 4 studs = 2x4).
           - Do NOT guess "Brick 2x4" (3001) unless you clearly see 8 studs.
           - If it is very long, count the length carefully (e.g., 1x6, 1x8, 2x8).
        3. **Check Features**: Look for clips, holes, slopes, or prints.
        4. **Deduplicate**: The photos show the SAME parts. Do not double count.
        
        RETURN A JSON OBJECT. Format:
        {
          "reasoning": "Photo 1 shows a red piece. It is tall (Brick) with 2x4 studs. I also see a blue flat piece...",
          "identified_parts": [
            { 
              "part_num": "3001", 
              "color_id": 0, 
              "quantity": 1, 
              "name": "Brick 2x4"
            }
          ]
        }
        
        EXAMPLES of Reasoning:
        - "I see a tall white piece with 1 stud on top. It is NOT a Plate. It is a Brick 1x1." -> Part 3005.
        - "I see a flat grey piece, 2 studs wide and 4 long. It has no studs on top, it is smooth." -> Tile 2x4 (Part 87079).
        - "I see a tall brick, 1 stud wide, 3 bricks high." -> Brick 1x1x3 (Part 14716).

        If unsure of the ID, use the most descriptive name possible (e.g., "Plate 1x2 with Clip").`;

        const result = await model.generateContent([
            prompt,
            ...imageParts
        ]);

        const responseText = result.response.text();
        let identifiedParts = [];
        let reasoning = "No reasoning provided";

        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Handle both new object format and potential fallback array
            if (Array.isArray(parsed)) {
                identifiedParts = parsed;
            } else if (parsed.identified_parts) {
                console.log("[AI Reasoning]:", parsed.reasoning); // Log reasoning for debug
                reasoning = parsed.reasoning;
                identifiedParts = parsed.identified_parts;
            } else {
                identifiedParts = [];
            }

        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Raw Text:", responseText);
            return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText });
        }

        if (!Array.isArray(identifiedParts)) {
            identifiedParts = [];
        }

        // Hydrate with Images from Rebrickable
        const fetchPromises = identifiedParts.map(async (part) => {
            try {
                // Fetch Part Details (for the image)
                // We default to a placeholder if part_num is missing/invalid
                if (!part.part_num) return;

                const detailsUrl = `https://rebrickable.com/api/v3/lego/parts/${part.part_num}/colors/${part.color_id}/`;
                const detailsRes = await axios.get(detailsUrl, {
                    headers: { 'Authorization': `key ${process.env.REBRICKABLE_API_KEY}` }
                });
                const partImgUrl = detailsRes.data.part_img_url;
                if (!partImgUrl) console.warn(`No image found for ${part.part_num}`);
                else console.log(`Image found for ${part.part_num}: ${partImgUrl}`);
                part.part_img_url = partImgUrl;
            } catch (err) {
                console.warn(`Rebrickable Image lookup failed for ${part.part_num}`, err.message);
            }
        });

        await Promise.all(fetchPromises);

        // Return parts and reasoning for debugging
        res.json({
            identified_parts: identifiedParts,
            reasoning: reasoning
        });

    } catch (error) {
        console.error('Server Image Error:', error);
        res.status(500).json({ error: error.message });
    }
};
