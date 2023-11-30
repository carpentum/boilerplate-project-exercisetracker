const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

(async () => {
  await mongoose
    .connect(
      `mongodb+srv://ramonmosquera:${process.env.MONGO_PASSWORD}@cluster0.fcwmg46.mongodb.net/exercisetracker`
    )
    .catch((error) => {
      console.log("Connection error", error);
      return false;
    });
})();

const ExerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
});

const Exercise = mongoose.model("Exercise", ExerciseSchema);

const UserSchema = new mongoose.Schema({
  username: {
    require: true,
    type: String,
  },
});

const User = mongoose.model("User", UserSchema);

const LogSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: {
    description: String,
    duration: Number,
    date: String,
  },
});

const Log = mongoose.model("Log", LogSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .get(async (req, res) => {
    const allUsers = await findAllUsers();
    if (allUsers.length > 0) {
      res.json(allUsers);
    } else {
      res.json({ message: "No users found" });
    }
    res.statusCode = 200;
  })
  .post(bodyParser.urlencoded({ extended: false }), async (req, res) => {
    const username = req.body.username;
    const dbUser = await findUser(username);
    if (dbUser) {
      res.json({ error: "User already exists" });
    } else {
      const userObject = new User({
        username,
      });
      userObject.save();
      res.json(userObject);
      res.statusCode = 201;
    }
  });

const findUser = (username) => {
  try {
    return User.findOne({ username });
  } catch (error) {
    console.log(error);
  }
};

const findAllUsers = () => {
  try {
    return User.find({});
  } catch (error) {
    console.log(error);
  }
};

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
