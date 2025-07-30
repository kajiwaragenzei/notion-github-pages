const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require("fs");
const path = require("path");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

const pageId = process.env.NOTION_PAGE_ID;

async function main() {
  // Notionページ→Markdown変換
  const mdblocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdblocks);

  // Markdown→HTML変換（markdown-itなど）
  const md = require("markdown-it")();
  const html = md.render(mdString);

  // テンプレート読み込み
  const template = fs.readFileSync(path.join(__dirname, "../public/template.html"), "utf8");
  // 埋め込み
  const result = template.replace("<!--NOTION_CONTENT-->", html);

  // 出力
  fs.writeFileSync(path.join(__dirname, "../public/index.html"), result);
}

main();
