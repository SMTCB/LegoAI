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
            model: "gemini-2.0-flash",
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        });

        // Advanced System Prompt for Multi-View Analysis
        const prompt = `You are an expert LEGO Part Identifier.
        You are viewing multiple photos of the SAME batch of Lego parts from different angles.
        
        CRITICAL INSTRUCTIONS:
        1. **Combine Views**: Use the multiple angles to determine the 3D shape (Height/Depth).
           - If Photo 1 is top-down, use Photo 2 (side view) to check if it's a Brick (Tall) or Plate (Flat).
        2. **Deduplicate**: These photos show the SAME objects. Do NOT double count. 
           - If you see 3 red bricks in Photo A and the same 3 red bricks in Photo B, the total is 3, NOT 6.
           - Only count unique objects.
        3. **Count Studs & Identify**: Accurate stud count (e.g. 2x4) is paramount.
        
        4. **Estimate Color**: Use standard Lego color names.
        
        RETURN ONLY A JSON ARRAY. Format:
        [
          { 
            "part_num": "3001", 
            "color_id": 0, 
            "quantity": 1, 
            "name": "Brick 2x4"
          }
        ]
        
        If unsure of the exact Part Num, describe it precisely in the "name" field.`;

        const result = await model.generateContent([
            prompt,
            ...imageParts
        ]);

        const responseText = result.response.text();
        let identifiedParts = [];
        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            identifiedParts = JSON.parse(cleanJson);
        } catch (e) {
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

        // Return ONLY the parts. The frontend accumulates them.
        res.json({
            identified_parts: identifiedParts
        });

    } catch (error) {
        console.error('Server Image Error:', error);
        res.status(500).json({ error: error.message });
    }
};
