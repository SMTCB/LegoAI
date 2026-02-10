require('dotenv').config();
const analyzeImage = require('../api/analyze_image');
const fs = require('fs');
const path = require('path');

// Mock Express Request/Response
const req = {
    method: 'POST',
    body: {
        images: []
    }
};

const res = {
    setHeader: () => { },
    status: (code) => ({
        json: (data) => console.log(`[Status ${code}]`, JSON.stringify(data, null, 2)),
        end: () => console.log(`[Status ${code}] End`)
    }),
    json: (data) => {
        console.log("--- API Response ---");
        console.log(JSON.stringify(data, null, 2));
    }
};

async function runTest() {
    const imagePath = path.join(__dirname, '../tests/fixtures/parts_scan/IMG_1371.jpg');
    if (!fs.existsSync(imagePath)) {
        console.error("Image not found:", imagePath);
        return;
    }

    console.log("Reading test image...");
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    req.body.images = [base64Image];

    console.log("Calling analyze_image handler...");
    await analyzeImage(req, res);
}

runTest();
