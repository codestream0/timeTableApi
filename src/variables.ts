require("dotenv").config();

export const accessSecret = process.env.ACCESS_TOKEN_SECRET || "asdfghfgh";
export const mongodbUri =
  process.env.MONGODB_URI || "mongodb+srv://abdoulbin38:<db_password>@cluster0.befyo9z.mongodb.net/";
export const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "sdfghghj";
