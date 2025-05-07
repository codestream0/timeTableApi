require("dotenv").config();

export const accessSecret = process.env.ACCESS_TOKEN_SECRET || "asdfghfgh";
export const mongodbUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/";
export const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "sdfghghj";
