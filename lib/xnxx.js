import * as cheerio from "cheerio";

const getCookiesFromMainSite = async () => {
  try {
    const response = await fetch('https://www.xnxx.com/', { method: 'GET' });
    const rawCookies = response.headers.get('set-cookie') || '';
    const cookieString = rawCookies.split(',').map(c => c.split(';')[0]).join('; ');
    return cookieString;
  } catch (error) {
    console.error('Error while fetching cookies:', error);
    return null;
  }
};

const search = async (query) => {
  try {
    const cookies = await getCookiesFromMainSite();
    if (!cookies) return [];

    const response = await fetch(`https://www.xnxx.com/search/${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Cookie': cookies,
        'Referer': 'https://www.xnxx.com/'
      }
    });

    const htmlContent = await response.text();
    const $ = cheerio.load(htmlContent);
    const videos = [];

    $('.thumb-block').each((i, el) => {
      const videoEl = $(el);
      const videoId = videoEl.attr('data-id') || null;

      const linkEl = videoEl.find('.thumb a').first();
      const videoUrl = linkEl.attr('href') || null;
      const title = linkEl.attr('title') || linkEl.text().trim() || null;

      const imgEl = videoEl.find('.thumb img').first();
      const thumbnail = imgEl.attr('data-src') || imgEl.attr('src') || null;

      const uploaderEl = videoEl.find('.uploader a').first();
      const uploaderName = uploaderEl.find('.name').text().trim() || null;
      const uploaderUrl = uploaderEl.attr('href') || null;

      const metadataEl = videoEl.find('.thumb-under .metadata').first();
      let views = null, rating = null;
      const rightSpan = metadataEl.find('span.right').first();
      if (rightSpan.length) {
        const viewsText = rightSpan.contents().filter(function() {
          return this.type === 'text';
        }).text().trim();
        views = viewsText || null;
        const ratingSpan = rightSpan.find('span.superfluous').first();
        rating = ratingSpan.text().trim() || null;
      }

      let duration = null;
      const metadataText = metadataEl.text().replace(/\s+/g, ' ').trim();
      const durationMatch = metadataText.match(/(\d+\s?(?:min|sec))/i);
      if (durationMatch) duration = durationMatch[1];

      let resolution = null;
      const resolutionEl = metadataEl.find('.video-hd').first();
      if (resolutionEl.length) resolution = resolutionEl.text().replace(/[-\s]/g, '').trim() || null;

      videos.push({
        videoId,
        videoUrl: videoUrl ? 'https://www.xnxx.com' + videoUrl : null,
        title,
        thumbnail,
        uploaderName,
        uploaderUrl: uploaderUrl ? 'https://www.xnxx.com' + uploaderUrl : null,
        views,
        rating,
        duration,
        resolution
      });
    });

    return videos;
  } catch (error) {
    console.error('Error fetching search results:', error);
    return [];
  }
};

const download = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl, {
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'cache-control': 'no-cache',
        'device-memory': '8',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
        'sec-ch-ua-arch': '""',
        'sec-ch-ua-bitness': '""',
        'sec-ch-ua-full-version': '"139.0.7339.0"',
        'sec-ch-ua-full-version-list': '"Chromium";v="139.0.7339.0", "Not;A=Brand";v="99.0.0.0"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-model': '"CPH2209"',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua-platform-version': '"11.0.0"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'viewport-width': '980',
      },
    });

    const htmlContent = await response.text();
    const $ = cheerio.load(htmlContent);

    const baseDiv = $('#html5video_base');
    const thumbnailUrl = baseDiv.find('a > img').attr('src') || null;
    const lowQualUrl = baseDiv.find('div').eq(1).find('a').attr('href') || null;
    const highQualUrl = baseDiv.find('div').eq(2).find('a').attr('href') || null;

    return { thumbnailUrl, lowQualUrl, highQualUrl };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
};

const xnxx = {
  search: search,
  download: download
};

export default xnxx;