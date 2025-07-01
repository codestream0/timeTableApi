import express from "express";
import { z } from "zod";
import * as jwt from "jsonwebtoken";
import "dotenv/config";
import { accessSecret, refreshSecret } from "../variables";
import { usersCollection } from "../services/mongodb";
import { ObjectId } from "mongodb";
import { comparePasswords, hashPassword } from "../utils/passwordHasher";
import { authorizeRoles } from "../middlewares/authorizedRoles";
import { authMiddleWare } from "../middlewares/authMiddleware";
require("dotenv").config();

export const authRouter = express.Router();

const signUpSchema = z.object({
  firstName: z.string().min(3, "first name is required"),
  surName: z.string().min(3, "surName is required"),
  email: z.string().email("email is required"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  gender: z.enum(["male", "female", "other"]),
  address: z.string(),
  dob: z.coerce.date(),
  role: z.enum(["Admin", "User", "Moderator"]).default("User"),
  
});

const loginSchema = z.object({
  email: z.string().email("email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const updateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newRole: z.enum(["User", "Moderator"], {
    errorMap: () => ({ message: "Role must be either User or Moderator" })
  }),
});
authRouter.post("/create-account", async (req, res) => {
  try {
    signUpSchema.parse(req.body);
    console.log(req.body);
    const existingUser = await usersCollection.findOne({
      email: req.body.email.trim().toLowerCase(),
    });
    if (existingUser) {
     return res.status(400).json({
        message: "user already exists",
      });
    }

    console.log("password", req?.body?.password);

    const hashedPassword = await hashPassword(req.body.password);

    const userData = {
      firstName: req.body.firstName,
      surName: req.body.surName,
      phoneNumber: req.body.phoneNumber,
      gender: req.body.gender,
      homeAddress: req.body.address,
      email: req.body.email.trim().toLowerCase(),
      dob: req.body.dob,
      password: hashedPassword,
      role: req.body.role,
    };

    const result = await usersCollection.insertOne({
      ...userData,
    });

    const tokenPayload = {
      email: userData.email,
      id: result.insertedId,
      role: userData.role,
    };

    const token = jwt.sign(tokenPayload, accessSecret, {
      expiresIn: "3min",
    });
    console.log("token", token);

    const refreshToken = jwt.sign(tokenPayload, refreshSecret, {
      expiresIn: "7day",
    });
    console.log("refreshToken", refreshToken);

    res.json({
      message: "User created successfully",
      data: {
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({
      error: error instanceof z.ZodError ? error.errors : "server error",
    });
  }
});

authRouter.post("/login", async (req, res) => {
  console.log("login request received");
  console.log("Request body:", req.body);
  try {
    loginSchema.parse(req.body);
    // const allUsers = await usersCollection.find({}).toArray();
    // console.log(allUsers);
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    console.log(email, password);

    const existingUser = await usersCollection.findOne({
      email,
    });
    console.log(existingUser);
    if (!existingUser) {
      return res.status(400).json({ error: "User not found" });
    }

    const isPasswordValid = await comparePasswords(
      req.body.password,
      existingUser?.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    if (isPasswordValid) {
      const token = jwt.sign(
        {
          email,
        },
        accessSecret,
        { expiresIn: "25min" }
      );
      const refreshToken = jwt.sign(
        {
          email,
        },
        refreshSecret,
        {
          expiresIn: "7days",
        }
      );

      const data = {
        email: existingUser?.email,
        firstName: existingUser?.firstName,
        lastName: existingUser?.surName,
        phoneNumber: existingUser?.phoneNumber,
        gender: existingUser?.gender,
        homeAddress: existingUser?.homeAddress,
        dob: existingUser?.dob,
        accessToken: token,
        refreshToken,
      };

      res.json({
        message: "User logged in successfully",
        data,
      });
    } else {
      res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ error: error });
  }
});

authRouter.post("/refresh-token", async (req, res) => {
  try {
    const userInfo = req.body;

    let info;
    let newToken;

    jwt.verify(
      userInfo.refreshToken,
      refreshSecret,
      (
        err: jwt.VerifyErrors | null,
        user: jwt.JwtPayload | string | undefined
      ) => {
        if (err) {
          console.log("there is an error");
        }
        if (user && typeof user !== "string") {
          info = user;
          // user.refreshToken = accessSecret;
          const newAccessToken = jwt.sign(
            { email: user.email! },
            accessSecret,
            {
              expiresIn: "25min",
            }
          );
          newToken = newAccessToken;
        }
      }
    );
    console.log(info);
    res.json({
      message: "verified",
      accessToken: newToken,
    });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});
authRouter.get("/users-list", authMiddleWare,
  authorizeRoles("Admin"),
  async (req, res) => {
  try {
    const usersList = await usersCollection.find().toArray();
    console.log("users List: ", usersList);
    res.status(200).json({
      message: "Users fetched successfully",
      data: usersList,
    });
  } catch (error) {
    res.status(501).json({ message: "internal server error" });
  }
});
authRouter.put("/update-user-role", authMiddleWare,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const { userId, newRole } = updateRoleSchema.parse(req.body);
      
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "Admin") {
        return res.status(403).json({ 
          message: "Cannot change role of Admin user" 
        });
      }

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { role: newRole } }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: "Failed to update user role" });
      }

      res.json({
        message: `User role updated to ${newRole} successfully`,
        data: {
          userId,
          newRole,
        },
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(400).json({
        error: error instanceof z.ZodError ? error.errors : "server error",
      });
    }
  }
);
authRouter.get("/user/:id", authMiddleWare,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await usersCollection.findOne(
        { _id: new ObjectId(id) },
        { projection: { password: 0 } }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User fetched successfully",
        data: user,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
// authRouter.post
