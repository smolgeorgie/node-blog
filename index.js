import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = join(__dirname, "index.ejs");

// Set the view engine to EJS
app.set("view engine", "ejs");

// Render index page
app.get("/", (req, res) => {
  res.render(indexPath);
});

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});