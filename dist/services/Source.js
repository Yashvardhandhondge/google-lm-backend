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
exports.pullDataAnalysis = exports.summarizeWorkspace = exports.respondToConversation = exports.uploadFiles = void 0;
exports.getContentThroughUrl = getContentThroughUrl;
exports.summarizePDFFile = summarizePDFFile;
exports.summarizeContent = summarizeContent;
exports.suggetionChat = suggetionChat;
exports.extractContent = extractContent;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const dotenv_1 = __importDefault(require("dotenv"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const uuid_1 = require("uuid");
const storage_1 = require("firebase/storage");
const firebase_1 = require("../config/firebase");
const markdown_it_1 = __importDefault(require("markdown-it"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mammoth_1 = __importDefault(require("mammoth"));
const xlsx_1 = __importDefault(require("xlsx"));
const mime_types_1 = __importDefault(require("mime-types"));
const md = new markdown_it_1.default();
const gptModel = "gpt-4-turbo";
dotenv_1.default.config();
function getContentThroughUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: html } = yield axios_1.default.get(url, { timeout: 10000 });
            if (!html) {
                throw new Error("No HTML content returned");
            }
            const $ = cheerio.load(html);
            $("script, style, noscript, nav, header, footer, aside, .sidebar, .advertisement, link").remove();
            const bodyText = $("p, h1, h2, h3, h4, h5, h6, span, li, article, section, blockquote")
                .map((_, element) => $(element).text().trim())
                .get()
                .join(" ");
            return bodyText.length > 5000 ? bodyText.substring(0, 5000) : bodyText;
        }
        catch (error) {
            console.error("Error fetching content:", error.message);
            return "Failed to fetch content.";
        }
    });
}
function summarizePDFFile(file, openAIApiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!file) {
            throw new Error("Invalid file path provided");
        }
        // Step 1: Read the file as binary data
        const base64PDF = file.buffer.toString("base64");
        // Step 2: Send the file content to OpenAI for summarization
        const response = yield axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content: "You are an AI assistant that summarizes PDF documents. The user will provide a base64-encoded PDF, and you should extract key points and summarize them in an informative manner.Please give the answer in markdown format",
                },
                {
                    role: "user",
                    content: `Here is the PDF file (base64 encoded). Please summarize its content:\n\n${base64PDF}`,
                },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        });
        const messageContent = (_c = (_b = (_a = response.data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (!messageContent) {
            throw new Error("No content received in the response");
        }
        return messageContent;
    });
}
function summarizeContent(content, openAIApiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const response = yield axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content: "You are an AI trained to summarize text content in a concise and informative manner.Please give the answer in markdown format",
                },
                {
                    role: "user",
                    content: `Please summarize the following content in around 3000 words:\n\n${content}`,
                },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        });
        const messageContent = (_c = (_b = (_a = response.data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (!messageContent) {
            throw new Error("No content received in the response");
        }
        return messageContent;
    });
}
function suggetionChat(content, openAIApiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const response = yield axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content: "You are an AI trained to summarize text content in a concise and informative manner.Please give the answer in markdown format",
                },
                {
                    role: "user",
                    content: `${content}`,
                },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        });
        const messageContent = (_c = (_b = (_a = response.data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (!messageContent) {
            throw new Error("No content received in the response");
        }
        return messageContent;
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
function extractContent(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
        const mimeType = mime_types_1.default.lookup(file.originalname);
        try {
            if (mimeType === "application/pdf" || fileExtension === ".pdf") {
                const data = yield (0, pdf_parse_1.default)(file.buffer);
                return data.text;
            }
            else if (mimeType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                fileExtension === ".docx") {
                const result = yield mammoth_1.default.extractRawText({ buffer: file.buffer });
                return result.value;
            }
            else if (mimeType ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                fileExtension === ".xlsx" ||
                mimeType === "application/vnd.ms-excel" ||
                fileExtension === ".xls") {
                const buffer = file.buffer ? file.buffer : fs_1.default.readFileSync(file.path);
                const workbook = xlsx_1.default.read(buffer, { type: "buffer" });
                let content = "";
                workbook.SheetNames.forEach((sheetName) => {
                    const sheet = xlsx_1.default.utils.sheet_to_json(workbook.Sheets[sheetName], {
                        header: 1,
                    });
                    content += sheet
                        .map((row) => (Array.isArray(row) ? row.join("\t") : ""))
                        .join("\n");
                });
                return content;
            }
            else if (mimeType === "text/plain" || fileExtension === ".txt") {
                const content = file.buffer
                    ? file.buffer.toString("utf-8")
                    : fs_1.default.readFileSync(file.path, "utf-8");
                return content;
            }
            else {
                throw new Error(`Unsupported file type: ${fileExtension} or ${mimeType}`);
            }
        }
        catch (error) {
            console.error("Error extracting content:", error);
            throw new Error("Failed to extract file content.");
        }
    });
}
// export async function extractTextFromFile(
//     file: Express.Multer.File,
//     openAIApiKey: string
// ): Promise<string> {
//     try {
//         const data = await pdfParse(file.buffer);
//         return data.text;
//     } catch (error) {
//         console.error("Error extracting text from PDF:", error);
//         throw error;
//     }
// }
const respondToConversation = (_a) => __awaiter(void 0, [_a], void 0, function* ({ context, question, openAIApiKey, }) {
    var _b, _c, _d, _e;
    try {
        const response = yield axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content: context,
                },
                {
                    role: "user",
                    content: `Please provide an answer to this question: "${question}" from the given content. If the context is not there then please provide answer from your side.Please give the answer in markdown format`,
                },
            ],
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
const summarizeWorkspace = (_a) => __awaiter(void 0, [_a], void 0, function* ({ notes, sources, workspaceName, generateReportText, openAIApiKey, }) {
    var _b, _c, _d, _e;
    try {
        const prompt = `
Workspace Name: ${workspaceName}
Notes: 
${notes.join("\n\n")}

Sources: 
${sources.join("\n\n")}

Context: ${generateReportText}

Generate a detailed website performance report including all the below-listed points using the data and context provided above:

Summary: A concise overview of the website's performance, key trends, and highlights.

Analysis: A detailed breakdown of:
- Traffic: Include metrics like page views, unique visitors, and traffic sources. Suggest using a bar chart for visualization.
- User Behavior: Metrics such as bounce rate, session duration, and user flow. Suggest using a line chart for visualization.
- Engagement: Include data on click-through rates, conversion rates, and user interactions. Suggest using a pie chart for visualization.

Audit: Identify issues and provide insights into:
- Technical Aspects: Evaluate issues such as load times and broken links.
- SEO Performance: Review factors like keywords, backlinks, and meta tags.
- Accessibility: Assess aspects such as alt text usage and keyboard navigation.

Suggestions: Provide actionable recommendations for improving website performance, SEO, and user experience.

Visualizations: Include a \visualizations array with the following format:
Each visualization should specify chartType (e.g., line_chart, bar_chart, pie_chart).
Include data with:
- labels (categories or time intervals).
- datasets, where each dataset includes:
  - A label for the metric it represents.
  - An array of data points.
  - Styling options like borderColor and backgroundColor.

Please return output in JSON format with the following structure, ensuring that the names of the fields are consistent as specified:

{
    "Summary": "Summary as mentioned above",
    "Analysis": {
        "Traffic": {
            "Description": "Description for traffic analysis",
            "Traffic_Visualization": {
                "chartType": "bar_chart",
                "data": {
                    "labels": ["Category1", "Category2", "Category3"],
                    "datasets": [{
                        "label": "Traffic Sources",
                        "data": [values],
                        "borderColor": ["#FF6384"],
                        "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56"]
                    }]
                }
            }
        },
        "User Behavior": {
            "Description": "Description for user behavior analysis",
            "Behavior_Visualization": {
                "chartType": "line_chart",
                "data": {
                    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
                    "datasets": [{
                        "label": "Session Duration",
                        "data": [2, 2.5, 3.2, 2.8, 3.5],
                        "borderColor": ["#4BC0C0"],
                        "backgroundColor": ["#FF6384"]
                    }]
                }
            }
        },
        "Engagement": {
            "Description": "Description for engagement analysis",
            "Engagement_Visualization": {
                "chartType": "pie_chart",
                "data": {
                    "labels": ["Click-Through Rate", "Conversion Rate", "Interaction Rate"],
                    "datasets": [{
                        "label": "Engagement Metrics",
                        "data": [5, 3, 7],
                        "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56"]
                    }]
                }
            }
        }
    },
    "Audit": {
        "Technical Aspects": "Technical evaluation details",
        "SEO Performance": "SEO evaluation details",
        "Accessibility": "Accessibility evaluation details"
    },
    "Suggestions": "Suggestions for improving website performance, SEO, and user experience",
    "Visualization": [
        {
            "chartType": "bar_chart",
            "data": {
                "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
                "datasets": [{
                    "label": "Traffic Sources",
                    "data": [1200, 1390, 1420, 1520, 1680],
                    "borderColor": ["#FF6384"],
                    "backgroundColor": ["#FF6384"]
                }]
            }
        },
        {
            "chartType": "line_chart",
            "data": {
                "labels": ["Page Views", "Unique Visitors"],
                "datasets": [{
                    "label": "Page Views",
                    "data": [4500, 4700, 4900, 5100, 5300],
                    "borderColor": ["#36A2EB"],
                    "backgroundColor": ["#36A2EB"]
                }, {
                    "label": "Unique Visitors",
                    "data": [1500, 1550, 1600, 1650, 1700],
                    "borderColor": ["#FFCE56"],
                    "backgroundColor": ["#FFCE56"]
                }]
            }
        },
        {
            "chartType": "pie_chart",
            "data": {
                "labels": ["Registrations", "Purchases", "Interactions"],
                "datasets": [{
                    "label": "User Engagements",
                    "data": [300, 450, 350],
                    "backgroundColor": ["#9966FF", "#4BC0C0", "#FF9F40"]
                }]
            }
        }
    ]
}
    Everything should be provided only in json nothing outside the json. and please provide the written content in at least 1500 words.
`;
        const response = yield axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content: "You are an AI assistant.Summarize and provide insights based on the provided data.Please give the answer in markdown format",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        });
        const summaryContent = (_d = (_c = (_b = response.data.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
        if (!summaryContent) {
            throw new Error("No summary content received in the response");
        }
        return summaryContent;
    }
    catch (error) {
        console.error(((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) || error.message);
        throw new Error("Failed to retrieve summary from OpenAI");
    }
});
exports.summarizeWorkspace = summarizeWorkspace;
const pullDataAnalysis = (context, openAIApiKey) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const response = yield axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content: JSON.stringify(context),
                },
                {
                    role: "user",
                    content: `You are a data analysis assistant. I will provide you with raw Google Analytics data, including key metrics such as page views, user counts, session durations, bounce rates, top pages, and traffic sources. Your task is to:
Summarize the performance of the website based on this data.
Highlight key trends, patterns, or anomalies observed.
Suggest actionable insights or strategies to improve website performance.
Include any potential areas of concern and how they can be addressed.
Please respond in a structured format, including the summary, observations, and recommendations clearly.
Please give the answer in markdown format,
`,
                },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        });
        const messageContent = (_c = (_b = (_a = response.data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (!messageContent) {
            throw new Error("No content received in the response");
        }
        return messageContent;
    }
    catch (error) {
        console.error(((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) || error.message);
        throw new Error("Failed to retrieve the response from ChatGPT");
    }
});
exports.pullDataAnalysis = pullDataAnalysis;
