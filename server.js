/**
 * Node.js Proxy Server for IPO Track
 * Port: 5000
 * Completely hides all third-party domain names from Browser Network DevTools
 */

const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

// Backend API Endpoints (Hidden from browser Network tab)
const TARGET_IZ_LIST = 'https://investorzone.in/api/ipos?is_active=1&status__in=ANALYSIS_PENDING%2CUNDER_REVIEW%2CREADY%2CLIVE%2CCLOSED&order=open_date.desc&limit=50&select=id%2C%20slug%2C%20ipo_name%2C%20category%2C%20status%2C%20price_band_low%2C%20price_band_high%2C%20issue_size_cr%2C%20lot_size%2C%20open_date%2C%20close_date';
const TARGET_GMP_LIST = 'https://webnodejs.investorgain.com/cloud/v2/index/gmp-data';
const TARGET_IZ_DETAIL = 'https://investorzone.in/api/ipos';

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: List IPOs
  if (parsedUrl.pathname === '/api/ipos') {
    fetchExternal(TARGET_IZ_LIST, res);
    return;
  }

  // 2. API: GMP Data
  if (parsedUrl.pathname === '/api/gmp') {
    fetchExternal(TARGET_GMP_LIST, res);
    return;
  }

  // 3. API: IPO Details
  if (parsedUrl.pathname === '/api/details') {
    const slug = parsedUrl.searchParams.get('slug');
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing slug parameter' }));
      return;
    }
    const url = `${TARGET_IZ_DETAIL}?slug=${encodeURIComponent(slug)}&select=*%2C%20issuers(name%2C%20sector)`;
    fetchExternal(url, res);
    return;
  }

  // Static File Server
  let safePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  
  const filePath = path.join(__dirname, safePath);
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
    } else {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    }
  });
});

function fetchExternal(targetUrl, res) {
  https.get(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }, (extRes) => {
    let body = '';
    extRes.on('data', chunk => body += chunk);
    extRes.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
    });
  }).on('error', (err) => {
    console.error('Fetch error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch data' }));
  });
}

server.listen(PORT, () => {
  console.log(`✅ IPO Proxy Server running at http://localhost:${PORT}`);
});
