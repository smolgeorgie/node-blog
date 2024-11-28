import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize blog list
let blogList = [];

// Function to generate random ID
function generateID() {
  return Math.floor(Math.random() * 10000);
}

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/home', (req, res) => {
  const blogTitle = req.body.blogTitle;
  const blogDescription = req.body.blogDes;
  blogList.push({
    id: generateID(),
    title: blogTitle,
    description: blogDescription,
  });
  res.redirect('/bloglist');
});

app.get('/bloglist', (req, res) => {
  res.render('blogList', { blogList: blogList });
});

app.get('/blogDetails/:id', (req, res) => {
  const blogId = req.params.id;
  const blogDetails = blogList.find((blog) => blog.id === parseInt(blogId));
  res.render('blogDetails', { blogDetails: blogDetails });
});

app.post('/edit/:id', (req, res) => {
  const blogId = req.params.id;
  const editBlog = blogList.findIndex((blog) => blog.id === parseInt(blogId));
  if (editBlog === -1) {
    res.send('<h1> Something went wrong </h1>');
  }
  const updatedTitle = req.body.blogTitle;
  const updatedDescription = req.body.blogDes;

  blogList[editBlog].title = updatedTitle;
  blogList[editBlog].description = updatedDescription;

  res.redirect('/bloglist');
});

app.post('/delete/:id', (req, res) => {
  const blogId = req.params.id;
  blogList = blogList.filter((blog) => blog.id !== parseInt(blogId));
  res.redirect('/bloglist');
});

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});