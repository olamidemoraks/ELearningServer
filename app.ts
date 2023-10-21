require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRoute from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

//body parser -
app.use(express.json({ limit: "50mb" }));

app.use(morgan("common"));
//cookie parser
app.use(cookieParser(process.env.ACCESS_TOKEN_EXPIRE));

//cor
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 100,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: true,
});

//routes
app.use(
  "/api/v1",
  userRouter,
  orderRouter,
  courseRouter,
  notificationRoute,
  analyticsRouter,
  layoutRouter
);

//testin api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "Api is working",
  });
});

//unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(limiter);
app.use(ErrorMiddleware);
