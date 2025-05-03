import express from "express";
import { authMiddleWare } from "../middlewares/authMiddleware";
import { subjectCollection } from "../services/mongodb";

export const subjectRouter = express.Router();

subjectRouter.post("/add-subject", authMiddleWare, async (req, res) => {
  const { subject } = req.body;
  if (!subject) {
    res.status(400).json({ error: "subject is required" });
  }

  subjectCollection
    .insertOne({
      subject: subject,
      email: req.body.user.email,
      createdAt: new Date(),
    })
    .then((result) => {
      console.log("subject added successfully", result);
    });

  res.json({
    message: "subject added successfully",
    subject,
    email: req.body.user.email,
  });
});
