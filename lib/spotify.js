import * as cheerio from "cheerio";

const s = {
    tools: {
        async hit(description, url, options = {}, returnType = "text") {
            try {
                const fetchOptions = {
                    method: options.method || "GET",
                    headers: options.headers,
                    body: options.body
                };

                const response = await fetch(url.toString(), fetchOptions);

                let data;
                if (returnType === "json") {
                    try {
                        data = await response.json();
                    } catch (err) {
                        throw Error(`failed to parse JSON from ${description}`);
                    }
                } else if (returnType === "text") {
                    data = await response.text();
                } else if (returnType === "buffer") {
                    const arrayBuffer = await response.arrayBuffer();
                    data = Buffer.from(arrayBuffer);
                } else {
                    throw Error(`invalid returnType param.`);
                }

                return { data, response };
            } catch (e) {
                throw Error(`hit ${description} failed. ${e.message}`);
            }
        }
    },

    get baseUrl() {
        return "https://spotisongdownloader.to";
    },
    get baseHeaders() {
        return {
            "accept-encoding": "gzip, deflate, br, zstd",
            "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"
        };
    },

    async getCookie() {
        const url = this.baseUrl;
        const headers = this.baseHeaders;
        const { response } = await this.tools.hit(`homepage`, url, { headers }, "text");
        let cookie = response.headers.get("set-cookie")?.split(";")[0];
        if (!cookie?.length) throw Error(`gagal mendapatkan kuki`);
        cookie += "; _ga=GA1.1.2675401.1754827078";
        console.log(`hit ${url}`);
        return { cookie };
    },

    async ifCaptcha(gcObject) {
        const pathname = "/ifCaptcha.php";
        const url = new URL(pathname, this.baseUrl);
        const headers = {
            referer: new URL(this.baseUrl).href,
            ...gcObject,
            ...this.baseHeaders
        };
        await this.tools.hit(`ifCaptcha`, url, { headers }, "text");
        console.log(`hit ${pathname}`);
        return headers;
    },

    async singleTrack(spotifyTrackUrl, icObject) {
        const pathname = "/api/composer/spotify/xsingle_track.php";
        const url = new URL(pathname, this.baseUrl);
        url.search = new URLSearchParams({ url: spotifyTrackUrl });
        const headers = icObject;
        const { data } = await this.tools.hit(`single track`, url, { headers }, "json");
        console.log(`hit ${pathname}`);
        return data;
    },

    async singleTrackHtml(stObject, icObj) {
        const payload = [
            stObject.song_name,
            stObject.duration,
            stObject.img,
            stObject.artist,
            stObject.url,
            stObject.album_name,
            stObject.released
        ];
        const pathname = "/track.php";
        const url = new URL(pathname, this.baseUrl);
        const headers = icObj;
        const body = new URLSearchParams({ data: JSON.stringify(payload) });
        const { data } = await this.tools.hit(`track html`, url, { headers, body, method: "POST" }, "text");
        console.log(`hit ${pathname}`);
        return data;
    },

    async downloadUrl(spotifyTrackUrl, icObj, stObj) {
        const pathname = "/api/composer/spotify/ssdw23456ytrfds.php";
        const url = new URL(pathname, this.baseUrl);
        const headers = icObj;
        const body = new URLSearchParams({
            song_name: "",
            artist_name: "",
            url: spotifyTrackUrl,
            zip_download: "false",
            quality: "m4a"
        });
        const { data } = await this.tools.hit(
            `get download url`,
            url,
            { headers, body, method: "POST" },
            "json"
        );
        const result = { ...data, ...stObj };
        console.log(`hit ${pathname}`);
        return result;
    },

    async download(spotifyTrackUrl) {
        const gcObj = await this.getCookie();
        const icObj = await this.ifCaptcha(gcObj);
        const stObj = await this.singleTrack(spotifyTrackUrl, icObj);
        await this.singleTrackHtml(stObj, icObj);
        const dlObj = await this.downloadUrl(spotifyTrackUrl, icObj, stObj);
        return dlObj;
    }
}

const V2 = 'c9eda64a88dfad033';
const V4 = '0e60c5740a67433' + V2; 
const V1 = '94572aa6fbee5597';
const V3 = '59b5b3d3f7c3494b' + V1;

let cachedToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${V4}:${V3}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) throw new Error(`Spotify token request failed with status ${res.status}`);

  const data = await res.json();
  if (!data.access_token) throw new Error('Gagal mendapatkan token Spotify');

  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000; // refresh 60s lebih awal
  return cachedToken;
}

function simplifySpotifyTracks(data, type = 'track') {
  if (!data) return [];

  const formatTrack = (track, albumData = null) => ({
    song_name: track.name,
    artist: track.artists?.map(a => a.name).join(", ") || null,
    img: track.album?.images?.[0]?.url || albumData?.images?.[0]?.url || null,
    thumb: track.album?.images?.[0]?.url || albumData?.images?.[0]?.url || null,
    duration: track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}m ${Math.floor((track.duration_ms % 60000) / 1000)}s` : null,
    url: track.external_urls?.spotify || null,
    released: track.album?.release_date || albumData?.release_date || null,
    album_name: track.album?.name || albumData?.name || null,
    res: 200,
    time: new Date().toISOString().replace('T', ' ').split('.')[0]
  });

  // Data dari search
  if (data.tracks?.items) return data.tracks.items.map(track => formatTrack(track));

  // Single track
  if (type === 'track') return [formatTrack(data)];

  // Album: ambil semua track
  if (type === 'album') return data.tracks?.items.map(track => formatTrack(track, data)) || [];

  // Playlist: ambil semua track di playlist
  if (type === 'playlist') return data.tracks?.items.map(item => formatTrack(item.track)) || [];

  // Artist: ambil top tracks
  if (type === 'artist') return data?.tracks?.map(track => formatTrack(track)) || [];

  return [];
}

async function search(query, type = "track", limit = 10) {
  const token = await getSpotifyToken();
  const spotifyUrlRegex = /https?:\/\/open\.spotify\.com\/(?:embed\/)?(track|album|playlist|artist)\/([^?\/]+)(?:\?.*)?/;
  const match = query.match(spotifyUrlRegex);

  let res;
  let actualType = type;

  if (match) {
    const urlType = match[1];
    const id = match[2];
    actualType = urlType;

    let endpoint;
    switch (urlType) {
      case "track":
        endpoint = `https://api.spotify.com/v1/tracks/${id}`;
        break;
      case "album":
        endpoint = `https://api.spotify.com/v1/albums/${id}`;
        break;
      case "playlist":
        endpoint = `https://api.spotify.com/v1/playlists/${id}`;
        break;
      case "artist":
        endpoint = `https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`;
        break;
      default:
        throw new Error("Unsupported Spotify URL type.");
    }

    res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } else {
    const params = new URLSearchParams({ q: query, type, limit });
    res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After")) || 1;
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return search(query, type, limit);
  }

  if (!res.ok) {
    throw new Error(`Spotify API request failed with status ${res.status}`);
  }

  const data = await res.json();
  return simplifySpotifyTracks(data, actualType);
}

const spotify = {
  search: async function(query) {
    const result = await search(query); 
    return result;
  },
  download: async function(url) {
    const dl = await s.download(url);
    return dl;
  }
};

export default spotify