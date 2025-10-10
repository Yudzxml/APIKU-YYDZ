async function getToken() {
  try {
    const mssid = 081275673391 // GANTI NO HP LU YA MONYET
    const response = await fetch("https://api.duniagames.co.id/api/item-catalog/v1/get-token", {
      method: "POST",
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "id",
        "ciam-type": "FR",
        "content-type": "application/json",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-device": "a097a27b-07f2-4075-ae49-88c2553eee73", // GAUSA DI GANTI KLO GAMAU ERROR
        "Referer": "https://duniagames.co.id/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: JSON.stringify({ mssid })
    });


    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text; 
    }

    return {
      token: data.data.token
    };

  } catch (err) {
    console.error("Error saat ambil token:", err.message);
    return null;
  }
}

async function mlstalk(serverid, zoneId) {
  try {
    const payload = {
      productId: 1,
      itemId: 66,
      product_ref: "REG",
      product_ref_denom: "REG",
      catalogId: 121,
      paymentId: 6361,
      gameId: serverid || "",
      zoneId: zoneId || "",
      campaignUrl: ""
    };

    const { token } = await getToken();
    if (!token) throw new Error("Gagal mendapatkan token");

    const response = await fetch("https://api.duniagames.co.id/api/transaction/v1/top-up/inquiry/store", {
      method: "POST",
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "id",
        "ciam-type": "FR",
        "content-type": "application/json",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-device": "a097a27b-07f2-4075-ae49-88c2553eee73", // GAUSA DI GANTI KLO GAMAU ERROR
        "x-token": token,
        "Referer": "https://duniagames.co.id/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Request gagal: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = data?.data;

    if (!result) {
      throw new Error("Response tidak berisi data user");
    }

    return {
      name: result.userNameGame || null,
      gameid: result.gameId || serverid || null,
      zoneid: result.zoneId || zoneId || null
    };
  } catch (err) {
    console.error("Error saat inquiry top-up:", err.message);
    return null;
  }
}

// contoh pemakaian
mlstalk(1235xxxx, 7362xx)