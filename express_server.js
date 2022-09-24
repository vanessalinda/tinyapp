const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// const urlDatabase = {
//   b2xVn2: "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
    shortURL: "b6UTxQ",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
    shortURL: "i3BoGr",
  },
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

const urlsForUser = (id) => {
  const urlsForUserList = [];
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlsForUserList.push(urlDatabase[url]);
    }
  }
  return urlsForUserList ? urlsForUserList : null;
  //return urlsForUserList;
  //return null;
};

const urlBelongsToUser = (urlList, id) => {
  for (let url of urlList) {
    if (url.shortURL === id) {
      return true;
    }
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Displaying all urls for user
app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const urlList = urlsForUser(user_id);
  //console.log(urlList);
  const templateVars = { urls: urlList, user };
  res.render("urls_index", templateVars);
});

//Handling creation of new short urls
app.post("/urls", (req, res) => {
  const { user_id } = req.cookies;
  const user = users[user_id];
  if (!user) {
    res.status(403).send("<h2>Users must log in to create new URLs.</h2>");
  }
  const id = generateRandomString();
  const { longURL } = req.body;
  if (!longURL) res.redirect("/urls/new");
  //urlDatabase[id].longURL = longURL;
  urlDatabase[id] = {
    longURL,
    userID: user_id,
    shortURL: id,
  };
  //console.log(urlDatabase);
  res.redirect(`/urls/${id}`);
});

//Displaying the new urls form
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { user };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//Displaying the unique urls
app.get("/urls/:id", (req, res) => {
  const { id } = req.params;
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const urlList = urlsForUser(user_id);

  if (!user) {
    res.status(403).send("<h2>Users must log in to view their URLs.</h2>");
  }

  if (!urlBelongsToUser(urlList, id)) {
    res
      .status(403)
      .send("<h2>You do not have permission to access this url.</h2>");
  }

  const templateVars = {
    id,
    longURL: urlDatabase[id].longURL,
    user,
  };
  res.render("urls_show", templateVars);
});

//Redirecting from short url to full url
app.get("/u/:id", (req, res) => {
  const { id } = req.params;
  const longURL = urlDatabase[id].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("<h2>This short URL does not exist</h2>");
  }
});

//Updating short urls
app.post("/urls/:id", (req, res) => {
  const { id } = req.params;
  const existingURL = urlDatabase[id];
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const urlList = urlsForUser(user_id);

  if (!existingURL) {
    res.send("<h2>This short URL does not exist</h2>");
  }

  if (!user) {
    res
      .status(403)
      .send("<h2>Users must be logged into update their urls.</h2>");
  }

  if (!urlBelongsToUser(urlList, id)) {
    res
      .status(403)
      .send("<h2>You do not have permission to update this url.</h2>");
  }

  const longURL = req.body.longURL;
  urlDatabase[id].longURL = longURL;
  res.redirect(`/urls/${id}`);
});

//Deleting shorts urls
app.post("/urls/:id/delete", (req, res) => {
  const { id } = req.params;
  const existingURL = urlDatabase[id];
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const urlList = urlsForUser(user_id);

  if (!existingURL) {
    res.send("<h2>This short URL does not exist</h2>");
  }

  if (!user) {
    res
      .status(403)
      .send("<h2>Users must be logged into delete their urls.</h2>");
  }

  if (!urlBelongsToUser(urlList, id)) {
    res
      .status(403)
      .send("<h2>You do not have permission to delete this url.</h2>");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

//Handling registration page
app.get("/register", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

//Handling creation of new user
app.post("/register", (req, res) => {
  const user_id = generateRandomString();
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email || !password) res.status(400).send("Invalid username or password");
  const foundUser = getUserByEmail(email);
  if (foundUser) res.status(400).send("A user with that email already exists");
  users[user_id] = {
    id: user_id,
    email,
    hashedPassword,
  };
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

//Handling Login and Logout
app.get("/login", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
  if (!user) {
    res.render("login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(403).send("Username or password cannot be blank");
  }
  const foundUser = getUserByEmail(email);
  if (!foundUser) {
    res.status(403).send("No user with that email exists");
  }
  if (!bcrypt.compareSync(password, foundUser.hashedPassword)) {
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
