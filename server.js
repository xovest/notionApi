require('dotenv').config();
const express = require('express');
const { getTags, createSuggestion, getSuggs } = require('./notion');

const app = express();
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

let tags = [];
getTags().then(data => {
  tags = data;
});

setInterval(async () => {
  tags = await getTags();
}, 1000 * 60 * 60);

app.get('/', async (req, res) => {
  const suggs = await getSuggs();
  res.render('index', { tags, suggs });
});

app.post('/create-suggestion', async (req, res) => {
  const { title, description, isProject, tagIds = [] } = req.body;

  await createSuggestion({
    title,
    description,
    isProject: isProject != null,
    tags: (Array.isArray(tagIds) ? tagIds : [tagIds]).map(tagId => {
      return { id: tagId };
    })
  });

  res.redirect('/');
});

app.listen(process.env.PORT)
