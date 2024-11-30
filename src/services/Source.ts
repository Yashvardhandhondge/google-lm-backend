import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

interface ConversationParams {
    context: string;
    question: string;
    openAIApiKey: string;
}

dotenv.config();

export async function getContentThroughUrl(url: string): Promise<string> {
    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);
        const bodyText = $("body").text().trim();
        return bodyText ? bodyText.substring(0, 3000) : "No content found.";
    } catch (error: any) {
        console.error("Error fetching content:", error.message);
        return "Failed to fetch content.";
    }
}

export async function summarizePDFFile(
    file: Express.Multer.File,
    openAIApiKey: string
): Promise<string> {
    if (!file) {
        throw new Error("Invalid file path provided");
    }
    // Step 1: Read the file as binary data
    const base64PDF = file.buffer.toString("base64");

    // Step 2: Send the file content to OpenAI for summarization
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-4-32k", // Use GPT-4 with higher token limits
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI assistant that summarizes PDF documents. The user will provide a base64-encoded PDF, and you should extract key points and summarize them in an informative manner.",
                },
                {
                    role: "user",
                    content: `Here is the PDF file (base64 encoded). Please summarize its content:\n\n${base64PDF}`,
                },
            ],
            max_tokens: 8000, // Adjust based on the model and expected output
        },
        {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        }
    );

    // Step 3: Process the response
    const messageContent = response.data.choices?.[0]?.message?.content;
    if (!messageContent) {
        throw new Error("No content received in the response");
    }

    return messageContent;
}

export async function summarizeContent(content: string, openAIApiKey: string): Promise<string> {
    
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI trained to summarize text content in a concise and informative manner.",
                },
                {
                    role: "user",
                    content: `Please summarize the following content in atmost 1000 words:\n\n${content}`,
                },
            ],
            max_tokens: 3000,
        },
        {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        }
    );

    const messageContent = response.data.choices?.[0]?.message?.content;
    if (!messageContent) {
        throw new Error("No content received in the response");
    }

    return messageContent;
}

export async function suggetionChat(content: string, openAIApiKey: string): Promise<string> {
    
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI trained to summarize text content in a concise and informative manner.",
                },
                {
                    role: "user",
                    content: `${content}`,
                },
            ],
            max_tokens: 3000,
        },
        {
            headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                "Content-Type": "application/json",
            },
        }
    );

    const messageContent = response.data.choices?.[0]?.message?.content;
    if (!messageContent) {
        throw new Error("No content received in the response");
    }

    return messageContent;
}


export const uploadFiles = async (file: Express.Multer.File) => {
    const metadata = {
        contentType: file.mimetype,
    };
    const userId = uuidv4();
    const storageRef = ref(storage, `files/${userId}`);
    const uploadResult = await uploadBytes(storageRef, file.buffer, metadata);
    const fileUrl = await getDownloadURL(uploadResult.ref);
    return fileUrl;
};

export async function extractTextFromFile(
    file: Express.Multer.File,
    openAIApiKey: string
): Promise<string> {
    try {
        const data = await pdfParse(file.buffer);
        return data.text;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw error;
    }
}

export const respondToConversation = async ({
    context,
    question,
    openAIApiKey
}: ConversationParams): Promise<string> => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
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
                max_tokens: 3000,
            },
            {
                headers: {
                    Authorization: `Bearer ${openAIApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const messageContent = response.data.choices?.[0]?.message?.content;
        if (!messageContent) {
            throw new Error("No content received in the response");
        }

        return messageContent;
    } catch (error: any) {
        console.error(error.response?.data || error.message);
        throw new Error("Failed to retrieve the response from ChatGPT");
    }
};

export const summarizeWorkspace = async ({
    notes,
    sources,
    workspaceName,
    generateReportText, 
    openAIApiKey
}: {
    notes: string[];
    sources: string[];
    workspaceName: string;
    generateReportText: string;
    openAIApiKey: string;
}): Promise<string> => {
    try {
        const prompt = `
            Please provide a detailed report and key insights for the following workspace:
            Workspace Name: ${workspaceName}
            Notes: ${notes.join("\n\n")}
            Sources: ${sources.join("\n\n")} in ${generateReportText}.
            Please provide in points, first for all the notes and then for all the sources.
            And if any data is present which can be used to create any graph please make that.
        `;

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are an AI assistant. Summarize and provide insights based on the provided data.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: 3000,
            },
            {
                headers: {
                    Authorization: `Bearer ${openAIApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const summaryContent = response.data.choices?.[0]?.message?.content;
        if (!summaryContent) {
            throw new Error("No summary content received in the response");
        }

        return summaryContent;
    } catch (error: any) {
        console.error(error.response?.data || error.message);
        throw new Error("Failed to retrieve summary from OpenAI");
    }
};

export const pullDataAnalysis = async (context: any, openAIApiKey: string): Promise<string> => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: JSON.stringify(context),
                    },
                    {
                        role: "user",
                        content: `This is the data provided by google analytics please check there is headings which the metadataHeader of the data is provided. Please analyze the data which is in the metrics rows metricvalue and give the analysis.`,
                    },
                ],
                max_tokens: 3000,
            },
            {
                headers: {
                    Authorization: `Bearer ${openAIApiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const messageContent = response.data.choices?.[0]?.message?.content;
        if (!messageContent) {
            throw new Error("No content received in the response");
        }

        return messageContent;
    } catch (error: any) {
        console.error(error.response?.data || error.message);
        throw new Error("Failed to retrieve the response from ChatGPT");
    }
};
