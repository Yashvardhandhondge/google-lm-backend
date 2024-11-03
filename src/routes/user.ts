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
    test
} from "../controllers/userController";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });


const router = Router();


router.post("/signup", createUser);

// @ts-ignore
router.get("/:clerkId", getUser);

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
router.post("/createSource/:workspaceId", upload.single("file"), createSource);

// @ts-ignore
router.post("/test", upload.single("file"), test);

// @ts-ignore
router.get("/getAllSources/:workspaceId", getAllSources);

export default router;
