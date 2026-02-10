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

    const { parts, min_match_percentage = 80 } = req.body;

    if (!parts || parts.length === 0) {
        return res.status(400).json({ error: 'No parts provided' });
    }

    try {
        const apiKey = process.env.REBRICKABLE_API_KEY;

        console.log(`[API] Starting Find Builds for ${parts.length} parts. Threshold: ${min_match_percentage}%`);

        // Strategy: Iterate through unique parts to find candidate sets.
        // We try up to 3 "pivot" parts. If Pivot 1 yields few results, we try Pivot 2, etc.
        const uniqueParts = parts.filter(p => !['3001', '3003', '3020', '3023'].includes(p.part_num));
        const pivotCandidates = uniqueParts.length > 0 ? uniqueParts : parts;

        let allCandidateSets = new Map(); // Use Map to deduplicate by set_num
        let pivotsTried = 0;
        const MAX_PIVOTS = 3;
        const MIN_CANDIDATES = 20; // Stop if we have enough sets

        for (const pivot of pivotCandidates) {
            if (pivotsTried >= MAX_PIVOTS) break;
            if (allCandidateSets.size >= MIN_CANDIDATES) break;

            const partNum = pivot.part_num;
            let colorId = pivot.color_id;

            // If color is unknown (null) or 0 (Black - potentially default), we verify or fetch popular
            if (colorId === null || colorId === undefined) {
                console.log(`[API] Color ID missing for pivot ${partNum}. Fetching most popular color...`);
                try {
                    const colorsUrl = `https://rebrickable.com/api/v3/lego/parts/${partNum}/colors/?key=${apiKey}`;
                    const colorsRes = await axios.get(colorsUrl);
                    const colors = colorsRes.data.results;
                    if (colors && colors.length > 0) {
                        colors.sort((a, b) => b.num_sets - a.num_sets);
                        colorId = colors[0].color_id;
                        console.log(`[API] Inferred Color ID: ${colorId} for ${partNum}`);
                    } else {
                        colorId = 1;
                    }
                } catch (e) {
                    console.warn(`[API] Color fetch failed for ${partNum}: ${e.message}`);
                    colorId = 1;
                }
            }

            console.log(`[API] Pivot ${pivotsTried + 1}: ${partNum} (Color ${colorId})`);

            try {
                const url = `https://rebrickable.com/api/v3/lego/parts/${partNum}/colors/${colorId}/sets/?key=${apiKey}&page_size=20&ordering=-year`;
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
            // Formula: (UserParts / SetParts) * 100
            let ratio = (parts.length / set.num_parts);
            if (ratio > 1) ratio = 1;

            let score = ratio * 100;

            // Boost for "Creative Mode" (Low Threshold)
            if (min_match_percentage < 40) {
                score = score * 2.0; // Significant boost to show incomplete sets
            }

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

        // Filter
        // 1. Must have at least 10 parts (avoid trivial/empty sets).
        // 2. Score must be visible. If user has 5 parts and set has 100, score is 5%.
        //    If threshold is 10%, it's hidden. We should allow lower scores if parts count is low.
        //    Let's use a dynamic minimum.

        let dynamicMinScore = 5; // Base minimum
        if (parts.length < 10) dynamicMinScore = 1; // Show anything non-zero if user has few parts

        suggested_builds = suggested_builds.filter(b => b.num_parts >= 10 && b.match_score >= dynamicMinScore);

        // Sort by Match Score (Highest first)
        suggested_builds.sort((a, b) => b.match_score - a.match_score);

        // Limit
        suggested_builds = suggested_builds.slice(0, 20);

        res.status(200).json({ suggested_builds });

    } catch (error) {
        console.error('Find Builds Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch builds' });
    }
};
