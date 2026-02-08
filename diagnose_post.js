const https = require('https');

const postUrl = (url) => {
    return new Promise((resolve) => {
        console.log(`POSTing to ${url}...`);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            console.log(`[${url}] Status: ${res.statusCode} ${res.statusMessage}`);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[${url}] Body Preview: ${data.substring(0, 100)}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`[${url}] Error: ${e.message}`);
            resolve();
        });

        req.write(JSON.stringify({})); // Empty body
        req.end();
    });
};

async function run() {
    await postUrl('https://legoai-kappa.vercel.app/api/analyze');
}

run();
