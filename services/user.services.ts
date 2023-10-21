//get user by id

import { Response } from "express";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";

export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson as string);
    res.status(200).json({
      success: true,
      user,
    });
  }
};
