const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const router = express.Router();
require('dotenv').config();

// Replace this line with your actual MongoDB connection string
mongoose
  .connect('mongodb+srv://mdridge:Hank0311@cluster0.wvucoo2.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Set up session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

// Set up Passport
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ resave: true, saveUninitialized: true }));

// Define User model
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

module.exports = User;

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

// Set up static files and views
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res, next) => {
  try {
    const newUser = new User({ username: req.body.username });

    // Use the User.register method provided by passport-local-mongoose
    User.register(newUser, req.body.password, (err, user) => {
      if (err) {
        console.error(err);
        return res.render('register'); // Handle registration error
      }

      // Authenticate the user and redirect upon successful registration
      passport.authenticate('local')(req, res, () => {
        res.redirect('/');
      });
    });
  } catch (err) {
    console.error(err);
    next(err); // Pass the error to the next middleware (error handler)
  }
});

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
