import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
interface ConversationParams {
    context: string;
    question: string;
}

dotenv.config();

const openAIApiKey = process.env.OPENAI_API_KEY;

export async function getContentThroughUrl(url: string): Promise<string> {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    return $("body").text();
}

export async function summarizeContent(content: string): Promise<string> {
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an AI trained to summarize text content in a concise and informative manner.",
                },
                {
                    role: "user",
                    content: `Please summarize the following content in 500 words:\n\n${content}`,
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
    file: Express.Multer.File
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
}: {
    notes: string[];
    sources: string[];
    workspaceName: string;
}): Promise<string> => {
    try {
        const prompt = `
            Please provide a detailed report and key insights for the following workspace:
            Workspace Name: ${workspaceName}
            Notes: ${notes.join("\n\n")}
            Sources: ${sources.join("\n\n")}
            Please provide in points, first for all the notes and then for all the sources.
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
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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