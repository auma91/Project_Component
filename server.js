/***********************
  Load Components!
  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

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
	host: 'ec2-107-20-177-161.compute-1.amazonaws.com',
	port: 5432,
	database: 'd22mr3m4netqs8',
	user: 'xbhtcypzgcjpuk',
	password: '75a929bd6e0d7df76ddfa48a2bf3e38a5f005b938ba74fe490b2f7bebcd2efde',
  ssl: true
};

//const dbConfig = pgp('postgres://xbhtcypzgcjpuk:75a929bd6e0d7df76ddfa48a2bf3e38a5f005b938ba74fe490b2f7bebcd2efde@ec2-107-20-177-161.compute-1.amazonaws.com:5432/d22mr3m4netqs8');

var db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

var port = process.env.PORT || 8080;

/*********************************
 Below we'll add the get & post requests which will handle:
   - Database access
   - Parse parameters from get (URL) and post (data package)
   - Render Views - This will decide where the user will go after the get/post request has been processed
 Web Page Requests:
  Login Page:        Provided For your (can ignore this page)
  Registration Page: Provided For your (can ignore this page)
  Home Page:
  		/home - get request (no parameters)
  				This route will make a single query to the favorite_colors table to retrieve all of the rows of colors
  				This data will be passed to the home view (pages/home)
  		/home/pick_color - post request (color_message)
  				This route will be used for reading in a post request from the user which provides the color message for the default color.
  				We'll be "hard-coding" this to only work with the Default Color Button, which will pass in a color of #FFFFFF (white).
  				The parameter, color_message, will tell us what message to display for our default color selection.
  				This route will then render the home page's view (pages/home)
  		/home/pick_color - get request (color)
  				This route will read in a get request which provides the color (in hex) that the user has selected from the home page.
  				Next, it will need to handle multiple postgres queries which will:
  					1. Retrieve all of the color options from the favorite_colors table (same as /home)
  					2. Retrieve the specific color message for the chosen color
  				The results for these combined queries will then be passed to the home view (pages/home)
  		/team_stats - get request (no parameters)
  			This route will require no parameters.  It will require 3 postgres queries which will:
  				1. Retrieve all of the football games in the Fall 2018 Season
  				2. Count the number of winning games in the Fall 2018 Season
  				3. Count the number of lossing games in the Fall 2018 Season
  			The three query results will then be passed onto the team_stats view (pages/team_stats).
  			The team_stats view will display all fo the football games for the season, show who won each game,
  			and show the total number of wins/losses for the season.
  		/player_info - get request (no parameters)
        This route will handle a single query to the football_players table which will retrieve the id & name for all of the football players.
        Next it will pass this result to the player_info view (pages/player_info), which will use the ids & names to populate the select tag for a form

      /player_info/select_player - get request (player_id)
        This route will handle three queries and a work with a single parameter.
      Parameter:
        player_id - this will be a single number that refers to the football player's id.
        Queries:
          1. Retrieve the user id's & names of the football players (just like in /player_info)
          2. Retrieve the specific football player's informatioin from the football_players table
          3. Retrieve the total number of football games the player has played in
************************************/

// login page
app.get('/', function(req, res) {
	res.render('pages/home',{
		local_css:"homepage.css",
    my_title: "HOME",
    emailList: "",
    loginname: "Login"
	});
});

app.get('/home', function(req, res) {
  var email = req.query.uname;
  var psw = req.query.psw;
  console.log(email+psw);
  var emails = "SELECT * FROM users WHERE email= '"+email+"';";
  db.task('get-info', task => {
    return task.batch([
      task.any(emails),
    ]);
  })
  .then(info => {
    if(info[0][0].password==psw) {
      console.log("PASSWORD MATCHES!")
      loggedin = true;
      res.render('pages/home',{
        local_css:"homepage.css",
        my_title: "HOME",
        emailList: info[0],
        loginname: info[0][0].name
      });
    }
    else {
      console.log("PASSWORD DOESN'T MATCH!")
      res.render('pages/home',{
    		local_css:"homepage.css",
        my_title: "HOME",
        emailList: "",
        loginname: "Login"
    	});
    }


  })
});

// registration page
app.get('/register', function(req, res) {
  res.render('pages/reg', {
    local_css:"reg.css",
    my_title: "Registration"
  });
});

app.post('/register', function(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var pass = req.body.psw;
  console.log(name);
  var insert_statement = "INSERT INTO users(name, email, password) VALUES('" + name + "','" +
              email + "','" + pass +"');";
  console.log(insert_statement);
  db.task('get-everything', task => {
        return task.batch([
            task.any(insert_statement)
        ]);
    })
    .then(info => {
      res.render('pages/reg', {
        local_css:"reg.css",
        my_title: "Registration"
      });
    })
});

/*Add your other get/post request handlers below here: */


app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
console.log('8080 is the magic port');
