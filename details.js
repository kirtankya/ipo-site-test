// Rich Details Page Logic with Vercel Edge Serverless Support

function sanitizeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/InvestorZone/gi, 'IPO Tracker')
    .replace(/InvestorGain/gi, 'IPO Tracker')
    .replace(/investorzone\.in/gi, '')
    .replace(/investorgain\.com/gi, '');
}

const LIVE_SERVER = 'https://ipo-site-test.vercel.app';

const _0x1a = 'aHR0cHM6Ly9pbnZlc3RvcnpvbmUuaW4vYXBpL2lwb3M=';
const _0x2b = 'aHR0cHM6Ly93ZWJub2RlanMuaW52ZXN0b3JnYWluLmNvbS9jbG91ZC92Mi9pbmRleC9nbXAtZGF0YQ==';
const _0x3c = 'aHR0cHM6Ly9jb3JzcHJveHkuaW8vPw==';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    document.getElementById('detailsContent').innerHTML = `
      <div class="error-box">
        <h2>No IPO Selected</h2>
        <p><a href="index.html">← Click here to return to IPO list</a></p>
      </div>
    `;
    return;
  }

  fetchIpoDetails(slug);
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

async function fetchIpoDetails(slug) {
  const container = document.getElementById('detailsContent');
  const izFallback = atob(_0x1a) + `?slug=${encodeURIComponent(slug)}&select=*%2C%20issuers(name%2C%20sector)`;

  try {
    const [izRes, gmpRes] = await Promise.allSettled([
      fetchApi(`/api/details?slug=${encodeURIComponent(slug)}`, izFallback),
      fetchApi('/api/gmp', atob(_0x2b))
    ]);

    let izItem = null;
    if (izRes.status === 'fulfilled' && izRes.value && izRes.value.data && izRes.value.data.length > 0) {
      izItem = izRes.value.data[0];
    }

    let matchedGmp = null;
    if (gmpRes.status === 'fulfilled' && gmpRes.value && gmpRes.value.gmpList && izItem) {
      const cleanIzName = izItem.ipo_name.toLowerCase().replace(/ipo/g, '').replace(/[^a-z0-9]/g, '');
      const cleanSlug = slug.toLowerCase().replace(/-/g, '');

      matchedGmp = gmpRes.value.gmpList.find(gmp => {
        const cleanGmpName = gmp.company_short_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanIzName.includes(cleanGmpName) || cleanGmpName.includes(cleanIzName) || cleanSlug.includes(cleanGmpName);
      });
    }

    if (izItem) {
      renderDetails(izItem, matchedGmp);
    } else {
      container.innerHTML = `
        <div class="error-box">
          <h2>IPO Details Not Found</h2>
          <p><a href="index.html">← Return to IPO list</a></p>
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="error-box">Error loading IPO details. Please try again.</div>';
  }
}

function renderDetails(item, gmpData) {
  const container = document.getElementById('detailsContent');

  // Status Formatting
  let statusText = item.status ? item.status.replace(/_/g, ' ') : 'CLOSED';
  let statusClass = 'badge-closed';

  const today = new Date().toISOString().split('T')[0];
  if (item.open_date <= today && item.close_date >= today) {
    statusText = 'OPEN NOW';
    statusClass = 'badge-open';
  } else if (item.open_date > today) {
    statusText = 'UPCOMING (' + statusText + ')';
    statusClass = 'badge-upcoming';
  }

  // Price Calculations
  const priceLow = parseFloat(item.price_band_low) || 0;
  const priceHigh = parseFloat(item.price_band_high) || priceLow;
  const priceText = priceHigh > priceLow ? `₹${priceLow} - ₹${priceHigh}` : `₹${priceLow || '-'}`;

  const lotSize = parseInt(item.lot_size) || 0;
  const minRetailAmt = priceHigh * lotSize;

  // Investment Calculator Logic
  let maxRetailLots = 0;
  let maxRetailShares = 0;
  let maxRetailAmt = 0;
  let minSHniLots = 0, minSHniAmt = 0;
  let minBHniLots = 0, minBHniAmt = 0;

  if (minRetailAmt > 0) {
    maxRetailLots = Math.floor(200000 / minRetailAmt);
    if (maxRetailLots < 1) maxRetailLots = 1;
    maxRetailShares = maxRetailLots * lotSize;
    maxRetailAmt = maxRetailLots * minRetailAmt;

    minSHniLots = maxRetailLots + 1;
    minSHniAmt = minSHniLots * minRetailAmt;

    minBHniLots = Math.ceil(1000000 / minRetailAmt);
    minBHniAmt = minBHniLots * minRetailAmt;
  }

  const ipoName = sanitizeText(item.ipo_name);
  const issuerName = sanitizeText(item.issuers?.name || item.ipo_name);
  const issuerSector = sanitizeText(item.issuers?.sector || gmpData?.company_sector || 'General');
  const summaryText = sanitizeText(item.meta_description);

  // GMP values
  const gmpVal = gmpData?.gmp !== undefined && gmpData?.gmp !== '' ? `₹${gmpData.gmp}` : 'N/A';
  const gmpPerc = parseFloat(gmpData?.gmp_perc) || 0;
  const profitClass = gmpPerc >= 0 ? 'profit-positive' : 'profit-negative';
  const gmpNum = parseFloat(gmpData?.gmp) || 0;
  const estListingPrice = priceHigh > 0 && gmpData?.gmp ? `₹${priceHigh + gmpNum}` : 'N/A';
  const fireRating = gmpData?.gmp_rating_html || '';
  const subscription = gmpData?.subscription || 'N/A';

  // Allotment Link Button
  const allotmentLink = item.allotment_link || gmpData?.allotment_link;

  container.innerHTML = `
    <!-- Top Header -->
    <div class="details-header">
      <div>
        <h1 class="details-title">${ipoName}</h1>
        <p style="color:#7f8c8d; font-size:14px; margin-top:4px;">
          Company: <strong>${issuerName}</strong> | Sector: <strong>${issuerSector}</strong>
        </p>
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span class="badge badge-type">${(item.category || 'MAINBOARD').toUpperCase()}</span>
          <span class="badge ${statusClass}">${statusText}</span>
          ${item.exchange ? `<span class="badge badge-type">Exchange: ${item.exchange}</span>` : ''}
          ${item.nse_symbol ? `<span class="badge badge-type">Symbol: ${item.nse_symbol}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- GMP Highlights Section -->
    <div class="metrics-grid">
      <div class="metric-card" style="background:#e8f8f0; border-color:#abebc6;">
        <span class="metric-label" style="color:#1e8449;">Live Grey Market Premium (GMP)</span>
        <div class="metric-value ${profitClass}" style="font-size:22px;">
          ${gmpVal} ${fireRating}
        </div>
      </div>

      <div class="metric-card" style="background:#eaf2f8; border-color:#aed6f1;">
        <span class="metric-label" style="color:#2874a6;">Est. Profit & Listing Price</span>
        <div class="metric-value ${profitClass}" style="font-size:18px;">
          ${gmpData?.gmp_perc ? '+' + gmpData.gmp_perc + '%' : 'N/A'} <span style="font-size:13px; color:#555;">(Est: ${estListingPrice})</span>
        </div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Live Subscription</span>
        <div class="metric-value">${subscription}</div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Price Band</span>
        <div class="metric-value">${priceText}</div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Lot Size</span>
        <div class="metric-value">${lotSize ? lotSize + ' Shares' : '-'}</div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Total Issue Size</span>
        <div class="metric-value">${item.issue_size_cr ? '₹' + item.issue_size_cr + ' Cr' : '-'}</div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Fresh Issue Size</span>
        <div class="metric-value">${item.fresh_issue_cr ? '₹' + item.fresh_issue_cr + ' Cr' : 'N/A'}</div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Offer for Sale (OFS)</span>
        <div class="metric-value">${item.ofs_cr ? '₹' + item.ofs_cr + ' Cr' : 'N/A'}</div>
      </div>
    </div>

    <!-- Retail & HNI Investment Calculator Table -->
    ${lotSize > 0 ? `
      <div class="timeline-section" style="margin-top:20px;">
        <h3 style="margin-bottom:15px; color:#2c3e50;">💰 Investment & Lot Size Breakdown</h3>
        <table class="simple-table" style="font-size:13px;">
          <thead>
            <tr>
              <th>Application Category</th>
              <th>Lots</th>
              <th>Shares</th>
              <th>Minimum Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Retail (Minimum)</strong></td>
              <td>1 Lot</td>
              <td>${lotSize} Shares</td>
              <td><strong>₹${minRetailAmt.toLocaleString('en-IN')}</strong></td>
            </tr>
            ${maxRetailLots > 1 ? `
              <tr>
                <td><strong>Retail (Maximum)</strong></td>
                <td>${maxRetailLots} Lots</td>
                <td>${maxRetailShares} Shares</td>
                <td>₹${maxRetailAmt.toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
            ${minSHniLots > 0 ? `
              <tr>
                <td><strong>Small HNI (sHNI) Min</strong></td>
                <td>${minSHniLots} Lots</td>
                <td>${minSHniLots * lotSize} Shares</td>
                <td>₹${minSHniAmt.toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
            ${minBHniLots > 0 ? `
              <tr>
                <td><strong>Big HNI (bHNI) Min</strong></td>
                <td>${minBHniLots} Lots</td>
                <td>${minBHniLots * lotSize} Shares</td>
                <td>₹${minBHniAmt.toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Timeline Schedule Table -->
    <div class="timeline-section" style="margin-top:20px;">
      <h3 style="margin-bottom:15px; color:#2c3e50;">📅 IPO Timetable & Important Dates</h3>
      <div class="timeline-grid">
        <div class="timeline-item">
          <span class="timeline-label">DRHP Date</span>
          <span class="timeline-val">${item.drhp_date || '-'}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">RHP Date</span>
          <span class="timeline-val">${item.rhp_date || '-'}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Anchor Offer Date</span>
          <span class="timeline-val">${item.anchor_date || '-'}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Issue Open Date</span>
          <span class="timeline-val">${item.open_date || '-'}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Issue Close Date</span>
          <span class="timeline-val">${item.close_date || '-'}</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-label">Listing Date</span>
          <span class="timeline-val">${item.listing_date || '-'}</span>
        </div>
      </div>
    </div>

    <!-- Share Reservation Table (if available) -->
    ${item.total_shares || item.shares_qib || item.shares_nii || item.shares_rii ? `
      <div class="timeline-section" style="margin-top:20px;">
        <h3 style="margin-bottom:15px; color:#2c3e50;">📊 Share Offer & Category Reservation</h3>
        <table class="simple-table" style="font-size:13px;">
          <thead>
            <tr>
              <th>Investor Category</th>
              <th>Shares Offered</th>
              <th>Allocation %</th>
            </tr>
          </thead>
          <tbody>
            ${item.shares_qib ? `
              <tr>
                <td>QIB (Institutional)</td>
                <td>${Number(item.shares_qib).toLocaleString('en-IN')} Shares</td>
                <td>50.00%</td>
              </tr>
            ` : ''}
            ${item.shares_nii ? `
              <tr>
                <td>NII / HNI (Non-Institutional)</td>
                <td>${Number(item.shares_nii).toLocaleString('en-IN')} Shares</td>
                <td>15.00%</td>
              </tr>
            ` : ''}
            ${item.shares_rii ? `
              <tr>
                <td>RII (Retail Individual)</td>
                <td>${Number(item.shares_rii).toLocaleString('en-IN')} Shares</td>
                <td>35.00%</td>
              </tr>
            ` : ''}
            ${item.total_shares ? `
              <tr style="background:#f8f9fa;">
                <td><strong>Total Shares Offered</strong></td>
                <td><strong>${Number(item.total_shares).toLocaleString('en-IN')} Shares</strong></td>
                <td><strong>100.00%</strong></td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Summary Box -->
    ${summaryText ? `
      <div style="margin-top:20px; background:#f8f9fa; padding:18px; border-radius:8px; font-size:14px; color:#444; border:1px solid #eef2f5; line-height:1.6;">
        <h4 style="margin-bottom:6px; color:#2c3e50;">📝 About & Summary</h4>
        <p>${summaryText.trim()}</p>
      </div>
    ` : ''}

    <!-- Allotment Button -->
    ${allotmentLink ? `
      <div style="margin-top:25px; text-align:center;">
        <a href="${allotmentLink}" target="_blank" class="btn-allotment">
          🔗 Check Official Allotment Status Link
        </a>
      </div>
    ` : ''}
  `;
}
