import { Request, Response } from "express";
import User from "../models/User";

export const createUser = async (req: Request, res: Response) => {
    const { email, clerkId } = req.body;

    try {
        const newUser = new User({
            clerkId,
            email
        });
        await newUser.save()
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: "Error saving user data" });
    }
};

export const getUser = async (req: Request, res: Response) => {
    const { clerkId } = req.params;

    try {
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: "Error fetching user data" });
    }
};

export const saveOpenAikey = async (req: Request, res: Response) => {
    const { clerkId } = req.params;
    const {api_key} = req.body;

    try {
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.openAikey = api_key;
        await user.save();

        res.status(200).json({
            message: 'API saved successfully'
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching user data" });
    }
}