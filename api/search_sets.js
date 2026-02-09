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

    const { query, page = 1, min_parts = 10, ordering = '-num_parts' } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const apiKey = process.env.REBRICKABLE_API_KEY;
        // Search for Sets (theme_id=null finds all, but we can filter by min_parts)
        // type=1 is 'Set', type=2 is 'Minifig', etc. We want normal sets.
        // Rebrickable API v3 documentation says 'search' looks in set name/num.
        // We add min_parts to filter out gear/keychains which usually have 0-5 parts.
        const url = `https://rebrickable.com/api/v3/lego/sets/?search=${encodeURIComponent(query)}&page=${page}&page_size=20&min_parts=${min_parts}&ordering=${ordering}&key=${apiKey}`;

        console.log(`Searching Rebrickable: ${query} (Page: ${page}, MinParts: ${min_parts})`);

        const response = await axios.get(url);

        // Transform for UI
        const results = response.data.results.map(set => ({
            set_id: set.set_num,
            name: set.name,
            set_img_url: set.set_img_url,
            parts_count: set.num_parts,
            year: set.year,
            set_url: set.set_url
        }));

        res.status(200).json({
            results,
            next: response.data.next,
            previous: response.data.previous,
            count: response.data.count
        });

    } catch (error) {
        console.error('Rebrickable Search Error:', error.message);
        res.status(500).json({ error: 'Failed to search sets' });
    }
};
