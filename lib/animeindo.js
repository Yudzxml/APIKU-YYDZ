import * as cheerio from "cheerio";
import { fetch } from "undici";

const BASE_URL = "https://anime-indo.lol";
function absoluteUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : BASE_URL + url;
}

function PARSE_HOME(html) {
  const $ = cheerio.load(html);

  // --- Update Terbaru ---
  const updateTerbaru = [];
  $(".ngiri .menu a").each((i, el) => {
    const link = absoluteUrl($(el).attr("href"));
    const img =
      $(el).find("img").attr("data-original") ||
      $(el).find("img").attr("src");

    const title = $(el).find("p").text().trim();
    const eps = $(el).find(".eps").text().trim();

    updateTerbaru.push({
      title,
      eps,
      link,
      image: absoluteUrl(img),
    });
  });

  // --- Popular ---
  const popular = [];
  $(".nganan .ztable").each((i, el) => {
    const link = absoluteUrl($(el).find("td.zvidesc a").attr("href"));
    const title = $(el).find("td.zvidesc a").text().trim();
    const image = absoluteUrl($(el).find("td.zvithumb img").attr("src"));

    // ambil teks selain judul link
    const genres = $(el)
      .find("td.zvidesc")
      .clone()
      .children("a")
      .remove()
      .end()
      .text()
      .trim();

    popular.push({
      title,
      link,
      image,
      genres,
    });
  });

  return {
    latest: updateTerbaru,
    popular,
  };
}
function PARSE_DETAIL(html) {
  const $ = cheerio.load(html);

  // --- Detail Anime ---
  const title = $(".ngirix h1.title").text().trim();
  const img = absoluteUrl($(".ngirix .detail img").attr("src"));
  const altTitle = $(".ngirix .detail h2").text().trim();

  const genres = [];
  $(".ngirix .detail li a").each((i, el) => {
    genres.push({
      name: $(el).text().trim(),
      url: absoluteUrl($(el).attr("href")),
    });
  });

  const description = $(".ngirix .detail p").text().trim();

  // --- Episode List ---
  const episodes = [];
  $(".menu .ep a").each((i, el) => {
    episodes.push({
      episode: $(el).text().trim(),
      url: absoluteUrl($(el).attr("href")),
    });
  });

  return {
    title,
    altTitle,
    img,
    genres,
    description,
    episodes,
  };
}
function PARSE_GENRE(html) {
  const $ = cheerio.load(html);
  const data = [];

  $(".ngiri .menu table.otable").each((i, el) => {
    const row = $(el);

    const link = row.find("td.vithumb a").attr("href");
    const img = row.find("td.vithumb img").attr("src");

    const title = row.find("td.videsc a").first().text().trim();

    // ambil semua <span class="label">
    const labels = row.find("td.videsc .label").map((i, span) => $(span).text().trim()).get();

    const type = labels[0] || null;
    const status = labels[1] || null;
    const year = labels[2] || null;

    const description = row.find("td.videsc p.des").text().trim();

    data.push({
      title,
      link: absoluteUrl(link),
      img: absoluteUrl(img),
      type,
      status,
      year,
      description,
    });
  });

  return data;
}
function PARSE_SEARCH(html) {
  const $ = cheerio.load(html);
  const results = [];

  $("table.otable").each((i, el) => {
    const row = $(el);

    const link = row.find(".videsc a").first().attr("href");
    const title = row.find(".videsc a").first().text().trim();
    const img = row.find(".vithumb img").attr("src");
    const labels = row.find(".videsc .label").map((i, el) => $(el).text().trim()).get();
    const description = row.find(".videsc p.des").text().trim();

    results.push({
      title,
      link: absoluteUrl(link) || null,
      img: absoluteUrl(img) || null,
      type: labels[0] || null,
      duration: labels[1] || null,
      year: labels[2] || null,
      description,
    });
  });

  return results;
}
function PARSE_STREAM(html) {
  const $ = cheerio.load(html);

  const title = $(".ngiri h1.title").text().trim();
  const thumbnail = absoluteUrl($(".detail img").attr("src"));
  const synopsis = $(".detail p").text().trim();

  // Ambil server list
  const servers = [];
  $(".servers a.server").each((i, el) => {
    servers.push({
      name: $(el).text().trim(),
      video: absoluteUrl($(el).attr("data-video")),
    });
  });

  // Ambil link download
  const downloads = [];
  $(".nav .navi a[target=_blank]").each((i, el) => {
    downloads.push({
      name: $(el).text().trim(),
      url: absoluteUrl($(el).attr("href")),
    });
  });

  return {
    title,
    thumbnail,
    synopsis,
    servers,
    downloads,
  };
}


async function home(page = 1) {
  try {
    const response = await fetch(`${BASE_URL}/page/${page}/`, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "max-age=0",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
       // "cookie": ""
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const html = await response.text(); 
    return await PARSE_HOME(html);

  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

async function detail(url) {
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
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "Referer": "https://anime-indo.lol/page/1/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      method: "GET"
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const html = await res.text();
    return await PARSE_DETAIL(html);
  } catch (err) {
    console.error("Fetch gagal:", err);
    return null;
  }
}

async function genre(type, page = 1) {
  try {
  const validGenres = [
  'action',           'adventrue',       'adventure',     'anthropomorphic',
  'avant-garde',      'cars',            'cgdct',         'childcare',
  'comdey',           'comedy',          'crossdressing', 'delinquents',
  'dementia',         'demons',          'detective',     'donghua',
  'drama',            'ecchi',           'echhi',         'educational',
  'erotica',          'family',          'fantasy',       'gag-humor',
  'game',             'girls-love',      'gore',          'gourmet',
  'harem',            'historical',      'horror',        'idols-female',
  'idols-male',       'isekai',          'josei',         'kids',
  'life',             'live-action',     'love-polygon',  'love-status-quo',
  'magic',            'mahou-shoujo',    'martial-arts',  'mecha',
  'medical',          'military',        'music',         'mystery',
  'mythology',        'organized-crime', 'otaku-culture', 'parody',
  'performing-arts',  'pets',            'police',        'psychological',
  'racing',           'reincarnation',   'reverse-harem', 'romance',
  'romantic-subtext', 'samurai',         'school',        'sci-fi',
  'seinen',           'shoujo',          'shoujo-ai',     'shounen',
  'shounen-ai',       'showbiz',         'slice-of-life', 'space',
  'sports',           'strategy-game',   'super-power',   'supernatural',
  'survival',         'suspense',        'team-sports',   'thriller',
  'time-travel',      'tokusatsu',       'urban-fantasy', 'vampire',
  'video-game',       'villainess',      'work-life',     'workplace',
  'yaoi'
]

    if (!validGenres.includes(type)) {
      return { message: `Invalid Genre: '${type}' not found in validGenres` };
    }
  const res = await fetch(`${BASE_URL}/genres/${type}/` + `page/${page}/`, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "upgrade-insecure-requests": "1",
    },
    method: "GET"
  });

  const html = await res.text();
  return await PARSE_GENRE(html)
} catch (e) {
  console.log("ERROR GENRE: " + e)
  return {
    message: 'Invalid Parameter Atau Url nya Path nya salah wajib pakai hasil dari search jangan di hapus hapus'
  }
 }
}

async function search(query) {
  try {
    const res = await fetch(BASE_URL + `/search/${query}/`, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "Referer": `https://anime-indo.lol/search/${query}/`,
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      method: "GET"
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const html = await res.text();
    return await PARSE_SEARCH(html)
  } catch (err) {
    console.error("Gagal fetch:", err);
  }
}

async function stream(url) {
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
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET"
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    const html = await res.text();
    return await PARSE_STREAM(html); 
  } catch (err) {
    console.error("Error fetch episode:", err);
    return null;
  }
}

const animeindo = {
  home: home,
  detail: detail,
  genre: genre,
  search: search,
  stream: stream
}

export default animeindo





