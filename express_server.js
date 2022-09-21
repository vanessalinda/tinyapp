const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const generateRandomString = () => {
  let randomString = Math.random().toString(36).slice(2, 8);
  return randomString;
};

const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
  // for (const userId in users) {
  //   return users[userId].email === email ? users[userId] : null;
  // }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const { longURL } = req.body;
  urlDatabase[id] = longURL;
  //console.log(req.body); // Log the POST request body to the console
  //console.log(longURL);
  res.redirect(`/urls/${id}`); // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const { id } = req.params;
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {
    id,
    longURL: urlDatabase[id],
    user,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const { id } = req.params;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const { id } = req.params;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const { id } = req.params;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  const { user_id } = req.cookies;
  //console.log(req.cookies);
  res.clearCookie("user_id", user_id);
  //console.log(users);
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
  //const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const user_id = generateRandomString();
  const { email, password } = req.body;
  if (!email || !password) res.status(400).send("Invalid username or password");
  const foundUser = getUserByEmail(email);
  if (foundUser) res.status(400).send("A user with that email already exists");
  users[user_id] = {
    id: user_id,
    email,
    password,
  };
  //console.log(req.body); // Log the POST request body to the console
  //console.log(users);
  res.cookie("user_id", user_id);
  res.redirect("/urls"); // Respond with 'Ok' (we will replace this)
});

app.get("/login", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
  //const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  //console.log(req.body);
  const { email, password } = req.body;
  //console.log(email, password);
  if (!email || !password) {
    res.status(403).send("Username or password cannot be blank");
  }
  const foundUser = getUserByEmail(email);
  //console.log(foundUser);
  if (password !== foundUser.password) {
    res.status(403).send("Invalid password");
  }
  //console.log("got it!");
  res.cookie("user_id", foundUser.id);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
