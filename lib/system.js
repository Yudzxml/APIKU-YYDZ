import got from 'got';
import { performance } from 'perf_hooks';

const SETTINGS_URL = 'https://raw.githubusercontent.com/Yudzxml/APIKU-YYDZ/refs/heads/main/public/settings.json';

async function fetchAndCountEndpoints() {
  let totalEndpoints = 0;
  let totalCategory = 0;

  try {
    const response = await fetch(SETTINGS_URL, { method: 'GET', timeout: 10000 });
    const text = await response.text(); // ambil sebagai plain text
    let data;
    try {
      data = JSON.parse(text); // parse manual
    } catch (err) {
      console.error('JSON parse error:', err.message);
      data = {};
    }

    if (data && data.categories && Array.isArray(data.categories)) {
      totalCategory = data.categories.length;
      totalEndpoints = data.categories.reduce(
        (sum, cat) => sum + (cat.items && Array.isArray(cat.items) ? cat.items.length : 0),
        0
      );
    } else {
      console.warn('categories tidak ditemukan atau bukan array');
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }

  return { totalEndpoints, totalCategory };
}

async function runSpeedTest() {
  const startTime = performance.now();
  let uploadSpeed = 0;
  let ping = 0;
  let networkInfo = { location: 'N/A', org: 'N/A' };

  // Upload speed test
  try {
    const url = 'https://speed.cloudflare.com/__up';
    const data = '0'.repeat(10 * 1024 * 1024); // 10 MB
    const res = await got.post(url, {
      body: data,
      headers: { 'Content-Length': data.length },
      timeout: { request: 30000 }
    });
    const duration = (performance.now() - startTime) / 1000;
    if (res.statusCode === 200) uploadSpeed = data.length / (duration || 1);
  } catch {
    uploadSpeed = 0;
  }

  // Ping test
  try {
    const startPing = performance.now();
    await got('https://www.google.com', { timeout: { request: 10000 } });
    ping = Math.round(performance.now() - startPing);
  } catch {
    ping = 0;
  }

  // Network info
  try {
    const res = await got('https://ipinfo.io/json', { responseType: 'json', timeout: { request: 10000 } });
    const data = res.body;
    networkInfo.location = `${data.city || 'N/A'}, ${data.country || 'N/A'}`;
    networkInfo.org = (data.org || 'N/A').replace('AS', '');
  } catch {
    networkInfo = { location: 'N/A', org: 'N/A' };
  }

  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec) return '0 Mbps';
    const mbits = (bytesPerSec * 8) / (1024 * 1024);
    return mbits >= 1 ? `${mbits.toFixed(1)} Mbps` : `${(mbits * 1000).toFixed(1)} Kbps`;
  };

  const endpointsInfo = await fetchAndCountEndpoints();

  return {
    ...endpointsInfo,
    upload: formatSpeed(uploadSpeed),
    ping: `${ping} ms`,
    server: networkInfo.location,
    provider: networkInfo.org,
    duration: `${((performance.now() - startTime) / 1000).toFixed(1)} sec`,
    time: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '')
  };
}

export default runSpeedTest;