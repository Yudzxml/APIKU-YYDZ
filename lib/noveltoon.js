import { fetch, Headers } from "undici";
import { v4 as uuidv4 } from "uuid";
import * as cheerio from "cheerio";

async function parseMangaToon(html) {
  const $ = cheerio.load(html);
  let result = {};
  function parseCategory(categorySelector) {
    const category = {};
    const topLine = $(`${categorySelector} .top-line`);
    category.title = topLine.find('.type-title').text().trim();
    const countText = topLine.find('.result-count').text().trim();
    const countMatch = countText.match(/(\d+)/);
    category.count = countMatch ? parseInt(countMatch[1], 10) : 0;

    category.items = [];

    $(`${categorySelector} .recommend-item`).each((i, el) => {
      const item = $(el);
      const link = item.find('a').attr('href')?.trim();
      const img = item.find('img').attr('data-src')?.trim();
      const title = item.find('.recommend-comics-title span').text().trim();
      const type = item.find('.comics-type span').text().trim();

      category.items.push({ title, link, img, type });
    });
    return category;
  }
  const novelCategory = parseCategory('.novel-result');
  result = novelCategory;
  return result;
}

async function parseNovelHtml(html) {
    const $ = cheerio.load(html);

    // Info utama
    const title = $(".detail-title").text().trim();
    const authors = $(".detail-author.web-author")
        .map((i, el) => $(el).text().replace(/^Nama Author: /, "").trim())
        .get();
    const genreText = $(".detail-author.web-author")
        .filter((i, el) => $(el).text().includes("Genre"))
        .text()
        .replace("Genre: ", "")
        .trim();
    const description = $(".detail-desc-info").text().trim();
    const cover = $(".detail-top-right img").attr("src");
    const rating = parseFloat($(".detail-score span").first().text().trim());
    const likes = parseInt($(".detail-like-info span").eq(1).text().trim().replace(/K/, "000"));
    const favorites = parseInt($(".detail-like-info span").eq(3).text().trim());

    // Link
    const startEpisodeLink = $(".detail-top-btn-box .detail-top-btn a").attr("href");
    const pdfLink = $(".download-pdf-btn").attr("href");

    // Tags
    const tags = $(".detail-tag-item a span")
        .map((i, el) => $(el).text().trim())
        .get();

    // Episodes
    const episodes = $(".episodes-info-a-item").map((i, el) => {
        const episodeNum = $(el).find(".episode-item-num").text().trim();
        const episodeTitle = $(el).find(".episode-item-title").text().trim();
        const episodeLink = $(el).attr("href");
        const isFee = $(el).find(".lock-episodes").length > 0 || $(el).find(".lock-icon").css("display") !== "none";

        return {
            number: episodeNum,
            title: episodeTitle,
            link: episodeLink,
            isFee
        };
    }).get();

    return {
        title,
        authors,
        genre: genreText,
        description,
        cover,
        rating,
        likes,
        favorites,
        startEpisodeLink,
        pdfLink,
        tags,
        episodes
    };
}

function getCookieValue(cookieStr, name) {
  const match = cookieStr.match(new RegExp('(^|; )' + name + '=([^;]*)'));
  return match ? match[2] : null;
}

function generateCookies(existingCookies = '') {
  let phpsessid = getCookieValue(existingCookies, 'PHPSESSID');
  if (!phpsessid) phpsessid = uuidv4().replace(/-/g, '').slice(0, 26);

  let udid = getCookieValue(existingCookies, 'mangatoon:udid');
  if (!udid) udid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random()*16|0, v = c==='x'? r : (r&0x3|0x8);
    return v.toString(16);
  });

  let toonGala = getCookieValue(existingCookies, 'toon_gala_pop_ads') || '1';
  let btnPublish = getCookieValue(existingCookies, 'btn_publish_status') || '1';
  let mangatoonComicsPopup = getCookieValue(existingCookies, 'mangatoon_comics_popups') || '';

  return `MANGATOON_LANGUAGE=id; PHPSESSID=${phpsessid}; btn_publish_status=${btnPublish}; mangatoon:udid=${udid}; toon_gala_pop_ads=${toonGala}; mangatoon_comics_popups=${mangatoonComicsPopup}`;
}

async function reportRobotCheck() {
  const url = 'https://mangatoon.mobi/h5/web/robotCheckCounter';
  try {
    await fetch(url, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      }),
      body: new URLSearchParams({ page_action_name: 'search' })
    });
  } catch {}
}

async function searchMangatoon(query) {
  await reportRobotCheck(); 
  const url = `https://mangatoon.mobi/id/search?word=${encodeURIComponent(query)}`;
  const cookies = generateCookies();

  const headers = new Headers({
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": cookies,
    "Referer": "https://mangatoon.mobi/id/search",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });

  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const html = await response.text();
  return parseMangaToon(html)
}
async function fetchNovelDetail(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "max-age=0",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "cross-site",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "Referer": "https://mangatoon.mobi/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });

    const html = await res.text();
    return await parseNovelHtml(html)
  } catch (err) {
    console.error("Failed to fetch or parse novel detail:", err);
    return null;
  }
}

const noveltoon = async function(query) {
  if (/^https?:\/\//i.test(query)) {
    return await fetchNovelDetail(query);
  } else {
    return await searchMangatoon(query);
  }
};

export default noveltoon
