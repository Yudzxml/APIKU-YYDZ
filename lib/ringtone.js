import got from 'got';
import * as cheerio from "cheerio";

async function ringtone(title) {
  try {
    const url = `https://meloboom.com/en/search/${encodeURIComponent(title)}`;
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

    $('#__next > main > section > div.jsx-2244708474.container > div > div > div > div:nth-child(4) > div > div > div > ul > li')
      .each((index, element) => {
        hasil.push({
          title: $(element).find('h4').text().trim(),
          source: 'https://meloboom.com/' + $(element).find('a').attr('href'),
          audio: $(element).find('audio').attr('src')
        });
      });

    return hasil;
  } catch (error) {
    console.error('Ringtone Error:', error.message);
    return [];
  }
}

export default ringtone;