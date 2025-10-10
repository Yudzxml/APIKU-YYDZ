import got from "got";

const headers = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": "\"Android\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "Referer": "https://www.freeconvert.com/video-converter",
  "Referrer-Policy": "unsafe-url",
  "user-agent": "Mozilla/5.0 (Linux; Android 11; CPH2209) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36"
};

async function getUrlInfo(fileUrl) {
  try {
    let detectedExt = null;
    try {
      const parsedUrl = new URL(fileUrl);
      const match = parsedUrl.pathname.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
      if (match) detectedExt = match[1].toLowerCase();
    } catch {}
    if (!detectedExt) {
      try {
        const headResponse = await got.head(fileUrl, { headers });
        const contentType = headResponse.headers["content-type"] || "";
        if (contentType.includes("image/jpeg")) detectedExt = "jpg";
        else if (contentType.includes("image/png")) detectedExt = "png";
        else if (contentType.includes("image/webp")) detectedExt = "webp";
        else if (contentType.includes("image/gif")) detectedExt = "gif";
        else if (contentType.includes("video/mp4")) detectedExt = "mp4";
        else if (contentType.includes("video/webm")) detectedExt = "webm";
        else if (contentType.includes("audio/mpeg")) detectedExt = "mp3";
        else if (contentType.includes("application/pdf")) detectedExt = "pdf";
        else detectedExt = "bin";
      } catch {
        detectedExt = "webp";
      }
    }
    const response = await got.post("https://api.freeconvert.com/v1/query/url-info", {
      headers,
      json: { url: fileUrl, ext: detectedExt },
      responseType: "json"
    });
    return { ...response.body, ext: detectedExt };
  } catch (error) {
    return { error: true, message: error.message };
  }
}

async function getConvertOptions(input_format = "webp", output_format = "jpg", lang = "en") {
  try {
    const url = `https://api.freeconvert.com/v1/query/view/options?include=options&operation=convert&output_format=${output_format}&lang=${lang}&input_format=${input_format}&slug=video-converter`;
    const { body: json } = await got.get(url, { headers, responseType: "json" });
    const result = {};
    function traverse(options) {
      if (!Array.isArray(options)) return;
      for (const opt of options) {
        if (opt.name && "default_value" in opt) {
          result[opt.name] = parseOptionValue(opt.default_value, opt.input_type);
        }
        if (Array.isArray(opt.metas)) {
          const def = opt.metas.find(m => m.is_default);
          if (def && def.value) result[opt.name] = def.value;
        }
        if (Array.isArray(opt.children)) traverse(opt.children);
        if (Array.isArray(opt.options)) traverse(opt.options);
      }
    }
    function parseOptionValue(value, type) {
      if (type === "boolean") return value === "true";
      if (type === "integer" || type === "number") return parseInt(value, 10);
      return value;
    }
    traverse(json.options);
    return {
      success: true,
      source: input_format,
      target: output_format,
      info: {
        operation: "convert",
        sourceExt: input_format,
        targetExt: output_format,
        sourceFormat: json.sourceFormat?.name || null,
        targetFormat: json.targetFormat?.name || null
      },
      options: result
    };
  } catch (error) {
    return { error: true, message: error.message };
  }
}

async function createFreeConvertJob(fileUrl, from = "webp", to = "jpg", options = {}) {
  try {
    const { body: data } = await got.post("https://api.freeconvert.com/v1/process/jobs", {
      headers,
      json: {
        tasks: {
          import: {
            operation: "import/url",
            url: fileUrl,
            filename: fileUrl.split("/").pop() || `file.${from}`
          },
          convert: {
            operation: "convert",
            input: "import",
            input_format: from,
            output_format: to,
            options
          },
          "export-url": {
            operation: "export/url",
            input: "convert"
          }
        }
      },
      responseType: "json"
    });
    const linkSelf = data?.links?.self;
    if (!linkSelf) throw new Error("Link self tidak ditemukan di response.");
    return linkSelf;
  } catch (error) {
    return { error: true, message: error.message };
  }
}

async function fetchJobResults(jobUrl, interval = 3000, timeout = 30000) {
  const start = Date.now();
  while (true) {
    try {
      const { body: data } = await got.get(jobUrl, { headers, responseType: "json" });
      if (!Array.isArray(data.tasks)) throw new Error("Data job tidak valid.");
      if (data.status === "completed") {
        const allLinks = data.tasks
          .filter(t => t.status === "completed" && t.result?.url)
          .map(t => ({
            task: t.name,
            operation: t.operation,
            url: t.result.url,
            size: t.result.size || null
          }));
        return allLinks;
      }
      if (Date.now() - start > timeout)
        throw new Error("Waktu polling habis, job belum selesai.");
      await new Promise(r => setTimeout(r, interval));
    } catch (err) {
      return { error: true, message: err.message };
    }
  }
}

async function convert(fileUrl, targetFormat = "jpg") {
  const info = await getUrlInfo(fileUrl);
  if (info.error) return info;
  const from = info.ext || "webp";
  const opts = await getConvertOptions(from, targetFormat);
  const job = await createFreeConvertJob(fileUrl, from, targetFormat, opts.options);
  const result = await fetchJobResults(job);
  return result;
}

export default convert
