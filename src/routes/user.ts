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
  googleAnalytics,
  deleteNote,
  renameSource,
  removeSource,
  renameWorkspace,
  getGaReport,
  getAllAccounts,
  getGaProperties,
  generateReport,
  getGaReportForWorkspace,
  createConversationOfSuggestion,
  deleteWorkspace,
} from "../controllers/userController";
import multer from "multer";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post("/signup", createUser);

router.get("getUser/:clerkId", ClerkExpressRequireAuth(), getUser);

router.get("/getAiKey/:clerkId", ClerkExpressRequireAuth(), getOpenAikey);

router.post("/saveApiKey/:clerkId", ClerkExpressRequireAuth(), saveOpenAikey);

router.post(
  "/createNewWorkspace/:clerkId",
  ClerkExpressRequireAuth(),
  createNewWorkspace,
);

router.get(
  "/getAllWorkspaces/:clerkId",
  ClerkExpressRequireAuth(),
  getAllWorkspaces,
);

router.get(
  "/getWorkspace/:workspaceId",
  ClerkExpressRequireAuth(),
  getWorkspace,
);

router.post(
  "/createNewNote/:workspaceId",
  ClerkExpressRequireAuth(),
  createNewNote,
);

router.get("/getAllNotes/:workspaceId", ClerkExpressRequireAuth(), getAllNotes);

router.put("/updateNote/:noteId", ClerkExpressRequireAuth(), updateNote);

router.delete("/deleteNotes", ClerkExpressRequireAuth(), deleteNote);

router.post(
  "/createSource/:workspaceId",
  ClerkExpressRequireAuth(),
  upload.single("file"),
  createSource,
);

router.get(
  "/getAllSources/:workspaceId",
  ClerkExpressRequireAuth(),
  getAllSources,
);

router.post(
  "/createConversation",
  ClerkExpressRequireAuth(),
  createConversation,
);

router.post(
  "/createConversation/suggestion",
  ClerkExpressRequireAuth(),
  createConversationOfSuggestion,
);

router.put("/rename-source", ClerkExpressRequireAuth(), renameSource);

router.delete("/remove-source", ClerkExpressRequireAuth(), removeSource);

router.put("/rename-workspace", ClerkExpressRequireAuth(), renameWorkspace);

router.get("/oauth/google-analytics/callback", googleAnalytics);

router.get("/analytics/accounts", ClerkExpressRequireAuth(), getAllAccounts);

router.get("/analytics/report", ClerkExpressRequireAuth(), getGaReport);

router.post(
  "/analytics/report-for-workspace",
  ClerkExpressRequireAuth(),
  getGaReportForWorkspace,
);

router.get("/analytics/properties", ClerkExpressRequireAuth(), getGaProperties);

router.post(
  "/getWorkspace-report/:workspaceId",
  ClerkExpressRequireAuth(),
  generateReport,
);

router.delete(
  "/workspaces/:clerkId/:workspaceId",
  ClerkExpressRequireAuth(),
  deleteWorkspace,
);

export default router;
