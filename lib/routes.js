var express = require('express');
var app = express();
var passport = require("passport");
var request = require('request');
const bcrypt = require('bcryptjs')
const LocalStrategy = require('passport-local').Strategy;
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
//app.use(express.static('resources'));

app.get('/', function (req, res, next) {
 res.render('home', {
   local_css:"reg.css", my_title: "Registration",
   errors,
   name,
   email,
   psw,
   psw2
 });
 //console.log(req.user);
 });
