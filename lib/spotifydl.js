import got from "got";
import spotify from "./spotify.js";

async function spodl(url) {
  const data = await spotify(url);
  if (!data || !data[0]) {
    throw new Error("Data Spotify tidak ditemukan");
  }
  const hasil = data[0];
  try {
    const res = await got.post("https://spotifysave.com/download", {
      headers: {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "origin": "https://spotifysave.com",
        "referer": "https://spotifysave.com/"
      },
      json: {
        title: hasil.song_name,
        artist: hasil.artist,
        url: hasil.url
      },
      responseType: "buffer"
    });

    return res.body;

  } catch (err) {
    console.error("[spodl-got] Error saat download:", err.message);
    throw err;
  }
}

export default spodl;