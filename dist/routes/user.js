"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
router.post("/signup", userController_1.createUser);
// @ts-ignore
router.get("/:clerkId", userController_1.getUser);
// @ts-ignore
router.get("/getAiKey/:clerkId", userController_1.getOpenAikey);
// @ts-ignore
router.post("/saveApiKey/:clerkId", userController_1.saveOpenAikey);
// @ts-ignore
router.post("/createNewWorkspace/:clerkId", userController_1.createNewWorkspace);
// @ts-ignore
router.get("/getAllWorkspaces/:clerkId", userController_1.getAllWorkspaces);
// @ts-ignore
router.get("/getWorkspace/:workspaceId", userController_1.getWorkspace);
// @ts-ignore
router.post("/createNewNote/:workspaceId", userController_1.createNewNote);
// @ts-ignore
router.get("/getAllNotes/:workspaceId", userController_1.getAllNotes);
// @ts-ignore
router.put("/updateNote/:noteId", userController_1.updateNote);
// @ts-ignore
router.post("/createSource/:workspaceId", upload.single("file"), userController_1.createSource);
// @ts-ignore
router.get("/getAllSources/:workspaceId", userController_1.getAllSources);
// @ts-ignore
router.post('/createConversation', userController_1.createConversation);
exports.default = router;
