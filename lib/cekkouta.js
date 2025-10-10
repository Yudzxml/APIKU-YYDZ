import { request } from 'undici';

async function cekkouta(number) {
  const url = `https://bendith.my.id/end.php?check=package&number=${number}&version=2`;

  const headers = {
    "accept": "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
    "Mozilla/5.0 (Linux; Android 11; CPH2209) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
    "Referer": "https://bendith.my.id/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };

  try {
    const { statusCode, body: resBody } = await request(url, {
      method: "GET",
      headers
    });

    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`HTTP error! Status: ${statusCode}`);
    }

    const data = await resBody.json().catch(async () => await resBody.text());

    return data;

  } catch (error) {
    console.error("❌ Terjadi kesalahan saat memeriksa kuota:", error);
    return { error: error.message };
  }
}

export default cekkouta;