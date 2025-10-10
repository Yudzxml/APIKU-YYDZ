import { request, FormData, fetch } from 'undici';

const pinterest = {
    api: {
        base: "https://www.pinterest.com",
        endpoints: {
            search: "/resource/BaseSearchResource/get/",
            pin: "/resource/PinResource/get/",
            user: "/resource/UserResource/get/"
        }
    },

    headers: {
        'accept': 'application/json, text/javascript, */*, q=0.01',
        'referer': 'https://www.pinterest.com/',
        'user-agent': 'Postify/1.0.0',
        'x-app-version': 'a9522f',
        'x-pinterest-appstate': 'active',
        'x-pinterest-pws-handler': 'www/[username]/[slug].js',
        'x-pinterest-source-url': '/search/pins/?rs=typed&q=kucing%20anggora/',
        'x-requested-with': 'XMLHttpRequest'
    },

    isUrl: (str) => {
        try { new URL(str); return true; } 
        catch { return false; }
    },

    isPin: (url) => {
        if (!url) return false;
        const patterns = [
            /^https?:\/\/(?:www\.)?pinterest\.com\/pin\/[\w.-]+/,
            /^https?:\/\/(?:www\.)?pinterest\.[\w.]+\/pin\/[\w.-]+/,
            /^https?:\/\/pin\.it\/[\w.-]+/
        ];
        return patterns.some(p => p.test(url.trim().toLowerCase()));
    },

    getCookies: async () => {
        try {
            const { headers } = await request(pinterest.api.base, { method: 'GET' });
            const raw = headers['set-cookie'] || headers['set-cookie2'];
            if (!raw) return null;
            return raw.join('; ').split(';').map(s => s.trim()).join('; ');
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    fetchJSON: async (url, params, cookies) => {
        const searchParams = new URLSearchParams(params).toString();
        const { body } = await request(`${url}?${searchParams}`, {
            headers: { ...pinterest.headers, cookie: cookies },
        });
        return JSON.parse(await body.text());
    },

    search: async (query, limit = 10) => {
        if (!query) return { status: false, code: 400, result: { message: "Query kosong" } };
        const cookies = await pinterest.getCookies();
        if (!cookies) return { status: false, code: 400, result: { message: "Gagal ambil cookies" } };

        const params = {
            source_url: `/search/pins/?q=${query}`,
            data: JSON.stringify({
                options: { isPrefetch: false, query, scope: "pins", bookmarks: [""], no_fetch_context_on_resource: false, page_size: limit },
                context: {}
            }),
            _: Date.now()
        };

        try {
            const data = await pinterest.fetchJSON(`${pinterest.api.base}${pinterest.api.endpoints.search}`, params, cookies);
            const results = data.resource_response?.data?.results?.filter(v => v.images?.orig) || [];
            if (!results.length) return { status: false, code: 404, result: { message: `Tidak ditemukan untuk query "${query}"` } };

            const container = results.map(r => ({
                id: r.id,
                title: r.title || "",
                description: r.description,
                pin_url: `https://pinterest.com/pin/${r.id}`,
                media: {
                    images: {
                        orig: r.images.orig,
                        small: r.images['236x'],
                        medium: r.images['474x'],
                        large: r.images['736x']
                    },
                    video: r.videos ? { video_list: r.videos.video_list, duration: r.videos.duration, video_url: r.videos.video_url } : null
                },
                uploader: {
                    username: r.pinner.username,
                    full_name: r.pinner.full_name,
                    profile_url: `https://pinterest.com/${r.pinner.username}`
                }
            }));

            return { status: true, code: 200, result: { query, total: container.length, pins: container } };
        } catch (e) {
            return { status: false, code: 500, result: { message: "Server error, coba lagi nanti" } };
        }
    },

    download: async (pinUrl) => {
        if (!pinUrl || !pinterest.isUrl(pinUrl) || !pinterest.isPin(pinUrl))
            return { status: false, code: 400, result: { message: "URL pin tidak valid" } };

        const pinId = pinUrl.split('/pin/')[1].replace('/', '');
        const cookies = await pinterest.getCookies();
        if (!cookies) return { status: false, code: 400, result: { message: "Gagal ambil cookies" } };

        const params = {
            source_url: `/pin/${pinId}/`,
            data: JSON.stringify({ options: { field_set_key: "detailed", id: pinId }, context: {} }),
            _: Date.now()
        };

        try {
            const data = await pinterest.fetchJSON(`${pinterest.api.base}${pinterest.api.endpoints.pin}`, params, cookies);
            const pd = data.resource_response?.data;
            if (!pd) return { status: false, code: 404, result: { message: "Pin tidak ditemukan" } };

            const mediaUrls = [];

            if (pd.videos) {
                Object.values(pd.videos.video_list || {}).sort((a, b) => b.width - a.width).forEach(v => {
                    mediaUrls.push({ type: 'video', quality: `${v.width}x${v.height}`, width: v.width, height: v.height, duration: pd.videos.duration || null, url: v.url, file_size: v.file_size || null, thumbnail: pd.images.orig.url });
                });
            }

            if (pd.images) {
                const imge = { original: pd.images.orig, large: pd.images['736x'], medium: pd.images['474x'], small: pd.images['236x'], thumbnail: pd.images['170x'] };
                Object.entries(imge).forEach(([q, img]) => { if (img) mediaUrls.push({ type: 'image', quality: q, width: img.width, height: img.height, url: img.url, size: `${img.width}x${img.height}` }); });
            }

            if (!mediaUrls.length) return { status: false, code: 404, result: { message: "Pin tidak memiliki media" } };

            return { status: true, code: 200, result: { id: pd.id, title: pd.title || pd.grid_title || "", description: pd.description || "", created_at: pd.created_at, media_urls: mediaUrls } };
        } catch (e) {
            return { status: false, code: 500, result: { message: "Server error, coba lagi nanti" } };
        }
    },

    profile: async (username) => {
        if (!username) return { status: false, code: 400, result: { message: "Username tidak diberikan" } };

        const cookies = await pinterest.getCookies();
        if (!cookies) return { status: false, code: 400, result: { message: "Gagal ambil cookies" } };

        const params = {
            source_url: `/${username}/`,
            data: JSON.stringify({ options: { username, field_set_key: "profile", isPrefetch: false }, context: {} }),
            _: Date.now()
        };

        try {
            const data = await pinterest.fetchJSON(`${pinterest.api.base}${pinterest.api.endpoints.user}`, params, cookies);
            const userx = data.resource_response?.data;
            if (!userx) return { status: false, code: 404, result: { message: "User tidak ditemukan" } };

            return {
                status: true,
                code: 200,
                result: {
                    id: userx.id,
                    username: userx.username,
                    full_name: userx.full_name || "",
                    profile_url: `https://pinterest.com/${userx.username}`,
                    image: { small: userx.image_small_url || null, medium: userx.image_medium_url || null, large: userx.image_large_url || null, original: userx.image_xlarge_url || null },
                    stats: { pins: userx.pin_count || 0, followers: userx.follower_count || 0, following: userx.following_count || 0 }
                }
            };
        } catch (e) {
            return { status: false, code: 500, result: { message: "Server error, coba lagi nanti" } };
        }
    }
};

export default pinterest;