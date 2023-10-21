"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv").config();
const dbUrl = process.env.DB_URI || "";
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(dbUrl, { family: 4 }).then((data) => {
            console.log("Database connected");
        });
    }
    catch (error) {
        console.log(error.message);
        setTimeout(connectDB, 5000);
    }
};
exports.default = connectDB;
