const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const MANIFEST_PATH = path.join(__dirname, '../tests/manifest.json');
const IMAGES_DIR = path.join(__dirname, '../tests/fixtures/parts_scan');
const BRICKOGNIZE_API_URL = 'https://api.brickognize.com/predict/parts/';

async function testBrickognize() {
    console.log("Loading manifest...");
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error(`Manifest not found at ${MANIFEST_PATH}`);
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const testFiles = Object.keys(manifest);

    console.log(`Found ${testFiles.length} test cases.`);

    let correctCount = 0;
    let totalCount = 0;
    let results = [];

    for (const filename of testFiles) {
        const imagePath = path.join(IMAGES_DIR, filename);
        const expectedParts = manifest[filename];
        const expectedPartNum = expectedParts[0].part_num; // Assuming single part for simple test

        if (!fs.existsSync(imagePath)) {
            console.warn(`[SKIP] Image not found: ${filename}`);
            continue;
        }

        totalCount++;
        process.stdout.write(`Testing ${filename} (Expected: ${expectedPartNum})... `);

        try {
            const form = new FormData();
            form.append('query_image', fs.createReadStream(imagePath));

            const response = await axios.post(BRICKOGNIZE_API_URL, form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            const items = response.data.items;
            const topMatch = items[0];

            if (!topMatch) {
                console.log("No match found.");
                results.push({ filename, expected: expectedPartNum, actual: null, score: 0, status: 'FAIL' });
                continue;
            }

            const actualPartNum = topMatch.id;
            const score = topMatch.score;
            const isMatch = actualPartNum === expectedPartNum;

            if (isMatch) correctCount++;

            console.log(`${isMatch ? 'PASS' : 'FAIL'} -> Got: ${actualPartNum} (${(score * 100).toFixed(1)}%)`);

            results.push({
                filename,
                expected: expectedPartNum,
                actual: actualPartNum,
                actualName: topMatch.name,
                score,
                status: isMatch ? 'PASS' : 'FAIL'
            });

            // Be nice to the API
            await new Promise(r => setTimeout(r, 500));

        } catch (error) {
            console.log(`ERROR: ${error.message}`);
            results.push({ filename, expected: expectedPartNum, error: error.message, status: 'ERROR' });
        }
    }

    console.log("\n--- Summary ---");
    console.log(`Total: ${totalCount}`);
    console.log(`Correct: ${correctCount}`);
    console.log(`Accuracy: ${(correctCount / totalCount * 100).toFixed(1)}%`);

    // Write detailed report
    const reportPath = path.join(__dirname, '../brickognize_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Detailed report saved to ${reportPath}`);
}

testBrickognize();
