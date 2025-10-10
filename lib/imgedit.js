import got from 'got';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const promptV1 =
  "Using the nano-banana model, a commercial 1/7 scale figurine of the character in the picture was created, depicting a realistic style and a realistic environment. The figurine is placed on a computer desk with a round transparent acrylic base. There is no text on the base. The computer screen shows the Zbrush modeling process of the figurine. Next to the computer screen is a BANDAI-style toy box with the original painting printed on it.";

const imgedit = {
  getToken: async () => {
    const url = 'https://notegpt.io/api/v1/oss/sts-token';
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
      referer: 'https://notegpt.io/ai-image-editor',
    };

    const res = await got.get(url, { headers, responseType: 'json' });
    if (!res.body || res.body.code !== 100000) throw new Error('Gagal getToken');
    return res.body;
  },

  uploadFromUrl: async (imageUrl) => {
    const tokenData = await imgedit.getToken();
    const { AccessKeyId, AccessKeySecret, SecurityToken } = tokenData.data || {};
    if (!AccessKeyId || !AccessKeySecret || !SecurityToken) throw new Error('Token tidak lengkap');
    const imgRes = await got(imageUrl, { responseType: 'buffer' });
    const contentType = imgRes.headers['content-type'] || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const fileName = `${uuidv4()}.${ext}`;

    const bucketName = 'nc-cdn';
    const objectKey = `notegpt/web3in1/${fileName}`;
    const ossPath = `/${bucketName}/${objectKey}`;
    const uploadUrl = `https://${bucketName}.oss-us-west-1.aliyuncs.com/${objectKey}`;
    const date = new Date().toUTCString();

    const canonicalizedHeaders = [`x-oss-date:${date}`, `x-oss-security-token:${SecurityToken}`]
      .sort()
      .join('\n');
    const stringToSign = ['PUT', '', contentType, date, canonicalizedHeaders, ossPath].join('\n');
    const signature = crypto.createHmac('sha1', AccessKeySecret).update(stringToSign).digest('base64');
    const authorization = `OSS ${AccessKeyId}:${signature}`;

    const headers = {
      Authorization: authorization,
      'Content-Type': contentType,
      Date: date,
      'x-oss-date': date,
      'x-oss-security-token': SecurityToken,
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
      Referer: 'https://notegpt.io/',
      Origin: 'https://notegpt.io',
    };

    const res = await got.put(uploadUrl, {
      headers,
      body: imgRes.rawBody,
      throwHttpErrors: false,
    });

    if (res.statusCode === 200) return uploadUrl;
    throw new Error(`Upload gagal: ${res.statusCode}`);
  },

  start: async (imageUrl, userPrompt = promptV1) => {
    const randomUserId = uuidv4();
    const randomSessionId = uuidv4();

    const payload = {
      image_url: imageUrl,
      type: 60,
      user_prompt: userPrompt,
      aspect_ratio: 'match_input_image',
      num: 1,
      model: 'google/nano-banana',
      sub_type: 3,
    };

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
      'Content-Type': 'application/json; charset=UTF-8',
      origin: 'https://notegpt.io',
      referer: `https://notegpt.io/ai-image-editor?s=${randomSessionId}`,
      Cookie: `anonymous_user_id=${randomUserId}`,
    };

    const res = await got.post('https://notegpt.io/api/v2/images/handle', {
      headers,
      json: payload,
      responseType: 'json',
    });

    return {
      sessionInfo: { sessionId: randomSessionId, userId: randomUserId },
      data: res.body,
    };
  },

  checkStatus: async (sessionId, sessionInfo) => {
    const url = 'https://notegpt.io/api/v2/images/status';
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
      referer: `https://notegpt.io/ai-image-editor?s=${sessionInfo.sessionId || sessionId}`,
      Cookie: `anonymous_user_id=${sessionInfo.userId}`,
    };

    const res = await got.get(url, {
      headers,
      searchParams: { session_id: sessionId },
      responseType: 'json',
    });
    return res.body;
  },

  create: async (imageUrl, userPrompt = promptV1) => {
    try {
      const uploadedUrl = await imgedit.uploadFromUrl(imageUrl);
      const startResponse = await imgedit.start(uploadedUrl, userPrompt);

      const body = startResponse.data;
      if (!body || body.code !== 100000 || !body.data?.session_id)
        throw new Error(`Gagal memulai proses: ${body?.message || 'Session ID tidak ditemukan'}`);

      const sessionId = body.data.session_id;
      const sessionInfo = startResponse.sessionInfo;
      let finalResult = null;

      for (;;) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const statusResponse = await imgedit.checkStatus(sessionId, sessionInfo);

        if (!statusResponse) throw new Error('Tidak ada response saat cek status.');
        if (statusResponse.code !== 100000)
          throw new Error(`Gagal saat cek status: ${statusResponse.message || 'unknown'}`);

        const statusData = statusResponse.data;
        console.log(`Status: ${statusData.status}`);

        if (statusData.status === 'succeeded') {
          finalResult = statusData;
          break;
        }
        if (statusData.status === 'failed') throw new Error('server meledak');
      }

      return finalResult;
    } catch (err) {
      console.error(`gagal: ${err.message}`);
      throw err;
    }
  },
};

export default imgedit;