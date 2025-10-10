import got from "got";
import qs from "qs";
import * as cheerio from "cheerio";

async function searchLirik(query) {
  try {
    const payload = qs.stringify({
      query,
      btn_search_submit: ""
    });

    const response = await got.post("https://lirik-lagu.net/search_filter", {
      body: payload,
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://lirik-lagu.net/"
      }
    });

    const $ = cheerio.load(response.body);
    const firstEl = $(".card-body.list_main.text-left").first();

    if (!firstEl.length) return null;

    const title = firstEl.find(".title-list a").text().trim();
    const link = "https://lirik-lagu.net" + firstEl.find(".title-list a").attr("href");
    const artist = firstEl.find(".artis a").first().text().trim();
    const snippet = firstEl.find(".related-post").text().replace(/Read »/g, "").trim();

    return { title, link, artist, snippet };
  } catch (error) {
    console.error("Error fetching lyrics search:", error.message);
    return null;
  }
}

async function lirik(query) {
  const result = await searchLirik(query);
  if (!result) return { status: 404, error: "Lyrics not found" };

  const { title, link, artist } = result;

  try {
    const response = await got.get(link, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        referer: "https://lirik-lagu.net"
      }
    });

    const $ = cheerio.load(response.body);
    let lyrics = $("#lirik_lagu").clone()
      .children("div, script, style").remove().end().text();

    lyrics = lyrics
      .replace(/\r\n|\r/g, "\n")
      .replace(/\n{2,}/g, "\n\n")
      .trim();

    return {
      title,
      artist,
      lyrics
    };
  } catch (error) {
    console.error("Error fetching page:", error.message);
    return { status: 500, error: "Failed to fetch lyrics" };
  }
}

export default lirik