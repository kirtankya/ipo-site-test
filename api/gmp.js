const https = require('https');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const target = 'https://webnodejs.investorgain.com/cloud/v2/index/gmp-data';

  https.get(target, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  }, (extRes) => {
    let body = '';
    extRes.on('data', chunk => body += chunk);
    extRes.on('end', () => {
      res.statusCode = 200;
      res.end(body);
    });
  }).on('error', (err) => {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  });
};
