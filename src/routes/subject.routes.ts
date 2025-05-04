import express from "express";
import { authMiddleWare } from "../middlewares/authMiddleware";
import { subjectCollection, usersCollection } from "../services/mongodb";
import { z } from "zod";

export const subjectRouter = express.Router();

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: "Invalid time format. Expected HH:MM",
});

const subjectSchema = z.object({
  subjectName: z.string().min(2, "subject is required"),
  courseCode: z.string().min(3, "course code is required "),
  courseLecturer: z.string().min(3, "course lecturer is required"),
  subjectVenue: z.object({
    class: z.string(),
    description: z.string(),
  }),
  creditUnit: z.enum(["one", "two", "three", "four"]),
  startTime: timeSchema,
  endTime: timeSchema,
});

subjectRouter.post("/add-subject", authMiddleWare, async (req, res) => {
  try {
    subjectSchema.parse(req.body);
    console.log(req.body);

    const subjectInfo = {
      subjectName: req.body.subjectName,
      courseCode: req.body.courseCode,
      courseLecturer: req.body.courseLecturer,
      subjectVenue: req.body.subjectVenue,
      creditUnit: req.body.creditUnit,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
    };

    const userInfo = await usersCollection.findOne({
      email: req.body.user.email,
    });
    console.log("userInfo", userInfo?._id);

    subjectCollection
      .insertOne({
        userId: userInfo?._id,
        ...subjectInfo,
        email: req.body.user.email,
        createdAt: new Date(),
      })
      .then((result) => {
        console.log("subject added successfully", result);
      });

    res.json({
      message: "subject added successfully",
      subjectInfo,
      email: req.body.user.email,
    });
    
    res.status(202).json({ message: "subject created" });
  } catch (error) {
    res.status(400).json({
      error: error instanceof z.ZodError ? error.errors : "server error",
    });
  }
});
