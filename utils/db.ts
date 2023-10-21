import mongoose from "mongoose";
require("dotenv").config();

const dbUrl: string = process.env.DB_URI || "";

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl, { family: 4 }).then((data: any) => {
      console.log("Database connected");
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
