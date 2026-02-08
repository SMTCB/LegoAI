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

    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const apiKey = process.env.REBRICKABLE_API_KEY;
        const url = `https://rebrickable.com/api/v3/lego/sets/?search=${encodeURIComponent(query)}&page_size=20&key=${apiKey}`;

        console.log(`Searching Rebrickable for: ${query}`);

        const response = await axios.get(url);

        // Transform for UI
        const results = response.data.results.map(set => ({
            set_id: set.set_num,
            name: set.name,
            set_img_url: set.set_img_url,
            parts_count: set.num_parts,
            year: set.year
        }));

        res.status(200).json({ results });

    } catch (error) {
        console.error('Rebrickable Search Error:', error.message);
        res.status(500).json({ error: 'Failed to search sets' });
    }
};
