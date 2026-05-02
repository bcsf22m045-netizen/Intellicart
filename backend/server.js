import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import authRouter from "./routes/authRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import chatbotRouter from "./routes/chatbotRoute.js";
import recommendationRouter from "./routes/recommendationRoute.js";

//App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

//Middlewares
app.use(express.json());
app.use(cookieParser());

// CORS configuration - allow multiple frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true, // Allow cookies to be sent
}));

//API endpoints
app.use("/api/auth", authRouter); // New authentication routes
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/category", categoryRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/recommendations", recommendationRouter);

app.get("/", (req, res) => {
  res.send("API WORKING");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port} ❤️`);
});
