import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes";
import {subjectRouter } from "./routes/subject.routes";
// server is right below
const app = express();
//
// port is the port number on which the server will listen for incoming requests
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRouter);
app.use("/subject", subjectRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
