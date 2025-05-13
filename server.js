const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware for parsing JSON request bodies
app.use(express.json());

// Simple user data store (in-memory for now, could be replaced with a database)
const users = {};  // For storing user data (could be a database or file)

// Register new user
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Check if username already exists
  if (users[username]) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  // Save user data as hash (hash password before saving it in a real app)
  users[username] = { password };

  // Optionally, save users to file (to be persistent)
  fs.writeFileSync('user_data.txt', JSON.stringify(users, null, 2));

  return res.status(200).json({ message: 'User registered successfully' });
});

// Login user
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if user exists and passwords match
  if (users[username] && users[username].password === password) {
    return res.status(200).json({ message: 'Login successful' });
  }

  return res.status(400).json({ message: 'Invalid username or password' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
