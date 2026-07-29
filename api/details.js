// Vercel Serverless Function for /api/details (Native Node.js ServerResponse)

const https = require('https');
const url = require('url');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const slug = parsedUrl.query?.slug;

  if (!slug) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing slug parameter' }));
    return;
  }

  const target = `https://investorzone.in/api/ipos?slug=${encodeURIComponent(slug)}&select=*%2C%20issuers(name%2C%20sector)`;

  https.get(target, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }, (extRes) => {
    let body = '';
    extRes.on('data', chunk => body += chunk);
    extRes.on('end', () => {
      res.statusCode = 200;
      res.end(body);
    });
  }).on('error', (err) => {
    console.error('Vercel details error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch details' }));
  });
};
