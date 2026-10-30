
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const connectDB = require("./config/db");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api", leaveRoutes);

// Start the server
const PORT = process.env.PORT || 5050;

app.use("/api", (req, res) => res.status(404).json({ message: "API route not found" }));
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.status || 500).json({ message: error.status === 400 ? "Invalid JSON request" : "Server error" });
});

if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
    }).catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = app;
