import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { Groq } from "groq-sdk";
import OpenAI from "openai";
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

const openai = new OpenAI({
    apiKey: openAIApiKey,
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const MAX_TOKENS = 300;

function truncateText(text: string): string {
    const words = text.split(" ");
    return words.slice(0, MAX_TOKENS).join(" ");
}

export async function getContentThroughUrl(url: string): Promise<string> {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const content = truncateText($("body").text());
    if (!content) {
        throw new Error("No content found to summarize.");
    }
    return content;
}

export async function summarizeContent(content: string): Promise<string> {
    const summaryRequest = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: `Please summarize the following text:\n\n${content}`,
            },
        ],
        model: "llama3-8b-8192",
    });

    return (
        summaryRequest.choices?.[0]?.message?.content ||
        "Summary could not be generated."
    );
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
                max_tokens: 100,
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
