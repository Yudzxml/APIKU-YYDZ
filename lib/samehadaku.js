// samehadaku.js
import { request } from "undici";

const BASE_URL = "https://www.sankavollerei.com/anime/samehadaku";
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};


async function fetchAPI(endpoint) {
  try {
    const { body } = await request(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: DEFAULT_HEADERS,
    });

    const data = await body.json();
    if (!data || !data.data) throw new Error("Invalid response structure");

    return data.data;
  } catch (err) {
    return {
      status: "error",
      endpoint,
      message: err.message,
    };
  }
}


const samehadaku = {
  // 🏠 Halaman utama
  home: async () => fetchAPI("/home"),

  // 🆕 Anime terbaru
  latest: async (page = 1) => fetchAPI(`/recent?page=${page}`),

  // 🔍 Pencarian anime
  search: async (query, page = 1) => {
    if (!query) return { status: "error", message: "Parameter 'query' wajib diisi." };
    return fetchAPI(`/search?q=${encodeURIComponent(query)}&page=${page}`);
  },

  // 🔄 Anime ongoing
  ongoing: async (page = 1, order = "latest") => {
    const validOrders = ["popular", "latest", "update", "titlereverse", "title"];
    if (!validOrders.includes(order))
      return { status: "error", message: `Order tidak valid. Gunakan: ${validOrders.join(", ")}` };
    return fetchAPI(`/ongoing?page=${page}&order=${order}`);
  },

  // ✅ Anime completed
  completed: async (page = 1, order = "latest") => {
    const validOrders = ["popular", "latest", "update", "titlereverse", "title"];
    if (!validOrders.includes(order))
      return { status: "error", message: `Order tidak valid. Gunakan: ${validOrders.join(", ")}` };
    return fetchAPI(`/completed?page=${page}&order=${order}`);
  },

  // 🌟 Anime populer
  popular: async (page = 1) => {
    if (typeof page !== "number" || page < 1)
      return { status: "error", message: "Parameter 'page' harus berupa angka ≥ 1" };
    return fetchAPI(`/popular?page=${page}`);
  },

  // 🎬 Anime Movie
  movie: async (page = 1, order = "update") => {
    const validOrders = ["popular", "latest", "update", "titlereverse", "title"];
    if (!validOrders.includes(order))
      return { status: "error", message: `Order tidak valid. Gunakan: ${validOrders.join(", ")}` };
    return fetchAPI(`/movies?page=${page}&order=${order}`);
  },

  // 📚 Semua Anime
  list: async (page = 1, order = "latest") => {
    const validOrders = ["popular", "latest", "update", "titlereverse", "title"];
    if (!validOrders.includes(order))
      return { status: "error", message: `Order tidak valid. Gunakan: ${validOrders.join(", ")}` };
    return fetchAPI(`/list?page=${page}&order=${order}`);
  },

  // 🗓️ Jadwal rilis mingguan
  schedule: async () => fetchAPI("/schedule"),

  // 🎭 Semua genre anime
  genre: async () => fetchAPI("/genres"),

  // 🧩 Anime berdasarkan genre
  genres: async (genreId, page = 1) => {
    if (!genreId)
      return { status: "error", message: "Parameter 'genreId' wajib diisi." };
    return fetchAPI(`/genres/${genreId}?page=${page}`);
  },

  // 📦 Daftar batch anime
  batch: async (page = 1) => fetchAPI(`/batch?page=${page}`),

  // 🎌 Detail anime
  detail: async (animeId) => {
    if (!animeId)
      return { status: "error", message: "Parameter 'animeId' wajib diisi." };
    return fetchAPI(`/anime/${animeId}`);
  },

  // 🎥 Detail episode
  episode: async (episodeId) => {
    if (!episodeId)
      return { status: "error", message: "Parameter 'episodeId' wajib diisi." };
    const res = await fetchAPI(`/episode/${episodeId}`);
    return {
      ...res,
      source: "samehadaku",
      endpoint: "episodeDetail",
      episodeId,
    };
  },

  // 📦 Detail batch anime
  batchdetail: async (batchId) => {
    if (!batchId)
      return { status: "error", message: "Parameter 'batchId' wajib diisi." };
    return fetchAPI(`/batch/${batchId}`);
  },

  // 🎮 Link server nonton (embed)
  stream: async (serverId) => {
    if (!serverId)
      return { status: "error", message: "Parameter 'serverId' wajib diisi." };
    return fetchAPI(`/server/${serverId}`);
  },
};

export default samehadaku;