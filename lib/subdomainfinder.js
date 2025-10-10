import { fetch } from "undici";

async function subdomainfinder(domain) {
  const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.120 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Ch-Ua":
          '"Not/A)Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "Connection": "keep-alive",
      },
    });

    if (!response.ok) throw new Error(`Gagal fetch data: status ${response.status}`);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Data dari crt.sh tidak valid JSON");
    }

    const subdomains = data
      .map((entry) => entry.name_value)
      .filter(Boolean)
      .flatMap((item) => item.split("\n"))
      .map((s) => s.replace(/^\*\./, "").trim().toLowerCase())
      .filter((s) => s.endsWith(domain.toLowerCase()));

    const uniqueSubdomains = [...new Set(subdomains)].sort();
    return uniqueSubdomains;
  } catch (error) {
    console.error("[subdomainfinder] Error:", error.message);
    throw new Error("Gagal mengambil data subdomain dari crt.sh");
  }
}

export default subdomainfinder
