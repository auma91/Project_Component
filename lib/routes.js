var express = require(‘express’);
var app = express();
var passport = require(“passport”);
var request = require(‘request’);
const { Pool, Client } = require(‘pg’)
const bcrypt = require(‘bcrypt’)
//const uuidv4 = require(‘uuid/v4’);
const LocalStrategy = require(‘passport-local’).Strategy;
/*const pool = new Pool({
 user: process.env.PGUSER,
 host: process.env.PGHOST,
 database: process.env.PGDATABASE,
 password: process.env.PGPASSWORD,
 port: process.env.PGPORT,
 ssl: true
});*/
var pgp = require('pg-promise')();
const dbConfig = {
	host: 'ec2-107-20-177-161.compute-1.amazonaws.com',
	port: 5432,
	database: 'd22mr3m4netqs8',
	user: 'xbhtcypzgcjpuk',
	password: '75a929bd6e0d7df76ddfa48a2bf3e38a5f005b938ba74fe490b2f7bebcd2efde',
  ssl: true
};
var db = pgp(dbConfig);
app.use(express.static(‘public’));

app.get('/register', function(req, res) {
  res.render('pages/reg', {
    local_css:"reg.css",
    my_title: "Registration"
  });
});

app.post('/register', async function (req, res) {
  try{
    var name = req.body.name;
    var email = req.body.email;
    var pass = await bcrypt.hash(req.body.psw, 5);
    var pass = await bcrypt.hash(req.body.password, 5);
    var select_statement = "SELECT COUNT(*) FROM users WHERE email= '"+email+"';";
    var insert_statement = "INSERT INTO users(name, email, password) VALUES('" + name + "','" +
                email + "','" + pass +"');";
    db.task('get-everything', task => {
      return task.batch([
        task.any(select_statement)
      ]);
    })
    .then(info => {
      if(info[0][0].count > 0) {
        console.log("This email is already registered");
      }
      else {
        console.log("This is an unregisted email.")
        db.task('get-everything', task => {
          return task.batch([
            task.any(insert_statement)
          ]);
        })
      }
			res.redirect('/');
    })
});

app.get(‘/account’, function (req, res, next) {
  if(req.isAuthenticated()){
    res.render(‘account’, {title: “Account”, userData: req.user, userData: req.user, messages: {danger: req.flash(‘danger’), warning: req.flash(‘warning’), success: req.flash(‘success’)}});
  }
  else {
    res.redirect(‘/login’);
  }
});

app.get(‘/login’, function (req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect(‘/account’);
  }
  else{
    res.render(‘login’, {title: “Log in”, userData: req.user, messages: {danger: req.flash(‘danger’), warning: req.flash(‘warning’), success: req.flash(‘success’)}});
  }
});

app.post(‘/login’, passport.authenticate(‘local’, {
  successRedirect: ‘/account’,
  failureRedirect: ‘/login’,
  failureFlash: true
  }), function(req, res) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    }
    else {
      req.session.cookie.expires = false; // Cookie expires at end of session
    }
    res.redirect(‘/’);
});

app.get(‘/logout’, function(req, res){
  console.log(req.isAuthenticated());
  req.logout();
  console.log(req.isAuthenticated());
  req.flash(‘success’, “Logged out. See you soon!”);
  res.redirect(‘/’);
});

passport.use(‘local’, new LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
  loginAttempt();
  async function loginAttempt() {
    const client = await pool.connect()
    try{
      await client.query(‘BEGIN’)
      var currentAccountsData = await JSON.stringify(client.query(‘SELECT id, “firstName”, “email”, “password” FROM “users” WHERE “email”=$1’, [username], function(err, result) {
        if(err) {
          return done(err)
        }
        if(result.rows[0] == null) {
          req.flash(‘danger’, “Oops. Incorrect login details.”);
          return done(null, false);
        }
        else{
          bcrypt.compare(password, result.rows[0].password, function(err, check) {
            if (err){
              console.log(‘Error while checking password’);
              return done();
            }
            else if (check){
              return done(null, [{email: result.rows[0].email, firstName: result.rows[0].firstName}]);
            }
            else{
              req.flash(‘danger’, “Oops. Incorrect login details.”);
              return done(null, false);
            }
          });
        }
      }))
    }
    catch(e){throw (e);}
  };
}))

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
