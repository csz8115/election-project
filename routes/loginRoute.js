const express = require('express');
const app = express();
const port = 3001;
const cors = require('cors');

const db = require('../src/server/DataAccess');
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5174', // Allow frontend to access
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.post('/api/login', async (req, res) => {
  console.log(req.body);

  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(req.body.password, saltRounds);
  console.log(hashedPassword)

  try {
    console.log("Attempted to log in...")
    await db.logInUser(req.body.username, hashedPassword);
    res.json({ message: 'User logged in successfully' });
  } catch (error) {
    res.json({ message: error + 'User Not Found' });
  }

});

app.listen(port, () => {
console.log(`Server listening on port ${port}`);
});