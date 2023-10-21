"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAuthenticated = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../utils/redis");
//authenticated user
const isAuthenticated = async (req, res, next) => {
    const access_token = req.cookies.access_token;
    console.log("we are in auth middleware");
    if (!access_token) {
        return next(new ErrorHandler_1.default("Please login to access this resource", 400));
    }
    console.log("token", access_token);
    const decoded = jsonwebtoken_1.default.verify(access_token, process.env.ACCESS_TOKEN);
    if (!decoded) {
        return next(new ErrorHandler_1.default("access token is not valid", 400));
    }
    const user = await redis_1.redis.get(decoded.id);
    if (!user) {
        return next(new ErrorHandler_1.default("Please login to access thus resources", 400));
    }
    req.user = JSON.parse(user);
    next();
};
exports.isAuthenticated = isAuthenticated;
//validate user role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler_1.default(`Role: ${req.user?.role} is not allowed to access this resources`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
