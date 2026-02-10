const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const sharp = require('sharp');
const FormData = require('form-data');

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

        console.log(`[Hybrid Flow] Processing ${images.length} images in parallel...`);

        // Process all images in parallel (Queue Logic: each image is a section)
        const allParts = [];

        await Promise.all(images.map(async (imgBase64, index) => {
            try {
                const parts = await processSingleImage(imgBase64, index);
                allParts.push(...parts);
            } catch (err) {
                console.error(`[Image ${index}] Failed:`, err.message);
            }
        }));

        console.log(`[Hybrid Flow] Total parts found across batch: ${allParts.length}`);

        res.json({
            identified_parts: allParts
        });

    } catch (error) {
        console.error('Server Image Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// --- Hybrid Logic Helpers ---

async function processSingleImage(base64String, index) {
    // 1. Prepare Buffer & Metadata
    // Remove "data:image/jpeg;base64," prefix if present
    const base64Data = base64String.split(',')[1] || base64String;
    const imgBuffer = Buffer.from(base64Data, 'base64');

    // Get metadata for coordinate scaling
    const metadata = await sharp(imgBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;

    // 2. Call Gemini for Detection (Stage 1)
    console.log(`[Image ${index}] Stage 1: Gemini Detection...`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prompt asking for JSON list + bounding boxes
    const prompt = `
    Analyze this image of a LEGO pile.
    Return a strictly valid JSON object with a list of ALL detected LEGO parts.
    For each part, you MUST provide:
    - "name": A descriptive name (e.g., "Red 2x4 Brick").
    - "ymin", "xmin", "ymax", "xmax": Bounding box coordinates (normalized 0-1000).
    - "confidence": Your confidence (0-100).
    
    Do not include any explanation, only the JSON.
    Example JSON:
    {
      "parts": [
        { "name": "Blue Plate 1x2", "ymin": 100, "xmin": 200, "ymax": 150, "xmax": 300, "confidence": 95 }
      ]
    }
    `;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        }
    ]);

    const geminiText = result.response.text();
    const geminiParts = parseGeminiJson(geminiText);
    console.log(`[Image ${index}] Gemini found ${geminiParts.length} candidates.`);

    // 3. Verify ALL Parts with Brickognize (Stage 2)
    // We FORCE Brickognize because Gemini cannot reliably provide Part IDs (part_num).
    // Valid Part IDs are required for Rebrickable matching.

    const verifiedParts = await Promise.all(geminiParts.map(async (part) => {
        // Validation check for bounding box
        if (part.ymin === undefined || part.xmin === undefined || part.ymax === undefined || part.xmax === undefined) {
            // No bbox, can't crop. Returns a generic part. (Won't match builds easily).
            return {
                ...part,
                quantity: 1,
                source: 'gemini_no_bbox',
                part_num: null, // Critical: No ID
                part_img_url: null
            };
        }

        try {
            // Calculate pixel coordinates (ensure valid range)
            const left = Math.max(0, Math.floor((part.xmin / 1000) * width));
            const top = Math.max(0, Math.floor((part.ymin / 1000) * height));
            const w = Math.min(width - left, Math.floor(((part.xmax - part.xmin) / 1000) * width));
            const h = Math.min(height - top, Math.floor(((part.ymax - part.ymin) / 1000) * height));

            if (w <= 10 || h <= 10) return { ...part, quantity: 1, source: 'gemini_small_bbox' }; // Too small

            // Crop
            const cropBuffer = await sharp(imgBuffer)
                .extract({ left, top, width: w, height: h })
                .toBuffer();

            // Call Brickognize
            const form = new FormData();
            form.append('query_image', cropBuffer, { filename: 'crop.jpg', contentType: 'image/jpeg' });

            const brickRes = await axios.post('https://api.brickognize.com/predict/parts/', form, {
                headers: { ...form.getHeaders() }
            });

            const topMatch = brickRes.data.items?.[0];

            if (topMatch) {
                // We use the Brickognize result as the Source of Truth for ID
                // Even if score is somewhat low, it's better than Gemini's "Red Brick".
                // We accept anything > 30% as a "best guess" for ID.
                console.log(`[Image ${index}] Brickognize ID: "${part.name}" -> "${topMatch.name}" (${(topMatch.score * 100).toFixed(0)}%) [${topMatch.id}]`);

                // Try to map color from Gemini name to Rebrickable ID
                let colorId = null;
                const nameLower = part.name.toLowerCase();
                const colorMap = {
                    'black': 0,
                    'blue': 1,
                    'green': 2,
                    'teal': 3, // Dark Turquoise
                    'red': 5,
                    'dark pink': 26,
                    'pink': 23,
                    'brown': 8,
                    'light gray': 9,
                    'dark gray': 10,
                    'gray': 71, // Assume Light Bluish Gray
                    'yellow': 14,
                    'white': 15,
                    'orange': 4,
                    'tan': 19,
                    'purple': 24,
                    'lime': 27
                };

                for (const [colorName, id] of Object.entries(colorMap)) {
                    if (nameLower.includes(colorName)) {
                        colorId = id;
                        break;
                    }
                }

                return {
                    name: topMatch.name,
                    part_num: topMatch.id, // This is what we needed!
                    part_img_url: topMatch.img_url,
                    confidence: Math.round(topMatch.score * 100),
                    source: 'brickognize',
                    quantity: 1,
                    original_gemini_name: part.name,
                    color_id: colorId
                };
            }

        } catch (verErr) {
            console.warn(`[Image ${index}] Brickognize failed for part:`, verErr.message);
        }

        // Fallback: Return Gemini part (No ID)
        return {
            ...part,
            quantity: 1,
            source: 'gemini_failed_verification',
            part_num: null
        };
    }));

    return verifiedParts;
}

function parseGeminiJson(text) {
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) return [];

        let jsonStr = text.substring(firstBrace, lastBrace + 1);
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');

        const parsed = JSON.parse(jsonStr);
        return parsed.parts || [];
    } catch (e) {
        console.error("Gemini JSON Parse Error:", e);
        return [];
    }
}
