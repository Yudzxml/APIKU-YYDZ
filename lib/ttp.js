import got from 'got';
import * as cheerio from "cheerio";

async function ttp(text) {
  try {
    const response = await got.post(
      "https://www.picturetopeople.org/p2p/text_effects_generator.p2p/transparent_text_effect",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36",
          Cookie:
            "_ga=GA1.2.1667267761.1655982457; _gid=GA1.2.77586860.1655982457; __gads=ID=c5a896288a559a38-224105aab0d30085:T=1655982456:RT=1655982456:S=ALNI_MbtHcmgQmVUZI-a2agP40JXqeRnyQ; __gpi=UID=000006149da5cba6:T=1655982456:RT=1655982456:S=ALNI_MY1RmQtva14GH-aAPr7-7vWpxWtmg; _gat_gtag_UA_6584688_1=1",
        },
        body: new URLSearchParams({
          TextToRender: text,
          FontSize: "100",
          Margin: "30",
          LayoutStyle: "0",
          TextRotation: "0",
          TextColor: "ffffff",
          TextTransparency: "0",
          OutlineThickness: "3",
          OutlineColor: "000000",
          FontName: "Lekton",
          ResultType: "view",
        }).toString(),
      }
    );

    const html = response.body;
    const $ = cheerio.load(html);
    const results = [];

    $('form[name="MyForm"]').each((index, formElement) => {
      const resultFile = $(formElement).find('#idResultFile').attr('value');
      const refTS = $(formElement).find('#idRefTS').attr('value');
      results.push({
        creator: 'TanakaDomp',
        url: 'https://www.picturetopeople.org' + resultFile,
        title: refTS
      });
    });

    return results;
  } catch (error) {
    console.error('Error:', error.message);
    return {
      error: error
    }
  }
}

export default ttp;