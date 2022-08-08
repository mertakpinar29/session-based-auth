import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import Redis from "ioredis";
import connectRedis from "connect-redis";

dotenv.config();

const app = express();

const RedisStore = connectRedis(session);
const redis = new Redis();

app.use(
  session({
    name: process.env.COOKIE_NAME,
    store: new RedisStore({
      client: redis,
      disableTouch: true,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: !process.env.NODE_ENV === "production",
    },

    //secret: "mysecretkey"
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.json());

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!(username === "admin" && password === "123")) {
      return res.status(400).json({ error: "Invalid creds" });
    }

    const user = { username, favorite: "strawberry" };
    req.session.user = user;

    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err });
  }
});

app.get("/favorite", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    return res.status(200).json({ favorite: req.session.user.favorite });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err });
  }
});

app.get("/logout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.send(false);
    }

    res.clearCookie(process.env.COOKIE_NAME);
    return res.send(true);
  });
});

app.listen(5000, () => {
  console.log("listening on port 5000");
});
