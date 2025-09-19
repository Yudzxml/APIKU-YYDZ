import { request } from 'undici';
import * as cheerio from "cheerio";

const baseUrl = 'https://an1.com';

const android1 = {
  search: async (query) => {
    const url = `${baseUrl}/?story=${query}&do=search&subaction=search`;
    try {
      const { body } = await request(url, { method: 'GET' });
      const data = await body.text();
      const $ = cheerio.load(data);
      const items = [];

      $('.item').each((index, element) => {
        const name = $(element).find('.name a span').text();
        const developer = $(element).find('.developer').text();
        const ratingStr = $(element).find('.current-rating').css('width') || '0';
        const rating = parseFloat(ratingStr.replace('%', '')) / 20;
        const imageUrl = $(element).find('.img img').attr('src');
        const link = $(element).find('.name a').attr('href');

        items.push({ name, developer, rating, imageUrl, link });
      });

      console.log('Data:', items);
      return items;
    } catch (error) {
      console.error('Error:', error.message);
      return { success: false, message: error.message };
    }
  },

  detail: async (url) => {
    try {
      const { body } = await request(url, { method: 'GET' });
      const data = await body.text();
      const $ = cheerio.load(data);

      const title = $('h1.title.xxlgf').text() || 'N/A';
      const imageUrl = $('figure.img img').attr('src') || '';
      const developer = $('.developer[itemprop="publisher"] span').text() || 'N/A';
      const descriptionElement = $('.description #spoiler').html();
      const description = descriptionElement ? descriptionElement.replace(/<[^>]*>/g, '') : 'N/A';
      const version = $('span[itemprop="softwareVersion"]').text() || 'N/A';
      const fileSize = $('span[itemprop="fileSize"]').text() || 'N/A';
      const operatingSystem = $('span[itemprop="operatingSystem"]').text() || 'N/A';
      const ratingStr = $('#ratig-layer-4959 .current-rating').css('width') || '0';
      const rating = parseFloat(ratingStr.replace('%', '')) / 20;
      const ratingCount = $('#vote-num-id-4959').text() || '0';
      const downloadUrl = $('.download_line.green').attr('href') || '';
      const screenshots = [];

      $('.app_screens_list a').each((i, el) => {
        const screenshotUrl = $(el).find('img').attr('src');
        if (screenshotUrl) screenshots.push(screenshotUrl);
      });

      const appInfo = {
        title,
        imageUrl,
        developer,
        description,
        version,
        fileSize,
        operatingSystem,
        rating,
        ratingCount,
        downloadUrl: downloadUrl ? baseUrl + downloadUrl : '',
        screenshots
      };

      console.log('Data:', appInfo);
      return appInfo;
    } catch (error) {
      console.error('Error:', error.message);
      return { success: false, message: error.message };
    }
  },

  download: async (url) => {
    try {
      const { body } = await request(url, { method: 'GET' });
      const data = await body.text();
      const $ = cheerio.load(data);

      const title = $('.box-file h1.title.fbold').text() || 'N/A';
      const imageUrl = $('.box-file-img img').attr('src') || '';
      const version = $('#a_ver').text().trim() || 'N/A';
      const downloadUrl = $('#pre_download').attr('href') || '';

      const downloadInfo = { title, imageUrl, version, downloadUrl };
      console.log('Data:', downloadInfo);
      return downloadInfo;
    } catch (error) {
      console.error('Error:', error.message);
      return { success: false, message: error.message };
    }
  }
};

export default android1;