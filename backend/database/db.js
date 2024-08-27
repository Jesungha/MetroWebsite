// db.js
var mysql = require('mysql');

var con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root', // Replace with your MySQL username
    password: 'sU*T6zH1yI2F', // Replace with your MySQL password
    database: 'users', // Replace with your database name
    port: 3306 // Default MySQL port
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to the database!");
});


module.exports = con;
