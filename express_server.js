const express = require("express");
const app = express();
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const PORT = 8080;

const {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
  urlBelongsToUser,
} = require("./helpers");

const { urlDatabase, users } = require("./data");

app.set("view engine", "ejs");

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key2", "key2"],
    maxAge: 10 * 60 * 1000, // 10 min
  })
);

app.get("/", (req, res) => {
  res.redirect("/urls");
});

//Display a JSON string of the url database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Displaying all urls for user
app.get("/urls", (req, res) => {
  const { user_id } = req.session;
  const user = users[user_id];
  const urlList = urlsForUser(user_id, urlDatabase);
  const templateVars = { urls: urlList, user };
  res.render("urls_index", templateVars);
});

//Handling creation of new short urls
app.post("/urls", (req, res) => {
  const { user_id } = req.session;
  const user = users[user_id];
  const id = generateRandomString();
  const { longURL } = req.body;

  if (!user) {
    res.status(403).send("<h2>Users must log in to create new URLs.</h2>");
  } else if (!longURL) {
    res.redirect("/urls/new");
  } else {
    urlDatabase[id] = {
      longURL,
      userID: user_id,
      shortURL: id,
    };
    res.redirect(`/urls/${id}`);
  }
});

//Displaying the new urls form
app.get("/urls/new", (req, res) => {
  const { user_id } = req.session;
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
  const { user_id } = req.session;
  const user = users[user_id];
  const urlList = urlsForUser(user_id, urlDatabase);

  if (!user) {
    res.status(403).send("<h2>Users must log in to view their URLs.</h2>");
  } else if (!urlBelongsToUser(urlList, id)) {
    res
      .status(403)
      .send("<h2>You do not have permission to access this url.</h2>");
  } else {
    const templateVars = {
      id,
      longURL: urlDatabase[id].longURL,
      user,
    };
    res.render("urls_show", templateVars);
  }
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
  const { user_id } = req.session;
  const user = users[user_id];
  const urlList = urlsForUser(user_id, urlDatabase);
  const longURL = req.body.longURL;

  if (!existingURL) {
    res.send("<h2>This short URL does not exist</h2>");
  } else if (!user) {
    res
      .status(403)
      .send("<h2>Users must be logged into update their urls.</h2>");
  } else if (!urlBelongsToUser(urlList, id)) {
    res
      .status(403)
      .send("<h2>You do not have permission to update this url.</h2>");
  } else if (!longURL) {
    res.redirect(`/urls/${id}`);
  } else {
    urlDatabase[id].longURL = longURL;
    res.redirect(`/urls/${id}`);
  }
});

//Deleting shorts urls
app.post("/urls/:id/delete", (req, res) => {
  const { id } = req.params;
  const existingURL = urlDatabase[id];
  const { user_id } = req.session;
  const user = users[user_id];
  const urlList = urlsForUser(user_id, urlDatabase);

  if (!existingURL) {
    res.send("<h2>This short URL does not exist</h2>");
  } else if (!user) {
    res
      .status(403)
      .send("<h2>Users must be logged into delete their urls.</h2>");
  } else if (!urlBelongsToUser(urlList, id)) {
    res
      .status(403)
      .send("<h2>You do not have permission to delete this url.</h2>");
  } else {
    delete urlDatabase[id];
    res.redirect("/urls");
  }
});

//Handling registration
app.get("/register", (req, res) => {
  const { user_id } = req.session;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const user_id = generateRandomString();
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const foundUser = getUserByEmail(email, users);

  if (!email || !password) {
    res.status(400).send("Invalid username or password");
  } else if (foundUser) {
    res.status(400).send("A user with that email already exists");
  } else {
    //Updating the user database with the new user
    users[user_id] = {
      id: user_id,
      email,
      hashedPassword,
    };
    req.session.user_id = user_id;
    res.redirect("/urls");
  }
});

//Handling Login and Logout
app.get("/login", (req, res) => {
  const { user_id } = req.session;
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
  const foundUser = getUserByEmail(email, users);
  if (!email || !password) {
    res.status(403).send("Username or password cannot be blank");
  } else if (!foundUser) {
    res.status(403).send("No user with that email exists");
  } else if (!bcrypt.compareSync(password, foundUser.hashedPassword)) {
    res.status(403).send("Invalid password");
  } else {
    req.session.user_id = foundUser.id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//Listener
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
