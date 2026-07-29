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

  const slug = event.queryStringParameters?.slug;
  if (!slug) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing slug parameter' })
    };
  }

  const target = `https://investorzone.in/api/ipos?slug=${encodeURIComponent(slug)}&select=*%2C%20issuers(name%2C%20sector)`;

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
