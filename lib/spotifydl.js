import { fetch } from "undici";
import * as cheerio from "cheerio";

async function getSpotifyNonce() {
  try {
    const res = await fetch("https://spotify.downloaderize.com/", {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Linux; Android 10) Chrome/139.0.0.0 Mobile Safari/537.36"
      }
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    const scriptText = $("#spotify-downloader-js-js-extra").html();
    if (!scriptText) throw new Error("Tidak ditemukan script nonce di halaman.");
    const nonceMatch = scriptText.match(/"nonce":"([a-zA-Z0-9]+)"/);
    if (!nonceMatch) throw new Error("Nonce tidak ditemukan dalam script.");
    return nonceMatch[1];
  } catch (err) {
    console.error("Gagal mengambil nonce:", err.message);
    return null;
  }
}


async function spodl(url) {
  try {
    if (!url) throw new Error("Parameter 'url' wajib diisi.");
    const nonce = await getSpotifyNonce()
    const response = await fetch("https://spotify.downloaderize.com/wp-admin/admin-ajax.php", {
      method: "POST",
      headers: {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "Referer": "https://spotify.downloaderize.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: new URLSearchParams({
        action: "spotify_downloader_get_info",
        url: url,
        nonce: nonce
      }).toString(),
    });

    if (!response.ok) throw new Error(`Gagal mengambil data: ${response.status}`);
    const data = await response.json();
    return data;

  } catch (err) {
    console.error("Terjadi kesalahan:", err.message);
    return { error: err.message };
  }
}


export default spodl