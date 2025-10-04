require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/database");

const app = express();

// Basic middlewares
const allowedOrigins = [
	process.env.FRONTEND_URL || "http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:5173",
	"http://127.0.0.1:5173"
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", time: new Date().toISOString() });
});

// Routes
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/user");
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// Global error handler (basic)
app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
	app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
