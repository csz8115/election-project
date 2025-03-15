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

app.post('/api/login', (req, res) => {
  console.log(req.body);

  try {
    let userFound = db.getUser(req.body.username);
    res.json({ message: userFound });
  } catch (error) {
    res.json({ message: 'User Not Found' });
  }
});

app.listen(port, () => {
console.log(`Server listening on port ${port}`);
});