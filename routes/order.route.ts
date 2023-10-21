import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  createOrder,
  getAllOrder,
  newPayment,
  sendStripPublishableKey,
} from "../controllers/order.controller";
import { updateAccessToken } from "../controllers/user.controller";
const orderRouter = express.Router();

orderRouter.post(
  "/create-order",
  updateAccessToken,
  isAuthenticated,
  createOrder
);

orderRouter.get(
  "/get-orders",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrder
);

orderRouter.get("/payment/stripepublishablekey", sendStripPublishableKey);
orderRouter.post("/payment", newPayment);
export default orderRouter;
