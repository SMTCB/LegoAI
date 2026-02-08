const https = require('https');

const checkUrl = (url) => {
    return new Promise((resolve) => {
        console.log(`Checking ${url}...`);
        https.get(url, (res) => {
            console.log(`[${url}] Status: ${res.statusCode} ${res.statusMessage}`);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[${url}] Body Preview: ${data.substring(0, 100)}`);
                resolve();
            });
        }).on('error', (e) => {
            console.error(`[${url}] Error: ${e.message}`);
            resolve();
        });
    });
};

async function run() {
    await checkUrl('https://legoai-kappa.vercel.app/api/hello');
    await checkUrl('https://legoai-kappa.vercel.app/api/analyze'); // GET request
}

run();
