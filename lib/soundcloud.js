import * as cheerio from "cheerio";
import qs from "qs";
import tough from "tough-cookie";

async function soundcloud(action, input) {
  try {
    // --- Ambil Cookies
    async function getCookies() {
      const base = 'https://www.klickaud.org/en';
      const cookieJar = new tough.CookieJar();

      await fetch(base, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });

      return await cookieJar.getCookieString(base);
    }

    // --- Ambil CSRF Token
    async function getCsrfToken() {
      const cookies = await getCookies();
      const res = await fetch('https://www.klickaud.org/csrf-token-endpoint.php', {
        headers: {
          'accept': '*/*',
          'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
          'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
          'Cookie': cookies,
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'referer': 'https://www.klickaud.org/en'
        }
      });

      const data = await res.json();
      return { csrfToken: data.csrf_token, cookies };
    }

    // --- Mode Download
    async function scDownload(trackUrl) {
      const { csrfToken, cookies } = await getCsrfToken();
      const body = qs.stringify({ value: trackUrl, csrf_token: csrfToken });

      const res = await fetch('https://www.klickaud.org/download.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies,
          'Referer': 'https://www.klickaud.org/en',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        body
      });

      const html = await res.text();
      const $ = cheerio.load(html);
      const dlDiv = $("#dlMP3");

      if (!dlDiv || dlDiv.length === 0) throw new Error("Tidak menemukan elemen download.");

      const encodedUrl = dlDiv.attr("data-src");
      const downloadUrl = Buffer.from(encodedUrl, "base64").toString("utf-8");
      const filename = dlDiv.attr("data-name");

      return { downloadUrl, filename };
    }

    // --- Mode Search
    async function scSearch(query) {
      const res = await fetch(`https://proxy.searchsoundcloud.com/tracks?q=${encodeURIComponent(query)}`, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
          'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site'
        },
        referrer: 'https://searchsoundcloud.com/',
        referrerPolicy: 'strict-origin-when-cross-origin'
      });

      const json = await res.json();
      return json.collection.map(track => ({
        title: track.title,
        link: track.permalink_url,
        artwork: track.artwork_url,
        duration: track.duration,
        genre: track.genre,
        streamable: track.streamable
      }));
    }

    // --- Dispatcher
    if (action === "download") {
      return await scDownload(input);
    } else if (action === "search") {
      return await scSearch(input);
    } else {
      throw new Error("Action tidak valid. Gunakan 'search' atau 'download'.");
    }

  } catch (err) {
    return { error: err.message };
  }
}

export default soundcloud;