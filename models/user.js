const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/miniProject");

const userSchema = new mongoose.Schema({
  username: String,
  age: Number,
  name: String,
  email: String,
  password: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
