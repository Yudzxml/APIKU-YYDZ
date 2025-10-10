async function capcut(url) {
  try {
    const response = await fetch('https://www.genviral.io', {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const cookies = response.headers.get('set-cookie');
    let cookieHeader = '';
    if (cookies) {
      cookieHeader = cookies.split(',').map(cookie => cookie.trim()).join('; ');
    }

    const apiResponse = await fetch('https://www.genviral.io/api/tools/social-downloader', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'content-type': 'application/json',
        'cookie': cookieHeader,
      },
      body: JSON.stringify({
        url: url,
      }),
    });

    const apiData = await apiResponse.json();
    if (!apiData.status) {
      apiData.status = 200;
    }

    return apiData;

  } catch (error) {
    console.error('Error occurred:', error);
    return { status: 500, error: error.message };
  }
}

export default capcut