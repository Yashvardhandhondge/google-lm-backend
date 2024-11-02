import { Request, Response } from "express";
import User from "../models/User";
import Workspace from "../models/Workspace";
import Note from "../models/Note";
import mongoose from "mongoose";

export const createUser = async (req: Request, res: Response) => {
    const { email, clerkId } = req.body;

    try {
        const newUser = new User({
            clerkId,
            email,
        });
        await newUser.save();
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
    const { api_key } = req.body;

    try {
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.openAikey = api_key;
        await user.save();

        res.status(200).json({
            message: "API saved successfully",
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching user data" });
    }
};

export const createNewWorkspace = async (req: Request, res: Response) => {
    const { workspaceName } = req.body;
    const { clerkId } = req.params;
    try {
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const newWorkspace = new Workspace({
            name: workspaceName,
        });
        await newWorkspace.save();

        user.workspaces.push(newWorkspace._id as mongoose.Types.ObjectId);
        await user.save();

        res.status(201).json({
            message: "Workspace created successfully",
            workspace: newWorkspace,
        });
    } catch (err) {
        res.status(500).json({ error: "Error while creating workspace" });
    }
};

export const getAllWorkspaces = async (req: Request, res: Response) => {
    const { clerkId } = req.params;
    try {
        const user = await User.findOne({ clerkId }).populate({
            path: "workspaces",
            select: "-notes", 
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ workspaces: user.workspaces });
    } catch (err) {
        res.status(500).json({ error: "Error while fetching workspaces" });
    }
};

export const getWorkspace = async (req: Request, res: Response) => {
    const { workspaceId } = req.params;
    try {
        const workspace = await Workspace.findOne({ _id: workspaceId });
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        res.status(200).json({ workspace });
    } catch (err) {
        res.status(500).json({ error: "Error while fetching workspaces" });
    }
};

export const createNewNote = async (req: Request, res: Response) => {
    const { workspaceId } = req.params;
    const { heading, content } = req.body;

    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const newNote = new Note({
            heading,
            content,
        });

        const savedNote = await newNote.save();

        workspace.notes.push(savedNote._id as mongoose.Types.ObjectId);
        await workspace.save();

        res.status(201).json(savedNote);
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllNotes = async (req: Request, res: Response) => {
    const { workspaceId } = req.params;

    try {
        const workspace = await Workspace.findOne({_id: workspaceId}).populate(
            "notes"
        );
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        res.status(200).json(workspace.notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
