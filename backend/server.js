const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const db = require('./database/db');
require('dotenv').config();
const multer = require('multer')
const app = express();
const port = 3001;
const csv = require('csv');
const fs = require('fs');
const con = require('./database/db');
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
  const sql = 'INSERT INTO users (email, password, name, master) VALUES (?, ?, ?, 0)';
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
    const sql = 'SELECT name, email, master FROM users WHERE id = ?';

    db.query(sql, [req.session.userId], (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else if (results.length > 0) {
        console.log('User data:', results[0]);
        res.json({ success: true, user: results[0] });
      } else {
        res.status(404).send('User not found');
      }
    });
  } else {
    res.status(401).send('Unauthorized: Please log in first');
  }
});

//adminpreviliges
app.get('/admin', (req, res) => {
  if (req.session.userId) {
    // Fetch user-specific data from the database using req.session.userId
    const sql = 'SELECT email, name, master FROM users';
    
    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else if (results.length > 0) {
        res.json({ success: true, user: results });
      }
      else {
        res.status(404).send('No users found');
      }
    });

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
  else {
    let stream = fs.createReadStream(req.file.path);
    let csvData = [];
    let i = 0;
    let csvStream = csv
      .parse()
      .on("data", function (data) {
        csvData.push(data);
      })
      .on("end", function () {
        // Remove Header ROW
        csvData.shift();
        // Open the MySQL connection
        let query = 'INSERT INTO `users`.`dump_table` (`marketid`, `storeid`, `company`, `custid`, `invno`, `SERIAL`, `item`, `mobile`, `actdate`, `account`, `ported`, `portptn`, `reference`, `sim`, `reference1`, `custname`, `promoname`, `linetype`, `status`, `source`, `plantype`, `accounttype`, `term`, `prodline`, `itemdesc`, `username`, `acttype`, `plancode`, `plantype1`, `grouptype`, `plandesc`, `mrc`) VALUES ?';
        db.query(query, [csvData], (error, response) => {
          console.log(error || response);
        });



        // delete file after saving to MySQL database
        // -> you can comment the statement to see the uploaded CSV file.
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
          return res.status(500).json({ message: 'Error deleting the uploaded file.', error: err });
        }
      });

    stream.pipe(csvStream);

    try {
      var update_customer = 'INSERT INTO customer_info(Date, PhoneNumber, PhoneName, acttype, Plan) SELECT d1.actdate as Date, d1.Mobile as PhoneNumber, IF(d1.itemdesc = "", "BYOD", d1.itemdesc) as PhoneName, d1.acttype, d1.plandesc as Plan FROM dump_table d1 JOIN dump_table d2 ON d1.id = (d2.id + 1)WHERE d1.Mobile != d2.Mobile;';
      db.query(update_customer, function (err, result) {
        if (err) {
          console.error('Error updating customer_info:', err);
          return res.status(500).json({ message: 'Error updating customer_info.', error: err });
        }
      });

      // Then, delete all data from `dump_table`
      var delete_dump_table = "DELETE FROM dump_table";
      db.query(delete_dump_table, function (err, result) {
        if (err) {
          console.error('Error deleting dump_table:', err);
          return res.status(500).json({ message: 'Error deleting dump_table.', error: err });
        }
      });

      // If both queries succeed, send a success response
      res.status(200).json({ message: 'Data transferred and dump table cleared successfully!' });
    } catch (err) {
      // Catch any errors and send a failure response
      console.error('Error manipulating SQL:', err);
      res.status(500).json({ message: 'Error manipulating SQL data.', error: err });
    }
  }

});
//get user by phoneNumber
app.post('/getNumber', (req, res) => {
  const sql = 'SELECT * FROM customer_info WHERE PhoneNumber = ?';
  console.log("Phone Number received: ", req.body.phoneNumber);
  db.query(sql, [req.body.phoneNumber], (err, results) => {
    if (err) {
      console.error('Error executing query', err);
      return res.status(500).json({ success: false, error: err });
    } else {
      if (results.length > 0) {
        return res.json({ success: true, data: results });
      } else {
        return res.json({ success: false, message: 'No matching records found' });
      }
    }
  });
  // Temporary response for testing without database interaction
});








// get itemdesc to get number, armastiid to identify identical customer, date for date, acttype for either activation or upgrade, 


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
