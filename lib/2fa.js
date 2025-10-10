async function get2FAToken(code) {
  if (!code) throw new Error("Kode 2FA wajib diisi");

  try {
    const url = `https://2fa.live/tok/${code}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "_gcl_au=1.1.1225609475.1757723318; _ga_R2SB88WPTD=GS2.1.s1757723318$o1$g0$t1757723318$j60$l0$h0; _ga=GA1.2.486286358.1757723318; _gid=GA1.2.1817825694.1757723318; _gat_gtag_UA_78777107_1=1",
        "Referer": "https://2fa.live/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });

    if (!res.ok) throw new Error(`Request gagal dengan status ${res.status}`);

    const data = await res.json();
    if (!data || !data.token) throw new Error("Response tidak mengandung token");

    return data.token;

  } catch (error) {
    console.error("Gagal mengambil token:", error.message);
    throw new Error("Tidak bisa mengambil token 2FA");
  }
}

export default get2FAToken
