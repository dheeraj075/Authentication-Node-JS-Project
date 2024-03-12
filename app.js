const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
    if (validatePassword(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//API 2 :
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const postUserLogin = `
  SELECT * 
  FROM user 
  WHERE username = '${username}' ;
  `;
  const dbUser = await db.get(postUserLogin);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordValid = await bcrypt.compare(password, dbUser.password);
    if (isPasswordValid === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 :

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const putChangePassQuery = `
    SELECT * 
    FROM user 
    WHERE username = '${username}' ;
    `;
  const dbUser = await db.get(putChangePassQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassMatched = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPassMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPass = await bcrypt.hash(newPassword, 10);
        const updatePassQuery = `
             UPDATE user 
             SET 
             password = '${hashedPass}'
             WHERE username = '${username}' ;
             `;
        const user = await db.run(updatePassQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
