const axios = require('axios');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { parts } = req.body; // Removed min_match_percentage, we go raw.

    if (!parts || parts.length === 0) {
        return res.status(200).json({ suggested_builds: [] });
    }

    try {
        const apiKey = process.env.REBRICKABLE_API_KEY;

        console.log(`[API] Find Builds (Unfiltered) for ${parts.length} unique parts.`);

        // Strategy: Iterate through unique parts to find candidate sets.
        // Try up to 10 "pivot" parts to ensure coverage.
        const uniqueParts = parts.filter(p => !['3001', '3003', '3020', '3023'].includes(p.part_num));
        const pivotCandidates = uniqueParts.length > 0 ? uniqueParts : parts;

        let allCandidateSets = new Map();
        let pivotsTried = 0;
        const MAX_PIVOTS = 10; // INCREASED FROM 3
        const MIN_CANDIDATES = 100; // INCREASED FROM 20

        for (const pivot of pivotCandidates) {
            if (pivotsTried >= MAX_PIVOTS) break;
            if (allCandidateSets.size >= MIN_CANDIDATES) break;

            const partNum = pivot.part_num;
            let colorId = pivot.color_id;

            if (colorId === null || colorId === undefined) {
                // ... (Color Inference Logic) ...
                try {
                    const colorsUrl = `https://rebrickable.com/api/v3/lego/parts/${partNum}/colors/?key=${apiKey}`;
                    const colorsRes = await axios.get(colorsUrl);
                    const colors = colorsRes.data.results;
                    if (colors && colors.length > 0) {
                        colors.sort((a, b) => b.num_sets - a.num_sets);
                        colorId = colors[0].color_id;
                    } else {
                        colorId = 1;
                    }
                } catch (e) {
                    colorId = 1;
                }
            }

            console.log(`[API] Pivot ${pivotsTried + 1}: ${partNum} (Color ${colorId})`);

            try {
                // Fetch MORE sets per pivot (page_size 50)
                const url = `https://rebrickable.com/api/v3/lego/parts/${partNum}/colors/${colorId}/sets/?key=${apiKey}&page_size=50&ordering=-year`;
                const response = await axios.get(url);
                const sets = response.data.results;

                if (sets) {
                    sets.forEach(set => {
                        allCandidateSets.set(set.set_num, set);
                    });
                }
                pivotsTried++;
            } catch (err) {
                console.error(`[API] Pivot search error for ${partNum}: ${err.message}`);
                pivotsTried++;
            }
        }

        const candidateSets = Array.from(allCandidateSets.values());
        console.log(`[API] Total Candidates Found: ${candidateSets.length}`);

        // Transform and Score
        let suggested_builds = candidateSets.map(set => {
            // Formula: (TotalUserParts / SetParts) * 100
            const totalUserParts = parts.reduce((sum, p) => sum + (p.quantity || 1), 0);

            let ratio = (totalUserParts / set.num_parts);
            if (ratio > 1) ratio = 1;

            let score = ratio * 100;

            return {
                set_id: set.set_num,
                name: set.name,
                set_img_url: set.set_img_url,
                num_parts: set.num_parts,
                year: set.year,
                set_url: set.set_url,
                match_score: Math.round(score)
            };
        });

        // Filter: Show ALMOST EVERYTHING.
        // Just hide sets with < 3 parts (likely errors or minis)
        suggested_builds = suggested_builds.filter(b => b.num_parts >= 3);

        // Sort by Match Score
        suggested_builds.sort((a, b) => b.match_score - a.match_score);

        // Limit
        suggested_builds = suggested_builds.slice(0, 50);

        res.status(200).json({ suggested_builds });

    } catch (error) {
        console.error('Find Builds Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch builds' });
    }
};
