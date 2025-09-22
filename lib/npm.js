
import * as cheerio from "cheerio";

function parseJson(jsonData) {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    const basicInfo = {
        name: data.name,
        version: data.version,
        description: data.description,
        license: data.license,
        modified: data.modified,
        dist_tag: data.dist_tag,
        repository: data.repository,
        keywords: data.keywords,
    };

    const dependencies = data.dependencies || [];
    const dependents = data.dependents || [];
    let readmeParsed = {};
    if (data.readme) {
        const cheerio = require('cheerio');
        const $ = cheerio.load(data.readme);

        readmeParsed = {
            title: $('h1').first().text() || null,
            subtitle: $('h5').first().text() || null,
            links: $('a')
                .map((i, el) => ({
                    text: $(el).text().trim(),
                    href: $(el).attr('href'),
                }))
                .get(),
            images: $('img')
                .map((i, el) => ({
                    src: $(el).attr('src'),
                    alt: $(el).attr('alt'),
                    title: $(el).attr('title'),
                    width: $(el).attr('width'),
                    height: $(el).attr('height'),
                }))
                .get(),
        };
    }

    // Ambil versi historis jika ada
    const versions = data.versions || {};

    return {
        basicInfo,
        dependencies,
        dependents,
        readmeParsed,
        versions,
    };
}

async function search(query) {
  try {
    const url = `https://npm.io/search/${query}?_=${Date.now()}`; 
    const response = await fetch(url, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "GET"
    });

    if (!response.ok && response.status !== 304) throw new Error(`HTTP error! status: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const hrefs = [];
    $("h2.header.header__primary a").each((i, el) => {
      const href = $(el).attr("href");
      if (href) hrefs.push(href);
    });
    return hrefs;
  } catch (error) {
    console.log(error);
    return [];
  }
}

async function npmdetail(query) {
  try {
    const data = await search(query);
    if (!data?.length) throw new Error("Package tidak ditemukan");

    const packageName = data[0];
    const response = await fetch(`https://npm.io/api/v1${packageName}`, {
      headers: {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": `https://npm.io/search/${query}`,
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      method: "GET"
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const datav1 = await response.json();

    return await parseJson(datav1);

  } catch (error) {
    console.error("Gagal fetch atau parse package:", error);
    return null;
  }
}

export default npmdetail