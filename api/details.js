// Vercel Serverless Function for /api/details (CommonJS pattern for universal Vercel Node runtime compatibility)

const https = require('https');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const slug = req.query?.slug;
  if (!slug) {
    res.status(400).json({ error: 'Missing slug parameter' });
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
      res.status(200).send(body);
    });
  }).on('error', (err) => {
    console.error('Vercel details error:', err);
    res.status(500).json({ error: 'Failed to fetch details' });
  });
};
