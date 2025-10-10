import got from 'got';
import * as cheerio from "cheerio";

const livechart = {
    search: async (query) => {
        try {
            const response = await got(`https://www.livechart.me/search?q=${query}`, {
                headers: {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                    "referer": "https://www.livechart.me/search",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
                }
            });

            const html = response.body;
            const $ = cheerio.load(html);
            const animeList = [];

            $('.callout.grouped-list.anime-list li.grouped-list-item.anime-item').each((index, element) => {
                const title = $(element).find('.anime-item__body__title a').text().trim();
                const release = $(element).find('.info span[data-action="click->anime-item#showPremiereDateTime"]').text().trim();
                const rating = $(element).find('.info .fake-link').text().trim();
                const url = $(element).find('.anime-item__body__title a').attr('href');
                const type = $(element).find('.anime-item__body__title span.title-extra').text().trim();
                const imageUrl = $(element).find('.anime-item__poster-wrap img').attr('src');

                animeList.push({
                    title,
                    release,
                    rating,
                    url: `https://www.livechart.me${url}`,
                    type,
                    imageUrl
                });
            });

            return animeList;
        } catch (error) {
            console.error("Error:", error.response ? error.response.body : error.message);
            return { success: false, message: error.message };
        }
    },
    detail: async (url) => {
        try {
            const urlParts = url.split('/');
            const animeId = urlParts[urlParts.length - 1];

            const response = await got(url, {
                headers: {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                    "referer": url,
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
                }
            });

            const html = response.body;
            const $ = cheerio.load(html);
            const animeDetails = {
                title: $(`div[data-anime-details-id="${animeId}"] .text-xl`).first().text().trim(),
                premiereDate: $(`div[data-anime-details-id="${animeId}"] .font-medium:contains("Premiere")`).next().text().trim(),
                rating: $(`div[data-anime-details-id="${animeId}"] .text-lg.font-medium`).first().text().trim(),
                imageUrl: $(`div[data-anime-details-id="${animeId}"] img`).attr('src'),
                synopsis: $(`div[data-anime-details-id="${animeId}"] .lc-expander-content`).text().trim(),
                source: $(`div[data-anime-details-id="${animeId}"] .text-xs:contains("Source")`).next().find('a').text().trim(),
                tags: [],
                studios: []
            };

            $(`div[data-anime-details-id="${animeId}"] .flex.flex-wrap.gap-2 a.lc-chip-button`).each((index, element) => {
                animeDetails.tags.push($(element).text().trim());
            });

            $(`div[data-anime-details-id="${animeId}"] .flex.flex-wrap.gap-2 a.lc-chip-button[href^="/studios"]`).each((index, element) => {
                animeDetails.studios.push($(element).text().trim());
            });

            return animeDetails;
        } catch (error) {
            console.error("Error:", error.response ? error.response.body : error.message);
            return { success: false, message: error.message };
        }
    }
};

export default livechart;