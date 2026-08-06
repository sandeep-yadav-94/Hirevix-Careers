import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { sql } from "../utils/db.js";

export interface PaymentUser {
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  role: "jobseeker" | "recruiter";
  subscription: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: PaymentUser;
}

export async function isAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined;
    const secret = process.env.JWT_SEC || process.env.JWT_SECRET;
    if (!token || !secret) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }
    const payload = jwt.verify(token, secret) as JwtPayload;
    if (!payload.id) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }
    const [user] = await sql`SELECT user_id, name, email, phone_number, role, subscription FROM users WHERE user_id = ${payload.id}`;
    if (!user) {
      res.status(401).json({ message: "The account for this token no longer exists" });
      return;
    }
    req.user = user as PaymentUser;
    next();
  } catch {
    res.status(401).json({ message: "Authentication failed" });
  }
}
