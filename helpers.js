const getUserByEmail = (email, database) => {
  for (const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return null;
};

const generateRandomString = () => {
  let randomString = Math.random().toString(36).slice(2, 8);
  return randomString;
};

const urlsForUser = (id, database) => {
  const urlsForUserList = [];
  for (const url in database) {
    if (database[url].userID === id) {
      urlsForUserList.push(database[url]);
    }
  }
  return urlsForUserList; //? urlsForUserList : null;
};

const urlBelongsToUser = (urlList, id) => {
  for (let url of urlList) {
    if (url.shortURL === id) {
      return true;
    }
  }
  return false;
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
  urlBelongsToUser,
};
