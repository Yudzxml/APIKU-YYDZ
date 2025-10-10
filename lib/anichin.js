import * as cheerio from "cheerio";

const anichin = {
  rekomendasi: async () => {
    try {
      const res = await fetch("https://anichin.watch/");
      if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const animeList = [];

      $(".swiper-slide.item").each((i, el) => {
        const backdropStyle = $(el).find(".backdrop").attr("style") || "";
        const imageMatch = backdropStyle.match(/url\('(.+?)'\)/);
        const image = imageMatch ? imageMatch[1] : null;
        const watchLink = $(el).find("a.watch").attr("href") || null;
        const titleEl = $(el).find("h2 a");
        const title = titleEl.text().trim() || null;
        const jtitle = titleEl.attr("data-jtitle") || null;

        let description = $(el).find("p").first().text().trim() || null;
        if (!description) description = $(el).text().trim().split("…")[0];

        animeList.push({ title, jtitle, watchLink, image, description });
      });

      return animeList;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  popularToday: async () => {
    try {
      const res = await fetch("https://anichin.watch/");
      if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const popularList = [];

      $("div.releases.hothome + div.listupd.normal article.bs").each((i, el) => {
        const aTag = $(el).find("a.tip");
        const ttDiv = aTag.find(".tt");

        popularList.push({
          title: ttDiv.contents().first().text().trim() || null,
          episodeTitle: ttDiv.find("h2[itemprop='headline']").text().trim() || null,
          watchLink: aTag.attr("href") || null,
          image: aTag.find("img").attr("src") || null,
          type: aTag.find(".typez").text().trim() || null,
          episode: aTag.find(".bt .epx").text().trim() || null,
          subOrDub: aTag.find(".bt .sb").text().trim() || null
        });
      });

      return popularList;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  search: async (query) => {
    try {
      const url = `https://anichin.watch/?s=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const results = [];

      $(".listupd article.bs").each((_, el) => {
        const anchor = $(el).find("a");
        const title = anchor.attr("title")?.trim();
        const link = anchor.attr("href");
        const image = $(el).find("img").attr("src");
        const type = $(el).find(".typez").text().trim();
        const status =
          $(el).find(".epx").text().trim() || $(el).find(".status").text().trim();

        results.push({ title, link, image, type, status });
      });

      return results;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  latestRelease: async () => {
    try {
      const res = await fetch("https://anichin.watch/");
      if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const latest = [];

      $(".listupd .bs").each((i, el) => {
        const elSel = $(el).find(".bsx a");
        const title = elSel.attr("title");
        const url = elSel.attr("href");
        const episode = elSel.find(".bt .epx").text();
        const sub = elSel.find(".bt .sb").text();
        const type = elSel.find(".typez").text();
        const img = elSel.find("img").attr("src");

        latest.push({ title, url, episode, sub, type, img });
      });

      return latest;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  detail: async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);

      const title = $("h1.entry-title").text().trim() || null;
      const episode = $("meta[itemprop='episodeNumber']").attr("content") || null;
      const released =
        $("span.updated").text().trim() ||
        $("span.year").text().match(/\w+ \d{1,2}, \d{4}/)?.[0] ||
        null;
      const authorTag = $("span.vcard.author a").first();
      const author = authorTag.text().trim() || null;
      const seriesTag =
        $("span.year a").last().length > 0
          ? $("span.year a").last()
          : $("a[href*='series']").first();
      const series = seriesTag.text().trim() || null;
      const mainVideo = $(".player-embed iframe").attr("src") || null;

      const mirrors = [];
      $("select.mirror option").each((i, el) => {
        let encoded = $(el).attr("value");
        const mirrorName = $(el).text().trim();
        let mirrorUrl = null;
        if (encoded) {
          try {
            const isBase64 = /^[A-Za-z0-9+/=]+$/.test(encoded);
            if (isBase64) {
              const decodedHtml = Buffer.from(encoded, "base64").toString("utf-8");
              const $iframe = cheerio.load(decodedHtml);
              mirrorUrl = $iframe("iframe").attr("src") || null;
            } else {
              mirrorUrl = encoded;
            }
            if (mirrorUrl) {
              mirrors.push({
                name: mirrorName,
                url: encodeURI(mirrorUrl.startsWith("http") ? mirrorUrl : `https:${mirrorUrl}`)
              });
            }
          } catch (e) {}
        }
      });

      const image = $(".single-info .thumb img").attr("src") || null;
      const animeTitle = $(".single-info .infox h2[itemprop='partOfSeries']").text().trim() || null;
      const altTitle = $(".single-info .infox .alter").text().trim() || null;
      const rating = $(".single-info .rating strong").text().replace("Rating", "").trim() || null;

      const details = {};
      $(".single-info .info-content .spe span").each((i, el) => {
        const text = $(el).text().trim();
        const [key, val] = text.split(":").map(t => t.trim());
        if (key && val) {
          details[key.replace(/\s+/g, "_").toLowerCase()] = val;
        }
      });

      const genres = [];
      $(".single-info .genxed a").each((i, el) => {
        genres.push($(el).text().trim());
      });

      const description = $(".single-info .desc.mindes").text().trim() || null;

      const sidebarEpisodes = [];
      $('#sidebar #singlepisode .episodelist li').each((i, el) => {
        const epLink = $(el).find('a').attr('href');
        const epTitle = $(el).find('.playinfo h3').text().trim();
        const epDate = $(el).find('.playinfo span').text().trim();
        const epThumb = $(el).find('.thumbnel img').attr('src');

        sidebarEpisodes.push({
          title: epTitle,
          link: epLink,
          date: epDate,
          thumbnail: epThumb
        });
      });

      return {
        title,
        episode,
        released,
        author,
        series,
        mainVideo,
        mirrors,
        anime: {
          animeTitle,
          altTitle,
          image,
          rating,
          ...details,
          genres,
          description
        },
        sidebarEpisodes
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }
};

export default anichin
