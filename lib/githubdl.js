import { request } from 'undici';
import JSZip from 'jszip';

async function fetchBuffer(url, headers = {}) {
    const { body, status, statusText } = await request(url, { headers });
    if (status < 200 || status >= 300) throw new Error(`Gagal fetch: ${status} ${statusText}`);
    return Buffer.from(await body.arrayBuffer());
}

async function fetchJson(url, headers = {}) {
    const { body, status, statusText } = await request(url, { headers });
    if (status < 200 || status >= 300) throw new Error(`Gagal fetch: ${status} ${statusText}`);
    return body.json();
}

async function githubdl(githubUrl) {
    const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/([^\/]+)(?:\/tree\/([^\/]+)\/(.+))?(?:\/blob\/([^\/]+)\/(.+))?/i;
    const match = githubUrl.match(regex);
    if (!match) throw new Error("URL GitHub tidak valid");

    const [ , user, repo, treeBranch, treePath, blobBranch, blobPath ] = match;

    if (blobPath) {
        const branch = blobBranch || 'main';
        const fileUrl = `https://api.github.com/repos/${user}/${repo}/contents/${blobPath}?ref=${branch}`;
        return await fetchBuffer(fileUrl, { 'Accept': 'application/vnd.github.v3.raw' });
    }

    if (treePath) {
        const branch = treeBranch || 'main';
        const folderUrl = `https://api.github.com/repos/${user}/${repo}/contents/${treePath}?ref=${branch}`;
        const items = await fetchJson(folderUrl);

        const zip = new JSZip();
        for (const item of items) {
            if (item.type === 'file') {
                const fileBuffer = await fetchBuffer(item.download_url);
                zip.file(item.name, fileBuffer);
            } else if (item.type === 'dir') {
                const subBuffer = await githubdl(`https://github.com/${user}/${repo}/tree/${branch}/${treePath}/${item.name}`);
                zip.file(item.name + '.zip', subBuffer);
            }
        }
        return await zip.generateAsync({ type: 'nodebuffer' });
    }

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;
    return await fetchBuffer(apiUrl);
}

export default githubdl