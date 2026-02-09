const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 3000;

// Increase payload limit for images
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Import handlers
// Note: Vercel functions are (req, res) => {...} which works with Express
const analyzeImageHandler = require('./api/analyze_image');
const analyzeHandler = require('./api/analyze');
const findBuildsHandler = require('./api/find_builds');
const searchSetsHandler = require('./api/search_sets');
const listModelsHandler = require('./api/list_models');

// Define Routes
app.post('/api/analyze_image', analyzeImageHandler);
app.post('/api/analyze', analyzeHandler);
app.post('/api/find_builds', findBuildsHandler);
app.get('/api/search_sets', searchSetsHandler);
app.get('/api/list_models', listModelsHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Local API Server running at http://localhost:${PORT}`);
    console.log(`   - POST /api/analyze_image`);
    console.log(`   - POST /api/analyze`);
    console.log(`   - POST /api/find_builds`);
    console.log(`   - GET  /api/search_sets`);
});
