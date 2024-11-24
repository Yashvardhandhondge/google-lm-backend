import { Request, Response } from "express";
import User from "../models/User";
import Workspace from "../models/Workspace";
import Note from "../models/Note";
import mongoose from "mongoose";
import {
    getContentThroughUrl,
    summarizeContent,
    uploadFiles,
    extractTextFromFile,
    respondToConversation,
} from "../services/Source";
import Source from "../models/Source";
import axios from "axios";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

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

export const getOpenAikey = async (req: Request, res: Response) => {
    const { clerkId } = req.params;

    try {
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({
            message: "API saved successfully",
            api: user.openAikey === "" ? false : true,
            googleAnalytics: user.googleAnalytics === "" ? false : true,
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
        const user = await User.findOne({ clerkId })
            .populate({
                path: "workspaces",
                select: "-notes, -source",
            })
            .lean();
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
    const { heading, content, type } = req.body;

    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const newNote = new Note({
            heading,
            content,
            type,
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
        const workspace = await Workspace.findOne({
            _id: workspaceId,
        }).populate("notes");
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        res.status(200).json(workspace.notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createSource = async (req: Request, res: Response) => {
    const { workspaceId } = req.params;
    const { url, uploadType } = req.body;
    const file = (req.file as Express.Multer.File) ?? null;

    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (uploadType === "file" && req.file) {
            const fileUrl = await uploadFiles(file);
            const content = await extractTextFromFile(file);
            const summary = await summarizeContent(content);

            const newSource = new Source({
                url: fileUrl,
                summary,
                name: req.file.originalname,
                uploadType,
            });
            await newSource.save();

            workspace.sources.push(newSource._id as mongoose.Types.ObjectId);
            await workspace.save();

            return res.status(200).json(newSource);
        } else if (uploadType === "url" && url) {
            // If URL is provided, process it as usual
            const content = await getContentThroughUrl(url);
            const summary = await summarizeContent(content);

            const newSource = new Source({
                url,
                summary,
                name: "URL Source",
                uploadType,
            });
            await newSource.save();

            workspace.sources.push(newSource._id as mongoose.Types.ObjectId);
            await workspace.save();

            return res.status(200).json(newSource);
        } else {
            return res.status(400).json({
                message: "Invalid input. Either a file or URL is required.",
            });
        }
    } catch (error) {
        console.error("Error creating source:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllSources = async (req: Request, res: Response) => {
    const { workspaceId } = req.params;

    try {
        const workspace = await Workspace.findOne({
            _id: workspaceId,
        }).populate("sources");

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        res.status(200).json(workspace.sources);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createConversation = async (req: Request, res: Response) => {
    const { context, question } = req.body;
    try {
        const resp = await respondToConversation({ context, question });
        res.status(200).json({ message: resp });
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateNote = async (req: Request, res: Response) => {
    const { noteId } = req.params;
    const { heading, content } = req.body;
    try {
        const foundNote = await Note.findOne({ _id: noteId });

        if (!foundNote) {
            return res.status(404).json({ message: "Note not found" });
        }

        foundNote.heading = heading;
        foundNote.content = content;
        await foundNote.save();

        res.status(200).json({
            message: "Note updated successfully",
            note: foundNote,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update note", error });
    }
};

export const googleAnalytics = async (req: Request, res: Response) => {
    const state = req.query.state;

    if (Array.isArray(state)) {
        return res.status(400).send("Invalid state parameter: expected a single value, but got an array.");
    }

    if (typeof state !== 'string') {
        return res.status(400).send("Invalid state parameter: expected a string.");
    }

    const parsedState = JSON.parse(decodeURIComponent(state));
    const clerkId = parsedState?.clerkId;

    if (!clerkId) {
        return res.status(400).send("Missing Clerk ID.");
    }

    try {
        // Exchange authorization code for access token
        const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
            code: req.query.code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            redirect_uri: `${process.env.BACKEND_URL}/api/users/oauth/google-analytics/callback`,
            grant_type: "authorization_code",
        });

        const { access_token, refresh_token } = tokenResponse.data;

        // Find user by clerk ID
        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Save tokens in user record
        user.googleAnalytics = access_token;
        user.googleRefreshToken = refresh_token;
        await user.save();

        const redirectUrl = parsedState?.redirectUrl || `${process.env.API_URL}/home`;
        res.redirect(redirectUrl);
        
    } catch (error: any) {
        console.error("OAuth Error:", error.response?.data || error.message || error);
        return res.status(500).json({
            error: "OAuth process failed.",
            details: error.response?.data || error.message || "Unknown error occurred",
        });
    }
};

export const getAllAccounts = async (req: Request, res: Response) => {
    const clerkId = req.query.clerkId as string;

    if (!clerkId) {
        return res.status(400).send("Clerk ID is required.");
    }

    try {
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).send("User not found");

        oauth2Client.setCredentials({
            access_token: user.googleAnalytics,
            refresh_token: user.googleRefreshToken,
        });

        const analyticsAdmin = google.analyticsadmin('v1beta');
        const accountsResponse = await analyticsAdmin.accounts.list({ auth: oauth2Client });

        const accounts = accountsResponse.data.accounts || [];
        res.json(accounts);
    } catch (error) {
        console.error("Error fetching GA4 accounts:", error);
        res.status(500).send("Failed to fetch accounts.");
    }
};


export const getAnalytics = async (req: Request, res: Response) => {
    const { clerkId, accountId } = req.query;

    if (!clerkId) {
        return res.status(400).json({ error: "Clerk ID is required." });
    }

    try {
        // Fetch the user from the database
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: "User not found." });

        oauth2Client.setCredentials({
            access_token: user.googleAnalytics,
            refresh_token: user.googleRefreshToken,
        });

        // Step 1: Fetch all accessible GA4 properties
        const analyticsAdmin = google.analyticsadmin("v1beta");
        const propertiesResponse = await analyticsAdmin.properties.list({
            filter: `parent:${accountId}`,
            auth: oauth2Client,
        });

        const properties = propertiesResponse.data.properties || [];
        if (!properties || properties.length === 0) {
            return res.status(404).json({ error: "No GA4 properties found." });
        }

        // Select the first property (or allow user selection)
        const propertyId = properties[1]?.name;

        if (!propertyId) {
            return res.status(400).json({ error: "Invalid property ID." });
        }        

        // Step 2: Fetch analytics report using the Data API
        const analyticsData = google.analyticsdata("v1beta");
        
        const reportResponse = await analyticsData.properties.runReport({
            auth: oauth2Client,
            property: propertyId, // GA4 property ID
            requestBody: {
                dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
                metrics: [{ name: "activeUsers" }],
                dimensions: [{ name: "date" }],
                "returnPropertyQuota": true
                // Optional filter example:
                // filtersExpression: 'date >= "2023-01-01"', // Adjust as needed
            },
        });

        // Return the analytics report
        res.json(reportResponse.data);
    } catch (error: any) {
        console.error("Error fetching GA4 analytics report:", error);
        
        // Check if error has specific details
        if (error.response) {
            return res.status(error.response.status).json({ error: error.response.data });
        }
        
        res.status(500).json({ error: "Failed to fetch analytics report." });
    }
};


export const deleteNote = async (req: Request, res: Response) => {
    const { noteIds, workspaceId } = req.body;

    if (!noteIds || !Array.isArray(noteIds)) {
        return res.status(400).json({
            message: "Invalid payload. Expected an array of note IDs.",
        });
    }

    try {
        const result = await Note.deleteMany({ _id: { $in: noteIds } });

        if (result.deletedCount === 0) {
            return res
                .status(404)
                .json({ message: "No notes found to delete." });
        }

        if (workspaceId) {
            const workspaceUpdate = await Workspace.findByIdAndUpdate(
                workspaceId,
                { $pull: { notes: { $in: noteIds } } },
                { new: true }
            );

            if (!workspaceUpdate) {
                return res
                    .status(404)
                    .json({ message: "Workspace not found." });
            }
        }

        res.status(200).json({
            message: "Notes deleted successfully and removed from workspace.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const renameSource = async (req: Request, res: Response) => {
    const { _id, name } = req.body;

    // Validate input
    if (!_id || !name) {
        return res.status(400).json({
            message: "Invalid request. '_id' and 'name' are required.",
        });
    }

    try {
        // Find the source by _id and update its name
        const updatedSource = await Source.findByIdAndUpdate(
            _id,
            { name },
            { new: true } // Return the updated document
        );

        if (!updatedSource) {
            return res.status(404).json({
                message: "Source not found.",
            });
        }

        res.status(200).json({
            message: "Source renamed successfully.",
            source: updatedSource,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

export const removeSource = async (req: Request, res: Response) => {
    const { _id, workspaceId } = req.body;

    // Validate input
    if (!_id) {
        return res.status(400).json({
            message: "Invalid request. '_id' is required.",
        });
    }

    try {
        // Delete the source from the Source collection
        const deletedSource = await Source.findByIdAndDelete(_id);

        if (!deletedSource) {
            return res.status(404).json({
                message: "Source not found.",
            });
        }

        // If workspaceId is provided, remove the source reference from the workspace
        if (workspaceId) {
            const updatedWorkspace = await Workspace.findByIdAndUpdate(
                workspaceId,
                { $pull: { sources: _id } }, // Remove the source reference
                { new: true } // Return the updated document
            );

            if (!updatedWorkspace) {
                return res.status(404).json({
                    message: "Workspace not found.",
                });
            }
        } else {
            // If no specific workspaceId is provided, remove the source reference from all workspaces
            await Workspace.updateMany(
                { sources: _id },
                { $pull: { sources: _id } } // Remove the source reference
            );
        }

        res.status(200).json({
            message: "Source removed successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

export const renameWorkspace = async (req: Request, res: Response) => {
    const { _id, name } = req.body;

    // Validate input
    if (!_id || !name) {
        return res.status(400).json({
            message: "Invalid request. '_id' and 'name' are required.",
        });
    }

    try {
        const updatedWorkspace = await Workspace.findByIdAndUpdate(
            _id,
            { name },
            { new: true } // Return the updated document
        );

        if (!updatedWorkspace) {
            return res.status(404).json({
                message: "Workspace not found.",
            });
        }

        res.status(200).json({
            message: "Workspace renamed successfully.",
            workspace: updatedWorkspace,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};
