import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();
const gptModel = "gpt-4-turbo";

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
        const bodyText = $("p, h1, h2, h3, span, li")
            .map((_, element) => $(element).text().trim())
            .get()
            .join(" ");
        return bodyText;
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
            model: gptModel, 
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI assistant that summarizes PDF documents. The user will provide a base64-encoded PDF, and you should extract key points and summarize them in an informative manner.  Please give the answer in markdown format",
                },
                {
                    role: "user",
                    content: `Here is the PDF file (base64 encoded). Please summarize its content:\n\n${base64PDF}`,
                },
            ],
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

export async function summarizeContent(
    content: string,
    openAIApiKey: string
): Promise<string> {
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI trained to summarize text content in a concise and informative manner.  Please give the answer in markdown format",
                },
                {
                    role: "user",
                    content: `Please summarize the following content in atleast 3000 words:\n\n${content}`,
                },
            ],
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

export async function suggetionChat(
    content: string,
    openAIApiKey: string
): Promise<string> {
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI trained to summarize text content in a concise and informative manner.  Please give the answer in markdown format",
                },
                {
                    role: "user",
                    content: `${content}`,
                },
            ],
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
    openAIApiKey,
}: ConversationParams): Promise<string> => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: gptModel,
                messages: [
                    {
                        role: "system",
                        content: context,
                    },
                    {
                        role: "user",
                        content: `Please provide an answer to this question: "${question}" from the given content. If the context is not there then please provide answer from your side.  Please give the answer in markdown format`,
                    },
                ],
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
    openAIApiKey,
}: {
    notes: string[];
    sources: string[];
    workspaceName: string;
    generateReportText: string;
    openAIApiKey: string;
}): Promise<string> => {
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
    eveything provide only in the json nothing outside the json.
`;



        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: gptModel,
                messages: [
                    {
                        role: "system",
                        content:
                            "You are an AI assistant. Summarize and provide insights based on the provided data. Please give the answer in markdown format",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
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

export const pullDataAnalysis = async (
    context: any,
    openAIApiKey: string
): Promise<string> => {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: gptModel,
                messages: [
                    {
                        role: "system",
                        content: JSON.stringify(context),
                    },
                    {
                        role: "user",
                        content: `This is the data provided by google analytics please check there is headings which the metadataHeader of the data is provided. Please analyze the data which is in the metrics rows metricvalue and give the analysis. Please give the answer in markdown format`,
                    },
                ],
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
