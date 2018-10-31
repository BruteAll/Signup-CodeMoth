const sqlite3 = require('sqlite3').verbose()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')

let db = new sqlite3.Database('database.db', err => {
  if (err) return console.error(err.message)
  console.log("Connected to the SQLite database.")

  db.run(`CREATE TABLE IF NOT EXISTS signups(
    email text unique,
    created datetime default current_timestamp
  );`)
})

db.close(err => {
  if (err) return console.error(err.message)
  console.log("Closed the database connection.")
})

const app = express()

app.use(bodyParser.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

const ENCRYPTION_KEY = 'FQlJBGGW7xQeXLJMkCc0mP6rwZZSJqcm'
const IV = crypto.randomBytes(16)

function createEncryptedEmail(email) {
  const cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), IV)

  let encrypted = cipher.update(email)

  encrypted = Buffer.concat([encrypted, cipher.final()])

  return encrypted.toString('hex')
}

function createDecryptedEmail(email) {
  let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), IV)
  let decrypted = decipher.update(Buffer(email, 'hex'))

  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString()
}

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

app.post('/', (req, res) => {
  if (!emailRegex.test(req.body.email)) {
    res.send("Not a proper email address.")
    return
  }

  const encryptedEmail = createEncryptedEmail(req.body.email)

  let db = new sqlite3.Database('database.db', err => {
    db.run('INSERT INTO signups(email) VALUES ("'+encryptedEmail+'")', err => {
      console.log(err)
    })
  })

  res.send(req.body.email)
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
