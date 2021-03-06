const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY })

async function getTags() {
  const database = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });

  return notionPropsById(database.properties)[process.env.NOTION_TAGS_ID].multi_select.options.map(option => {
    return { id: option.id, name: option.name };
  });
}

function notionPropsById(props) {
  return Object.values(props).reduce((obj, prop) => {
    const { id, ...rest } = prop;
    return { ...obj, [id]: rest };
  }, []);
}

function createSuggestion({ title, description, isProject, tags }) {
  notion.pages.create({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID
    },
    properties: {
      [process.env.NOTION_TITLE_ID]: {
        title: [
          {
            type: "text",
            text: {
              content: title
            }
          }
        ]
      },
      [process.env.NOTION_DESCRIPTION_ID]: {
        rich_text: [
          {
            type: "text",
            text: {
              content: description,
            }
          }
        ]
      },
      [process.env.NOTION_PROJECT_ID]: {
        checkbox: isProject
      },
      [process.env.NOTION_VOTES_ID]: {
        number: 0
      },
      [process.env.NOTION_TAGS_ID]: {
        multi_select: tags.map(tag => {
          return { id: tag.id };
        })
      }
    }
  });
}

async function getSuggs() {
  const notionPages = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    sorts: [
      { 
        property: process.env.NOTION_VOTES_ID,
        direction: 'descending'
      }
    ]
  });

  return notionPages.results.map(fromNotionObject);
}

function fromNotionObject(notionpage) {
  const propsById = notionPropsById(notionpage.properties);

  return {
    id: notionpage.id,
    title: propsById[process.env.NOTION_TITLE_ID].title[0].plain_text,
    votes: propsById[process.env.NOTION_VOTES_ID].number,
    tags: propsById[process.env.NOTION_TAGS_ID].multi_select.map(option => {
      return { id: option.id, name: option.name };
    }),
    isProject: propsById[process.env.NOTION_PROJECT_ID].checkbox,
    description: propsById[process.env.NOTION_DESCRIPTION_ID].rich_text[0].text.content
  };
}

async function upVoteSugg(pageId) {
  const sugg = await getSugg(pageId);
  const votes = sugg.votes + 1;
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [process.env.NOTION_VOTES_ID]: { number: votes }
    }
  });

  return votes;
}

async function getSugg(pageId) {
  return fromNotionObject(await notion.pages.retrieve({ page_id: pageId }));
}

module.exports = {
  createSuggestion,
  getTags,
  getSuggs,
  upVoteSugg
};