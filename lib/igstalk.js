const instagramConfig = {
  posts: {
    url: "https://tools.xrespond.com/api/instagram/media/posts",
    body: (username) =>
      `------WebKitFormBoundaryXaEwce5zfSFWB7OQ\r\nContent-Disposition: form-data; name="profile"\r\n\r\n${username}\r\n------WebKitFormBoundaryXaEwce5zfSFWB7OQ--\r\n`,
    headers: {
      "accept": "*/*",
      "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryXaEwce5zfSFWB7OQ",
      "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": "https://bitchipdigital.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    }
  },
  highlights: {
    url: "https://tools.xrespond.com/api/instagram/media/highlights",
    body: (username) =>
      `------WebKitFormBoundarymI0mxaB302CcASCB\r\nContent-Disposition: form-data; name="profile"\r\n\r\n${username}\r\n------WebKitFormBoundarymI0mxaB302CcASCB--\r\n`,
    headers: {
      "accept": "*/*",
      "content-type": "multipart/form-data; boundary=----WebKitFormBoundarymI0mxaB302CcASCB",
      "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": "https://bitchipdigital.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    }
  },
  reels: {
    url: "https://tools.xrespond.com/api/instagram/media/reels",
    body: (username) =>
      `------WebKitFormBoundaryPjTynqUNHso8JtZC\r\nContent-Disposition: form-data; name="profile"\r\n\r\n${username}\r\n------WebKitFormBoundaryPjTynqUNHso8JtZC--\r\n`,
    headers: {
      "accept": "*/*",
      "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryPjTynqUNHso8JtZC",
      "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": "https://bitchipdigital.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    }
  },
  stories: {
    url: "https://tools.xrespond.com/api/instagram/media/stories",
    body: (username) =>
      `------WebKitFormBoundaryE2XPxkBuGmpsnPhK\r\nContent-Disposition: form-data; name="profile"\r\n\r\n${username}\r\n------WebKitFormBoundaryE2XPxkBuGmpsnPhK--\r\n`,
    headers: {
      "accept": "*/*",
      "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryE2XPxkBuGmpsnPhK",
      "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": "https://bitchipdigital.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    }
  }
};
async function getInstagramPosts(username) {
  const conf = instagramConfig.posts;
  const res = await fetch(conf.url, { method: "POST", headers: conf.headers, body: conf.body(username) });
  if (!res.ok) throw new Error(`posts fetch error: ${res.status}`);
  const result = await res.json();

  // ambil data penting aja
  const posts = result.data.data.items.map(post => {
    return {
      id: post.id,
      caption: post.caption,
      is_video: post.is_video,
      taken_at: post.taken_at_date,
      thumbnail: post.thumbnail_url,
      images: post.carousel_media
        ? post.carousel_media.map(media => media.image_versions.items[0].url)
        : post.image_versions?.items.map(img => img.url) || []
    };
  });

  return posts;
}
async function getInstagramHighlights(username) {
  const conf = instagramConfig.highlights;
  const res = await fetch(conf.url, { 
    method: "POST", 
    headers: conf.headers, 
    body: conf.body(username) 
  });
  if (!res.ok) throw new Error(`highlights fetch error: ${res.status}`);
  
  const json = await res.json();
  const highlights = json?.data?.data?.items || [];

  // Ambil data penting saja
  const simplified = highlights.map(h => ({
    id: h.id,
    title: h.title,
    media_count: h.media_count,
    created_at: h.created_at,
    cover_image: h.cover_media?.cropped_image_version?.url || null,
    username: h.user?.username,
    full_name: h.user?.full_name,
    profile_pic: h.user?.profile_pic_url
  }));

  return JSON.stringify({highlights: simplified }, null, 2);
}
async function getInstagramReels(username) {
  const conf = instagramConfig.reels;
  const res = await fetch(conf.url, { 
    method: "POST", 
    headers: conf.headers, 
    body: conf.body(username) 
  });
  if (!res.ok) throw new Error(`reels fetch error: ${res.status}`);
  const data = await res.json();

  // Extract simplified list
  const reels = data.data?.data?.items?.map(item => ({
    id: item.id,
    code: item.code,
    username: item.caption?.user?.username,
    full_name: item.caption?.user?.full_name,
    avatar: item.caption?.user?.profile_pic_url,
    caption: item.caption?.text,
    hashtags: item.caption?.hashtags,
    is_video: item.is_video,
    duration_ms: item.clips_metadata?.original_sound_info?.duration_in_ms,
    media_url: item.clips_metadata?.progressive_download_url || item.image_versions?.items?.[0]?.url,
    like_count: item.like_count,
    play_count: item.play_count,
    created_at: item.caption?.created_at
  }));

  return reels;
}
async function getInstagramStories(username) {
  try {
    const conf = instagramConfig.stories;
    const res = await fetch(conf.url, {
      method: "POST",
      headers: conf.headers,
      body: conf.body(username)
    });

    if (!res.ok) throw new Error(`Stories fetch error: ${res.status}`);

    const result = await res.json();

    // Ambil data penting saja
    const user = result.data.data.user;
    const items = result.data.data.items.map(item => {
      return {
        id: item.id,
        media_type: item.media_type === 1 ? 'image' : 'video',
        media_url: item.image_versions?.items?.[0]?.url || item.video_versions?.[0]?.url || null,
        caption: item.caption || null,
        duration_ms: item.video_duration_ms || null,
        expiring_at: item.expiring_at
      };
    });

    return {
      user: {
        username: user.username,
        full_name: user.full_name,
        profile_pic: user.profile_pic_url,
        is_private: user.is_private
      },
      stories: items
    };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}
async function igstalk(username) {
  try {
    const posts = await getInstagramPosts(username);
    const highlights = await getInstagramHighlights(username);
    const reels = await getInstagramReels(username);
    const stories = await getInstagramStories(username);

    return { posts, highlights, reels, stories };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default igstalk


