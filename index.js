const sqlite3 = require('sqlite3').verbose()
const express = require('express')
const cryptojs = require('crypto-js')
const fs = require('fs')
const { check, validationResult } = require('express-validator/check')
const https = require('https')
const helmet = require('helmet')
const nobots = require('express-nobots')
const basicAuth = require('express-basic-auth')
const config = require('config.js')

function connect_db() {
  let db = new sqlite3.Database('database.db', err => {
    if (err) return console.error(err.message)
    console.log("Connected to the SQLite database.")

  })

  return db
}

function close_db(db) {
  db.close(err => {
    if (err) return console.error(err.message)
    console.log("Closed the database connection.")
  })
}

let db = connect_db()

db.run(`CREATE TABLE IF NOT EXISTS signups(
  email text unique,
  created datetime default current_timestamp
);`, [], err => {
  if (err) throw(err)

  return db
})

close_db(db)

const app = express()

app.use(helmet())

app.use(nobots())

app.use(express.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

function getEncryptionKey(path) {
  return config.encryption_key
}

function createEncryptedEmail(email) {
  let encrypted = cryptojs.AES.encrypt(email, getEncryptionKey('encryption_key.conf')).toString()
  return encrypted
}

function createDecryptedEmail(encrypted) {
  let key = getEncryptionKey('encryption_key.conf')
  return cryptojs.AES.decrypt(encrypted, key).toString(cryptojs.enc.Utf8)
}

app.post('/', [
  check('email').isEmail().normalizeEmail().withMessage("Email was not a proper email.")
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log(errors.array())
    return res.status(422).send(errors.array()[0].msg)
  }

  let db = connect_db()

  const signups = db.all('SELECT (email) FROM signups',
    (err,signups) => {
    if (err) {
      console.log(err)
      return res.status(422).send(err)
    }

    // Don't insert new signup if email already in database.
    const emails = signups.map(signup => createDecryptedEmail(signup.email))
    if (emails.indexOf(req.body.email) > -1) {
      close_db(db)
      return res.status(422).send("This email is already signed up!")
    }

    const encryptedEmail = createEncryptedEmail(req.body.email)
    db.run('INSERT INTO signups(email) VALUES (?)',
      [encryptedEmail], err => {
      if (err) {
        console.log(err)
        close_db(db)
        return res.status(422).send(err)
      }
      console.log("Saving email!")
    })

    res.send("Saved email successfully!")
  })
})

// Returns a new array of signup objects with removed duplicate emails.
function uniqEmails(rows, filter, seen=[], i=0) {
  if (i+1 > rows.length) return seen

  if (seen.filter(row => row.email === rows[i].email).length == 0) {
    seen.push(rows[i])
  }

  return uniqEmails(rows, filter, seen, i+1)
}

app.get('/signups', basicAuth({
  // TODO: Put username and password in config file.
  users: { config.admin_user : config.admin_pwd }
}), (req, res) => {
    let db = new sqlite3.Database('database.db', err => {
    if (err) console.log(err)

    db.all('SELECT email, created FROM signups', (err, rows) => {
      if (err) console.log(err)

      const decrypted = rows.map(row => {
        return {
          email: createDecryptedEmail(row.email),
          created: row.created
        }
      })

      // Remove duplicate emails
      const uniques = uniqEmails(decrypted)

      res.send(uniques)
    })
  })
})

if(config.production_mode === true) {
  const options = {
    key: fs.readFileSync('signupform-key.pem'),
    cert: fs.readFileSync('signupform-cert.pem')
  }

  https.createServer(options, app).listen(3000, () => {
    console.log("Timed signup form listening on port 3000!")
  })
} else {
  app.listen(3000, () => {
    console.log("Timed signup form listening on port 3000!")
  })
}
