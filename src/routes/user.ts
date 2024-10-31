import { Router } from "express";
import { createUser, getUser, saveOpenAikey } from "../controllers/userController";

const router = Router();

router.post("/signup", createUser);

// @ts-ignore
router.get("/:clerkId", getUser);

// @ts-ignore
router.post('/saveApiKey/:clerkId', saveOpenAikey)

export default router;
