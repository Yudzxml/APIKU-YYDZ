import got from "got";
import * as cheerio from "cheerio";

async function styletext(teks) {
  try {
    const url = `http://qaz.wtf/u/convert.cgi?text=${encodeURIComponent(teks)}`;
    const { body } = await got(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
      },
    });

    const $ = cheerio.load(body);
    const hasil = [];

    $("table > tbody > tr").each((_, el) => {
      hasil.push({
        name: $(el).find("td:nth-child(1) > span").text(),
        result: $(el).find("td:nth-child(2)").text().trim(),
      });
    });

    return hasil;
  } catch (err) {
    console.error("❌ Error:", err.message);
    throw err;
  }
}

export default styletext