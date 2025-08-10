console.log(require("@supabase/supabase-js/package.json").version)
const express = require("express")
const cors = require("cors")
const morgan = require("morgan")

const authRoutes = require("./api/routes/auth.routes")
const jobsRoutes = require("./api/routes/jobs.routes")
const applicationsRoutes = require("./api/routes/applications.routes")
// const candidateRoutes = require('./api/routes/candidateRoutes'); // Re-enabling the candidate routes

const app = express()

// Middleware
// CRITICAL: Configure CORS to explicitly allow your Vercel frontend's domain
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // Add your Vercel frontend URL here
      "https://job-portal-frontend-iota-eight.vercel.app",
      "https://job-portal-backend-kiot.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/jobs", jobsRoutes)
app.use("/api/applications", applicationsRoutes)
app.use('/api/candidates', candidateRoutes);

// Basic Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running!" })
})

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({
    message: err.message || "An unexpected error occurred.",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
})

module.exports = app