import got from "got";
import * as cheerio from "cheerio";

const komikindo = {
  populer: async () => {
    try {
      const data = await got('https://komikindo.dev/').text();
      const $ = cheerio.load(data);
      const popularKomikList = [];

      $('.sencs .serieslist.pop li').each((index, element) => {
        const title = $(element).find('h4 a.series').text().trim();
        const url = $(element).find('h4 a.series').attr('href');
        const image = $(element).find('img[itemprop="image"]').attr('src');
        const author = $(element).find('.author').text().trim();
        const rating = $(element).find('.loveviews').text().trim();

        popularKomikList.push({ title, url, image, author, rating });
      });

      return popularKomikList;
    } catch (error) {
      console.error("Error:", error.message);
      return { success: false, message: error.message };
    }
  },

  search: async (query) => {
    try {
      const data = await got(`https://komikindo.dev/?s=${encodeURIComponent(query)}`).text();
      const $ = cheerio.load(data);
      const komikList = [];

      $('.film-list .animepost').each((index, element) => {
        const title = $(element).find('.tt h4').text().trim();
        const url = $(element).find('a[itemprop="url"]').attr('href');
        const image = $(element).find('img[itemprop="image"]').attr('src');
        const rating = $(element).find('.rating i').text().trim();

        komikList.push({ title, url, image, rating });
      });

      return komikList;
    } catch (error) {
      console.error("Error:", error.message);
      return { success: false, message: error.message };
    }
  },

  detail: async (url) => {
    try {
      const data = await got(url).text();
      const $ = cheerio.load(data);

      const result = {
        judul: $('div.spe span').eq(0).text().replace('Judul Alternatif:', '').trim(),
        status: $('div.spe span').eq(1).text().replace('Status:', '').trim(),
        pengarang: $('div.spe span').eq(2).text().replace('Pengarang:', '').trim(),
        ilustrator: $('div.spe span').eq(3).text().replace('Ilustrator:', '').trim(),
        grafis: $('div.spe span').eq(4).text().replace('Grafis:', '').trim(),
        tema: $('div.spe span').eq(5).text().replace('Tema:', '').trim(),
        jenis: $('div.spe span').eq(6).text().replace('Jenis Komik:', '').trim(),
        link: $('div.epsbr.chapter-awal a').attr('href'),
        sinopsis: $('div.entry-content.entry-content-single').text().trim().replace(/\s+/g, ' '),
        official: [],
        informasi: [],
        genre: [],
        spoiler: [],
        chapters: []
      };

      $('div.spe span').eq(7).find('.informan .person').each((i, elem) => {
        const name = $(elem).find('.name a').text().trim();
        const link = $(elem).find('.name a').attr('href');
        if (name && link) result.official.push({ name, link });
      });

      $('div.spe span').eq(8).find('.informan .person').each((i, elem) => {
        const name = $(elem).find('.name a').text().trim();
        const link = $(elem).find('.name a').attr('href');
        if (name && link) result.informasi.push({ name, link });
      });

      $('.genre-info a').each((i, elem) => {
        const genreName = $(elem).text();
        const genreLink = $(elem).attr('href');
        result.genre.push({ name: genreName, link: 'https://komikindo.dev' + genreLink });
      });

      $('.spoiler-img img').each((i, elem) => {
        const image = $(elem).attr('src');
        result.spoiler.push({ image });
      });

      $('#chapter_list ul li').each((i, elem) => {
        const chapterTitle = $(elem).find('.lchx a').text().trim().replace(/\s+/g, ' ');
        const chapterLink = $(elem).find('.lchx a').attr('href');
        const chapterDate = $(elem).find('.dt a').text().trim();
        result.chapters.push({ title: chapterTitle, link: chapterLink, date: chapterDate });
      });

      return result;
    } catch (error) {
      console.error("Error:", error.message);
      return { success: false, message: error.message };
    }
  },

  getImage: async (url) => {
    try {
      const data = await got(url).text();
      const $ = cheerio.load(data);
      const images = [];

      $('.img-landmine img').each((index, element) => {
        const imgSrc = $(element).attr('src');
        if (imgSrc) images.push(imgSrc);
      });

      return images;
    } catch (error) {
      console.error("Error:", error.message);
      return { success: false, message: error.message };
    }
  }
};

export default komikindo;