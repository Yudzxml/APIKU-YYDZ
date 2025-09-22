import got from "got";
import * as cheerio from "cheerio";

const wattpad = {
  search: async (query) => {
    try {
      const baseUrl = "https://www.wattpad.com";
      const url = `${baseUrl}/search/${query}`;
      const response = await got(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      const html = response.body;
      const $ = cheerio.load(html);

      const results = $("section#section-results-stories article#results-stories ul.list-group li.list-group-item")
        .map((index, element) => ({
          link: baseUrl + $(element).find(".story-card").attr("href"),
          image: $(element).find(".cover img").attr("src"),
          title: $(element).find('.story-info .title[aria-hidden="true"]').first().text().trim(),
          readCount: $(element).find(".new-story-stats .stats-value").eq(0).text(),
          voteCount: $(element).find(".new-story-stats .stats-value").eq(1).text(),
          chapterCount: $(element).find(".new-story-stats .stats-value").eq(2).text(),
          description: $(element).find(".description").text().trim(),
        }))
        .get();

      return results;
    } catch (error) {
      console.error("Search Error:", error.message);
      return { success: false, message: error.message };
    }
  },

  read: async function read(url, page = 1, output = "\n\n", prevTitle = null) {
    try {
      const pageURL = `${url}/page/${page}`;
      const response = await got(pageURL, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      const html = response.body;
      const $ = cheerio.load(html);
      const newTitle = $("title").text();

      if (newTitle === prevTitle) {
        const nextURL = $("a.on-navigate.next-up").attr("href");
        if (!nextURL) return output;
        return wattpad.read(nextURL, 1, output + `\n\n\t${prevTitle}\n`, null);
      }

      $("p").each((index, element) => {
        const paragraph = $(element).text().trim();
        output += `${paragraph}\n`;
      });

      return wattpad.read(url, page + 1, output, newTitle);
    } catch (error) {
      console.error("Read Error:", error.message);
      return output;
    }
  },

  getList: async function getList(url) {
    try {
      const response = await got(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      const html = response.body;
      const $ = cheerio.load(html);
      const startReadingLink = $("a.read-btn").attr("href");
      if (!startReadingLink) return [];
      const listUrl = "https://www.wattpad.com" + startReadingLink;
      const episode = await wattpad.list(listUrl);
      return episode;
    } catch (error) {
      console.error("getList Error:", error.message);
      return null;
    }
  },

  list: async function list(url) {
    try {
      const response = await got(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      const html = response.body;
      const $ = cheerio.load(html);

      const tableOfContents = $('ul.table-of-contents li[class=""]')
        .map((index, element) => ({
          title: $(element).find(".part-title").text().trim(),
          link: "https://www.wattpad.com" + $(element).find("a.on-navigate").attr("href"),
        }))
        .get();

      return tableOfContents;
    } catch (error) {
      console.error("List Error:", error.message);
      return null;
    }
  },
};

export default wattpad;