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

  const target = 'https://investorzone.in/api/ipos?is_active=1&status__in=ANALYSIS_PENDING%2CUNDER_REVIEW%2CREADY%2CLIVE%2CCLOSED&order=open_date.desc&limit=50&select=id%2C%20slug%2C%20ipo_name%2C%20category%2C%20status%2C%20price_band_low%2C%20price_band_high%2C%20issue_size_cr%2C%20lot_size%2C%20open_date%2C%20close_date';

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
