import express from "express";
import { authMiddleWare } from "../middlewares/authMiddleware";
import { subjectCollection } from "../services/mongodb";

export const subjectRouter = express.Router();

subjectRouter.post("/add-todo", authMiddleWare, async (req, res) => {
  const { subject } = req.body;
  if (!subject) {
    res.status(400).json({ error: "Todo is required" });
  }

  subjectCollection
    .insertOne({
      subject: subject,
      fullName: req.body.firstName + req.body.surName,
    })
    .then((result) => {
      console.log("subject added successfully", result);
    });

  res.json({
    message: "subject added successfully",
    subject,
    fullName: req.body.firstName + req.body.surName,
    email: req.body.email,
  });
});
