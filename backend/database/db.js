// db.js
var mysql = require('mysql');

var con = mysql.createConnection({
    host: process.env.MYSQL_HOST, // Replace with your MySQL host
    user: process.env.MYSQL_USER, // Replace with your MySQL username
    password: process.env.MYSQL_PASSWORD, // Replace with your MySQL password
    database: process.env.MYSQL_DB, // Replace with your database name
    port: process.env.MYSQL_PORT // Default MySQL port
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to the database!");
});


module.exports = con;
