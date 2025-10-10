import got from "got";
import { HttpsProxyAgent } from "https-proxy-agent";
import crypto from "crypto";
import * as cheerio from "cheerio";

// --- User Agents ---
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
];
const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const buildHeaders = (targetUrl) => ({
  "User-Agent": randomUA(),
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Connection": "keep-alive",
  "Referer": targetUrl
});

async function getProxyList() {
  try {
    const res = await got("https://api.nekolabs.my.id/tools/free-proxy", { responseType: "json", timeout: 10000 });
    const proxies = res.body.result || [];
    return proxies.filter(p => String(p.https).toLowerCase() === "yes");
  } catch (err) {
    console.error("Failed to fetch proxy list:", err.message);
    return [];
  }
}

async function fetchWithProxy(url, options = {}) {
  const proxies = await getProxyList();
  const {
    method = "GET",
    headers = {},
    body = null,
    maxAttemptsPerProxy = 1,
    overallTimeoutMs = 60000
  } = options;
  const start = Date.now();

  if (!proxies.length) {
    console.warn("⚠️ No proxies available, fetching directly...");
    const opts = {
      method,
      headers: { ...buildHeaders(url), ...headers },
      timeout: { request: 5000 }, 
      followRedirect: true,
      retry: 0
    };
    if (body && method !== "GET") opts.body = body;
    return got(url, opts).then(res => res.body);
  }

  const tried = new Set();
  while (tried.size < proxies.length) {
    if (Date.now() - start > overallTimeoutMs) throw new Error("Overall timeout reached");

    // ambil proxy acak yang belum dicoba
    const remaining = proxies.filter(p => !tried.has(`${p.ip}:${p.port}`));
    const p = remaining[Math.floor(Math.random() * remaining.length)];
    tried.add(`${p.ip}:${p.port}`);

    const agent = new HttpsProxyAgent(`http://${p.ip}:${p.port}`);

    try {
      const opts = {
        method,
        headers: { ...buildHeaders(url), ...headers },
        agent: { https: agent, http: agent },
        timeout: { request: 5000 }, // <--- timeout singkat
        followRedirect: true,
        retry: 0
      };
      if (body && method !== "GET") opts.body = body;

      const resp = await got(url, opts);
      console.log(`✅ Success with proxy ${p.ip}:${p.port}`);
      return resp.body;

    } catch (err) {
      console.warn(`⚠️ Skipping proxy ${p.ip}:${p.port}: ${err.message}`);
      // tunggu sebentar sebelum coba proxy lain
      await wait(200);
    }
  }

  throw new Error("All proxies failed or too slow");
}

function base64ToBuffer(b64) { return Buffer.from(b64, "base64"); }
function decryptAES(dataB64, keyB64, ivB64) {
  const key = base64ToBuffer(keyB64);
  const iv = base64ToBuffer(ivB64);
  const encryptedData = base64ToBuffer(dataB64);
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf-8");
}

async function GSMSearch(query) {
  try {
    const url = `https://m.gsmarena.com/resl.php3?sSearch=${encodeURIComponent(query)}`;
    const html = await fetchWithProxy(url, { maxAttemptsPerProxy: 2, overallTimeoutMs: 60000 });
    if (!html) return null;

    const keyMatch = html.match(/const KEY\s*=\s*"([^"]+)"/);
    const ivMatch = html.match(/const IV\s*=\s*"([^"]+)"/);
    const dataMatch = html.match(/const DATA\s*=\s*"([^"]+)"/);
    if (!keyMatch || !ivMatch || !dataMatch) return null;

    const decryptedHTML = decryptAES(dataMatch[1], keyMatch[1], ivMatch[1]);
    const $ = cheerio.load(decryptedHTML);

    const specs = [];
    $("#latest-container .swiper-half-slide a").each((i, el) => {
      specs.push({
        name: $(el).find("strong").text(),
        link: $(el).attr("href"),
        img: $(el).find("img").attr("src")
      });
    });
    return { specs };
  } catch (e) {
    console.error("❌ GSMSearch error:", e.message);
    return null;
  }
}

async function GSMDetail(query) {
  try {
    const data = await GSMSearch(query);
    if (!data || !data.specs.length) return null;
    const url = `https://m.gsmarena.com/${data.specs[0].link}`;
    const html = await fetchWithProxy(url, { maxAttemptsPerProxy: 2, overallTimeoutMs: 60000 });
    if (!html) return null;

    const $ = cheerio.load(html);
    const title = $("h1.section.nobor").text().trim();
    const mainImg = $("#specs-cp-pic img").attr("src");

    const specsQuick = {};
    $(".quick-specs li").each((i, el) => {
      const display = $(el).find("[data-spec='displaysize-hl']").text();
      const resolution = $(el).find("[data-spec='displayres-hl']").text();
      const camera = $(el).find("[data-spec='camerapixels-hl']").text();
      const video = $(el).find("[data-spec='videopixels-hl']").text();
      const ram = $(el).find("[data-spec='ramsize-hl']").text();
      const cpu = $(el).find("[data-spec='chipset-hl']").text();
      const battery = $(el).find("[data-spec='batsize-hl']").text();
      const charging = $(el).find("[data-spec='battype-hl']").text();

      if (display) specsQuick.display = { size: display, resolution };
      if (camera) specsQuick.camera = { mp: camera, video };
      if (ram) specsQuick.ram = ram;
      if (cpu) specsQuick.cpu = cpu;
      if (battery) specsQuick.battery = { capacity: battery, charging };
    });

    const specsBrief = {};
    $(".quick-specs.vote.swiper-slide span.specs-brief-accent").each((i, el) => {
      const text = $(el).text().trim();
      const specName = $(el).find("i").attr("class");
      if (/launched/.test(specName)) specsBrief.released = text;
      if (/mobile2/.test(specName)) specsBrief.body = text;
      if (/os/.test(specName)) specsBrief.os = text;
      if (/sd-card/.test(specName)) specsBrief.storage = text;
    });

    return { title, thumb: mainImg, specsQuick, specsBrief };
  } catch (e) {
    console.error("❌ fetchGSMDetailed error:", e.message);
    return null;
  }
}


export default GSMDetail
