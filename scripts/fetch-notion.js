require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function main() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
