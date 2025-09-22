import {
  Cerpen,
  Quotes,
  Couples,
  JalanTikusMeme,
  Darkjokes,
  CNNNews,
  CNBCNews,
  KompasNews,
  TribunNews,
  DetikNews,
  KontanNews,
  DailyNews
} from 'dhn-api';
import got from 'got';
import * as cheerio from "cheerio";

async function aviz(query = 'terbaru') {
    const searchUrl = `https://www.inews.id/find?q=${encodeURIComponent(query)}`;

    try {
        const response = await got(searchUrl);
        const html = response.body;

        const $ = cheerio.load(html);
        const results = [];

        $('article.cardArticle').each((i, element) => {
            const title = $(element).find('h3.cardTitle').text().trim();
            const url = $(element).find('a').attr('href');
            const imgUrl = $(element).find('img.thumbCard').attr('src');
            const date = $(element).find('div.postTime').text().trim();

            if (title && url && imgUrl && date) {
                results.push({ title, url, imgUrl, date });
            }
        });

        return results;

    } catch (error) {
        console.error("Error fetching data:", error.message);
        return [];
    }
}

const dhn = {
  cerpen: Cerpen,
  quotes: Quotes,
  couples: Couples,
  meme: JalanTikusMeme,
  darkjokes: Darkjokes,
  cnn: CNNNews,
  cnbc: CNBCNews,
  kompas: KompasNews,
  tribun: TribunNews,
  detik: DetikNews,
  kontan: KontanNews,
  inews: aviz, 
  dailynews: DailyNews
};

export default dhn;