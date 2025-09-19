async function twitterstalk(username) {
  try {
    const response = await fetch("https://twitterviewer.net/api/get-user", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": "_utid=594455294; _ga_RMR9QFK3WB=GS2.1.s1757581625$o1$g0$t1757581625$j60$l0$h0; _ga=GA1.1.635421669.1757581626; _clck=1dqapyg%5E2%5Efz8%5E0%5E2080; __gads=ID=38855e4a98bb660c:T=1757581627:RT=1757581627:S=ALNI_Ma94gD5QFQGwMaT6nb_eM76-QLk2w; __gpi=UID=0000119520e3f61e:T=1757581627:RT=1757581627:S=ALNI_MYKrX3Q5wA61odsyYRsjbxyhW6b4A; __eoi=ID=4a2bbe13dc00aa0c:T=1757581627:RT=1757581627:S=AA-Afjacy4IlwgZNndLahLUEoVW3; _clsk=1prwyup%5E1757581627083%5E1%5E1%5Ev.clarity.ms%2Fcollect; FCNEC=%5B%5B%22AKsRol_yrWQriu-CUx6ruvXS1EhP0_dZ39UV0VkSF4npMkRklzVYpCnxoD0P0fQhWswzWanYHYm0jQklLZ3ZP_v30PMG_-Ph0ntp3r3qbOc-OB6zUCk-Ep4s_47-wI4v8m88gLMKPIpA79OZcV0bY5NzlJpJHKvR8w%3D%3D%22%5D%5D",
        "Referer": "https://twitterviewer.net/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: JSON.stringify({ username })
    });

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    return data

  } catch (err) {
    console.error("Error fetching Twitter user:", err.message);
    return null;
  }
}

export default twitterstalk