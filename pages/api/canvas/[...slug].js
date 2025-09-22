import { getApiKey } from '../../../lib/apikeys.js';
import ttp from '../../../lib/ttp.js';

export default async function handler(req, res) {
    const { slug = [] } = req.query;
    const { name, id, status, limit, role, money, level, level_cache, text, text2, pp, filename, apikey } = req.query;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-apikey");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") return res.status(405).json({ status: 405, author: "Yudzxml", error: "Method Not Allowed" });

    try {
        let result;

        switch (slug[0]) {
            case "ttp": {
    if (!apikey) {
        return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "invalid or missing parameter apikey"
        });
    }

    const ipRaw = req.headers['x-forwarded-for']?.split(',')[0].trim() 
                  || req.socket.remoteAddress 
                  || '0.0.0.0';
    const ip = (ipRaw === '::1') ? '127.0.0.1' : ipRaw;

    let keyData;
    try {
        keyData = await getApiKey(apikey, ip);
    } catch (err) {
        console.error("getApiKey error:", err);
        return res.status(500).json({
            status: 500,
            author: "Yudzxml",
            error: "internal Server error"
        });
    }

    if (!keyData || keyData.status !== 200) {
        return res.status(keyData?.status || 403).json({
            status: keyData?.status || 403,
            author: "Yudzxml",
            error: keyData?.message || "API key invalid or expired"
        });
    }

    if (!text) {
        return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter 'text' wajib untuk ttp"
        });
    }

    let result;
    try {
        const ttpResult = await ttp(text); 
        if (!ttpResult || !ttpResult.length) {
            return res.status(500).json({
                status: 500,
                author: "Yudzxml",
                error: "Failed to generate TTP image"
            });
        }
        result = ttpResult[0].url;
    } catch (err) {
        console.error("TTP Error:", err);
        return res.status(500).json({
            status: 500,
            author: "Yudzxml",
            error: err.message
        });
    }

    return res.status(200).json({
        status: 200,
        author: "Yudzxml",
        data: result
    });
}
            case "profil": {
                if (!pp) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter pp wajib diisi untuk profil" });

                const data = { nama: name, id, status, limit, role, money, level, level_cache };
                const profilePicUrl = pp;
                const queryParams = new URLSearchParams({ ...data, profilePicUrl }).toString();
                const url = `http://astro.wisp.uno:13217/profile?${queryParams}`;

                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                    const buffer = await response.arrayBuffer();
                    const imageBuffer = Buffer.from(buffer);

                    res.setHeader("Content-Type", "image/png");
                    return res.send(imageBuffer); 
                } catch (error) {
                    return res.status(500).json({ status: 500, author: "Yudzxml", error: error.message });
                }
            }
            case "smeme": {
    if (!apikey) {
        return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "invalid or missing parameter apikey"
        });
    }

    const ipRaw = req.headers['x-forwarded-for']?.split(',')[0].trim() 
                  || req.socket.remoteAddress 
                  || '0.0.0.0';
    const ip = (ipRaw === '::1') ? '127.0.0.1' : ipRaw;

    let keyData;
    try {
        keyData = await getApiKey(apikey, ip);
    } catch (err) {
        console.error("getApiKey error:", err);
        return res.status(500).json({
            status: 500,
            author: "Yudzxml",
            error: "internal Server error"
        });
    }

    if (!keyData || keyData.status !== 200) {
        return res.status(keyData?.status || 403).json({
            status: keyData?.status || 403,
            author: "Yudzxml",
            error: keyData?.message || "API key invalid or expired"
        });
    }

    if (!pp) {
        return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter pp wajib untuk smeme"
        });
    }

    if (!text && !text2) {
        return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Minimal salah satu parameter 'text' atau 'text2' harus diisi"
        });
    }

    const params = new URLSearchParams({ pp });
    if (text) params.append("text", text);
    if (text2) params.append("text2", text2);

    const yudd = await fetch(`http://astro.wisp.uno:13217/smeme?${params.toString()}`);
    const resultJson = await yudd.json();
    const result = resultJson.url;

    return res.status(200).json({
        status: 200,
        author: "Yudzxml",
        data: result
    });
}
            case "welcome": {
                if (!pp) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter pp wajib untuk welcome" });
                if (!filename || !["welcome1.png", "welcome2.png"].includes(filename)) 
                    return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter filename wajib dan hanya boleh 'welcome1.png' atau 'welcome2.png'" });
                if (!name) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter name wajib untuk welcome" });

                try {
                    const response = await fetch(
                        `http://astro.wisp.uno:13217/welcome?name=${encodeURIComponent(name)}&pp=${encodeURIComponent(pp)}&iwelcome=${encodeURIComponent(filename)}`
                    );

                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                    const buffer = await response.arrayBuffer();
                    const imageBuffer = Buffer.from(buffer);

                    res.setHeader("Content-Type", "image/png");
                    return res.send(imageBuffer); // ✅ return di sini
                } catch (err) {
                    return res.status(500).json({ status: 500, author: "Yudzxml", error: "Gagal memanggil API welcome", detail: err.message });
                }
            }
            
            default:
                return res.status(400).json({ status: 400, author: "Yudzxml", error: "Endpoint tidak ditemukan" });
        }

    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ status: 500, author: "Yudzxml", error: err.message || "Terjadi kesalahan server" });
    }
}