import express from "express";
import { authMiddleWare } from "../middlewares/authMiddleware";
import { subjectCollection, usersCollection } from "../services/mongodb";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { authorizeRoles } from "../middlewares/authorizedRoles";

export const subjectRouter = express.Router();

const subjectSchema = z.object({
  subjectName: z.string().min(2, "subject is required"),
  courseCode: z.string().min(3, "course code is required "),
  courseLecturer: z.string().min(3, "course lecturer is required"),
  subjectVenue: z.string().min(2, "subject venue is required"),
  creditUnit: z.enum(["one", "two", "three", "four"]),
  day: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]),
  time: z.enum([
    "8:00 -- 10:00",
    "10:00 -- 12:00",
    "12:00 -- 1:00",
    "2:00 -- 4:00",
    "4:00 -- 6:00",
  ]),
});

const updateSubjectSchema = z.object({
  id: z.string().min(1, "Subject ID is required"),
  subjectName: z.string().min(2, "subject is required").optional(),
  courseCode: z.string().min(3, "course code is required").optional(),
  courseLecturer: z.string().min(3, "course lecturer is required").optional(),
  subjectVenue: z.string().min(2, "subject venue is required").optional(),
  // creditUnit: z.enum(["one", "two", "three", "four"]).optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1, "Subject ID is required"),
});

subjectRouter.post(
  "/add-subject",
  authMiddleWare,
  authorizeRoles("Admin", "Moderator"),
  async (req, res) => {
    try {
      subjectSchema.parse(req.body);
      console.log(req.body);

      const subjectInfo = {
        subjectName: req.body.subjectName,
        courseCode: req.body.courseCode,
        courseLecturer: req.body.courseLecturer,
        subjectVenue: req.body.subjectVenue,
        creditUnit: req.body.creditUnit,
        day: req.body.day,
        time: req.body.time,
      };

      const user = (req as any).user;
      const userInfo = await usersCollection.findOne({
        email: user.email,
      });
      console.log("userInfo", userInfo?._id);
      
      const timeConflict = await subjectCollection.findOne({
        day: req.body.day,
        time: req.body.time,
      });

      if (timeConflict) {
        return res.status(400).json({
          message: "Time slot is already occupied for this day",
        });
      }

      const result = await subjectCollection
        .insertOne({
          userId: userInfo?._id,
          ...subjectInfo,
          email: user.email,
          createdAt: new Date(),
        })
        .then((result) => {
          console.log("subject added successfully", result);
        });

        return res.status(201).json({
        message: "subject added successfully",
        subjectInfo,
        email: user.email,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof z.ZodError ? error.errors : "server error",
      });
    }
  }
);

subjectRouter.get("/subject-list", authMiddleWare, async (req, res) => {
  try {
    const user = (req as any).user;
    const userInfo = await usersCollection.findOne({ email: user.email });
    console.log("User Info:", userInfo);

    const subjectList = await subjectCollection.find().toArray();
    console.log("subjectList: ", subjectList);
    res.status(200).json({
      message: "subject fetched successfully",
    subjectList,
      user: userInfo,
    });
  } catch (error) {
    res.status(501).json({ message: "internal server error" });
  }
});

subjectRouter.put(
  "/edit-subject",
  authMiddleWare,
  authorizeRoles("Admin", "Moderator"),
  async (req, res) => {
    try {
      const parsedData = updateSubjectSchema.parse(req.body);
      const subjectId = new ObjectId(parsedData.id);

      const updatedSubject = {
        subjectName: parsedData.subjectName,
        courseCode: parsedData.courseCode,
        courseLecturer: parsedData.courseLecturer,
        // subjectVenue: parsedData.subjectVenue,
        // creditUnit: parsedData.creditUnit,
        // time: parsedData.time,
      };
      console.log("Updating subject with ID:", subjectId);
      console.log("Update data:", updatedSubject); 

      const result = await subjectCollection.updateOne(
        { _id: subjectId },
        { $set: updatedSubject }
      );
      console.log("Update result:", result);
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Subject not found" });
      }

      return res.status(200).json({ message: "Subject edited successfully" });
    } catch (error) {
      console.error("Update error:", error);
      return res.status(400).json({
        error: error instanceof z.ZodError ? error.errors : "Server error",
      });
    }
  }
);

subjectRouter.delete(
  "/delete-subject",
  authMiddleWare,
  authorizeRoles("Admin", "Moderator"),
  async (req, res) => {
    try {
      console.log("Delete request body:", req.body);
      const parsed = deleteSchema.parse(req.body);
      const subjectId = new ObjectId(parsed.id);

      console.log("Deleting subject with ID:", subjectId);

      const result = await subjectCollection.deleteOne({ _id: subjectId });
      console.log("Delete result:", result);

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ message: "Subject not found or already deleted" });
      }

      res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(400).json({
        error: error instanceof z.ZodError ? error.errors : "Server error",
      });
    }
  }
);
