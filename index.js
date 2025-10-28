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
let users = [];
let items = [];
let currentUserId = 1;

async function checkItems() {
  // changed the query to bring up the items of a particular user.id
  const data = await db.query(
    "SELECT user_id, title FROM users JOIN items ON users.id = items.user_id WHERE users.id = ($1)",
    [currentUserId]
  );
  return data.rows;
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  try {
    items = await checkItems();
    const currentUser = await getCurrentUser();
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
      users: users,
      currentUser: currentUser,
    });
  } catch (error) {
    console.error("Error fetching data from item table", error.stack);
  }
});

app.post("/add", async (req, res) => {
  //items.push({title: item});
  const item = req.body.newItem;
  try {
    await db.query("INSERT INTO items (title) VALUES ($1)", [item]);
    res.redirect("/");
  } catch (error) {
    console.error("Error inserting record into items table", error.stack);
  }
});

//post route for /user
app.post("/user", async (req, res) => {
  const response = req.body;

  try {
    
    if (response.add == "Add New Member") { 
      res.render("new.ejs");

    } else {
      const result = await (db.query("SELECT * FROM users WHERE name = ($1)", [response.user]));
      currentUserId = result.rows[0].id;
      res.redirect("/");
    }

  } catch (error) {
    console.error("Error fetching record of user", error.stack);
  }
});

app.post("/edit", async (req, res) => {
  const result = req.body;
  try {
    await db.query("UPDATE items SET title = ($1) WHERE id = ($2)", [
      result.updatedItemTitle,
      result.updatedItemId,
    ]);
    res.redirect("/");
  } catch (error) {
    console.error("Error updating record in items table:", error.stack);
  }
});

app.post("/delete", async (req, res) => {
  try {
    const result = req.body;
    await db.query("DELETE FROM items WHERE id = ($1)", [result.deleteItemId]);
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting record from items", error.stack);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
