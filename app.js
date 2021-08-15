const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/bankDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  username: String,
  password: String,
  accNum: Number,
  balance: Number
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

let amount;
let account;
let from;
let to;

app.get("/", function(req, res) {

  res.render("signUp");
});

app.get("/home", function(req, res) {
  if(req.isAuthenticated()) {
    var myDate = new Date();
    var hrs = myDate.getHours();
    var greet;
    if (hrs < 12)
      greet = 'Good Morning';
    else if (hrs >= 12 && hrs <= 17)
      greet = 'Good Afternoon';
    else if (hrs >= 17 && hrs <= 24)
      greet = 'Good Evening';
    User.findById(req.user.id, function(err, foundUser) {
      const greetFull = greet +" " + foundUser.fname;
      const query1 = from;
      const query2 = to;
      const apiKey = "6eaf581213cd08267dbf";
      let rate;
      const url = "https://free.currconv.com/api/v7/convert?q=" + query1 + "_" + query2 + "&compact=ultra&apiKey=" + apiKey;
      https.get(url, function(response) {
        // console.log(response.statusCode);
        response.on("data", function(data) {
          const exchangeData = JSON.parse(data);
          rate = exchangeData;
          console.log(rate);
        });
      });
      res.render("home", {greetings: greetFull, rate: rate});
    });
  }
  else {
    res.redirect("/");
  }
});

app.get("/account", function(req, res) {
  if(req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      const fullName = foundUser.fname + " "+foundUser.lname;
      const emailId = foundUser.username;
      const accountNum = foundUser.accNum;
      let alottedBalance;
      if(foundUser.accNum === account) {
        foundUser.balance = foundUser.balance + amount;
        alottedBalance = foundUser.balance;
        res.render("accounts", {fullName: fullName, emailId: emailId, accountNum: accountNum, balance: alottedBalance});
      }
      else {
        foundUser.balance = foundUser.balance - amount;
        alottedBalance = foundUser.balance;
        res.render("accounts", {fullName: fullName, emailId: emailId, accountNum: accountNum, balance: alottedBalance});
      }

    });
  }
  else {
    res.redirect("/");
  }
});

app.get("/loan", function(req, res) {
  res.render("loan");
});
app.get("/signIn", function(req, res) {
  res.render("signIn");
});

app.post("/", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});

app.post("/signIn", function(req, res) {
  const accNum = Math.floor(100000 + Math.random() * 900000);
  const balance = 10000;
  User.register({
    username: req.body.username,
    fname: req.body.fname,
    lname: req.body.lname,
    accNum: accNum,
    balance: balance},
    req.body.password, function(err, user){
  if (err) {
    console.log(err);
    res.redirect("/");
  }
  // else {
  //   passport.authenticate("local")(req, res, function(){
      res.redirect("/");
  //   });
  // }
});
});

app.post("/home", function(req, res) {
  account = parseInt(req.body.accountNumber);
  amount=parseInt(req.body.amount);
  from=req.body.from;
  to = req.body.to;
  res.redirect("/home");

})



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
