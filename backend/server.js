const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const db = require('./database/db');
require('dotenv').config();
const multer  = require('multer')
const app = express();
const port = 3001;
const csv = require('csv');
const fs = require('fs');
app.disable('x-powered-by');
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend origin
  credentials: true
}));


app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 day lifespan
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/// MULTER SETUP
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname);
  }
});
const upload = multer({ storage });


// Login endpoint
app.post('/login', (req, res) => {
  const { email, pw } = req.body;
  console.log(`Received email: ${email}`); // Ensure sensitive info is not logged
  // Note: Avoid logging passwords or any sensitive information
  const sql = 'SELECT * FROM users WHERE email = ?';
  
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err); // Log errors for debugging
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    } 
    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(pw, user.password, (err, result) => {
        if (err) {
          console.error('Password comparison error:', err); // Log errors for debugging
          return res.status(500).json({ success: false, message: 'Internal server error.' });
        } 
        if (result) {
          req.session.loggedin = true;
          req.session.userId = user.id; // Set session data
          res.status(200).json({ success: true, user });
        } else {
          res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
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

//Logout endpoint 



app.post('/logout', (req, res) => {
  console.log('Session before destroying:', req.session); // Log entire session for debugging
  if (req.session.userId) {
    console.log('Attempting to log out user:', req.session.userId);
    req.session.destroy(err => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ success: false, message: 'Could not log out.' });
      }
      res.clearCookie(process.env.SESS_NAME); // Clear the session cookie
      res.status(200).json({ success: true });
      console.log('Logged out');
    });
  } else {
    console.log('No user logged in, session:', req.session);
    res.status(400).json({ success: false, message: 'No user is logged in.' });
  }
});

// server.js

app.get('/dashboard', (req, res) => {
  if (req.session.userId) {
    // Fetch user-specific data from the database using req.session.userId
    const sql = 'SELECT name, email FROM users WHERE id = ?';
    console.log(`User ID: ${req.session.userId}`);

    db.query(sql, [req.session.userId], (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else if (results.length > 0) {
        res.json({ success: true, user: results[0] });
      } else {
        res.status(404).send('User not found');
      }
    });
  } else {
    res.status(401).send('Unauthorized: Please log in first');
  }
});

app.get('/isLoggedIn', (req, res) => {
  console.log(`User ID: ${req.session.userId}`);
  if (req.session.userId) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
}
);

//get file endpoint
app.post('/uploadFile', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  else{
    let stream = fs.createReadStream(req.file.path);
    let csvData = [];
    let isFirstLine = true;
    let csvStream = csv
        .parse()
        .on("data", function (data) {
          if (isFirstLine) {
            // Skip the first line (headers)
            isFirstLine = false;
            return;
        }
            csvData.push(data);
        })
        .on("end", function () {
            // Remove Header ROW
            csvData.shift();

            // Open the MySQL connection
            let query = 'INSERT INTO `users`.`sales_table` (`marketid`, `custno`, `company`, `item`, `itmdesc`, `serial`, `qty`, `price`, `minprice`, `cost`, `discount`, `realprice`, `taxable`, `taxamount`, `pptax`, `subtotal`, `profit`, `adduser`, `name`, `lastname`, `invno`, `adddate`, `custno1`, `acttype`, `arstat`, `paytype`, `prodline`, `category`, `subcategory`, `paymentsku`, `cashpaid`, `creditcardpaid`, `debitcardpaid`, `financedpaid`, `checkpaid`, `otherpaid`, `artraniid`, `armastiid`, `firstname`, `lastname1`, `tangible`, `serialized`, `stationid`, `manufacturer`, `color`, `state`, `region`, `principle`) VALUES ?';
            db.query(query, [csvData], (error, response) => {
                console.log(error || response);
            });
        
          
             
            // delete file after saving to MySQL database
            // -> you can comment the statement to see the uploaded CSV file.
            fs.unlinkSync(req.file.path)
        });
    stream.pipe(csvStream);
  
    
  }
  res.status(200).json({
    message: 'File uploaded successfully!',
    file: req.file,
  });


});




// get itemdesc to get number, armastiid to identify identical customer, date for date, acttype for either activation or upgrade, 


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
