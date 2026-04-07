if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError.js");


// 🔐 Passport setup
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

// Routes
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

let dbUrl =
  "mongodb://messilionel7861_db_user:uDeyPoARg0lobP1W@ac-cci7l7l-shard-00-00.bz7aqgc.mongodb.net:27017,ac-cci7l7l-shard-00-01.bz7aqgc.mongodb.net:27017,ac-cci7l7l-shard-00-02.bz7aqgc.mongodb.net:27017/?ssl=true&replicaSet=atlas-zcf77f-shard-0&authSource=admin&appName=Cluster0";
main()
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: "secretcode",
  },
  touchAfter: 24 * 3600,
});

store.on("error",()=>{
console.log("error: ",err)
})

// Session config
const sessionOptions = {
  store:store,
  secret: "secretcode",
  resave: false,
  saveUninitialized: false, // ✅ fixed
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};


// Root route
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// ✅ SESSION + FLASH
app.use(session(sessionOptions));
app.use(flash());

// ✅ PASSPORT INITIALIZATION (CRITICAL)
app.use(passport.initialize());
app.use(passport.session());

// ✅ PASSPORT CONFIG (CRITICAL)
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash locals
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // 🔥 useful in EJS

  next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 handler
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

// Error handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  res.render("error.ejs", { message });
});

// Server
app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
