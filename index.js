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

const LogSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String,
});

const Log = mongoose.model("Log", LogSchema);

const UserSchema = new mongoose.Schema({
  username: {
    require: true,
    type: String,
  },
  log: [LogSchema],
});

const User = mongoose.model("User", UserSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .get(async (req, res) => {
    const allUsers = await findAllUsers();
    if (allUsers.length > 0) return res.status(200).json(allUsers);

    res.status(200).json({ message: "No users found" });
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
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const userLog = new Log({
      description,
      duration,
      date: dbDate,
    });
    dbUser.log.push(userLog);
    dbUser.save();
    //   res.json(dbUser);
    //   res.statusCode = 201;

    let responseObject = {};
    responseObject["_id"] = dbUser.id;
    responseObject["username"] = dbUser.username;
    responseObject["date"] = dbDate;
    responseObject["description"] = description;
    responseObject["duration"] = duration;
    res.status(200).json(responseObject);
  }
);

app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id;
  const dbUser = await findUserById(id);
  if (!dbUser) return res.status(400).json({ error: "User not found" });

  const from = req.query.from ? req.query.from : undefined;
  const to = req.query.to ? req.query.to : undefined;

  if (from && isNaN(new Date(from)))
    return res.status(400).json({ error: "From date is invalid" });

  if (to && isNaN(new Date(to)))
    return res.status(400).json({ error: "To date is invalid" });

  if (from && to && new Date(from) > new Date(to))
    return res.status(400).json({ error: "From date is higher than to date" });

  const limit = req.query.limit ? req.query.limit : undefined;
  let log =
    from || to || limit ? filterLogs(dbUser.log, from, to, limit) : dbUser.log;
  res.status(200).redirectjson({
    count: log.length,
    log,
  });
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

const filterLogs = (dbUserLog, from, to, limit) => {
  try {
    let logsFrom = [];
    let logsTo = [];
    if (from) {
      const fromDate = new Date(from);
      logsFrom = dbUserLog.filter((log) => {
        const logDate = new Date(log.date);
        return logDate >= fromDate;
      });
    }
    if (to && logsFrom.length) {
      const toDate = new Date(to);
      logsTo = logsFrom.filter((log) => {
        const logDate = new Date(log.date);
        return logDate <= toDate;
      });
    }
    return logsTo.length &&
      limit &&
      parseInt(limit) !== 0 &&
      parseInt(limit) !== "NaN"
      ? logsTo.slice(0, parseInt(limit))
      : logsTo;
  } catch (error) {
    console.log(error);
  }
};

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
