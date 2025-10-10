import * as cheerio from "cheerio";

class Komiku {
  constructor() {
    this.baseUrl = "https://api.komiku.org";
  }

  async latest() {
    const res = await fetch("https://komiku.org");
    const html = await res.text();
    const $ = cheerio.load(html);
    const array = [];
    $("#Terbaru .ls4w .ls4").each((_, el) => {
      const url = "https://komiku.org/" + $(el).find("a").attr("href");
      const title = $(el).find(".ls4j h3 a").text().trim();
      const release = $(el).find(".ls4j .ls4s").text().trim().split(" ").slice(2).join(" ").trim();
      const chapter = $(el).find(".ls4j .ls24").text().trim().split("Chapter")[1].trim();
      const thumbnail = $(el).find(".lazy").attr("data-src").split("?")[0].trim();
      array.push({ title, release, chapter, thumbnail, url });
    });
    return { status: 200, author: "Yudzxml", data: array };
  }

  async search(q) {
    const res = await fetch(`https://api.komiku.org/?post_type=manga&s=${q}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const array = [];
    $(".bge").each((_, el) => {
      const title = $(el).find(".kan a h3").text().trim();
      const url = "https://komiku.org" + $(el).find(".kan a").attr("href");
      const thumbnail = $(el).find(".bgei img").attr("src").split("?")[0].trim();
      array.push({ title, thumbnail, url });
    });
    return { status: 200, author: "Yudzxml", data: array };
  }

  async populer(page = 1) {
    const url = `${this.baseUrl}/other/hot/page/${page}/`;
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const results = [];
    $(".bge").each((_, el) => {
      const title = $(el).find(".kan h3").text().trim();
      const link = $(el).find(".kan a").attr("href");
      const image = $(el).find(".bgei img").attr("src");
      const genre = $(el).find(".tpe1_inf b").text().trim();
      const genreDetail = $(el).find(".tpe1_inf").text().replace(genre, "").trim();
      const description = $(el).find("p").text().trim();
      const awalChapter = $(el).find(".new1").first().find("a span").last().text().trim();
      const terbaruChapter = $(el).find(".new1").last().find("a span").last().text().trim();
      results.push({
        title,
        link: link?.startsWith("http") ? link : `https://komiku.org${link}`,
        image,
        genre,
        genreDetail,
        description,
        chapter: { awal: awalChapter, terbaru: terbaruChapter },
      });
    });
    return { status: true, author: "Yudzxml", page, results };
  }

  async detail(url) {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $("#Judul h1 span[itemprop='name']").text().trim();
    const title_id = $("#Judul p.j2").text().trim();
    const description = $("#Judul p[itemprop='description']").text().trim();
    const sinopsis_lengkap = $("#Sinopsis p").text().trim();
    const ringkasan = [];
    $("#Sinopsis h3:contains('Ringkasan')")
      .nextUntil("h2, h3")
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text) ringkasan.push(text);
      });
    const image = $("#Informasi img[itemprop='image']").attr("src");
    const infoRaw = {};
    $("#Informasi table.inftable tr").each((_, el) => {
      const key = $(el).find("td").first().text().trim();
      const value = $(el).find("td").last().text().trim();
      infoRaw[key] = value;
    });
    const genres = [];
    $('#Informasi ul.genre li.genre span[itemprop="genre"]').each((_, el) => {
      genres.push($(el).text().trim());
    });
    const baseUrl = new URL(url).origin;
    const chapters = [];
    $("#Daftar_Chapter tbody tr").each((_, el) => {
      const linkEl = $(el).find("td.judulseries a");
      if (linkEl.length > 0) {
        const relativeLink = linkEl.attr("href");
        chapters.push({
          title: linkEl.find("span").text().trim(),
          link: relativeLink.startsWith("http") ? relativeLink : baseUrl + relativeLink,
          views: $(el).find("td.pembaca i").text().trim(),
          date: $(el).find("td.tanggalseries").text().trim(),
        });
      }
    });
    return {
      status: true,
      author: "Yudzxml",
      data: {
        title,
        title_id,
        description,
        sinopsis_lengkap,
        ringkasan,
        image,
        info: {
          jenis: infoRaw["Jenis Komik"] || null,
          konsep: infoRaw["Konsep Cerita"] || null,
          pengarang: infoRaw["Pengarang"] || null,
          status: infoRaw["Status"] || null,
          umur_pembaca: infoRaw["Umur Pembaca"] || null,
          cara_baca: infoRaw["Cara Baca"] || null,
          genres,
        },
        chapters,
      },
    };
  }

  async chapter(url) {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const chapterTitle = $("#Judul h1").text().trim();
    const mangaTitle = $("#Judul p a b").first().text().trim();
    const releaseDate = $('tbody[data-test="informasi"] tr').eq(1).find("td").eq(1).text().trim();
    const readingDirection = $('tbody[data-test="informasi"] tr').eq(2).find("td").eq(1).text().trim();
    const images = [];
    $("#Baca_Komik img[itemprop='image']").each((_, el) => images.push($(el).attr("src")));
    return {
      status: true,
      author: "Yudzxml",
      data: { chapter_title: chapterTitle, manga_title: mangaTitle, release_date: releaseDate, reading_direction: readingDirection, images },
    };
  }

  async searchByGenre(genre = "action", page = 1) {
    const availableGenres = ["action","adult","adventure","comedy","cooking","crime","demons","drama","ecchi","fantasy","game","gender-bender","ghosts","gore","harem","historical","horror","isekai","josei","magic","manga","martial-arts","mature","mecha","medical","military","monsters","music","mystery","one-shot","police","psychological","reincarnation","romance","school","school-life","sci-fi","seinen","shoujo","shoujo-ai","shounen","shounen-ai","slice-of-life","sport","sports","super-power","supernatural","thriller","tragedy","villainess","yuri"];
    if (!availableGenres.includes(genre)) return { status: false, author: "Yudzxml", message: "Genre invalid", genre_provided: genre, available_genres: availableGenres, page, results: [] };
    const res = await fetch(`${this.baseUrl}/genre/${genre}/page/${page}/`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const mangaList = [];
    $(".bge").each((_, el) => {
      const container = $(el);
      const title = container.find(".kan h3").text().trim();
      const link = container.find(".bgei a").attr("href");
      const image = container.find(".bgei img").attr("src");
      const type = container.find(".tpe1_inf b").text().trim();
      const genreText = container.find(".tpe1_inf").contents().filter(function() { return this.type === "text"; }).text().trim();
      const views = container.find(".judul2").text().trim();
      const description = container.find(".kan p").text().trim();
      const chapterAwal = container.find(".new1").first().find("span").last().text().trim();
      const chapterTerbaru = container.find(".new1").last().find("span").last().text().trim();
      mangaList.push({ title, link, image, type, genre: genreText, views, description, chapter_awal: chapterAwal, chapter_terbaru: chapterTerbaru });
    });
    return { status: true, author: "Yudzxml", page, results: mangaList };
  }

  async getKomikuList(tipe = "manga", page = 1) {
    const res = await fetch(`https://api.komiku.org/manga/page/${page}/?tipe=${tipe}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const results = [];
    $(".bge").each((_, el) => {
      const container = $(el);
      const link = container.find(".bgei a").attr("href");
      const image = container.find(".bgei img").attr("src");
      const type = container.find(".tpe1_inf b").text().trim();
      const genre = container.find(".tpe1_inf").text().replace(type, "").trim();
      const title = container.find(".kan h3").text().trim();
      const readersText = container.find(".judul2").text().split("•")[0].trim();
      const lastUpdate = container.find(".judul2").text().split("•")[1]?.trim();
      const description = container.find("p").first().text().trim();
      const chapterStart = { title: container.find(".new1").first().find("span").last().text().trim(), url: "https://komiku.org" + container.find(".new1").first().find("a").attr("href") };
      const chapterLatest = { title: container.find(".new1").last().find("span").last().text().trim(), url: "https://komiku.org" + container.find(".new1").last().find("a").attr("href") };
      results.push({ title, type, genre, image, url: link, readers: readersText, lastUpdate, description, chapterStart, chapterLatest });
    });
    return results;
  }

  async daftarList(tipe = "manga") {
    const res = await fetch(`https://komiku.org/daftar-komik/?tipe=${encodeURIComponent(tipe)}`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const results = [];
    $(".ls4").each((_, el) => {
      const container = $(el);
      const link = container.find(".ls4v a").attr("href");
      const image = container.find(".ls4v img").attr("data-src");
      const title = container.find(".ls4j h4 a").text().trim();
      const spans = container.find(".ls4j .ls4s");
      const category = $(spans[0]).text().trim();
      const status = $(spans[1]).text().replace("Status:", "").trim();
      const genreText = $(spans[2]).text().replace("Genre:", "").trim();
      const genres = genreText.split(",").map(g => g.trim());
      results.push({ title, url: link ? `https://komiku.org${link}` : null, image, category, status, genres });
    });
    return results;
  }

  async topRank() {
    const res = await fetch('https://komiku.org/?halaman-1', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const scrapeSection = (sectionId) => {
      const list = [];
      $(`${sectionId} .ls12 article.ls2`).each((i, el) => {
        const title = $(el).find('.ls2j h3 a').text().trim();
        const genre = $(el).find('.ls2j .ls2t').text().trim();
        const chapter = $(el).find('.ls2j .ls2l').text().trim();
        const link = 'https://komiku.org' + $(el).find('.ls2j h3 a').attr('href');
        const img = $(el).find('.ls2v img').attr('data-src');
        list.push({ title, genre, chapter, link, img });
      });
      return list;
    };

    const peringkatKomiku = scrapeSection('#Rekomendasi_Komik');
    const mangaPopuler = scrapeSection('#Komik_Hot_Manga');
    const manhwaPopuler = scrapeSection('#Komik_Hot_Manhwa');

    return { peringkatKomiku, mangaPopuler, manhwaPopuler };
  }

  async rekomendasi() {
    const res = await fetch("https://komiku.org/?halaman-2");
    const html = await res.text();
    const $ = cheerio.load(html);
    const result = {};

    $(".mirip1").each((i, section) => {
      const category = $(section).find("h3").first().text().trim();
      if (!category) return;
      result[category] = [];

      $(section).find(".ls5b").each((_, el) => {
        const a = $(el).find("a");
        const name = $(el).find("h4").text().trim();
        const link = a.attr("href") ? "https://komiku.org" + a.attr("href") : null;
        const img = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
        const info = $(el).find("span").text().trim() || "";
        result[category].push({ name, link, img, info });
      });

      $(section).find("article.ls5").each((_, el) => {
        const a = $(el).find("a");
        const name = $(el).find("h4").text().trim();
        const link = a.attr("href") ? "https://komiku.org" + a.attr("href") : null;
        const img = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
        result[category].push({ name, link, img });
      });
    });

    return result;
  }
}

export default new Komiku();