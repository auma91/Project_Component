/***********************
  Load Components!
  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
var passport = require("passport"); //login system
var session = require("express-session"); //expressSession
var flash = require('connect-flash'); //will allow for alerts
const bcrypt = require('bcrypt-nodejs')
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const expressSession = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());
app.use(expressSession({secret: 'mySecretKey'}));
app.use(flash());
//require('./lib/routes.js')(app); //include routes file

//Create Database Connection
var pgp = require('pg-promise')();
var loggedin = false;

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab, we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!
**********************/
const dbConfig = {
	host: 'ec2-50-17-246-114.compute-1.amazonaws.com',
	port: 5432,
	database: 'dc9sh8asjaab1d',
	user: 'nbonaqcrbetdgo',
	password: 'cad36c22ea52e000d938c0b89cc6adc1b61f9b5b40a6a73c46b0cc49856489ab',
  ssl: true
};

//const dbConfig = pgp('postgres://xbhtcypzgcjpuk:75a929bd6e0d7df76ddfa48a2bf3e38a5f005b938ba74fe490b2f7bebcd2efde@ec2-107-20-177-161.compute-1.amazonaws.com:5432/d22mr3m4netqs8');

var db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

var port = process.env.PORT || 8080;

/*********************************
 *
************************************/

// login page
app.get('/', async function(req, res) {
	res.render('pages/home',{
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg'),
		local_css:"homepage.css",
    my_title: "HOME",
    emailList: "",
    loginname: "Login"
	});
	var pass = await bcrypt.hash('Hello123', 5);
	console.log(pass);
	bcrypt.compare('Hello123', pass, function(err, res) {
	  if(res) {
			console.log("PASSWORD MATCHES");
	  } else {
			console.log("PASSWORD DOESN'T MATCH");
	  }
	});
});

passport.use('local', new LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
  loginAttempt();
  async function loginAttempt() {
    //const client = await pool.connect()
    try{
      //await client.query(‘BEGIN’)
      db.any("SELECT * FROM users WHERE email = '" + username + "';")
      .then(function(data) {
        //console.log(data);
        //console.log(data[0]);
        bcrypt.compare(password, data[0].password, function(err, check) {
          if (err){
            console.log('Error while checking password');
            return done();
          }
          else if (check){
            req.flash('success_msg','Succesfully logged in')
            return done(null, [{email: data[0].email, firstName: data[0].name}]);
          }
          else{
            req.flash('error_msg', 'Oops. Incorrect login details.');
            return done(null, false);
          }
        });
      })
      .catch(function(error) {
        console.log(error);
      });
    }
    catch(e){throw (e);}
    console.log(req.email);
  }
}))

passport.serializeUser(function(user, done) {
 done(null, user);
});

passport.deserializeUser(function(user, done) {
 done(null, user);
});

app.get('/login', function (req, res, next) {
   if (req.isAuthenticated()) {

     res.redirect('/account');
   }
   else{
     res.render('pages/home',{
       success_msg: req.flash('success_msg'),
       error_msg: '',
       local_css:"homepage.css",
       my_title: "HOME",
       emailList: "",
       loginname: "Login"
     });
   }
 });

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
  })
);

app.get('/logout', function(req, res){
  console.log(req.isAuthenticated());
  req.logout();
  console.log(req.isAuthenticated());
  //req.flash(‘success’, “Logged out. See you soon!”);
  res.redirect('/');
 });




// registration page
app.get('/register', function(req, res) {
  //let errors = [];
  res.render('pages/reg', {
    local_css:"reg.css",
    my_title: "Registration",
    success_msg: "",
    error_msg: "",
    name: "",
    email: "",
    psw: "",
    psw2: ""
  });
});

app.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  var errors = '';
  console.log(name+email+password);

  if (!name || !email || !password || !password) {
    errors += 'Please enter all fields' +'\n';
  }

  if (password != password2) {
    errors += 'Passwords do not match' +'\n';
  }

  if (password.length < 6) {
    errors += 'Password must be at least 6 characters' +'\n';
  }

  if (errors != '') {
    res.render('pages/reg', {
      local_css:"reg.css", my_title: "Registration",
      error_msg: errors,
      success_msg: "",
      name,
      email,
      password,
      password2
    });
  }
  else {
    db.any("SELECT COUNT(*) FROM users WHERE email = '" + email + "';")
    .then(data =>{
      console.log(data[0].count);
      if(data[0].count != 0) {
        res.render('pages/reg', {
          local_css:"reg.css",
          my_title: "Registration",
          error_msg: "Email is already registered",
          success_msg: "",
          name,
          email,
          password,
          password2
        });
      }
      else {
        const user = {
          email: req.body.email,
          password: req.body.password
        }
        var pass = bcrypt.hashSync(password);;
        db.none("INSERT INTO users(name, email, password) VALUES('" + name + "', '" + email + "', '" + pass + "');")
        .then(() => {
          // success;
          req.flash(
            'success_msg',
            'You are now registered and can log in'
          )
          res.redirect('/login');
        })
        .catch(error => {
          // error;
          console.log(err)
        });
      }
    })
    .catch (fail => {
      console.log(fail);
    })
  }
});

/*Add your other get/post request handlers below here: */
//recipe pages
//IMPORTANT:
//Need to figure out how we are going to pass recipe id from click to recipe_choice
app.get('/recipe', function(req, res) {
  /*res.render('pages/recipe', {
    local_css: "homepage.css",
    my_title: "recipe ex",
    title: "Recipe Info",
    //general is everything straight from recipes table
    general: "",
    //ingredients is all ingredients associated with this recipe
    ingredients: "",
    //reviews is all reviews associated with this recipe
    reviews: "",
    loginname: "Login"
  })*/
  //get choice of recipe

  // var recipe_choice = req.query.recipe_choice; HARD CODE FOR TEST
  //get general info on recipe (name, difficulty, prep time, body, tutorial)
  var recipe_info = "SELECT * FROM Recipes WHERE recipe_id = 1;";
  //get ingredients in recipe
  var recipe_ingredients = "SELECT name FROM Ingredients WHERE ingredient_id = ANY(SELECT unnest(ingredients) FROM Recipes WHERE recipe_id = 1);";
  //get reviews for recipe (add in username to reviews table) (add in review_ids to recipes table)
  var recipe_reviews = "SELECT username,body,rating FROM Reviews WHERE review_id = ANY(SELECT unnest(review_ids) FROM Recipes WHERE recipe_id = 1);";
    db.task('get-recipe', task => {
      return task.batch([
        task.any(recipe_info),
        task.any(recipe_ingredients),
        task.any(recipe_reviews)
      ]);
    })
    .then(info => {
      res.render('pages/recipe', {
        my_title: "Recipe Info",
        //general is everything straight from recipes table
        local_css:"homepage.css",
        loginname: "",
        general: info[0][0],
        //ingredients is all ingredients associated with this recipe
        ingredients: info[1],
        //reviews is all reviews associated with this recipe
        reviews: info[2]
      })
    })
});


app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
console.log('8080 is the magic port');


//console.log(bcrypt.hash('Hello123', 5));
