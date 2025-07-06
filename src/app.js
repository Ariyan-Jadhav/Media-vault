import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//common middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
//common middleware

// import routes
import healthcheckRouter from "../src/routes/healthcheck.rou.js";
import userRouter from "../src/routes/user.rou.js";
import videoRouter from "./routes/video.rou.js";
import { errorHandler } from "./middlewares/error.mid.js";
// import routes

// routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/videos", videoRouter);
// routes

app.use(errorHandler);
export { app };
