require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is missing.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const IMAGE_PATH = path.join(__dirname, '../tests/fixtures/parts_scan/IMG_1371.jpg');

async function testGeminiBoundingBox() {
    try {
        console.log(`Testing Gemini Bounding Box on ${IMAGE_PATH}...`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const imageBuffer = fs.readFileSync(IMAGE_PATH);
        const base64Image = imageBuffer.toString('base64');

        const prompt = `
        Analyze this image of LEGO parts.
        Return a JSON object with a list of detected parts.
        For each part, provide:
        - "name": A short descriptive name.
        - "ymin", "xmin", "ymax", "xmax": Bounding box coordinates (normalized 0-1000).
        - "confidence": Your confidence (0-100).
        
        Strict JSON format.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        console.log("Response received:");
        console.log(result.response.text());

    } catch (error) {
        console.error("Error:", error);
    }
}

testGeminiBoundingBox();
