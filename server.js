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
app.use(session({
  secret: 'secrettexthere',
  saveUninitialized: true,
  resave: true,
}));
const LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

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
	host: 'ec2-54-225-106-93.compute-1.amazonaws.com',
	port: 5432,
	database: 'd67nqkf3arp740',
	user: 'szzrympmyxwqci',
	password: '2f886bf6b8dfa3426adfb08852a5b5898dd32ceefa4f08e8bd539a6a57ae4aea',
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
app.get('/', function(req, res) {
  console.log(req.isAuthenticated());
  db.any("SELECT COUNT(*) FROM Recipes;")
  .then(function(data) {
    var count = data[0].count;
    var id_list = [0,0,0];
    for(var i = 0; i < 3; i++) {
      var indice = Math.round(Math.random()*count);
      if(indice>0) {
        id_list[i] = indice;
      }
      else {
        i--;
      }
    }
    var rand_sel = "SELECT * FROM Recipes WHERE recipe_id="+id_list[0]+" OR recipe_id="+id_list[1]+" OR recipe_id="+id_list[2]+";";
    db.any(rand_sel)
    .then(function(list) {
      if(req.isAuthenticated()) {
        res.render('pages/home',{
          success_msg: req.flash('success_msg'),
          error_msg: req.flash('error_msg'),
      		local_css:"homepage.css",
          my_title: "HOME",
          loginname: req.session.passport.user.firstName,
          feat_recipes: list
      	});
      }
      else {
        res.render('pages/home',{
          success_msg: req.flash('success_msg'),
          error_msg: req.flash('error_msg'),
      		local_css:"homepage.css",
          my_title: "HOME",
          loginname: null,
          feat_recipes: list
      	});
      }

    })
    .catch(function(error) {
      res.render('pages/home',{
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
    		local_css:"homepage.css",
        my_title: "HOME",
        loginname: null,
        feat_recipes: null
    	});
    })
  })
  .catch(function(error) {
    res.render('pages/home',{
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg'),
  		local_css:"homepage.css",
      my_title: "HOME",
      loginname: null,
      feat_recipes: null
  	});
  })
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
            return done(null, {email: data[0].email, firstName: data[0].name});
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
       loginname: "Login"
     });
   }
 });

app.post('/login', passport.authenticate('local', {
  successRedirect: '/account',
  failureRedirect: '/login',
  failureFlash: true
  })
);

app.get('/logout', function(req, res){
  console.log(req.isAuthenticated());
  req.logOut();
  console.log(req.isAuthenticated());
  //req.flash(‘success’, “Logged out. See you soon!”);
  res.redirect('/');
 });

app.get('/account', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.render('pages/account',{
      success_msg: req.flash('success_msg'),
      error_msg: '',
      local_css:"homepage.css",
      my_title: "HOME",
      loginname: req.session.passport.user.firstName
    });
  }
  else {
    res.render('pages/account',{
      success_msg: req.flash('success_msg'),
      error_msg: '',
      local_css:"homepage.css",
      my_title: "HOME",
      loginname: null
    });
  }
  console.log(req.session.passport.user);

});

// registration page
app.get('/register', function(req, res) {
  //let errors = [];
  res.render('pages/reg', {
    local_css:"reg.css",
    my_title: "Registration",
    loginname: null,
    success_msg: "",
    error_msg: "",
    name: "",
    email: "",
    psw: "",
    psw2: ""
  });
});

app.post('/register', (req, res) => {
  if(req.isAuthenticated()) {
    req.flash(
      'success_msg',
      'You are already logged in.'
    )
    res.redirect('/');
  }
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
      loginname: null,
      name,
      email,
      password,
      password2,
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
          loginname: null,
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
  var recipe_id = req.query.recipe_choice;
  console.log(recipe_id);
  // var recipe_choice = req.query.recipe_choice; HARD CODE FOR TEST
  //get general info on recipe (name, difficulty, prep time, body, tutorial)
  var recipe_info = "SELECT * FROM Recipes WHERE recipe_id = "+recipe_id+";";
  //get ingredients in recipe
  var recipe_ingredients = "SELECT name FROM Ingredients WHERE ingredient_id = ANY(SELECT unnest(ingredients) FROM Recipes WHERE recipe_id = "+recipe_id+");";
  //get reviews for recipe (add in username to reviews table) (add in review_ids to recipes table)
  var recipe_reviews = "SELECT username,body,rating FROM Reviews WHERE review_id = ANY(SELECT unnest(review_ids) FROM Recipes WHERE recipe_id = "+recipe_id+");";
    db.task('get-recipe', task => {
      return task.batch([
        task.any(recipe_info),
        task.any(recipe_ingredients),
        task.any(recipe_reviews)
      ]);
    })
    .then(info => {
      if(req.isAuthenticated()) {
        res.render('pages/recipe', {
          my_title: "Recipe Info",
          //general is everything straight from recipes table
          local_css:"homepage.css",
          loginname: req.session.passport.user.firstName,
          general: info[0][0],
          //ingredients is all ingredients associated with this recipe
          ingredients: info[1],
          //reviews is all reviews associated with this recipe
          reviews: info[2]
        })
      }
      else {
        res.render('pages/recipe', {
          my_title: "Recipe Info",
          //general is everything straight from recipes table
          local_css:"homepage.css",
          loginname: null,
          general: info[0][0],
          //ingredients is all ingredients associated with this recipe
          ingredients: info[1],
          //reviews is all reviews associated with this recipe
          reviews: info[2]
        })
      }

    })
});


app.post('/search', function(req, res) {
  var search = req.body.search;
  console.log("This was the passed search: " + search);
  res.redirect("/search?search="+search+"");
});

app.get('/search', function(req, res) {
  var search_query = req.query.search;
  if(search_query==null) {
    console.log("its nothing");
    db.task('get-recipe', task => {
      return task.batch([
        task.any('SELECT * FROM Recipes;')
      ]);
    })
    .then(info => {
      if(req.isAuthenticated()) {
        res.render('pages/search', {
          my_title: "Recipes",
          local_css: "homepage.css",
          list: info[0],
          loginname: req.session.passport.user.firstName
        });
      }
      else {
        res.render('pages/search', {
          my_title: "Recipes",
          local_css: "homepage.css",
          list: info[0],
          loginname: null
        });
      }
    })
  }
  else {
    var query = "SELECT * FROM Recipes WHERE";
    var params = (search_query.toLowerCase()).split(" ");
    if(params.length>1) {
      for(var i = 0; i < params.length; i++) {
        if(i>0) {query+= " AND position('" + params[i] + "' in LOWER(name))>0";}
        else {query+= " position('" + params[i] + "' in LOWER(name))>0";}
      }
      query+=";";
    }
    else {query+= " position('" + params[0] + "' in LOWER(name))>0;";}
    console.log("This is the query I got: " + query);
    db.task('get-recipe', task => {
      return task.batch([
        task.any(query)
      ]);
    })
    .then(info => {
      console.log(info[0]);
      if(req.isAuthenticated()) {
        res.render('pages/search', {
          my_title: "Recipes",
          local_css: "homepage.css",
          list: info[0],
          loginname: req.session.passport.user.firstName
        });
      }
      else {
        res.render('pages/search', {
          my_title: "Recipes",
          local_css: "homepage.css",
          list: info[0],
          loginname: null
        });
      }
    })
  }
  console.log("This is the query i got: " + search_query);
  //res.send("success to search: " + search);
});

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});

console.log('8080 is the magic port');


//console.log(bcrypt.hash('Hello123', 5));
