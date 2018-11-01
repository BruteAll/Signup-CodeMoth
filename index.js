const sqlite3 = require('sqlite3').verbose()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
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
		return fs.readFileSync(path)
	} catch(e) {
		// Create key if not exists (16 Bytes * 8 Bit/Byte = 128 Bits)
		const key = crypto.randomBytes(16).toString('hex')
		fs.writeFileSync(path, key)
		return key
	}
}

function createEncryptedEmail(email) {
	const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(getEncryptionKey('encryption_key.conf')), iv)

  let encrypted = cipher.update(email)

  encrypted = Buffer.concat([encrypted, cipher.final()])

  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function createDecryptedEmail(encrypted) {
	let parts = encrypted.split(':')
	let iv = new Buffer(parts[0], 'hex')
	let encryptedEmail = new Buffer(parts[1], 'hex')
  let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(getEncryptionKey('encryption_key.conf')), iv)
  let decrypted = decipher.update(encryptedEmail)

	try {
		decrypted = Buffer.concat([decrypted, decipher.final()])
	} catch(e) {
		console.log("Error decrypting: \n" + e)
	}

  return decrypted.toString()
}

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

app.post('/', [
  check('email').isEmail().normalizeEmail().withMessage("Email was not a proper email.")
], (req, res) => {
  const errors = validationResult(req)
  console.log(errors.array())
  if (!errors.isEmpty()) {
    return res.status(422).send(errors.array()[0].msg)
  }

  const encryptedEmail = createEncryptedEmail(req.body.email)

  let db = new sqlite3.Database('database.db', err => {
    db.run('INSERT INTO signups(email) VALUES ("'+encryptedEmail+'")', err => {
      if (err) {
        console.log(err)
        return res.status(422).send(err)
      }
      res.send("Saved email successfully!")
    })
  })
})

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

      res.send(decrypted)
    })
  })
})

app.listen(3000, () => {
  console.log("Timed signup form listening on port 3000!")
})
