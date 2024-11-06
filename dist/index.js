"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const user_1 = __importDefault(require("./routes/user"));
const express_2 = require("@clerk/express");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const API_URL = process.env.API_URL;
// Middleware
app.use(express_1.default.json());
app.use((0, express_2.clerkMiddleware)()); // Apply Clerk middleware
app.use((0, cors_1.default)({
    origin: API_URL,
    credentials: true,
}));
// Connect to MongoDB
(0, db_1.default)();
// Routes
app.use("/api/users", user_1.default);
app.get("/", (req, res) => {
    res.send("Hello, World!");
});
// Export the app for Vercel
exports.default = app;
