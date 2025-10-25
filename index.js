import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

dotenv.config();
const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// let items = [
//   { id: 1, title: "Buy milk" },
//   { id: 2, title: "Finish homework" },
// ];
let items = [];

async function checkItems() {
  const data = (await db.query("SELECT * FROM items ORDER BY id ASC")).rows;
  return data;
}

app.get("/", async (req, res) => {
  try {
    items = await checkItems();
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
    });
  } catch (error) {
    console.error("Error fetching data from item table", err.stack);
  }
});

app.post("/add", async (req, res) => {
  //items.push({title: item});
  const item = req.body.newItem;
  try {
    await db.query("INSERT INTO items (title) VALUES ($1)", [item]);
    res.redirect("/");
  } catch (error) {
    console.error("Error inserting record into items table", err.stack); 
  }
});

app.post("/edit", async (req, res) => {
  const result = req.body;
  try {
    await db.query("UPDATE items SET title = ($1) WHERE id = ($2)", [result.updatedItemTitle, result.updatedItemId]);
    res.redirect("/");
  } catch (error) {
    console.error("Error updating record in items table:", err.stack);
  }
});

app.post("/delete", async (req, res) => {
  try {
    const result = req.body;
    await db.query("DELETE FROM items WHERE id = ($1)", [result.deleteItemId]);
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting record from items", err.stack);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
