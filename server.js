// server.js
// where your node app starts

// init project
var express = require('express');
var Sequelize = require('sequelize');
var app = express();
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');


// default user list
var users = [
      ["John","Hancock"],
      ["Liz","Smith"],
      ["Ahmed","Khan"]
    ];
var User;
var Users;
// setup a new database
// using database credentials set in .env
var sequelize = new Sequelize('database', process.env.DB_USER, process.env.DB_PASS, {
  host: '0.0.0.0',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  storage: '.data/database.sqlite'
});

// authenticate with the database
sequelize.authenticate()
  .then(function(err) {
    User = sequelize.define('users', {
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      }
    });
    
    setup();
  })
  .catch(function (err) {
    console.log('Unable to connect to the info database: ', err);
  });

var passdb = new Sequelize('database', process.env.DB_USER, process.env.DB_PASS, {
  host: '0.0.0.0',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  storage: '.data/database2.sqlite'
});

// authenticate with the database
passdb.authenticate()
  .then(function(err) {
    Users = sequelize.define('logins', {
      username: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      }
    });
  })
  .catch(function (err) {
    console.log('Unable to connect to the login database: ', err);
  });



app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/entry.html');
});

app.get("/index", function(req, res) {
  res.sendFile(__dirname + '/views/index.html')
})


// let dblogin = getUsernames();

app.get("/users", function (request, response) {
  var dbUsers=[];
  User.findAll().then(function(users) {
    users.forEach(function(user) {
      dbUsers.push([user.firstName,user.lastName]);
    });
    response.send(dbUsers);
  });
});

// creates a new entry in the users table with the submitted values
app.post("/users", function (request, response) {
  User.create({ firstName: request.query.fName, lastName: request.query.lName});
  response.sendStatus(200);
});

// new users table it with just the default users.
app.get("/reset", function (request, response) {
  setup();
  response.redirect("/index");
});

// removes all entries from the users table
app.get("/clear", function (request, response) {
  User.destroy({where: {}});
  response.redirect("/index");
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

app.post('/login',
    passport.authenticate('local', { successRedirect: '/index',
        failureRedirect: '/', failureFlash: 'Invalid Username of Password' }));

passport.use(new LocalStrategy(
    function(username, password, done) {
        const user1 = Users.find(logins => logins.username === username);

        if (!user1) {
            return done(null, false, {message: "Incorrect user"});
        } else if (user1.password === password) {
            return done(null, {username, password});
        } else {
            return done(null, false, {message: "Incorrect password"});
        }
    }
));

passport.serializeUser( ( user, done ) => done( null, user.username ) );

passport.deserializeUser( ( username, done ) => {
    const user = Users.find( u => u.username === username );
    console.log( 'deserializing:', username );

    if( user !== undefined ) {
        done( null, user )
    }else{
        done( null, false, { message:'user not found; session not restored' })
    }
});

app.post('/login',
    passport.authenticate('local', { successRedirect: '/index',
        failureRedirect: '/', failureFlash: 'Invalid Username of Password' }));

app.post('/createUser', function (request, response) {
    let newUser = request.body;
    const user1 = User.find(user => user.username === newUser.newUsername);
    if (!user1) {
        newUser = {
            username: newUser.newUsername,
            password: newUser.newPassword,
        };
        User.push(newUser);
        let userDoc = {
            _id: 'users',
            users: User
        };        
    }
    response.sendFile(__dirname + '/public/html/login.html');
});

function setup(){
  User.sync() 
    .then(function(){
      for(var i=0; i<users.length; i++){ 
        User.create({ firstName: users[i][0], lastName: users[i][1]}); 
      }
    });  
}

function getUsernames() {
  Users.findAll().then(function(logins) {
    Users.forEach(function(logins) {
      dblogin.push([logins.username,logins.password]);
    });
  });
}
