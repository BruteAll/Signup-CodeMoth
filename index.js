const sqlite3 = require('sqlite3').verbose()
const express = require('express')
const bodyParser = require('body-parser')
const cryptojs = require('crypto-js')
const fs = require('fs')
const { check, validationResult } = require('express-validator/check')

let db = new sqlite3.Database('database.db', err => {
  if (err) return console.error(err.message)
  console.log("Connected to the SQLite database.")

  db.run(`CREATE TABLE IF NOT EXISTS signups(
    email text unique,
    created datetime default current_timestamp
  );`, [], err => {
    if (err) console.log(err)
  })
})

db.close(err => {
  if (err) return console.error(err.message)
  console.log("Closed the database connection.")
})

const app = express()

app.use(express.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

function getEncryptionKey(path) {
	try {
		return fs.readFileSync(path).toString()
	} catch(e) {
		// Create key if not exists
		const key = cryptojs.lib.WordArray.random(16).toString()
    try {
      fs.writeFileSync(path, key)
      return key
    } catch(e) {
      console.log("Failed saving " + path + ": " + e)
    }
	}
}

function createEncryptedEmail(email) {
  return cryptojs.AES.encrypt(email, getEncryptionKey('encryption_key.conf'))
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

  const encryptedEmail = createEncryptedEmail(req.body.email)

  let db = new sqlite3.Database('database.db', err => {
    if (err) {
      console.log(err)
      return res.status(500).send(err)
    }
    db.run('INSERT INTO signups(email) VALUES ("'+encryptedEmail+'")', err => {
      if (err) {
        console.log(err)
        return res.status(422).send(err)
      }
      console.log("Saving email!")
      res.send("Saved email successfully!")
    })
  })
})

function uniqEmails(rows, filter, seen=[], i=0) {
  if (i+1 > rows.length) return seen

  // TODO: Find a pure way of doing this (without using rows[i] inside the bloody function).
  if (seen.filter(row => row.email === rows[i].email).length == 0) {
    seen.push(rows[i])
  }

  return uniqEmails(rows, filter, seen, i+1)
}

app.get('/signups', (req, res) => {
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

app.listen(3000, () => {
  console.log("Timed signup form listening on port 3000!")
})
