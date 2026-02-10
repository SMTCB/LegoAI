require('dotenv').config();
const findBuilds = require('../api/find_builds');

// Mock request with 5 parts (as per user screenshot)
const req = {
    method: 'POST',
    body: {
        parts: [
            { part_num: '3003', name: 'Brick 2x2', color_id: 15 },
            { part_num: '3020', name: 'Plate 2x4', color_id: 15 },
            { part_num: '3001', name: 'Brick 2x4', color_id: 15 },
            { part_num: '3022', name: 'Plate 2x2', color_id: 15 },
            { part_num: '3023', name: 'Plate 1x2', color_id: 15 }
        ],
        min_match_percentage: 80 // Precision mode
    }
};

const res = {
    setHeader: () => { },
    status: (code) => ({
        json: (data) => {
            console.log(`[Status ${code}]`);
            if (data.suggested_builds) {
                console.log("Top 5 Results:");
                data.suggested_builds.slice(0, 5).forEach(b => {
                    console.log(`- Set: ${b.name} (${b.num_parts} parts). Score: ${b.match_score}%`);
                });
            } else {
                console.log(JSON.stringify(data, null, 2));
            }
        }
    })
};

async function runTest() {
    console.log("Testing find_builds with 5 common parts...");
    await findBuilds(req, res);
}

runTest();
