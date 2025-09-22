import got from "got";

async function githubstalk(user) {
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}`;
    const { body } = await got(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Yudzxml Bot)",
        Accept: "application/vnd.github.v3+json",
      },
      responseType: "json",
    });

    const data = body;

    return {
      username: data.login,
      nickname: data.name,
      bio: data.bio,
      id: data.id,
      nodeId: data.node_id,
      profile_pic: data.avatar_url,
      url: data.html_url,
      type: data.type,
      admin: data.site_admin,
      company: data.company,
      blog: data.blog,
      location: data.location,
      email: data.email,
      public_repo: data.public_repos,
      public_gists: data.public_gists,
      followers: data.followers,
      following: data.following,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error("❌ Error fetching GitHub user:", err.message);
    throw err;
  }
}

// contoh pemanggilan
export default githubstalk