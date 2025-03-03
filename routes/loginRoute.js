const express = require('express'),
      router = express.Router(),
      db = require('../DataAccess/DataAccess');

// POST /login endpoint
router.post('../views/login.html', async (req, res) => {
  const { username, password } = req.body;
  console.log("loginform clicked");

  if (!username || !password) {
    return res.status(400).send({ error: 'Username and password are required' });
  }

  try {
    const user = await db.getUser(username);

    if (!user) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }

    res.send({ user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
