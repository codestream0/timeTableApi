require("dotenv").config();

export const accessSecret = process.env.ACCESS_TOKEN_SECRET || "";
export const mongodbUri = process.env.MONGODB_URI || "mongodb+srv://codestream:qwerty321@cluster0.0oamjiy.mongodb.net/";
export const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "";