require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Notion本文をテキスト化
function blocksToText(blocks) {
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      // Notion SDK v2: block.paragraph.rich_text
      return (block.paragraph.rich_text ?? block.paragraph.text ?? []).map(t => t.plain_text).join('');
    }
    return '';
  }).join('\n');
}

// Notionページ本文取得
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

// テンプレートディレクトリから .html ファイル一覧を再帰取得
function getAllTemplates(dir, prefix = '') {
  let files = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const relPath = path.join(prefix, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllTemplates(fullPath, relPath));
    } else if (file.endsWith('.html')) {
      files.push(relPath);
    }
  }
  return files;
}

// テンプレート名から出力先パスを決定
function templatePathToOutputPath(templatePath) {
  if (templatePath === 'top.html') return 'index.html';
  return templatePath.replace(/\.html$/, '/index.html');
}

// publicディレクトリの不要ファイル削除
function cleanOutputDir(baseDir, validFilesSet) {
  if (!fs.existsSync(baseDir)) return;

  for (const file of fs.readdirSync(baseDir)) {
    const fullPath = path.join(baseDir, file);
    const relPath = path.relative('public', fullPath);

    if (fs.statSync(fullPath).isDirectory()) {
      cleanOutputDir(fullPath, validFilesSet);
      // ディレクトリが空になったら削除
      if (fs.readdirSync(fullPath).length === 0) {
        fs.rmdirSync(fullPath);
      }
    } else {
      if (!validFilesSet.has(relPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted old file: ${relPath}`);
      }
    }
  }
}

async function main() {
  // 1. Notionページデータを取得
  const dbResponse = await notion.databases.query({ database_id: databaseId });
  // ページ名→ページデータ辞書を作る
  const notionPages = {};
  for (const page of dbResponse.results) {
    const title = page.properties.名前.title[0]?.plain_text || "No Title";
    const pageId = page.id;
    notionPages[title] = { pageId, page };
  }

  // 2. テンプレート一覧を取得
  const templates = getAllTemplates('public');
  // 生成されるべき出力ファイル一覧をセットとして保持
  const validFiles = templates.map(tpl => templatePathToOutputPath(tpl));
  const validFilesSet = new Set(validFiles);

  // 先に不要HTMLファイルの削除を実施
  cleanOutputDir('public', validFilesSet);

  // 3. テンプレートごとに出力
  for (const tpl of templates) {
    const tplFullPath = path.join('public', tpl);
    let html = fs.readFileSync(tplFullPath, 'utf8');

    // 4. テンプレート内の ${ページ名} を探してNotion本文で置換
    html = html.replace(/\$\{([^}]+)\}/g, (match, pageName) => {
      const entry = notionPages[pageName];
      if (!entry) return ''; // Notionに該当ページ名がなければ空
      return entry.body || ''; // bodyは後で取得
    });

    // 5. 置換内容（Notion本文）を取得して差し込む
    // すべての${...}についてbodyを取得
    const needBodyPages = [...html.matchAll(/\$\{([^}]+)\}/g)].map(m => m[1]);
    for (const pageName of needBodyPages) {
      if (notionPages[pageName] && !notionPages[pageName].body) {
        const blocks = await getPageBlocks(notionPages[pageName].pageId);
        notionPages[pageName].body = blocksToText(blocks);
      }
    }
    // 再度置換（本文取得後）
    html = html.replace(/\$\{([^}]+)\}/g, (match, pageName) => {
      const entry = notionPages[pageName];
      if (!entry) return '';
      return entry.body || '';
    });

    // 6. 出力先パスへ
    const outPath = path.join('public', templatePathToOutputPath(tpl));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`Generated: ${outPath}`);
  }
}

main();
