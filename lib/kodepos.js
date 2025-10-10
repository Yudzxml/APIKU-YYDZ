import got from "got";
import * as cheerio from "cheerio";

async function kodepos(kodepos) {
  try {
    if (!kodepos) {
      throw new Error("Parameter 'kodepos' wajib diisi.");
    }
    const initRes = await got("https://kodepos.posindonesia.co.id/", {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; CPH2209) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
      },
    });

    const cookies = initRes.headers["set-cookie"]
      ?.map((c) => c.split(";")[0])
      .join("; ") || "";
    const response = await got.post("https://kodepos.posindonesia.co.id/CariKodepos", {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        "pragma": "no-cache",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "cookie": cookies,
        "referer": "https://kodepos.posindonesia.co.id/",
        "referrer-policy": "strict-origin-when-cross-origin",
      },
      body: `kodepos=${encodeURIComponent(kodepos)}`,
      timeout: { request: 10000 },
    });

    // 3️⃣ Parsing hasil HTML
    const html = response.body;
    const $ = cheerio.load(html);
    const results = [];

    $("#list-data tbody tr").each((i, el) => {
      const tds = $(el).find("td");
      if (tds.length >= 6) {
        results.push({
          no: $(tds[0]).text().trim(),
          kodepos: $(tds[1]).text().trim(),
          kelurahan: $(tds[2]).text().trim(),
          kecamatan: $(tds[3]).text().trim(),
          kota: $(tds[4]).text().trim(),
          provinsi: $(tds[5]).text().trim(),
        });
      }
    });

    return results;
  } catch (err) {
    return [];
  }
}

export default kodepos;