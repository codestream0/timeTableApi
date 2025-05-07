import { Request, Response, NextFunction } from "express";
import { usersCollection } from "../services/mongodb";

export const authorizeRoles =
  (...allowedRoles: Array<"Admin" | "Moderator" | "User">) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.user.email;

      if (!email) {
        res
          .status(401)
          .json({ message: "Unauthorized: Email not found in request" });
        return;
      }

      const user = await usersCollection.findOne({ email });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({ message: "Forbidden: Insufficient role" });
        return;
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  };
