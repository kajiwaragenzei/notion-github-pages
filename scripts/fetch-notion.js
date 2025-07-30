require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

function blocksToHTML(blocks) {
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
      return `<p>${text}</p>`;
    }
    return '';
  }).join('\n');
}

async function getPageBlocks(pageId) {
  const blocks = [];
  let cursor;
  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...response.results);
    cursor = response.next_cursor;
  } while (cursor);
  return blocks;
}

function renderHtml(title, body) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`;
}

async function main() {
  const dbResponse = await notion.databases.query({ database_id: databaseId });
  for (const page of dbResponse.results) {
    // 1. pathプロパティを取得（text型もrich_text型も対応）
    let rawPath = page.properties.path?.rich_text?.[0]?.plain_text || page.properties.path?.plain_text || page.id;
    if (!rawPath || rawPath.trim() === '') {
      rawPath = page.id;
    }
    // 2. ルートパス対応
    let urlPath = rawPath.trim();
    if (urlPath === '/' || urlPath === '') {
      urlPath = '';
    } else {
      // 先頭・末尾スラッシュ除去 & スラッシュ区切り
      urlPath = urlPath.replace(/^\/|\/$/g, '');
    }
    const outDir = urlPath ? path.join('public', urlPath) : 'public';
    const title = page.properties.名前?.title?.[0]?.plain_text || "No Title";
    const pageId = page.id;

    const blocks = await getPageBlocks(pageId);
    const bodyHtml = blocksToHTML(blocks);
    const html = renderHtml(title, bodyHtml);

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    console.log(`Generated: ${path.join(outDir, 'index.html')}`);
  }
}

main();
