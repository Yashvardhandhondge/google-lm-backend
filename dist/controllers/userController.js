"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNote = exports.createConversation = exports.getAllSources = exports.createSource = exports.getAllNotes = exports.createNewNote = exports.getWorkspace = exports.getAllWorkspaces = exports.createNewWorkspace = exports.getOpenAikey = exports.saveOpenAikey = exports.getUser = exports.createUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const Note_1 = __importDefault(require("../models/Note"));
const Source_1 = require("../services/Source");
const Source_2 = __importDefault(require("../models/Source"));
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, clerkId } = req.body;
    try {
        const newUser = new User_1.default({
            clerkId,
            email,
        });
        yield newUser.save();
        res.status(201).json(newUser);
    }
    catch (error) {
        res.status(500).json({ error: "Error saving user data" });
    }
});
exports.createUser = createUser;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerkId } = req.params;
    try {
        const user = yield User_1.default.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching user data" });
    }
});
exports.getUser = getUser;
const saveOpenAikey = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerkId } = req.params;
    const { api_key } = req.body;
    try {
        const user = yield User_1.default.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.openAikey = api_key;
        yield user.save();
        res.status(200).json({
            message: "API saved successfully",
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching user data" });
    }
});
exports.saveOpenAikey = saveOpenAikey;
const getOpenAikey = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerkId } = req.params;
    try {
        const user = yield User_1.default.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({
            message: "API saved successfully",
            api: user.openAikey,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching user data" });
    }
});
exports.getOpenAikey = getOpenAikey;
const createNewWorkspace = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workspaceName } = req.body;
    const { clerkId } = req.params;
    try {
        const user = yield User_1.default.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const newWorkspace = new Workspace_1.default({
            name: workspaceName,
        });
        yield newWorkspace.save();
        user.workspaces.push(newWorkspace._id);
        yield user.save();
        res.status(201).json({
            message: "Workspace created successfully",
            workspace: newWorkspace,
        });
    }
    catch (err) {
        res.status(500).json({ error: "Error while creating workspace" });
    }
});
exports.createNewWorkspace = createNewWorkspace;
const getAllWorkspaces = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerkId } = req.params;
    try {
        const user = yield User_1.default.findOne({ clerkId })
            .populate({
            path: "workspaces",
            select: "-notes, -source",
        })
            .lean();
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ workspaces: user.workspaces });
    }
    catch (err) {
        res.status(500).json({ error: "Error while fetching workspaces" });
    }
});
exports.getAllWorkspaces = getAllWorkspaces;
const getWorkspace = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workspaceId } = req.params;
    try {
        const workspace = yield Workspace_1.default.findOne({ _id: workspaceId });
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        res.status(200).json({ workspace });
    }
    catch (err) {
        res.status(500).json({ error: "Error while fetching workspaces" });
    }
});
exports.getWorkspace = getWorkspace;
const createNewNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workspaceId } = req.params;
    const { heading, content } = req.body;
    try {
        const workspace = yield Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        const newNote = new Note_1.default({
            heading,
            content,
        });
        const savedNote = yield newNote.save();
        workspace.notes.push(savedNote._id);
        yield workspace.save();
        res.status(201).json(savedNote);
    }
    catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.createNewNote = createNewNote;
const getAllNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workspaceId } = req.params;
    try {
        const workspace = yield Workspace_1.default.findOne({
            _id: workspaceId,
        }).populate("notes");
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        res.status(200).json(workspace.notes);
    }
    catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getAllNotes = getAllNotes;
const createSource = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { workspaceId } = req.params;
    const { url, uploadType } = req.body;
    const file = (_a = req.file) !== null && _a !== void 0 ? _a : null;
    try {
        const workspace = yield Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        if (uploadType === "file" && req.file) {
            const fileUrl = yield (0, Source_1.uploadFiles)(file);
            const content = yield (0, Source_1.extractTextFromFile)(file);
            const summary = yield (0, Source_1.summarizeContent)(content);
            const newSource = new Source_2.default({
                url: fileUrl,
                summary,
                name: req.file.originalname,
                uploadType,
            });
            yield newSource.save();
            workspace.sources.push(newSource._id);
            yield workspace.save();
            return res.status(200).json(newSource);
        }
        else if (uploadType === "url" && url) {
            // If URL is provided, process it as usual
            const content = yield (0, Source_1.getContentThroughUrl)(url);
            const summary = yield (0, Source_1.summarizeContent)(content);
            const newSource = new Source_2.default({
                url,
                summary,
                name: "URL Source",
                uploadType,
            });
            yield newSource.save();
            workspace.sources.push(newSource._id);
            yield workspace.save();
            return res.status(200).json(newSource);
        }
        else {
            return res.status(400).json({
                message: "Invalid input. Either a file or URL is required.",
            });
        }
    }
    catch (error) {
        console.error("Error creating source:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.createSource = createSource;
const getAllSources = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workspaceId } = req.params;
    try {
        const workspace = yield Workspace_1.default.findOne({
            _id: workspaceId,
        }).populate("sources");
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        res.status(200).json(workspace.sources);
    }
    catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getAllSources = getAllSources;
const createConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { context, question } = req.body;
    try {
        const resp = yield (0, Source_1.respondToConversation)({ context, question });
        res.status(200).json({ message: resp });
    }
    catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.createConversation = createConversation;
const updateNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { noteId } = req.params;
    const { heading, content } = req.body;
    try {
        const foundNote = yield Note_1.default.findOne({ _id: noteId });
        if (!foundNote) {
            return res.status(404).json({ message: "Note not found" });
        }
        foundNote.heading = heading;
        foundNote.content = content;
        yield foundNote.save();
        res.status(200).json({
            message: "Note updated successfully",
            note: foundNote,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update note", error });
    }
});
exports.updateNote = updateNote;
