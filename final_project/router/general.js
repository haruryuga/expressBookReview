const express = require("express");
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.status(409).json({ message: "Username already exists." });
  }

  users.push({ username, password });
  return res
    .status(201)
    .json({ message: "User registered successfully. Now you can log in." });
});

// Get the book list available in the shop
public_users.get("/", async function (req, res) {
  try {
    const formattedBooks = JSON.stringify(books, null, 2);
    return res.status(200).send(formattedBooks);
  } catch (error) {
    console.error("Error retrieving books:", error);
    return res.status(500).send({ message: "Failed to retrieve books." });
  }
});

// Get book details based on ISBN
public_users.get("/isbn/:isbn", function (req, res) {
  // Retrieve the ISBN from the request parameters
  const isbn = req.params.isbn;

  // Create a Promise to handle the lookup
  const getBookDetails = (isbn) => {
    return new Promise((resolve, reject) => {
      const book = books[isbn];
      if (book) {
        resolve(book); // Resolve the promise with the book details
      } else {
        reject(new Error("Book not found")); // Reject the promise if the book is not found
      }
    });
  };

  // Call the Promise
  getBookDetails(isbn)
    .then((book) => {
      return res.status(200).json(book); // Send the book details if resolved
    })
    .catch((error) => {
      return res.status(404).json({ message: error.message }); // Handle the rejection
    });
});

// Get book details based on author
public_users.get("/author/:author", async (req, res) => {
  const authorName = req.params.author;

  // Create a function to find books by author
  const findBooksByAuthor = async (authorName) => {
    const bookKeys = Object.keys(books); // Get all book keys
    const booksByAuthor = bookKeys
      .map((key) => books[key]) // Map to book objects
      .filter((book) => book.author.toLowerCase() === authorName.toLowerCase()); // Filter by author

    return booksByAuthor; // Return the filtered books
  };

  try {
    const booksByAuthor = await findBooksByAuthor(authorName); // Wait for the promise to resolve

    if (booksByAuthor.length === 0) {
      return res
        .status(404)
        .json({ message: "No books found for this author" });
    }

    return res.status(200).json({ books: booksByAuthor }); // Respond with the found books
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving books." }); // Handle errors
  }
});

// Get all books based on title
public_users.get("/title/:title", (req, res) => {
  const titleName = req.params.title;

  // Function that returns a Promise to find books by title
  const findBooksByTitle = (titleName) => {
    return new Promise((resolve, reject) => {
      const bookKeys = Object.keys(books);
      const booksByTitle = bookKeys
        .map((key) => books[key])
        .filter((book) => book.title.toLowerCase() === titleName.toLowerCase());

      if (booksByTitle.length === 0) {
        reject({ message: "No books found with this title" }); // Reject if no books found
      } else {
        resolve(booksByTitle); // Resolve with the found books
      }
    });
  };

  // Call the function and handle the Promise
  findBooksByTitle(titleName)
    .then((booksByTitle) => {
      return res.status(200).json({ books: booksByTitle }); // Respond with the found books
    })
    .catch((error) => {
      return res.status(404).json(error); // Handle rejection
    });
});

//  Get book review
public_users.get("/review/:isbn", function (req, res) {
  const isbn = req.params.isbn;

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
