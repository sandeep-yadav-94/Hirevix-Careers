import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { sql } from "../utils/db.js";

const DB_QUERY_TIMEOUT_MS = 5000;

interface User{
    user_id : number;
    name : string;
    email : string;
    phone_number : string;
    role : "jobseeker" | "recruiter";
    bio : string | null;
    resume : string | null;
    resume_public_id : string | null;
    profile_pic : string | null;
    profile_pic_public_id : string | null;
    skills : string[];
    subscription :string | null;
}

export interface AuthenticatedRequest extends Request{
    user?: User;
}

export const  isAuth  = async(req:AuthenticatedRequest, res:Response, next:NextFunction):
Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({
                message: "Authorization header is missing or invalid..."
            })
            return;
        }

        const token = authHeader.split(" ")[1];

        if(!token){
            res.status(401).json({
                message: "Authorization header is missing or invalid..."
            })
            return;
        }

        const decodedPayload = jwt.verify(token, process.env.JWT_SEC as string) as JwtPayload;

        if(!decodedPayload || !decodedPayload.id){
            res.status(401).json({
                message: " invalid token"
            })
            return;
        }

        const users = await Promise.race([
            sql`
            SELECT u.user_id, u.name, u.email, u.phone_number, u.role, u.bio, u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id, u.subscription,
            ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) as skills
            FROM users u LEFT JOIN user_skills us ON u.user_id = us.user_id
            LEFT JOIN skills s ON us.skill_id = s.skill_id 
            WHERE u.user_id = ${decodedPayload.id}
            GROUP BY u.user_id;
            `,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timed out')), DB_QUERY_TIMEOUT_MS))
        ]) as Array<any>;

        if(users.length === 0){
            res.status(401).json({
                message: "user associated with this token is no longer exists"
            })
            return;
        }

        const user = users[0] as User

        user.skills = user.skills || []

        req.user = user

        next();

    } catch (error: any) {
        console.log(error);
        res.status(401).json({
            message: error?.message === 'Database query timed out'
                ? 'Authentication service is taking too long. Please try again.'
                : 'Authentication Failed...'
        })
    }
}