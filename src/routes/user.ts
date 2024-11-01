import { Router } from "express";
import { createUser, getUser, saveOpenAikey, createNewWorkspace , getAllWorkspaces, getWorkspace} from "../controllers/userController";

const router = Router();

router.post("/signup", createUser);

// @ts-ignore
router.get("/:clerkId", getUser);

// @ts-ignore
router.post('/saveApiKey/:clerkId', saveOpenAikey)

// @ts-ignore
router.post('/createNewWorkspace/:clerkId', createNewWorkspace);

// @ts-ignore
router.get('/getAllWorkspaces/:clerkId', getAllWorkspaces);

// @ts-ignore
router.get('/getWorkspace/:workspaceId', getWorkspace);

export default router;
