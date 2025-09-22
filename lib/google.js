import { getJson } from "serpapi";

// Google Search API V1 (SerpApi)
async function searchGoogleV1(query) {
  try {
    const json = await getJson({
      engine: "google",
      q: query,
      api_key: "82176516adba60819677a6cc21061cac10c22c1e715ddd4be670f31407dbe968"
    });

    const results = [];
    if (json.knowledge_graph) {
      results.push({
        title: json.knowledge_graph.title,
        link: json.knowledge_graph.website || json.knowledge_graph.knowledge_graph_search_link,
        snippet: json.knowledge_graph.description,
        source: "Knowledge Graph",
        img: json.knowledge_graph.thumbnail || null
      });
    }

    if (json.organic_results && json.organic_results.length) {
      json.organic_results.forEach(item => {
        results.push({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          source: item.source || null,
          img: item.favicon || null
        });
      });
    }

    if (json.top_stories && json.top_stories.length) {
      json.top_stories.forEach(item => {
        results.push({
          title: item.title,
          link: item.link,
          snippet: null,
          source: item.source || null,
          img: item.thumbnail || null
        });
      });
    }

    return results;

  } catch (err) {
    console.error("searchGoogleV1 error:", err);
    return [];
  }
}

// Google Search API V2 (searchapi.io)
async function searchGoogleV2(query) {
  const url = `https://www.searchapi.io/api/v1/search?api_key=bHfd73aPiGZuUJDtEThAGdbn&engine=google&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.organic_results) return [];

    return data.organic_results.map(item => ({
      position: item.position,
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: item.source
    }));

  } catch (err) {
    console.error("searchGoogleV2 error:", err);
    return [];
  }
}

// Google Search API V3 (serper.dev)
async function searchGoogleV3(query) {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": "92c6217415da57cbcfb56d7712fa937ba2f5b970",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query })
    });

    const data = await res.json();
    const organic = data.organic || [];

    return organic.map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: item.source || item.domain || ""
    }));

  } catch (err) {
    console.error("searchGoogleV3 error:", err);
    return [];
  }
}

// Fungsi utama, mencoba semua versi
async function google(query) {
  try {
    const result1 = await searchGoogleV1(query);
    if (result1.length) return result1;

    console.warn("searchGoogleV1 gagal, mencoba searchGoogleV2...");
    const result2 = await searchGoogleV2(query);
    if (result2.length) return result2;

    console.warn("searchGoogleV2 gagal, mencoba searchGoogleV3...");
    const result3 = await searchGoogleV3(query);
    if (result3.length) return result3;

    throw new Error("Semua search engine gagal dijalankan");
  } catch (err) {
    console.error(err.message);
    return [];
  }
}

export default google;