import got from "got";
import { fileTypeFromBuffer } from "file-type";
import qs from "qs";

const tools = ["removebg", "enhance", "upscale", "restore", "colorize"];

const pxpic = {
  upload: async (input) => {
    let buffer;

    if (Buffer.isBuffer(input)) {
      buffer = input;
    } else if (typeof input === "string") {
      // ambil file dari URL
      const res = await got(input, { responseType: "buffer" });
      buffer = res.body;
    } else {
      throw new Error("Input harus berupa Buffer atau URL string");
    }

    // deteksi tipe file
    const type = await fileTypeFromBuffer(buffer);
    if (!type?.ext || !type?.mime) {
      throw new Error("Gagal deteksi tipe file");
    }

    const fileName = `${Date.now()}.${type.ext}`;

    // ambil signed URL untuk upload
    const { body: signedRes } = await got.post("https://pxpic.com/getSignedUrl", {
      json: { folder: "uploads", fileName },
      responseType: "json",
    });

    const { presignedUrl } = signedRes;
    if (!presignedUrl) throw new Error("Gagal mendapatkan signed URL");

    // upload file ke signed URL
    await got.put(presignedUrl, {
      headers: { "Content-Type": type.mime },
      body: buffer,
    });

    const cdnDomain = "https://files.fotoenhancer.com/uploads/";
    return `${cdnDomain}${fileName}`;
  },

  create: async (input, tool) => {
    if (!tools.includes(tool)) {
      return `Pilih salah satu dari tools ini: ${tools.join(", ")}`;
    }

    const url = await pxpic.upload(input);

    const data = qs.stringify({
      imageUrl: url,
      targetFormat: "png",
      needCompress: "no",
      imageQuality: "100",
      compressLevel: "6",
      fileOriginalExtension: "png",
      aiFunction: tool,
      upscalingLevel: "",
    });

    const { body } = await got.post("https://pxpic.com/callAiFunction", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
        Accept:
          "application/json, text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        "accept-language": "id-ID",
      },
      body: data,
      responseType: "json",
    });

    return body;
  },
};

export default pxpic;
