async function genshinstalk(roleId) {
  try {
    const response = await fetch(`https://genshin.dakgg.io/roles/${roleId}`, {
      method: "GET",
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "Referer": "https://dak.gg/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    return data;

  } catch (err) {
    console.error("Error fetching Genshin role:", err.message);
    return null;
  }
}

export default genshinstalk