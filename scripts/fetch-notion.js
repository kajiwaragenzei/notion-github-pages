require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// NotionブロックをシンプルにHTML化（paragraphのみ）
function blocksToHTML(blocks) {
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
      return `<p>${text}</p>`;
    }
    // 必要に応じて他のタイプ（heading, list など）に対応
    return '';
  }).join('\n');
}

// ページ本文ブロック取得
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

// HTMLテンプレート（必要に応じて編集）
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
  // 1. データベースのページ一覧を取得
  const dbResponse = await notion.databases.query({ database_id: databaseId });
  for (const page of dbResponse.results) {
    // 2. url属性で出力先を決定
    const url = page.properties.url?.rich_text?.[0]?.plain_text?.replace(/^\//, '').replace(/[^a-zA-Z0-9/_-]/g, '') || page.id;
    const title = page.properties.名前?.title?.[0]?.plain_text || "No Title";
    const pageId = page.id;

    // 3. 本文取得
    const blocks = await getPageBlocks(pageId);
    const bodyHtml = blocksToHTML(blocks);

    // 4. テンプレートに埋め込んでHTML生成
    const html = renderHtml(title, bodyHtml);

    // 5. public/{url}/index.html へ保存
    const outDir = path.join('public', url);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    console.log(`Generated: ${path.join(outDir, 'index.html')}`);
  }
}

main();
