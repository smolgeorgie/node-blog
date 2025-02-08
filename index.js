import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Start server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Initialize blog list
let blogList = [];

// Function to generate random ID
function generateID() {
  return Math.floor(Math.random() * 10000);
}

// Routes
app.get("/", (req, res) => {
  res.render("index", {
      pageTitle: "Welcome to My Blog",
      metaDescription: "Explore a collection of insightful articles on web development."
  });
});

app.get("/blogList", (req, res) => {
  res.render("blogList", {
      pageTitle: "All Blogs",
      metaDescription: "Browse all blog posts on our platform.",
      blogList
  });
});

app.get("/blogDetails/:id", (req, res) => {
  const blogId = req.params.id;
  const blog = blogList.find((b) => b.id === parseInt(blogId));

  res.render("blogDetails", {
      pageTitle: blog ? blog.title : "Blog Not Found",
      metaDescription: blog ? blog.content.substring(0, 160) : "This blog post could not be found.",
      blog
  });
});

app.get("/edit/:id", (req, res) => {
  const blogId = req.params.id;
  const blog = blogList.find((b) => b.id === parseInt(blogId));

  res.render("edit", {
      pageTitle: blog ? `Edit: ${blog.title}` : "Edit Blog",
      metaDescription: "Edit your blog post and update its content.",
      blog
  });
});


app.post('/home', upload.single('blogImage'), (req, res) => {
  const blogTitle = req.body.blogTitle;
  const blogDescription = req.body.blogDes;
  const blogImage = req.file ? `/uploads/${req.file.filename}` : null;
  blogList.push({
    id: generateID(),
    title: blogTitle,
    description: blogDescription,
    image: blogImage,
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

app.get('/edit/:id', (req, res) => {
  const blogId = req.params.id;
  const blog = blogList.find((blog) => blog.id === parseInt(blogId));
  if (!blog) {
    res.send('<h1> Blog not found </h1>');
    return;
  }
  res.render('edit', { blog: blog });
});

app.post('/edit/:id', upload.single('blogImage'), (req, res) => {
  const blogId = req.params.id;
  const editBlog = blogList.findIndex((blog) => blog.id === parseInt(blogId));
  if (editBlog === -1) {
    res.send('<h1> Something went wrong </h1>');
    return;
  }
  const updatedTitle = req.body.blogTitle;
  const updatedDescription = req.body.blogDes;
  const updatedImage = req.file ? `/uploads/${req.file.filename}` : blogList[editBlog].image;

  blogList[editBlog].title = updatedTitle;
  blogList[editBlog].description = updatedDescription;
  blogList[editBlog].image = updatedImage;

  res.redirect('/bloglist');
});

app.post('/delete/:id', (req, res) => {
  const blogId = req.params.id;
  blogList = blogList.filter((blog) => blog.id !== parseInt(blogId));
  res.redirect('/bloglist');
});

