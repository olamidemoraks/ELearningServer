"use strict";
//get user by id
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = void 0;
const redis_1 = require("../utils/redis");
const getUserById = async (id, res) => {
    const userJson = await redis_1.redis.get(id);
    if (userJson) {
        const user = JSON.parse(userJson);
        res.status(200).json({
            success: true,
            user,
        });
    }
};
exports.getUserById = getUserById;
