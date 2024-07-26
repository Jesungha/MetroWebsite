const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('./database/db'); // Ensure this path is correct

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/login', (req, res) => {
  const { email, pw } = req.body;
  console.log(`Received email: ${email}`);
  console.log(`Received password: ${pw}`);
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else if (results.length > 0) {
      console.log(`Found user: ${results[0].password}`);
      const user = results[0];
      bcrypt.compare(pw, user.password, function (err, result) {
        console.log(`Result: ${result}`);
        if (err) {
          res.status(500).send(err);
        } else if (result) {
          res.json({ success: true, user });
        } else {
          res.status(401).send('Invalid credentials');
        }
      });
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});
app.post('/register', (req, res) => {

  const { email, pw, name } = req.body;
  console.log(`Received email: ${email}`);
  console.log(`Received password: ${pw}`);
  console.log(`Received name: ${name}`);
  const sql1 = 'SELECT * FROM users WHERE email = ?';
  const sql = 'INSERT INTO users (email, password, name) VALUES (?, ?, ?)';
  db.query(sql1, [email], (err, results) => {
    if (err) {
      res.status
        (500).send
        (err);
    }
    else if (results.length > 0) {
      res.status(409).send('User already exists');
    }
    else {
      bcrypt.hash(pw, 10, function (err, hash) {
        if (err) {
          res.status(500).send(err);
        }
        else {
          db.query(sql, [email, hash, name], (err, results) => {
            if (err) {
              res.status(500).send(err);
            }
            else {
              res.json({ success: true });
            }
          });
        }
      });
    }
  }
  );
}
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
