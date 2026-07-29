const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const target = process.env.API_IPOS_URL || 'https://investorzone.in/api/ipos?is_active=1&status__in=ANALYSIS_PENDING%2CUNDER_REVIEW%2CREADY%2CLIVE%2CCLOSED&order=open_date.desc&limit=50&select=id%2C%20slug%2C%20ipo_name%2C%20category%2C%20status%2C%20price_band_low%2C%20price_band_high%2C%20issue_size_cr%2C%20lot_size%2C%20open_date%2C%20close_date';

  return new Promise((resolve) => {
    https.get(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers,
          body
        });
      });
    }).on('error', (err) => {
      resolve({
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message })
      });
    });
  });
};
