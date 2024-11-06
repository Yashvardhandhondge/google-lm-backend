"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.respondToConversation = exports.uploadFiles = void 0;
exports.getContentThroughUrl = getContentThroughUrl;
exports.summarizeContent = summarizeContent;
exports.extractTextFromFile = extractTextFromFile;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const dotenv_1 = __importDefault(require("dotenv"));
const groq_sdk_1 = require("groq-sdk");
const openai_1 = __importDefault(require("openai"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const uuid_1 = require("uuid");
const storage_1 = require("firebase/storage");
const firebase_1 = require("../config/firebase");
dotenv_1.default.config();
const openAIApiKey = process.env.OPENAI_API_KEY;
const openai = new openai_1.default({
    apiKey: openAIApiKey,
});
const groq = new groq_sdk_1.Groq({
    apiKey: process.env.GROQ_API_KEY,
});
const MAX_TOKENS = 300;
function truncateText(text) {
    const words = text.split(" ");
    return words.slice(0, MAX_TOKENS).join(" ");
}
function getContentThroughUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data: html } = yield axios_1.default.get(url);
        const $ = cheerio.load(html);
        const content = truncateText($("body").text());
        if (!content) {
            throw new Error("No content found to summarize.");
        }
        return content;
    });
}
function summarizeContent(content) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const summaryRequest = yield groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `Please summarize the following text:\n\n${content}`,
                },
            ],
            model: "llama3-8b-8192",
        });
        return (((_c = (_b = (_a = summaryRequest.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) ||
            "Summary could not be generated.");
    });
}
const uploadFiles = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const metadata = {
        contentType: file.mimetype,
    };
    const userId = (0, uuid_1.v4)();
    const storageRef = (0, storage_1.ref)(firebase_1.storage, `files/${userId}`);
    const uploadResult = yield (0, storage_1.uploadBytes)(storageRef, file.buffer, metadata);
    const fileUrl = yield (0, storage_1.getDownloadURL)(uploadResult.ref);
    return fileUrl;
});
exports.uploadFiles = uploadFiles;
function extractTextFromFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield (0, pdf_parse_1.default)(file.buffer);
            return data.text;
        }
        catch (error) {
            console.error("Error extracting text from PDF:", error);
            throw error;
        }
    });
}
const respondToConversation = (_a) => __awaiter(void 0, [_a], void 0, function* ({ context, question, }) {
    var _b, _c, _d, _e;
    try {
        const response = yield axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: context,
                },
                {
                    role: "user",
                    content: `Please provide an answer to this question: "${question}" from the given content. If the context is not there then please provide answer from your side`,
                },
            ],
            max_tokens: 100,
        }, {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        });
        const messageContent = (_d = (_c = (_b = response.data.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
        if (!messageContent) {
            throw new Error("No content received in the response");
        }
        return messageContent;
    }
    catch (error) {
        console.error(((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) || error.message);
        throw new Error("Failed to retrieve the response from ChatGPT");
    }
});
exports.respondToConversation = respondToConversation;
