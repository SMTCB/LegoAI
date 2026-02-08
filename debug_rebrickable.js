const axios = require('axios');

// Load env if possible, or just copy key here for testing (user has key in file)
// We will rely on process.env being populated by the runner if we run it via node
// But I'll use the one from the file for this script since I can't easily source .env in this environment without dotenv
const API_KEY = process.env.REBRICKABLE_API_KEY || "790cfb0b7226123b0079f87318c49a6e";

async function testRebrickable() {
    try {
        const partNum = '3001';
        const colorId = 0; // Black

        console.log(`Fetching Sets for Part ${partNum} Color ${colorId}...`);
        const setsUrl = `https://rebrickable.com/api/v3/lego/parts/${partNum}/colors/${colorId}/sets/`;
        const setsRes = await axios.get(setsUrl, { headers: { 'Authorization': `key ${API_KEY}` } });

        console.log("Sets Endpoint Response Keys:", Object.keys(setsRes.data));
        console.log("Sets Endpoint part_img_url?", setsRes.data.part_img_url); // Check if it exists here

        console.log(`\nFetching Details for Part ${partNum} Color ${colorId}...`);
        const detailsUrl = `https://rebrickable.com/api/v3/lego/parts/${partNum}/colors/${colorId}/`;
        const detailsRes = await axios.get(detailsUrl, { headers: { 'Authorization': `key ${API_KEY}` } });

        console.log("Details Endpoint Keys:", Object.keys(detailsRes.data));
        console.log("Details Endpoint part_img_url:", detailsRes.data.part_img_url);

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) console.log(error.response.data);
    }
}

testRebrickable();
