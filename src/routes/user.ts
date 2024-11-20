import { Router } from "express";
import {
    createUser,
    getUser,
    saveOpenAikey,
    createNewWorkspace,
    getAllWorkspaces,
    getWorkspace,
    createNewNote,
    getAllNotes,
    createSource,
    getAllSources,
    createConversation,
    updateNote,
    getOpenAikey,
    googleAnalytics
} from "../controllers/userController";
import multer from "multer";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const upload = multer({ storage: multer.memoryStorage() });


const router = Router();


router.post("/signup", createUser);

// @ts-ignore
router.get("getUser/:clerkId", ClerkExpressRequireAuth(), getUser);

// @ts-ignore
router.get("/getAiKey/:clerkId", ClerkExpressRequireAuth(),  getOpenAikey);

// @ts-ignore
router.post("/saveApiKey/:clerkId", ClerkExpressRequireAuth(), saveOpenAikey);

// @ts-ignore
router.post("/createNewWorkspace/:clerkId", ClerkExpressRequireAuth(), createNewWorkspace);

// @ts-ignore
router.get("/getAllWorkspaces/:clerkId", ClerkExpressRequireAuth(), getAllWorkspaces);

// @ts-ignore
router.get("/getWorkspace/:workspaceId", ClerkExpressRequireAuth(),  getWorkspace);

// @ts-ignore
router.post("/createNewNote/:workspaceId", ClerkExpressRequireAuth(), createNewNote);

// @ts-ignore
router.get("/getAllNotes/:workspaceId", ClerkExpressRequireAuth(), getAllNotes);

// @ts-ignore
router.put("/updateNote/:noteId", ClerkExpressRequireAuth(), updateNote);

// @ts-ignore
router.post("/createSource/:workspaceId", ClerkExpressRequireAuth(), upload.single("file"), createSource);

// @ts-ignore
router.get("/getAllSources/:workspaceId", ClerkExpressRequireAuth(), getAllSources);

// @ts-ignore
router.post('/createConversation', ClerkExpressRequireAuth(), createConversation);

// @ts-ignore
router.get('/oauth/google-analytics/callback', googleAnalytics);

export default router;
