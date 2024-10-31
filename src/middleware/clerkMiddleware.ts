import { NextFunction, Request, Response } from "express";
import { Clerk } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";

dotenv.config();

const clerk = new Clerk({ apiKey: process.env.CLERK_API_KEY as string });

export const clerkMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: "Authorization token missing" });
    }

    try {
        const token = authorization.split(" ")[1];
        await clerk.verifySession(token);
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid authorization token" });
    }
};
