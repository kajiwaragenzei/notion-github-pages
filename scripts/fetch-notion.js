const { Client } = require("@notionhq/client");
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function fetchNotionContent() {
  const response = await notion.databases.query({ database_id: databaseId });
  // ここでNotionのデータをHTML化
  // 必要に応じてMarkdown→HTML変換ライブラリを使う
  return `<ul>` + response.results.map(r => `<li>${r.id}</li>`).join('') + `</ul>`;
}

async function buildPage() {
  const template = fs.readFileSync(path.join(__dirname, '../public/template.html'), 'utf8');
  const notionContent = await fetchNotionContent();

  const result = template.replace('<!--NOTION_CONTENT-->', notionContent);
  fs.writeFileSync(path.join(__dirname, '../public/index.html'), result);
}

buildPage();