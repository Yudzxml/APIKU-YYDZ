import * as cheerio from "cheerio";

async function chord(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 9; CPH1923) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.62 Mobile Safari/537.36",
        "Cookie": "__gads=ID=4513c7600f23e1b2-22b06ccbebcc00d1:T=1635371139:RT=1635371139:S=ALNI_MYShBeii6AFkeysWDKiD3RyJ1106Q; _ga=GA1.2.409783375.1635371138; _gid=GA1.2.1157186793.1635371140; _fbp=fb.1.1635371147163.1785445876"
      };

      // 1️⃣ Ambil hasil pencarian
      const searchUrl = `http://app.chordindonesia.com/?json=get_search_results&exclude=date,modified,attachments,comment_count,comment_status,thumbnail,thumbnail_images,author,excerpt,content,categories,tags,comments,custom_fields&search=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, { headers });
      if (!searchRes.ok) throw new Error(`Gagal fetch search: ${searchRes.status}`);
      const searchData = await searchRes.json();

      if (!searchData.posts || searchData.posts.length === 0) {
        throw new Error("Lagu tidak ditemukan");
      }

      // 2️⃣ Ambil detail chord dari post pertama
      const postId = searchData.posts[0].id;
      const postUrl = `http://app.chordindonesia.com/?json=get_post&id=${postId}`;
      const postRes = await fetch(postUrl, { headers });
      if (!postRes.ok) throw new Error(`Gagal fetch post: ${postRes.status}`);
      const postData = await postRes.json();

      // 3️⃣ Parsing HTML
      const $ = cheerio.load(postData.post.content);

      resolve({
        title: $("img").attr("alt") || searchData.posts[0].title,
        chord: $("pre").text().trim()
      });

    } catch (error) {
      reject(error);
    }
  });
}

export default chord;