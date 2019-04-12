// login page
// app.get('/', async function(req, res) {
// 	res.render('pages/home',{
// 		local_css:"homepage.css",
//     my_title: "HOME",
//     emailList: "",
//     loginname: "Login"
// 	});
// 	var pass = await bcrypt.hash('Hello123', 5);
// 	console.log(pass);
// 	bcrypt.compare('Hello123', pass, function(err, res) {
// 	  if(res) {
// 			console.log("PASSWORD MATCHES");
// 	  } else {
// 			console.log("PASSWORD DOESN'T MATCH");
// 	  }
// 	});
// });

app.get('/', function (req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/account');
  }
  else{
    res.render('pages/home',{
  		local_css:"homepage.css",
      my_title: "HOME",
      emailList: "",
      loginname: "Login"
  	});
  }
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/account',
  failureRedirect: '/login',
  failureFlash: true
  }), function(req, res) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
      req.session.cookie.expires = false; // Cookie expires at end of session
    }
    res.redirect('/');
  }
);

app.get('/logout', function(req, res){
  console.log(req.isAuthenticated());
  req.logout();
  console.log(req.isAuthenticated());
  //req.flash(‘success’, “Logged out. See you soon!”);
  res.redirect('/');
 });

passport.use('local', new LocalStrategy({passReqToCallback : true}, (req, uname, psw, done) => {
  loginAttempt();
  async function loginAttempt() {
    //const client = await pool.connect()
    try{
      //await client.query(‘BEGIN’)
      db.any('SELECT * FROM users WHERE email = "' + uname + '";')
      .then(function(data) {
        bcrypt.compare(psw, data[0].password, function(err, check) {
          if (err){
            console.log('Error while checking password');
            return done();
          }
          else if (check){
            return done(null, [{email: data[0].email, firstName: data[0].name}]);
          }
          else{
            //req.flash(‘danger’, “Oops. Incorrect login details.”);
            return done(null, false);
          }
        });
      })
      .catch(function(error) {
        console.log(error);
      });
    }
    catch(e){throw (e);}
}}))

passport.serializeUser(function(user, done) {
 done(null, user);
});

passport.deserializeUser(function(user, done) {
 done(null, user);
});

//if loggedin
app.get('/account', function (req, res, next) {
  if(req.isAuthenticated()){
    res.render('pages/home',{
  		local_css:"homepage.css",
      my_title: "HOME",
      emailList: "",
      loginname: "Login"
  	});
  }
  else{
    res.redirect('/login');
  }
});

// app.get('/home', function(req, res) {
//   var email = req.query.uname;
//   var psw = req.query.psw;
//   console.log(email+psw);
//   var emails = "SELECT * FROM users WHERE email= '"+email+"';";
//   db.task('get-info', task => {
//     return task.batch([
//       task.any(emails),
//     ]);
//   })
//   .then(info => {
//     if(info[0][0].password==psw) {
//       console.log("PASSWORD MATCHES!")
//       loggedin = true;
//       res.render('pages/home',{
//         local_css:"homepage.css",
//         my_title: "HOME",
//         emailList: info[0],
//         loginname: info[0][0].name
//       });
//     }
//     else {
//       console.log("PASSWORD DOESN'T MATCH!")
//       res.render('pages/home',{
//     		local_css:"homepage.css",
//         my_title: "HOME",
//         emailList: "",
//         loginname: "Login"
//     	});
//     }
//   })
// });

// registration page
app.get('/register', function(req, res) {
  res.render('pages/reg', {
    local_css:"reg.css",
    my_title: "Registration"
  });
});

app.post('/register', async function(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var pass = await bcrypt.hash(req.body.psw, 5);
  console.log(name);
	var emails_check = "SELECT COUNT(*) FROM users WHERE email= '"+email+"';";
  var insert_statement = "INSERT INTO users(name, email, password) VALUES('" + name + "','" +
              email + "','" + pass +"');";
  console.log(emails_check+"\n"+insert_statement);
  db.task('get-everything', task => {
        return task.batch([
            task.any(emails_check)
        ]);
    })
    .then(info => {
			if(info[0][0].count!=0) {
				console.log("User account already exist");
			}
			else {
				db.task('get-everything', task => {
					return task.batch([
						task.any(insert_statement)
					]);
					console.log("User account created.");
				})
			}
			res.redirect('/');
      /*res.render('pages/reg', {
        local_css:"reg.css",
        my_title: "Registration"
      });*/
    })
});

/*Add your other get/post request handlers below here: */


app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
console.log('8080 is the magic port');


//console.log(bcrypt.hash('Hello123', 5));


<% if(typeof local_css == 'string' && local_css){ %>
 <link href="../resources/css/<%=local_css%>" rel="stylesheet">
<% } %>
