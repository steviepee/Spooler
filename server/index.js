const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const fabricsRouter = require('./routes/fabrics.js');
const postsRouter = require("./routes/posts");
require('./passport.js');
require('dotenv').config();

const port = 8080;

//connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to DB'));

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

const app = express();

//session configuration
app.use(
  session(
    { secret: 'Scrumbags', httpOnly: false, resave: false, saveUninitialized: true },
    {
      cookie: {
        maxAge: 60000
      }
    }
  )
);

//passport initialization
app.use(passport.initialize());
app.use(passport.session());

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use('/fabrics', isLoggedIn, fabricsRouter);
app.use('/fabrics', fabricsRouter);
app.use("/posts", postsRouter);

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  isLoggedIn,
  (req, res) => {
    res.redirect('/fabrics');
  }
);

app.get('/auth/failure', (req, res) => {
  res.send('Authentication failure');
});

app.get('/protected', isLoggedIn, (req, res) => {
  res.send(`Hello ${req.user.displayName}`);
});

app.route('/logout').get((req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Failed to log out');
      }

      res.clearCookie('connect.sid');

      res.redirect('/');
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '..', 'dist') });
});

app.listen(port, () => {
  console.log(`Spooler listening At http://localhost:${port}`);
});
