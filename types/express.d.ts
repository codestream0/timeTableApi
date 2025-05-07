import "express";

declare module "express" {
  export interface Request {
    // email?: string;
    user: {
      email?: string;
      role?: "Admin" | "Moderator" | "User";
    };
  }
}
