require("dotenv").config();

export const accessSecret = process.env.ACCESS_TOKEN_SECRET || "asdfghfgh";
export const mongodbUri =
  process.env.MONGODB_URI || "mongodb+srv://abdoulbin38:w0bsa0IXB7mk2xcH@cluster0.5n02s7c.mongodb.net/timetabledb?retryWrites=true&w=majority&authSource=admin";
export const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "sdfghghj";
