import 'dotenv/config' // 👈 MUST BE LINE 1
import express from "express"
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import { helmetConfig, generalLimiter, sanitizationMiddleware, hppMiddleware, corsConfig, noCacheMiddleware } from "./middleware/securityConfig.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import advisorRouter from "./routes/advisorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import authRouter from "./routes/authRoute.js"
import consultationRouter from "./routes/consultationRoute.js"

// app config
const app = express()
app.set('trust proxy', 1) // Render runs behind a proxy — rate limiter needs this
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// Security Middleware
app.use(helmetConfig) // Set security headers
app.use(cors(corsConfig)) // CORS configuration
app.use(cookieParser()) // Parse cookies
app.use(express.json({ limit: '10mb' })) // JSON payload
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(sanitizationMiddleware) // Sanitize against NoSQL injection
app.use(hppMiddleware) // Prevent parameter pollution
app.use(generalLimiter) // Apply rate limiting
app.use(noCacheMiddleware) // No-cache headers for auth endpoints

// Remove powered-by header
app.disable('x-powered-by')

// api endpoints
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/advisor", advisorRouter)
app.use("/api/consultation", consultationRouter)

app.get("/", (req, res) => {
  res.send("API Working")
});

app.listen(port, () => console.log(`Server started on PORT:${port}`))
