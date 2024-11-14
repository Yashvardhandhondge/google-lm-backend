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
    getOpenAikey
} from "../controllers/userController";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });


const router = Router();


router.post("/signup", createUser);

// @ts-ignore
router.get("getUser/:clerkId", getUser);

// @ts-ignore
router.get("/getAiKey/:clerkId", getOpenAikey);

// @ts-ignore
router.post("/saveApiKey/:clerkId", saveOpenAikey);

// @ts-ignore
router.post("/createNewWorkspace/:clerkId", createNewWorkspace);

// @ts-ignore
router.get("/getAllWorkspaces/:clerkId", getAllWorkspaces);

// @ts-ignore
router.get("/getWorkspace/:workspaceId", getWorkspace);

// @ts-ignore
router.post("/createNewNote/:workspaceId", createNewNote);

// @ts-ignore
router.get("/getAllNotes/:workspaceId", getAllNotes);

// @ts-ignore
router.put("/updateNote/:noteId", updateNote);

// @ts-ignore
router.post("/createSource/:workspaceId", upload.single("file"), createSource);

// @ts-ignore
router.get("/getAllSources/:workspaceId", getAllSources);

// @ts-ignore
router.post('/createConversation', createConversation);

export default router;
