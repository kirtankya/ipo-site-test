// IPO Track Live - Main List Logic

function sanitizeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/InvestorZone/gi, 'IPO Tracker')
    .replace(/InvestorGain/gi, 'IPO Tracker')
    .replace(/investorzone\.in/gi, '')
    .replace(/investorgain\.com/gi, '');
}

const LIVE_SERVER = 'https://ipo-site-test.vercel.app';

// Hidden fallback obfuscated URLs for static file:// protocol
const _0x1a = 'aHR0cHM6Ly9pbnZlc3RvcnpvbmUuaW4vYXBpL2lwb3M=';
const _0x2b = 'aHR0cHM6Ly93ZWJub2RlanMuaW52ZXN0b3JnYWluLmNvbS9jbG91ZC92Mi9pbmRleC9nbXAtZGF0YQ==';
const _0x3c = 'aHR0cHM6Ly9jb3JzcHJveHkuaW8vPw==';

let allIpos = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchData();

  document.getElementById('searchInput').addEventListener('input', renderTable);
  document.getElementById('categorySelect').addEventListener('change', renderTable);
  document.getElementById('statusSelect').addEventListener('change', renderTable);
  document.getElementById('refreshBtn').addEventListener('click', fetchData);
});

async function fetchApi(path, fallbackUrl) {
  // 1. Try relative endpoint first (Works on Vercel Live Deployment)
  try {
    const res = await fetch(path);
    if (res.ok) return await res.json();
  } catch (err) { }

  // 2. Try Vercel Live Server proxy URL
  try {
    const res = await fetch(LIVE_SERVER + path);
    if (res.ok) return await res.json();
  } catch (err) { }

  // 3. Fallback for static file:// protocol
  const proxyUrl = atob(_0x3c) + encodeURIComponent(fallbackUrl);
  const res = await fetch(proxyUrl);
  return await res.json();
}

async function fetchData() {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '<tr><td colspan="10" class="loading">Loading live IPO data...</td></tr>';

  try {
    const listFallback = atob(_0x1a) + '?is_active=1&status__in=ANALYSIS_PENDING%2CUNDER_REVIEW%2CREADY%2CLIVE%2CCLOSED&order=open_date.desc&limit=50&select=id%2C%20slug%2C%20ipo_name%2C%20category%2C%20status%2C%20price_band_low%2C%20price_band_high%2C%20issue_size_cr%2C%20lot_size%2C%20open_date%2C%20close_date';

    const [izRes, gmpRes] = await Promise.allSettled([
      fetchApi('/api/ipos', listFallback),
      fetchApi('/api/gmp', atob(_0x2b))
    ]);

    let izData = [];
    if (izRes.status === 'fulfilled' && izRes.value && izRes.value.data) {
      izData = izRes.value.data;
    }

    let gmpMap = new Map();
    if (gmpRes.status === 'fulfilled' && gmpRes.value && gmpRes.value.gmpList) {
      gmpRes.value.gmpList.forEach(item => {
        const cleanName = item.company_short_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        gmpMap.set(cleanName, item);
      });
    }

    // Merge data & sanitize text
    allIpos = izData.map(item => {
      const cleanName = item.ipo_name.toLowerCase().replace(/ipo/g, '').replace(/[^a-z0-9]/g, '');

      let matchedGmp = null;
      for (let [key, gmpObj] of gmpMap.entries()) {
        if (cleanName.includes(key) || key.includes(cleanName)) {
          matchedGmp = gmpObj;
          break;
        }
      }

      return {
        ...item,
        ipo_name: sanitizeText(item.ipo_name),
        gmp: matchedGmp ? (matchedGmp.gmp || '0') : 'N/A',
        gmp_perc: matchedGmp ? (matchedGmp.gmp_perc || '0') : '0',
        subscription: matchedGmp ? (matchedGmp.subscription || '-') : '-'
      };
    });

    renderTable();
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = '<tr><td colspan="10" class="loading">Error loading data. Please try again.</td></tr>';
  }
}

function renderTable() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const category = document.getElementById('categorySelect').value;
  const status = document.getElementById('statusSelect').value;
  const tableBody = document.getElementById('tableBody');
  const today = new Date().toISOString().split('T')[0];

  const filtered = allIpos.filter(item => {
    // Search
    const nameMatch = item.ipo_name.toLowerCase().includes(search);
    if (search && !nameMatch) return false;

    // Category
    if (category !== 'all') {
      const catLower = (item.category || '').toLowerCase();
      if (category === 'SME' && !catLower.includes('sme')) return false;
      if (category === 'IPO' && catLower.includes('sme')) return false;
    }

    // Status
    if (status !== 'all') {
      const isOpen = item.open_date <= today && item.close_date >= today;
      const isUpcoming = item.open_date > today;
      const isClosed = item.close_date < today;

      if (status === 'O' && !isOpen) return false;
      if (status === 'U' && !isUpcoming) return false;
      if (status === 'C' && !isClosed) return false;
    }

    return true;
  });

  // Sort: OPEN First -> UPCOMING Second -> CLOSED Last
  filtered.sort((a, b) => {
    const getPriority = (item) => {
      if (item.open_date <= today && item.close_date >= today) return 1;
      if (item.open_date > today) return 2;
      return 3;
    };

    const prioA = getPriority(a);
    const prioB = getPriority(b);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    if (prioA === 2) {
      return (a.open_date || '').localeCompare(b.open_date || '');
    } else {
      return (b.open_date || '').localeCompare(a.open_date || '');
    }
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="10" class="loading">No matching IPOs found.</td></tr>';
    return;
  }

  tableBody.innerHTML = filtered.map(item => {
    let statusText = 'Closed';
    let statusClass = 'badge-closed';

    if (item.open_date <= today && item.close_date >= today) {
      statusText = 'Open';
      statusClass = 'badge-open';
    } else if (item.open_date > today) {
      statusText = 'Upcoming';
      statusClass = 'badge-upcoming';
    }

    const priceText = item.price_band_high
      ? `₹${item.price_band_low} - ₹${item.price_band_high}`
      : `₹${item.price_band_low || '-'}`;

    const gmpPercNum = parseFloat(item.gmp_perc) || 0;
    const profitClass = gmpPercNum >= 0 ? 'profit-positive' : 'profit-negative';
    const slug = encodeURIComponent(item.slug || '');

    return `
      <tr class="clickable-row" onclick="window.location.href='details.html?slug=${slug}'">
        <td>
          <a href="details.html?slug=${slug}" class="company-link">
            <strong>${item.ipo_name}</strong>
          </a>
        </td>
        <td><span class="badge badge-type">${(item.category || 'mainboard').toUpperCase()}</span></td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>${priceText}</td>
        <td>${item.gmp !== 'N/A' ? '₹' + item.gmp : '-'}</td>
        <td class="${profitClass}">${item.gmp_perc !== '0' ? (gmpPercNum >= 0 ? '+' : '') + item.gmp_perc + '%' : '-'}</td>
        <td>${item.issue_size_cr ? '₹' + item.issue_size_cr + ' Cr' : '-'}</td>
        <td>${item.open_date || '-'} to ${item.close_date || '-'}</td>
        <td>${item.lot_size ? item.lot_size + ' Shares' : '-'}</td>
        <td>
          <a href="details.html?slug=${slug}" class="btn-details">Details →</a>
        </td>
      </tr>
    `;
  }).join('');
}
