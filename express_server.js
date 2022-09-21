const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = 8080;

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

//Handling creation of new short urls
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const { longURL } = req.body;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

//Displaying the new urls form
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

//Displaying the unique urls
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

//Redirecting from short url to full url
app.get("/u/:id", (req, res) => {
  const { id } = req.params;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

//Updating short urls
app.post("/urls/:id", (req, res) => {
  const { id } = req.params;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

//Deleting shorts urls
app.post("/urls/:id/delete", (req, res) => {
  const { id } = req.params;
  delete urlDatabase[id];
  res.redirect("/urls");
});

//Handling registration
app.get("/register", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
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
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

//Handling Login and Logout
app.get("/login", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(403).send("Username or password cannot be blank");
  }
  const foundUser = getUserByEmail(email);
  if (password !== foundUser.password) {
    res.status(403).send("Invalid password");
  }
  res.cookie("user_id", foundUser.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  const { user_id } = req.cookies;
  res.clearCookie("user_id", user_id);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
