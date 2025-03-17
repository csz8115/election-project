const express = require('express');
const app = express();
const port = 3001;
const cors = require('cors');

const db = require('../src/server/DataAccess');

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5174', // Allow frontend to access
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.post('/api/login', async (req, res) => {
  console.log(req.body);

  const username = req.body.username
  const password = req.body.password

  try {
    console.log("Attempted to log in...")
    let result = await db.logInUser(username, password);
    res.json({ message: result });
  } catch (error) {
    res.json({ message: error + 'User Not Found' });
  }

});

app.listen(port, () => {
console.log(`Server listening on port ${port}`);
});