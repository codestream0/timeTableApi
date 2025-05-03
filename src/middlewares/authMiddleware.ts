import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { accessSecret } from "../variables";

export const authMiddleWare = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeaders = req.headers["authorization"];

  const token = authHeaders?.split(" ")[1];
  if (!token) {
    res.status(401).json({
      message: "unauthorized",
    });
    return;
  }

  jwt.verify(token!, accessSecret, (error, user) => {
    if (error) {
      // console.log(error);
      res.status(403).json({ message: "invalid token please login again" });
      return;
    }
    if (!error) {
      req.body.user = user;
      next();
    }
  });
};