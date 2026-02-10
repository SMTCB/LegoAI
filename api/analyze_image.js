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

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        console.log(`[Hybrid Flow] Processing ${images.length} images...`);
        const allParts = [];

        await Promise.all(images.map(async (imgBase64, index) => {
            try {
                const parts = await processSingleImage(imgBase64, index);
                allParts.push(...parts);
            } catch (err) {
                console.error(`[Image ${index}] Failed:`, err.message);
            }
        }));

        res.json({ identified_parts: allParts });

    } catch (error) {
        console.error('Server Image Error:', error);
        res.status(500).json({ error: error.message });
    }
};

async function processSingleImage(base64String, index) {
    const base64Data = base64String.split(',')[1] || base64String;
    const imgBuffer = Buffer.from(base64Data, 'base64');
    const metadata = await sharp(imgBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;

    console.log(`[Image ${index}] Stage 1: Gemini Detection...`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    Analyze this image of a LEGO pile.
    Your task is to identify EVERY SINGLE visible Lego brick, plate, tile, or element.
    
    CRITICAL INSTRUCTIONS:
    1. BE AGGRESSIVE. If it looks like a Lego part, include it. Do not group parts.
    2. Handle PILES. The image may contain a pile of parts. ID as many as distinct objects as possible.
    3. Ignore the background table/surface. Only return bounding boxes for the plastic Lego parts.
    4. Return the list in JSON format under the key "parts".
    5. For each part, provide a "name" (e.g. "red brick 2x4") and "box_2d" [ymin, xmin, ymax, xmax].
    
    Return a strictly valid JSON object.
    `;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const geminiText = result.response.text();
    const geminiParts = parseGeminiJson(geminiText);
    console.log(`[Image ${index}] Gemini found ${geminiParts.length} candidates.`);

    const verifiedParts = await Promise.all(geminiParts.map(async (part) => {
        if (part.ymin === undefined || part.xmin === undefined) {
            return {
                ...part,
                quantity: 1,
                source: 'gemini_no_bbox',
                part_num: null,
                part_img_url: null
            };
        }

        let cropBase64 = null;
        let cropBuffer = null;

        try {
            const left = Math.max(0, Math.floor((part.xmin / 1000) * width));
            const top = Math.max(0, Math.floor((part.ymin / 1000) * height));
            const w = Math.min(width - left, Math.floor(((part.xmax - part.xmin) / 1000) * width));
            const h = Math.min(height - top, Math.floor(((part.ymax - part.ymin) / 1000) * height));

            if (w <= 10 || h <= 10) return { ...part, quantity: 1, source: 'gemini_small_bbox' };

            // Generate Crop
            cropBuffer = await sharp(imgBuffer)
                .extract({ left, top, width: w, height: h })
                .toBuffer();

            cropBase64 = `data:image/jpeg;base64,${cropBuffer.toString('base64')}`;

            // Call Brickognize
            const form = new FormData();
            form.append('query_image', cropBuffer, { filename: 'crop.jpg', contentType: 'image/jpeg' });

            const brickRes = await axios.post('https://api.brickognize.com/predict/parts/', form, {
                headers: { ...form.getHeaders() }
            });

            const topMatch = brickRes.data.items?.[0];

            if (topMatch) {
                console.log(`[Image ${index}] Brickognize ID: "${part.name}" -> "${topMatch.name}" (${(topMatch.score * 100).toFixed(0)}%) [${topMatch.id}]`);

                let colorId = null;
                const nameLower = part.name.toLowerCase();
                const colorMap = {
                    'black': 0, 'blue': 1, 'green': 2, 'teal': 3, 'red': 5, 'dark pink': 26, 'pink': 23, 'brown': 8,
                    'light gray': 9, 'dark gray': 10, 'gray': 71, 'yellow': 14, 'white': 15, 'orange': 4, 'tan': 19,
                    'purple': 24, 'lime': 27, 'gold': 294, 'silver': 297, 'trans-clear': 12, 'clear': 12
                };

                for (const [colorName, id] of Object.entries(colorMap)) {
                    if (nameLower.includes(colorName)) {
                        colorId = id;
                        break;
                    }
                }

                let partImgUrl = topMatch.img_url;
                // USE CROP AS BACKUP!
                let backupImgUrl = cropBase64;

                if (colorId !== null) {
                    partImgUrl = `https://cdn.rebrickable.com/media/parts/ldraw/${colorId}/${topMatch.id}.png`;
                } else {
                    partImgUrl = `https://cdn.rebrickable.com/media/parts/ldraw/15/${topMatch.id}.png`;
                }

                return {
                    name: topMatch.name,
                    part_num: topMatch.id,
                    part_img_url: partImgUrl,
                    backup_img_url: backupImgUrl,
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

        // FAILURE FALLBACK
        // Still return the part, but use the CROP as the main image so user sees something!
        return {
            ...part,
            quantity: 1,
            source: 'gemini_failed_verification',
            part_num: null, // No ID found
            part_img_url: cropBase64, // SHOW THE CROP!
            backup_img_url: null
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
        return [];
    }
}
