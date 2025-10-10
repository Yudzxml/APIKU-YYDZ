import got from "got";
import { HttpsProxyAgent } from "https-proxy-agent";
import crypto from "crypto";
import * as cheerio from "cheerio";

async function getSource(url, proxy = null) {
  if (!url) throw new Error("url diperlukan");
  try {
    const response = await got.post('https://proxy.yydz.biz.id/source', {
      json: { url, proxy },
      responseType: 'json'
    });
    const data = response.body;
    if (!data.success) throw new Error(data.error || "Gagal mengambil source");
    return data.html;
  } catch (err) {
    throw new Error(err.message || "Gagal mengambil source");
  }
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
    const html = await getSource(url);
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
    const html = await getSource(url);
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
