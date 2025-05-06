import express from "express";
import { authMiddleWare } from "../middlewares/authMiddleware";
import { subjectCollection, usersCollection } from "../services/mongodb";
import { z } from "zod";
import { ObjectId } from "mongodb";

export const subjectRouter = express.Router();

// const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
//   message: "Invalid time format. Expected HH:MM",
// });

const subjectSchema = z.object({
  subjectName: z.string().min(2, "subject is required"),
  courseCode: z.string().min(3, "course code is required "),
  courseLecturer: z.string().min(3, "course lecturer is required"),
  subjectVenue: z.object({
    class: z.string(),
    description: z.string(),
  }),
  creditUnit: z.enum(["one", "two", "three", "four"]),
  // startTime: timeSchema,
  // endTime: timeSchema,
  time:z.enum(["10:00 -- 12:00","1:00 -- 3:00"])
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
      time:req.body.time,
    };

    const user = (req as any).user;
    const userInfo = await usersCollection.findOne({
      email: user.email,
    });
    console.log("userInfo", userInfo?._id);
    const existingSubject= await subjectCollection.findOne({subjectName:req.body.subjectName,});

    if(existingSubject){
res.json({
  message:"time or subject is been occupied",
})
    }

    subjectCollection
      .insertOne({
        userId: userInfo?._id,
        ...subjectInfo,
        email: user.email,
        createdAt: new Date(),
      })
      .then((result) => {
        console.log("subject added successfully", result);
      });

    res.json({
      message: "subject added successfully",
      subjectInfo,
      email: user.email,
    });
    
    res.status(202).json({ message: "subject created" });
  } catch (error) {
    res.status(400).json({
      error: error instanceof z.ZodError ? error.errors : "server error",
    });
  }
});


subjectRouter.get("/subject-list",authMiddleWare, async (req,res)=>{
try {
  const subjectList = await subjectCollection.find().toArray();
  console.log("subjectList: ", subjectList)
  res.status(200).json({
    message:"subject fetched successfully",
    data:subjectList,
  })
} catch (error) {
  res.status(501).json({ message: "internal server error" });
}
})



const updateSubjectSchema = subjectSchema.extend({
  id: z.string().min(1, "Subject ID is required"),
});

subjectRouter.put("/edit-subject", authMiddleWare, async (req, res) => {
  try {
    const parsedData = updateSubjectSchema.parse(req.body);
    const subjectId = new ObjectId(parsedData.id);

    const updatedSubject = {
      subjectName: parsedData.subjectName,
      courseCode: parsedData.courseCode,
      courseLecturer: parsedData.courseLecturer,
      subjectVenue: parsedData.subjectVenue,
      creditUnit: parsedData.creditUnit,
      time: parsedData.time,
    };

    const result = await subjectCollection.updateOne(
      { _id: subjectId },
      { $set: updatedSubject }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }

    return res.status(200).json({ message: "Subject edited successfully" });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof z.ZodError ? error.errors : "Server error",
    });
  }
});