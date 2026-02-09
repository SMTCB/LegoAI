const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../web-app/.env') });

// Configuration
const API_URL = 'http://localhost:3000/api/analyze_image'; // Assumes local API running
const FIXTURES_DIR = path.join(__dirname, '../tests/fixtures/parts_scan');
const MANIFEST_PATH = path.join(__dirname, '../tests/manifest.json');

async function runTests() {
    console.log('🚀 Starting Automated Parts Scan Tests...');

    // 1. Load Manifest
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('❌ Manifest not found:', MANIFEST_PATH);
        process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

    // 2. Iterate Images
    const testFiles = Object.keys(manifest);
    if (testFiles.length === 0) {
        console.log('⚠️ No tests defined in manifest.json.');
        return;
    }

    let passed = 0;
    let failed = 0;

    for (const filename of testFiles) {
        const filePath = path.join(FIXTURES_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Image not found: ${filename} (Skipping)`);
            continue;
        }

        console.log(`\n📸 Testing: ${filename}`);
        const expectedParts = manifest[filename];

        try {
            // Read Image to Base64
            const imageBuffer = fs.readFileSync(filePath);
            const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

            // Call API
            const startTime = Date.now();
            const response = await axios.post(API_URL, {
                images: [base64Image] // API expects array of images
            });
            const duration = Date.now() - startTime;

            const actualParts = response.data.identified_parts || [];
            const reasoning = response.data.reasoning;

            // Compare Results
            const report = compareResults(expectedParts, actualParts);

            if (report.success) {
                console.log(`✅ PASS (${duration}ms)`);
                passed++;
            } else {
                console.log(`❌ FAIL (${duration}ms)`);
                if (reasoning) console.log(`   🧠 AI Reasoning: ${reasoning}`);
                console.log('   Expected:', JSON.stringify(expectedParts, null, 2));
                console.log('   Actual:', JSON.stringify(actualParts, null, 2));
                console.log('   Errors:', report.errors);
                failed++;
            }

        } catch (error) {
            console.error(`❌ ERROR: Failed to process ${filename}`);
            if (error.response) {
                console.error(`   API Status: ${error.response.status}`);
                console.error(`   API Data:`, error.response.data);
            } else {
                console.error(`   Message: ${error.message}`);
            }
            failed++;
        }
    }

    console.log('\n----------------------------------------');
    console.log(`🏁 Test Run Complete: ${passed} Passed, ${failed} Failed`);
    console.log('----------------------------------------');
}

function compareResults(expected, actual) {
    const errors = [];

    // 1. Check count of distinct part types
    // This is a loose check. Better to check coverage.

    // Normalize logic
    const normalize = (list) => list.map(p => `${p.part_num} (Qty: ${p.quantity})`);

    // Extremely simple comparison logic for V1:
    // Check if every expected part is found with correct quantity

    expected.forEach(exp => {
        const found = actual.find(act =>
            // Try to match by part_num if available, else name fuzzy match?
            // For now rely on part_num
            (act.part_num === exp.part_num) ||
            (act.name && exp.name && act.name.toLowerCase().includes(exp.name.toLowerCase()))
        );

        if (!found) {
            errors.push(`Missing Part: ${exp.part_num || exp.name}`);
        } else if (found.quantity !== exp.quantity) {
            errors.push(`Qty Mismatch for ${exp.part_num}: Expected ${exp.quantity}, Found ${found.quantity}`);
        }
    });

    // Check for hallucinations (parts found but not expected)
    const extraParts = actual.length - expected.length;
    if (extraParts > 0) {
        // We might want to allow this for now, but logged as warning
        // errors.push(`Found ${extraParts} unexpected parts.`);
    }

    return {
        success: errors.length === 0,
        errors
    };
}

runTests();
