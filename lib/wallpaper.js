import got from 'got';
import * as cheerio from "cheerio";

async function wallpaper(title, page = '1') {
  try {
    const url = `https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${encodeURIComponent(title)}`;
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

    $('div.grid-item').each((index, element) => {
      hasil.push({
        title: $(element).find('div.info > a > h3').text().trim(),
        type: $(element).find('div.info > a:nth-child(2)').text().trim(),
        source: 'https://www.besthdwallpaper.com/' + $(element).find('div > a:nth-child(3)').attr('href'),
        image: [
          $(element).find('picture > img').attr('data-src') || $(element).find('picture > img').attr('src'),
          $(element).find('picture > source:nth-child(1)').attr('srcset'),
          $(element).find('picture > source:nth-child(2)').attr('srcset')
        ]
      });
    });

    return hasil;
  } catch (error) {
    console.error('Wallpaper Error:', error.message);
    return [];
  }
}

export default wallpaper;