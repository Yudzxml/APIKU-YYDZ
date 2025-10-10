import { request } from 'undici';
import * as cheerio from "cheerio";

async function quotesAnime() {
  try {
    const page = Math.floor(Math.random() * 184); 
    const { body } = await request(`https://otakotaku.com/quote/feed/${page}`);
    const html = await body.text();

    const $ = cheerio.load(html);
    const hasil = [];

    $('div.kotodama-list').each(function () {
      hasil.push({
        link: $(this).find('a').attr('href'),
        gambar: $(this).find('img').attr('data-src'),
        karakter: $(this).find('div.char-name').text().trim(),
        anime: $(this).find('div.anime-title').text().trim(),
        episode: $(this).find('div.meta').text(),
        up_at: $(this).find('small.meta').text(),
        quotes: $(this).find('div.quote').text().trim()
      });
    });

    if (hasil.length === 0) throw new Error('Tidak ada quote ditemukan');

    // pilih satu quote acak
    const randomIndex = Math.floor(Math.random() * hasil.length);
    return hasil[randomIndex];
    
  } catch (err) {
    throw err;
  }
}

export default quotesAnime