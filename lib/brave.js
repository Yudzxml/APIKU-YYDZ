import * as cheerio from "cheerio";

function parseSearchResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  $("#results .snippet").each((i, el) => {
    const $el = $(el);

    const link = $el.find("a").attr("href") || null;

    const title = $el.find(".title").text().trim() || null;

    const description = $el.find(".snippet-description").text().trim() || null;

    const domain = $el.find(".netloc").text().trim() || null;

    const favicon = $el.find(".favicon").attr("src") || null;

    if (title && link) {
      results.push({
        title,
        link,
        description,
        domain,
        thumb: favicon
      });
    }
  });

  return results;
}

async function brave(query) {
  try {
    const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "upgrade-insecure-requests": "1"
      },
      referrerPolicy: "strict-origin-when-cross-origin"
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const html = await response.text();
    return await parseSearchResults(html)
  } catch (err) {
    console.error(err.message);
    return null;
  }
}

export default brave
