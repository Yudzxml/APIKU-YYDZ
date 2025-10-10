import * as cheerio from "cheerio";

async function resep(query) {
    try {
      const searchRes = await fetch(`https://resepkoki.id/?s=${encodeURIComponent(query)}`, {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "upgrade-insecure-requests": "1"
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        method: "GET"
      });
      const searchHtml = await searchRes.text();
      const $ = cheerio.load(searchHtml);

      const searchResults = [];
      $(".archive-item").each((i, el) => {
        const title = $(el).find(".entry-title a").text().trim();
        const url = $(el).find(".entry-title a").attr("href");
        const img = $(el).find(".archive-item-media img").attr("data-src") || $(el).find(".archive-item-media img").attr("src");
        if (url) searchResults.push({ title, url, img });
      });

      const detailedResults = await Promise.all(
        searchResults.map(async ({ title, url, img }) => {
          try {
            const res = await fetch(url, {
              headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                "cache-control": "max-age=0",
                "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": '"Android"',
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1"
              },
              method: "GET"
            });
            const html = await res.text();
            const $$ = cheerio.load(html);

            const bahan = {};
            let currentHeading = "Bahan Utama";

            $$(".ingredients-table tr").each((i, el) => {
              const heading = $$(el).find(".ingredient-heading").text().trim();
              if (heading) {
                currentHeading = heading;
                if (!bahan[currentHeading]) bahan[currentHeading] = [];
                return;
              }

              const name = $$(el).find(".ingredient-name").text().trim();
              const amount = $$(el).find(".ingredient-amount").attr("data-initial-amount") || $$(el).find(".ingredient-amount").text().trim();

              if (name) {
                if (!bahan[currentHeading]) bahan[currentHeading] = [];
                bahan[currentHeading].push({ name, amount });
              }
            });

            if (Object.keys(bahan).length === 0) return null;

            const steps = [];
            $$(".recipe-steps-table tr.single-step").each((i, el) => {
              const number = $$(el).find(".single-step-number-value").text().trim();
              const description = $$(el)
                .find(".single-step-description p, .single-step-description h4")
                .map((i, d) => $$(d).text().trim())
                .get()
                .join("\n");

              steps.push({ number, description });
            });

            return { title, img, bahan, steps };
          } catch {
            return null;
          }
        })
      );

      return detailedResults.filter(r => r !== null);

    } catch (error) {
      console.error("Error fetching resep:", error);
      return [];
    }
  }

export default resep