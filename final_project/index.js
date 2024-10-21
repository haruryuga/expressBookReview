const express = require("express");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const customer_routes = require("./router/auth_users.js").authenticated;
const genl_routes = require("./router/general.js").general;

const app = express();

app.use(express.json());

app.use(
  session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Authentication Middleware
app.use("/customer/auth/*", function auth(req, res, next) {
  // Check if user is logged and has valid access token
  if (req.session.authorization) {
    const token = req.session.authorization.accessToken; // Use the correct key

    // Verify JWT token
    jwt.verify(token, "access", (err, user) => {
      if (!err) {
        req.user = user; // Attach user info to request
        next();
      } else {
        return res.status(403).json({ message: "User not authenticated" });
      }
    });
  } else {
    return res.status(403).json({ message: "User not logged in" });
  }
});

const PORT = 5000;

// Mount routes
app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
