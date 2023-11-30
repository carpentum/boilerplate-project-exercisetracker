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

app.post(
  "/api/users/:_id/exercises",
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    const id = req.body.userId;
    const description = req.body.description;
    const duration = req.body.duration;
    let date = req.body.date;
    date = date === "" ? Date().now : date;
    const dbDateObject = new Date(date);
    let dbDate = dbDateObject.toDateString();

    const dbUser = await findUserById(id);
    if (!dbUser) {
      res.json({ error: "User not found" });
      res.statusCode = 404;
    } else {
      const userExercise = new Exercise({
        username: dbUser.username,
        description,
        duration,
        date: dbDate,
      });
      userExercise.save();
      dbUser.description = userExercise.description;
      dbUser.duration = userExercise.duration;
      dbUser.date = userExercise.date;
      res.json(dbUser);
      res.statusCode = 201;
    }
  }
);

app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id;
  const dbUser = await findUserById(id);
  if (!dbUser) {
    res.json({ error: "User not found" });
  } else {
    const dbUserExercises = await findUserExercises(
      dbUser.username,
      "description duration date -_id"
    );
    // let userExercises = [];
    // if (dbUserExercises.length) {
    //   const userExercises = dbUserExercises.map((dbExercise) => {
    //     return {
    //       description: dbExercise.description,
    //       duration: dbExercise.duration,
    //       date: dbExercise.date,
    //     };
    //   });
    // }
    res.json({
      count: dbUserExercises.length,
      log: dbUserExercises,
    });
    res.statusCode = 200;
  }
});

const findUser = (username) => {
  try {
    return User.findOne({ username });
  } catch (error) {
    console.log(error);
  }
};

const findUserById = (id) => {
  try {
    return User.findById(id);
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

const findUserExercises = (username, fieldsString = "") => {
  try {
    return Exercise.find({ username }, fieldsString).exec();
  } catch (error) {
    console.log(error);
  }
};

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
