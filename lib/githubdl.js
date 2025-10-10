import JSZip from "jszip";
import { fetch } from "undici";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

async function getRepoData(username, repo) {
  try {
    console.log(`🔍 Mengambil data repo: ${username}/${repo}`);
    const url = `https://api.github.com/repos/${username}/${repo}`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": CHROME_UA,
      },
    });
    if (!response.ok) throw new Error(`Gagal mengambil data: ${response.statusText}`);
    const data = await response.json();
    const branch = data?.default_branch || "main";
    const downloadUrl = data?.downloads_url;
    console.log(`✅ Branch default: ${branch}`);
    return { branch, downloadUrl };
  } catch (error) {
    console.error(`❌ Gagal getRepoData(${username}/${repo}):`, error.message);
    return {
      status: 500,
      author: "Yudzxml",
      error: error.message,
    };
  }
}

async function repodl(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("URL tidak valid!");

  const username = match[1];
  const repo = match[2];
  console.log(`📦 Mode repo penuh: ${username}/${repo}`);

  const { branch } = await getRepoData(username, repo);
  console.log(`📥 Mengunduh ZIP dari branch: ${branch}`);

  const url = `https://codeload.github.com/${username}/${repo}/zip/refs/heads/${branch}`;
  console.log(`🌐 Fetch URL: ${url}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": CHROME_UA,
    },
  });
  if (!response.ok) throw new Error(`Gagal mengunduh: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();

  console.log(`✅ ZIP berhasil diunduh (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  return Buffer.from(arrayBuffer);
}

async function fetchGitHubSubfolder(username, repo, branch, subfolder) {
  console.log(`📂 Mode subfolder: ${username}/${repo}/${subfolder}@${branch}`);

  async function fetchFolderContents(pathInRepo = "") {
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${pathInRepo}?ref=${branch}`;
    console.log(`🔹 Fetch folder: ${apiUrl}`);
    const res = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": CHROME_UA,
      },
    });
    if (!res.ok) throw new Error(`Gagal ambil data dari ${apiUrl}: ${res.status}`);

    const items = await res.json();
    const results = [];

    for (const item of items) {
      if (item.type === "file" && item.download_url) {
        console.log(`🧩 File ditemukan: ${item.path}`);
        results.push({ path: item.path, download_url: item.download_url });
      } else if (item.type === "dir") {
        console.log(`📁 Menelusuri folder: ${item.path}`);
        const subFiles = await fetchFolderContents(item.path);
        results.push(...subFiles);
      }
    }
    return results;
  }

  const files = await fetchFolderContents(subfolder);
  console.log(`📦 Total file ditemukan: ${files.length}`);

  const zip = new JSZip();
  for (const file of files) {
    const res = await fetch(file.download_url, {
      headers: { "User-Agent": CHROME_UA },
    });
    if (!res.ok) {
      console.warn(`⚠️ Gagal unduh ${file.path} (${res.status})`);
      continue;
    }
    const arrayBuffer = await res.arrayBuffer();
    zip.file(file.path, Buffer.from(arrayBuffer));
    console.log(`✅ Tambah ke ZIP: ${file.path}`);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  console.log(`🎁 ZIP berhasil dibuat (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  return zipBuffer;
}

async function githubdl(repoUrl) {
  console.log(`🚀 Memulai download GitHub URL: ${repoUrl}`);
  const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(?:\/(.*))?)?/;
  const match = repoUrl.match(regex);
  if (!match) throw new Error("URL GitHub tidak valid!");

  const username = match[1];
  const repo = match[2];
  const branch = match[3];
  const subfolder = match[4];

  console.log(
    `🧠 Parsed => username: ${username}, repo: ${repo}, branch: ${branch || "default"}, subfolder: ${subfolder || "(none)"}`
  );

  if (subfolder) {
    const buffer = await fetchGitHubSubfolder(username, repo, branch || "main", subfolder);
    console.log(`✅ Subfolder ZIP size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    return buffer;
  } else {
    const buffer = await repodl(repoUrl);
    console.log(`✅ Repo ZIP size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    return buffer;
  }
}

export default githubdl;