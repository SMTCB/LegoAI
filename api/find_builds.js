const axios = require('axios');

const calculateMatchScore = (foundQty, totalSetParts) => {
    if (totalSetParts === 0) return 0;

    // 1. Base Percentage (Capped at 100%)
    let rawPercentage = (foundQty / totalSetParts) * 100;
    if (rawPercentage > 100) rawPercentage = 100;
    return rawPercentage;
};

module.exports = async (req, res) => {
    console.log(`[API] Find Builds Request received`);

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
        const { parts } = req.body;

        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return res.status(400).json({ error: 'No parts provided' });
        }

        // Threshold Check
        // if (parts.length < 10) {
        //     return res.json({ 
        //         status: 'threshold_error', 
        //         message: `Need at least 10 parts to search effectively (You have ${parts.length})`,
        //         suggested_builds: [] 
        //     });
        // }
        // We will return empty for now but let frontend handle warning, or just do best effort.

        const setMap = {};

        // Parallel queries to Rebrickable Sets
        const fetchPromises = parts.map(async (part) => {
            try {
                if (!part.part_num) return;

                const setsUrl = `https://rebrickable.com/api/v3/lego/parts/${part.part_num}/colors/${part.color_id}/sets/`;
                const setsRes = await axios.get(setsUrl, {
                    headers: { 'Authorization': `key ${process.env.REBRICKABLE_API_KEY}` }
                });

                const foundSets = setsRes.data.results || [];

                foundSets.forEach(set => {
                    if (!setMap[set.set_num]) {
                        setMap[set.set_num] = {
                            set_id: set.set_num,
                            name: set.name,
                            num_parts: set.num_parts || 9999,
                            set_img_url: set.set_img_url,
                            matched_parts: [],
                            total_matched_quantity: 0
                        };
                    }

                    const match = {
                        part_num: part.part_num,
                        part_name: part.name,
                        color_id: part.color_id,
                        owned_qty: part.quantity || 1,
                        set_qty: set.quantity_in_set || 1,
                        part_img_url: part.part_img_url // Pass through if available
                    };

                    setMap[set.set_num].matched_parts.push(match);
                    setMap[set.set_num].total_matched_quantity += Math.min(match.owned_qty, match.set_qty);
                });
            } catch (err) {
                // Silent fail on individual part lookup
            }
        });

        await Promise.all(fetchPromises);

        const results = Object.values(setMap).map(set => {
            const score = calculateMatchScore(set.total_matched_quantity, set.num_parts);
            return {
                ...set,
                set_url: set.set_url || `https://rebrickable.com/sets/${set.set_id}`,
                match_score: parseFloat(score.toFixed(2))
            };
        })
            // FILTER: Logic Update (50% score minimum)
            .filter(s => s.match_score > 50)
            // FILTER: Logic Update (Min 5 parts matched)
            .filter(s => s.matched_parts.length >= 5)
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 50); // Increased limit

        res.json({
            suggested_builds: results
        });

    } catch (error) {
        console.error('Server Logic Error:', error);
        res.status(500).json({ error: error.message });
    }
};
