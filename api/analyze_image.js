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
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        const base64Data = image.split(',')[1] || image;
        const mimeType = image.split(';')[0] || 'image/jpeg';
        const mimeTypeClean = mimeType.split(':')[1] || mimeType;

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

        // Advanced System Prompt for Lego Identification using AFOL terminology
        const prompt = `You are an expert LEGO Part Identifier.
        Analyze the image to identify the specific Lego parts.
        
        CRITICAL INSTRUCTIONS:
        1. **Count Studs**: For every brick/plate, count the studs (e.g., 2x4, 1x2, 1x1).
        2. **Identify Height**: Distinguish between:
           - "Brick" (Tall)
           - "Plate" (Flat, 1/3 height of brick)
           - "Tile" (Flat, smooth top, no studs)
           - "Slope" (Angled)
           - "SNOT" (Studs Not On Top)
        3. **Estimate Color**: Use standard Lego color names.
        4. **Angle Check**: Look for depth cues to tell Bricks from Plates. If top-down, default to Brick unless obvious.
        
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
                part.part_img_url = detailsRes.data.part_img_url;
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
