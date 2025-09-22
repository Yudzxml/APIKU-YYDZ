async function ttstalk(username, page = 1) {
  try {
    const profileResponse = await fetch(`https://api.tikviewer.com/api/profile/${username}`, {
      method: "GET",
      headers: {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "Referer": "https://tikviewer.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });
    if (!profileResponse.ok) throw new Error(`Profile HTTP error! status: ${profileResponse.status}`);
    const profile = await profileResponse.json();

    const videosResponse = await fetch(`https://api.tikviewer.com/api/videos/${username}?page=${page}`, {
      method: "GET",
      headers: {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "Referer": "https://tikviewer.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });
    if (!videosResponse.ok) throw new Error(`Videos HTTP error! status: ${videosResponse.status}`);
    const videos = await videosResponse.json();

    return { profile, videos };
  } catch (err) {
    console.error(err.message);
    return null;
  }
}

export default ttstalk
