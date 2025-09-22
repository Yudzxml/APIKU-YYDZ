import { fetch } from "undici";
import * as cheerio from "cheerio";

async function minecraft(username) {
    try {
        const url = `https://crafty.gg/@${username}`;
        const res = await fetch(url, {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "user-agent": "Mozilla/5.0"
            }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const html = await res.text();
        const $ = cheerio.load(html);

        // Nama
        const name = $('h1.text-2xl.font-bold.text-white').first().text().trim() || username;

        // Bio
        const bio = $('p.text-base.text-white.opacity-60').first().text().trim() || 'No bio set';

        // Stats
        const date = $('i.fa-clock').siblings('p.opacity-60').text().trim() || null;
        const views = $('i.fa-eye').siblings('p.opacity-60').text().trim() || null;
        const upvotes = $('i.fa-chevron-up').siblings('p.opacity-60').text().trim() || null;

        // Active skin
        const activeSkin = $('div.flex-col.bg-crafty-card img').first().attr('src') || null;

        // Player information
        const playerInfo = {};
        $('div.flex.w-full.flex-col.gap-2 div.flex.w-full').each((i, el) => {
            const label = $(el).find('p.text-base.text-white.opacity-60').first().text().trim();
            const value = $(el).find('p.text-xs.text-white').first().text().trim();
            if (label && value) playerInfo[label.toLowerCase()] = value;
        });

        // Username history
        const usernameHistory = [];
        $('p:contains("Username history")').closest('div.bg-crafty-card')
          .find('div.max-h-40 span.mt-2.text-white')
          .each((i, el) => {
              const uname = $(el).find('b').text().trim();
              const dateText = $(el).find('span.float-right').text().trim();
              if (uname) usernameHistory.push({ username: uname, date: dateText });
          });

        // Jumlah skin dari judul
        const skinTitle = $('p:contains("Player Skins")').first().text().trim();
        const skinCountMatch = skinTitle.match(/\((\d+)\)/);
        const skinCount = skinCountMatch ? parseInt(skinCountMatch[1], 10) : 0;

        return {
            username: name,
            profile: `https://render.crafty.gg/2d/head/${username}?size=32`,
            bio,
            stats: { date, views, upvotes },
            activeSkin,
            playerInfo,
            usernameHistory,
            skinCount
        };

    } catch (err) {
        console.error(err);
        return { error: err.message };
    }
}

export default minecraft;