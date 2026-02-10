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

        // Vibe Match Strategy:
        // 1. "Precision" Mode (High min_match_percentage): Strict matching, relies on unique parts.
        // 2. "Chaos" Mode (Low min_match_percentage): Loose matching, returns sets that share *any* parts.

        // Heuristic: Pick the most unique part.
        const uniquePart = parts.find(p => !['3001', '3003', '3020', '3023'].includes(p.part_num)) || parts[0];
        const partNum = uniquePart.part_num;
        let colorId = uniquePart.color_id;

        // If no color ID (or invalid 0), try to find the most popular color for this part
        if (!colorId || colorId === 0) {
            console.log(`[API] Color ID missing for part ${partNum}. Fetching most popular color...`);
            try {
                const colorsUrl = `https://rebrickable.com/api/v3/lego/parts/${partNum}/colors/?key=${apiKey}`;
                const colorsRes = await axios.get(colorsUrl);
                const colors = colorsRes.data.results;
                if (colors && colors.length > 0) {
                    // Sort by num_sets desc
                    colors.sort((a, b) => b.num_sets - a.num_sets);
                    colorId = colors[0].color_id;
                    console.log(`[API] Inferred Color ID: ${colorId} (${colors[0].color_name}) for part ${partNum}`);
                }
            } catch (colorErr) {
                console.warn(`[API] Failed to fetch colors for part ${partNum}:`, colorErr.message);
                colorId = 1; // Fallback to Blue or Black(0)? Black is 0. 1 is Blue.
            }
        }

        console.log(`[API] Finding builds for part: ${partNum} (Color: ${colorId}). Threshold: ${min_match_percentage}%`);

        // Rebrickable Endpoint
        const url = `https://rebrickable.com/api/v3/lego/parts/${partNum}/colors/${colorId}/sets/?key=${apiKey}&page_size=20&ordering=-year`;

        const response = await axios.get(url);

        // Transform for UI and Apply "Vibe Check"
        let suggested_builds = response.data.results.map(set => ({
            set_id: set.set_num,
            name: set.name,
            set_img_url: set.set_img_url,
            num_parts: set.num_parts,
            year: set.year,
            set_url: set.set_url,
            // Mock Match Score Logic:
            // - If threshold is high, we simulate a strict match (85-100%)
            // - If threshold is low, we simulate a loose match (30-80%)
            match_score: calculateMockMatchScore(min_match_percentage, set.num_parts, parts.length)
        }));

        // Filter based on the slider threshold
        suggested_builds = suggested_builds.filter(b => b.match_score >= min_match_percentage);

        // Sort by match score
        suggested_builds.sort((a, b) => b.match_score - a.match_score);

        res.status(200).json({ suggested_builds });

    } catch (error) {
        console.error('Find Builds Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch builds' });
    }
};

function calculateMockMatchScore(threshold, setParts, userParts) {
    // In a real app, this would be: (Common Parts / Set Parts) * 100
    // Here, we fake it to demonstrate the UI behavior.

    const variance = Math.floor(Math.random() * 15);

    if (threshold > 80) {
        // Strict Mode: Return high scores
        return 85 + variance;
    } else if (threshold < 40) {
        // Chaos Mode: Return lower scores
        return 30 + (Math.random() * 50);
    } else {
        // Balanced Mode
        return 60 + (Math.random() * 30);
    }
}
