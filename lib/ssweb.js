// Ambil API key dari halaman
async function getApikeys(url = "https://urltoscreenshot.com/") {
  const res = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "upgrade-insecure-requests": "1"
    }
  });

  const html = await res.text();
  const match = html.match(/xhr\.setRequestHeader\(\s*['"]x-api-key['"]\s*,\s*['"](.+?)['"]\s*\)/);
  if (match) return match[1];
  throw new Error("API key tidak ditemukan di halaman");
}

// Screenshot pakai API Apilight
async function apilight(targetUrl, device = "phone", interval = 2000, maxRetries = 10) {
  const apiKey = await getApikeys();
  const deviceSizes = {
    phone: { width: 360, height: 640 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1366, height: 768 }
  };
  const { width, height } = deviceSizes[device] || deviceSizes.phone;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const apiUrl = `https://api.apilight.com/screenshot/get?url=${encodeURIComponent(targetUrl)}&base64=1&width=${width}&height=${height}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "accept": "text/plain, */*; q=0.01",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });
      const base64Data = await response.text();
      if (!base64Data || base64Data.toLowerCase().includes("error") || base64Data.length < 100) {
        await new Promise(res => setTimeout(res, interval));
        continue;
      }
      return { buffer: Buffer.from(base64Data, "base64"), mime: "image/png", width, height, device };
    } catch (err) {
      if (attempt === maxRetries) throw new Error(`SSWeb gagal setelah ${maxRetries} percobaan: ${err.message}`);
      await new Promise(res => setTimeout(res, interval));
    }
  }
}

// Screenshot pakai fwss.pages.dev
async function takeScreenshot(url, device = "desktop", fullPage = false) {
  const devices = {
    phone: { width: 375, height: 667 },
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1366, height: 768 },
    desktophd: { width: 1920, height: 1080 }
  };

  const { width, height } = devices[device] || devices.desktop;

  const body = {
    url,
    width,
    height,
    waitUntil: "networkidle0",
    timeout: 45000,
    fullPage
  };

  const response = await fetch("https://fwss.pages.dev/api/screenshot", {
    method: "POST",
    headers: { "accept": "*/*", "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`FWSS request gagal: ${response.status}`);
  return { buffer: Buffer.from(await response.arrayBuffer()), mime: "image/png", width, height, device };
}

// Handler utama dengan fallback otomatis
async function ssweb(imageUrl, device = "desktop", fullPage = false) {
  if (!imageUrl) throw new Error("URL target wajib diisi");

  let result;
  try {
    // Utamakan fullPage → fwss.pages.dev
    if (fullPage) {
      result = await takeScreenshot(imageUrl, device, fullPage);
    } else {
      result = await apilight(imageUrl, device);
    }
    return result;
  } catch (primaryErr) {
    try {
      // fallback ke layanan lainnya
      if (fullPage) {
        result = await apilight(imageUrl, device);
      } else {
        result = await takeScreenshot(imageUrl, device, fullPage);
      }
      return result;
    } catch (fallbackErr) {
      throw new Error(`Kedua layanan gagal: ${primaryErr.message} | ${fallbackErr.message}`);
    }
  }
}

export default ssweb