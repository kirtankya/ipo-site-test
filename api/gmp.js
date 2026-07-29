// Vercel Serverless Function for /api/gmp (CommonJS pattern for universal Vercel Node runtime compatibility)

const https = require('https');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const target = 'https://webnodejs.investorgain.com/cloud/v2/index/gmp-data';

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
    console.error('Vercel gmp error:', err);
    res.status(500).json({ error: 'Failed to fetch gmp' });
  });
};
