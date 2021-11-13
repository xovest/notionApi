const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY })

function createSuggestion({ title }) {
  notion.pages.create({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID
    },
    properties: {
      [process.env.NOTION_TITLE_ID]: {
        title: [
          {
            type: 'text',
            text: {
              content: title
            }
          }
        ]
      }
    }
  });
}