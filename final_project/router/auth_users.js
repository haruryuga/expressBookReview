const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Secret key for signing the JWT token
const SECRET_KEY = "access";

// Check if the username is valid (contains only alphanumeric characters)
const isValid = (username) => {
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  return username && usernameRegex.test(username);
};

// Check if the username and password match the stored credentials
const authenticatedUser = (username, password) => {
  const user = users.find((user) => user.username === username);
  return user && user.password === password;
};

// Middleware to authenticate users
const authenticateToken = (req, res, next) => {
  const token = req.session.authorization?.accessToken; // Ensure you have access to session data

  if (!token) {
    return res.status(403).json({ message: "User not logged in" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user; // Attach the user info to the request
    next();
  });
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Check if both username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required!" });
  }

  // Authenticate the user
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password!" });
  }

  // Generate a JWT token that expires in 1 hour
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });

  // Store the token in the session
  req.session.authorization = { accessToken: token };

  // Respond with the JWT token
  return res.status(200).json({
    message: "Customer login successful!",
    token,
  });
});

// Add a book review (protected route)
regd_users.put("/auth/review/:isbn", authenticateToken, (req, res) => {
  const { isbn } = req.params;
  const { review } = req.query; // Use req.body for POST data instead of query parameters
  const username = req.user.username; // Access the username from the verified token

  if (!review) {
    return res.status(400).json({ message: "Review text is required!" });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found!" });
  }

  if (!book.reviews) {
    book.reviews = {};
  }

  // Update or add the review for the user
  book.reviews[username] = review;
  return res
    .status(200)
    .json({ message: "Review added/updated successfully!" });
});

// Delete a book review (protected route)
regd_users.delete("/auth/review/:isbn", authenticateToken, (req, res) => {
  const { isbn } = req.params;
  const username = req.user.username; // Get the username from the verified token

  const book = books[isbn]; // Find the book by ISBN
  if (!book) {
    return res.status(404).json({ message: "Book not found!" });
  }

  if (!book.reviews || !book.reviews[username]) {
    return res.status(404).json({ message: "Review not found!" });
  }

  // Delete the user's review
  delete book.reviews[username];

  return res
    .status(200)
    .json({
      message: "Review for the ISBN 1 posted by the user deleted successfully!",
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
