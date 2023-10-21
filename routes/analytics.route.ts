import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  getCoursesAnalytic,
  getOrdersAnalytic,
  getUserAnalytic,
} from "../controllers/analytics.controller";
import { updateAccessToken } from "../controllers/user.controller";
const analyticsRouter = express.Router();

analyticsRouter.get(
  "/get-users-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getUserAnalytic
);
analyticsRouter.get(
  "/get-orders-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getOrdersAnalytic
);
analyticsRouter.get(
  "/get-courses-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getCoursesAnalytic
);

export default analyticsRouter;
