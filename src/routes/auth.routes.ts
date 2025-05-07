import express from "express";
import { z } from "zod";

import * as jwt from "jsonwebtoken";
import "dotenv/config";
import { accessSecret, refreshSecret } from "../variables";
import { usersCollection } from "../services/mongodb";
import { comparePasswords, hashPassword } from "../utils/passwordHasher";
require("dotenv").config();

export const authRouter = express.Router();

const signUpSchema = z.object({
  firstName: z.string().min(3, "first name is required"),
  surName: z.string().min(3, "surName is required"),
  email: z.string().email("email is required"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  gender: z.enum(["male", "female", "other"]),
  homeAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
  }),
  dob: z.coerce.date(),
  role: z.enum(["Admin", "User", "Moderator"]).default("User"),
  // role:z.enum(["Admin"])
});

const loginSchema = z.object({
  email: z.string().email("email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

authRouter.post("/create-account", async (req, res) => {
  try {
    signUpSchema.parse(req.body);
    console.log(req.body);
    const existingUser = await usersCollection.findOne({
      email: req.body.email,
    });
    if (existingUser) {
      res.json({
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
      homeAddress: req.body.homeAddress,
      email: req.body.email,
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
    res.status(400).json({
      error: error instanceof z.ZodError ? error.errors : "server error",
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const allUsers = await usersCollection.find({}).toArray();
    console.log(allUsers);

    loginSchema.parse(req.body);

    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    console.log(email, password);

    const existingUser = await usersCollection.findOne({
      email,
    });
    console.log(existingUser);
    if (!existingUser) {
      res.status(400).json({ error: "User not found" });
    }

    const isPasswordValid = await comparePasswords(
      req.body.password,
      existingUser?.password
    );
    if (isPasswordValid) {
      const token = jwt.sign(
        {
          email,
        },
        accessSecret,
        { expiresIn: "5min" }
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
        lastName: existingUser?.lastName,
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
              expiresIn: "5min",
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

// authRouter.post
