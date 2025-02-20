import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import session from 'express-session';
import bcrypt from 'bcrypt';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, 'users.json');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

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

// Function to read users from JSON file
function readUsers() {
  if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

// Function to write users to JSON file
function writeUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Function to read blog list from JSON file
function readBlogList(username) {
  const blogFilePath = path.join(__dirname, `${username}_blogs.json`);
  if (fs.existsSync(blogFilePath)) {
    const data = fs.readFileSync(blogFilePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

// Function to write blog list to JSON file
function writeBlogList(username, blogList) {
  const blogFilePath = path.join(__dirname, `${username}_blogs.json`);
  fs.writeFileSync(blogFilePath, JSON.stringify(blogList, null, 2));
}

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    pageTitle: "Welcome to My Blog",
    metaDescription: "Explore a collection of insightful articles on web development."
  });
});

app.get("/register", (req, res) => {
  res.render("register", {
    pageTitle: "Register",
    metaDescription: "Create a new account."
  });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const existingUser = users.find(user => user.username === username);

  if (existingUser) {
    res.send('Username already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  writeUsers(users);
  res.redirect('/login');
});

app.get("/login", (req, res) => {
  res.render("login", {
    pageTitle: "Login",
    metaDescription: "Log in to your account."
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(user => user.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.send('Invalid username or password');
    return;
  }

  req.session.username = username;
  res.redirect('/blogList');
});

app.get("/blogList", (req, res) => {
  if (!req.session.username) {
    res.redirect('/login');
    return;
  }

  const blogList = readBlogList(req.session.username);
  blogList.sort((a, b) => b.isPinned - a.isPinned); // Ensures pinned blogs are at the top

  res.render("blogList", {
    pageTitle: "All Blogs",
    metaDescription: "Browse all blog posts on our platform.",
    blogList: blogList
  });
});

app.get("/blogDetails/:id", (req, res) => {
  if (!req.session.username) {
    res.redirect('/login');
    return;
  }

  const blogList = readBlogList(req.session.username);
  const blogId = req.params.id;
  const blog = blogList.find((b) => b.id === parseInt(blogId));

  res.render("blogDetails", {
    pageTitle: blog ? blog.title : "Blog Not Found",
    metaDescription: blog ? blog.description.substring(0, 160) : "This blog post could not be found.",
    blog
  });
});

app.get("/edit/:id", (req, res) => {
  if (!req.session.username) {
    res.redirect('/login');
    return;
  }

  const blogList = readBlogList(req.session.username);
  const blogId = req.params.id;
  const blog = blogList.find((b) => b.id === parseInt(blogId));
  if (!blog) {
    res.send('<h1> Blog not found </h1>');
    return;
  }
  res.render('edit', {
    pageTitle: blog ? `Edit: ${blog.title}` : "Edit Blog",
    metaDescription: "Edit your blog post and update its content.",
    blog
  });
});

app.post('/home', upload.single('blogImage'), (req, res) => {
  if (!req.session.username) {
    res.redirect('/login');
    return;
  }

  const blogTitle = req.body.blogTitle;
  const blogDescription = req.body.blogDes;
  const blogImage = req.file ? `/uploads/${req.file.filename}` : null;
  const blogList = readBlogList(req.session.username);
  blogList.push({
    id: generateID(),
    title: blogTitle,
    description: blogDescription,
    image: blogImage,
    isPinned: false, // Add isPinned field, defaulting to false
  });
  writeBlogList(req.session.username, blogList);
  res.redirect('/blogList');
});

app.post('/edit/:id', upload.single('blogImage'), (req, res) => {
  if (!req.session.username) {
    res.redirect('/login');
    return;
  }

  const blogId = req.params.id;
  const blogList = readBlogList(req.session.username);
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

  writeBlogList(req.session.username, blogList);
  res.redirect('/blogList');
});

app.post('/delete/:id', (req, res) => {
  if (!req.session.username) {
    res.redirect('/login');
    return;
  }

  const blogId = req.params.id;
  let blogList = readBlogList(req.session.username);
  blogList = blogList.filter((blog) => blog.id !== parseInt(blogId));
  writeBlogList(req.session.username, blogList);
  res.redirect('/blogList');
});

// Route to pin/unpin blog post
app.post('/pin/:id', (req, res) => {
  if (!req.session.username) {
    res.redirect('/login');
    return;
  }

  const blogId = req.params.id;
  const blogList = readBlogList(req.session.username);
  const blog = blogList.find(blog => blog.id === parseInt(blogId));

  if (blog) {
    blog.isPinned = !blog.isPinned; // Toggle the pin status
    writeBlogList(req.session.username, blogList);
    res.redirect('/blogList'); // Redirect back to the blog list page
  } else {
    res.status(404).send('Blog not found');
  }
});

// Function to generate random ID
function generateID() {
  return Math.floor(Math.random() * 10000);
}