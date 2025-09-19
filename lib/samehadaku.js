import * as cheerio from "cheerio";

const samehadaku = {
  base: "https://v1.samehadaku.how",

  fetchHtml: async function (url, headers = {}) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115 Safari/537.36",
        ...headers,
      },
    });
    const html = await res.text();
    const cookieHeader = res.headers.get("set-cookie") || "";
    const cookie = cookieHeader
      ? cookieHeader.split(",").map(c => c.split(";")[0]).join("; ")
      : "";
    return { html, cookie };
  },

  postForm: async function (url, formObj, cookie = "") {
    const body = new URLSearchParams(formObj).toString();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115 Safari/537.36",
      },
      body,
    });
    return await res.text();
  },

  getLinkVideo: async function (url) {
    try {
      console.log("🔍 Fetching URL:", url);
      const { html, cookie } = await this.fetchHtml(url);

      const $ = cheerio.load(html);
      const servers = [];
      $(".east_player_option").each((i, el) => {
        const post = $(el).attr("data-post");
        const nume = $(el).attr("data-nume");
        const type = $(el).attr("data-type");
        if (post && nume && type)
          servers.push({ label: $(el).text().trim(), post, nume, type });
      });

      const streamResults = [];
      for (let s of servers) {
        const ajaxResp = await this.postForm(`${this.base}/wp-admin/admin-ajax.php`, {
          action: "player_ajax",
          post: s.post,
          nume: s.nume,
          type: s.type,
        }, cookie);

        const match = ajaxResp.match(/<iframe[^>]+src="([^"]+)"/);
        streamResults.push({ quality: s.label, url: match ? match[1] : null });
      }

      const downloads = {};
      $(".download-eps").each((i, el) => {
        const type = $(el).find("p b").text().trim();
        downloads[type] = downloads[type] || {};
        $(el).find("ul li").each((j, li) => {
          const quality = $(li).find("strong").text().trim();
          const urls = [];
          $(li).find("span a").each((k, a) => {
            const url = $(a).attr("href");
            if (url) urls.push(url);
          });
          downloads[type][quality] = urls;
        });
      });

      return { streams: streamResults, downloads: JSON.stringify(downloads, null, 2) };
    } catch (err) {
      console.error("❌ Error:", err.message);
      return { streams: [], downloads: "{}" };
    }
  },

  latest: async function (page = 1) {
    try {
      const url = `${this.base}/anime-terbaru/page/${page}/`;
      const { html } = await this.fetchHtml(url);
      const $ = cheerio.load(html);
      const animeList = [];

      $('li[itemscope][itemtype="http://schema.org/CreativeWork"]').each((i, el) => {
        const title = $(el).find('h2.entry-title a').text().trim();
        const link = $(el).find('h2.entry-title a').attr('href');
        const image = $(el).find('div.thumb img').attr('src');
        const episode = $(el).find('span b:contains("Episode")').next('author').text().trim();
        const author = $(el).find('span.author author').text().trim();
        const released = $(el).find('span:contains("Released on")').text().replace('Released on:', '').trim();

        animeList.push({ title, link, image, episode, author, released });
      });

      return animeList;
    } catch (err) {
      console.error("Error fetching page:", err.message);
      return [];
    }
  },

  search: async function (page = 1, query = '') {
    try {
      const url = `${this.base}/page/${page}/?s=${encodeURIComponent(query)}`;
      const { html } = await this.fetchHtml(url);
      const $ = cheerio.load(html);
      const animeList = [];

      $('article.animpost').each((i, el) => {
        const title = $(el).find('.animposx .title h2').text().trim();
        const link = $(el).find('.animposx a').attr('href');
        const img = $(el).find('.animposx img.anmsa').attr('src');
        const type = $(el).find('.animposx .type').first().text().trim();
        const score = $(el).find('.animposx .score').text().trim();
        const views = $(el).find('.stooltip .metadata span').eq(2).text().trim();

        const genres = [];
        $(el).find('.stooltip .genres a').each((j, g) => {
          genres.push($(g).text().trim());
        });

        const description = $(el).find('.stooltip .ttls').text().trim();
        animeList.push({ title, link, img, type, score, views, genres, description });
      });

      return JSON.stringify(animeList, null, 2);
    } catch (err) {
      console.error("Gagal scrap:", err.message);
      return JSON.stringify([]);
    }
  },

  getTopAnime: async function () {
    try {
      const { html } = await this.fetchHtml(this.base);
      const $ = cheerio.load(html);
      const topAnimes = [];
      $('.topten-animesu ul li').each((i, el) => {
        const aTag = $(el).find('a.series');
        const animeUrl = aTag.attr('href');
        const title = aTag.find('.judul').text().trim();
        const rating = parseFloat(aTag.find('.rating').text().trim());
        const img = aTag.find('img').attr('src');
        const top = aTag.find('.is-topten b').last().text().trim();
        topAnimes.push({ top: Number(top), title, url: animeUrl, rating, img });
      });
      return JSON.stringify(topAnimes, null, 2);
    } catch {
      return JSON.stringify([]);
    }
  },

  jadwalUpdate: async function () {
    try {
      const { html } = await this.fetchHtml(`${this.base}/jadwal-rilis/`);
      const $ = cheerio.load(html);
      const schedule = [];
      $('#the-days ul li .east_days_option').each((i, el) => {
        const dayName = $(el).find('span').text().trim();
        const dayAttr = $(el).attr('data-day');
        const typeAttr = $(el).attr('data-type');
        schedule.push({ day: dayAttr, name: dayName, type: typeAttr, anime: [] });
      });

      for (const item of schedule) {
        try {
          const apiUrl = `${this.base}/wp-json/custom/v1/all-schedule?perpage=20&day=${item.day}&type=${item.type}`;
          const res = await fetch(apiUrl, {
            headers: {
              "Accept": "application/json, text/javascript, */*; q=0.01",
              "X-Requested-With": "XMLHttpRequest",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115 Safari/537.36",
            },
          });
          const data = await res.json();
          item.anime = data.map(anime => ({
            id: anime.id,
            title: anime.title,
            url: anime.url,
            description: anime.content.replace(/<\/?[^>]+(>|$)/g, ""),
            image: anime.featured_img_src,
            genre: anime.genre,
            type: anime.east_type,
            schedule: anime.east_schedule,
            time: anime.east_time,
            score: anime.east_score
          }));
        } catch (err) {
          console.error(`Gagal ambil data anime untuk ${item.day}:`, err.message);
        }
      }
      return JSON.stringify(schedule, null, 2);
    } catch (err) {
      console.error("Error fetching schedule:", err.message);
      return "[]";
    }
  },

  detail: async function (url) {
    try {
      const { html } = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      const img = $(".thumb img.anmsa").attr("src");
      const title = $(".thumb img.anmsa").attr("title");
      const alt = $(".thumb img.anmsa").attr("alt");

      const ratingValue = $(".archiveanime-rating [itemprop='ratingValue']").text();
      const ratingCount = $(".archiveanime-rating [itemprop='ratingCount']").attr("content");

      let description = "";
      $(".desc [itemprop='description'] .html-div").each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 20 && !description.includes(text)) description += text + "\n";
      });
      description = description.trim() || $(".entry-content.entry-content-single p").text().trim();

      const genres = [];
      $(".genre-info a").each((i, el) => genres.push($(el).text().trim()));

      const details = {};
      $(".anime.infoanime .spe span").each((i, el) => {
        const keyEl = $(el).find("b").first();
        if (keyEl.length) {
          const key = keyEl.text().replace(":", "").trim();
          keyEl.remove();
          const value = $(el).text().trim();
          details[key] = value;
        }
      });

      const episodes = [];
      $(".lstepsiode.listeps ul li").each((i, el) => {
        episodes.push({
          number: $(el).find(".epsright .eps a").text().trim(),
          title: $(el).find(".epsleft .lchx a").text().trim(),
          link: $(el).find(".epsleft .lchx a").attr("href"),
          date: $(el).find(".epsleft .date").text().trim()
        });
      });

      return { img, title, alt, ratingValue, ratingCount, description, genres, details, episodes };
    } catch (err) {
      console.error("Error parsing:", err.message);
      return null;
    }
  },

  genre: async function (genre, page = 1) {
    try {
      const url = `${this.base}/genre/${genre}/page/${page}/`;
      const { html } = await this.fetchHtml(url);
      const $ = cheerio.load(html);
      const animeList = [];

      $('.animepost').each((i, el) => {
        const anime = {};
        const animelink = $(el).find('.animposx a');
        const stooltip = $(el).find('.stooltip');

        anime.title = animelink.attr('title') || '';
        anime.url = animelink.attr('href') || '';
        anime.thumbnail = animelink.find('img.anmsa').attr('src') || '';
        anime.type = animelink.find('.type').text().trim() || '';
        anime.score = animelink.find('.score').text().trim() || '';
        anime.status = animelink.find('.data .type').text().trim() || '';
        anime.views = stooltip.find('.metadata span').eq(2).text().trim() || '';
        anime.description = stooltip.find('.ttls').text().trim() || '';
        anime.genres = [];
        stooltip.find('.genres .mta a').each((i, g) => anime.genres.push($(g).text().trim()));

        animeList.push(anime);
      });

      const pageText = $('.pagination span').first().text().trim();
      const match = pageText.match(/Page (\d+) of (\d+)/i);
      const pageNow = match ? parseInt(match[1], 10) : 1;
      const pageEnd = match ? parseInt(match[2], 10) : 1;

      return JSON.stringify({ animeList, pageNow, pageEnd });
    } catch (err) {
      return JSON.stringify({ animeList: [], pageNow: 1, pageEnd: 1 });
    }
  }
};

export default samehadaku;