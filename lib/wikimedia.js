import got from 'got';
import * as cheerio from "cheerio";

async function wikimedia(title) {
  try {
    const url = `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(title)}&title=Special:MediaSearch&go=Go&type=image`;
    const response = await got(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    const html = response.body;
    const $ = cheerio.load(html);
    const hasil = [];

    $('.sdms-search-results__list-wrapper > div > a').each((index, element) => {
      hasil.push({
        title: $(element).find('img').attr('alt'),
        source: $(element).attr('href'),
        image: $(element).find('img').attr('data-src') || $(element).find('img').attr('src')
      });
    });

    return hasil;
  } catch (error) {
    console.error('Wikimedia Error:', error.message);
    return [];
  }
}

export default wikimedia;