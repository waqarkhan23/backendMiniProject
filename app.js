const express = require("express");
const app = express();
const path = require("path");
const userModel = require("./models/user");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const postModel = require("./models/post");

const port = process.env.PORT || 3003;
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/profile", isLoggedIn, async (req, res) => {
  const userData = await userModel.findOne({ _id: req.user.id });
  console.log(userData);
  await userData.populate("posts");
  res.render("profile", { userData: userData });
});
app.get("/edit/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit", { post: post });
});
app.get("/like/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findOne({ _id: req.params.id }).populate("user");
  if (post.like.includes(req.user.id)) {
    post.like.splice(post.like.indexOf(req.user.id), 1);
  } else {
    post.like.push(req.user.id);
  }

  await post.save();
  res.redirect("/profile");
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content }
  );
  res.redirect("/profile");
});
app.get("/delete/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findByIdAndDelete({ _id: req.params.id });
  res.redirect("/profile");
});
app.post("/post", isLoggedIn, async (req, res) => {
  const userData = await userModel.findOne({ _id: req.user.id });
  const createdPost = await postModel.create({
    user: userData._id,
    content: req.body.content,
  });
  userData.posts.push(createdPost._id);
  await userData.save();
  res.redirect("/profile");
});

app.post("/signup", async (req, res) => {
  let { name, email, password, username, age } = req.body;
  let found = await userModel.findOne({ email: email });
  if (found) {
    res.status(400).send("Email already exists");
  } else {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          console.log(err);
        } else {
          password = hash;
          const user = await userModel.create({
            name: name,
            email: email,
            password: password,
            username: username,
            age: age,
          });
          const token = jwt.sign({ id: user._id, email: user.email }, "shhh");
          res.cookie("token", token);
          res.send("registered");
        }
      });
    });
  }
});
app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let found = await userModel.findOne({ email: email });
  if (!found) {
    res.status(500).send("something went wrong");
  } else {
    bcrypt.compare(password, found.password, async (err, result) => {
      if (result) {
        const token = jwt.sign({ id: found._id, email: found.email }, "shhh");
        res.cookie("token", token);
        res.redirect("/profile");
      } else {
        res.status(500).send("something went wrong");
      }
    });
  }
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "" || req.cookies.token == undefined) {
    res.redirect("/login");
  } else {
    const data = jwt.verify(req.cookies.token, "shhh");
    req.user = data;
    next();
  }
}

app.listen(port, () => {
  console.log("Example app listening on port 3003!");
});
