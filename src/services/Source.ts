import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { Groq } from "groq-sdk";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../config/firebase';
import Tesseract from 'tesseract.js';

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

export async function getContentThroughUrl(url: string): Promise<string>  {
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

export const getContentThroughFile = async (fileUrl: string): Promise<string> => {
    try {
        // Read the PDF file into a buffer
        const dataBuffer = fs.readFileSync(fileUrl);

        // Use pdf-parse to extract text from the PDF
        const pdfData = await pdfParse(dataBuffer);

        // Return the extracted text
        return truncateText(pdfData.text);
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error; // Rethrow the error for handling by the caller
    }
};

export const uploadFiles = async(file: Express.Multer.File) => {
    const metadata = {
        contentType: file.mimetype,
    };
    const userId = uuidv4();
    const storageRef = ref(storage, `files/${userId}`);
    const uploadResult = await uploadBytes(
        storageRef,
        file.buffer,
        metadata
    );
    const fileUrl = await getDownloadURL(uploadResult.ref);
    return fileUrl;
}


export async function extractTextFromFile(url: string): Promise<string> {
    try {
        // Step 1: Download the file
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Step 2: Determine the file type based on the URL or content
        const contentType = response.headers['content-type'];

        let extractedText = '';

        if (contentType === 'application/pdf') {
            // If it's a PDF, use pdf-parse
            extractedText = await pdfParse(buffer).then(data => data.text);
        } else if (contentType.startsWith('image/')) {
            // If it's an image, use Tesseract.js for OCR
            const imagePath = './temp_image.png'; // Temporary image path
            fs.writeFileSync(imagePath, buffer); // Save the image temporarily

            const { data: { text } } = await Tesseract.recognize(
                imagePath,
                'eng',
                {
                    logger: info => console.log(info) // Optional logger
                }
            );

            extractedText = text;

            // Clean up temporary image file
            fs.unlinkSync(imagePath);
        } else {
            throw new Error('Unsupported file type');
        }

        return truncateText(extractedText);
    } catch (error) {
        console.error('Error extracting text:', error);
        throw error; // Rethrow error for handling by caller
    }
}
















// export const fetchAndSummarizeTextWithChatGPT = async (url: string) => {
//     try {
//         // const { data: html } = await axios.get(url);
//         // const $ = cheerio.load(html);
//         // const content = $("body").text().trim();
//         // if (!content) {
//         //     throw new Error("No content found to summarize.");
//         // }
//         const content = `Made glorious summer by this sun of York;
//             And all the clouds that lour'd upon our house
//             In the deep bosom of the ocean buried.
//             Now are our brows bound with victorious wreaths;
//             Our bruised arms hung up for monuments;
//             Our stern alarums changed to merry meetings,
//             Our dreadful marches to delightful measures.
//             Grim-visaged war hath smooth'd his wrinkled front;
//             And now, instead of mounting barded steeds
//             To fright the souls of fearful adversaries,
//             He capers nimbly in a lady's chamber
//             To the lascivious pleasing of a lute.
//             But I, that am not shaped for sportive tricks,
//             Nor made to court an amorous looking-glass;
//             I, that am rudely stamp'd, and want love's majesty
//             To strut before a wanton ambling nymph;
//             I, that am curtail'd of this fair proportion,
//         `;

//         const response = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo", // You can use 'gpt-4' if you have access
//             messages: [
//                 {
//                     role: "user",
//                     content: `Summarize the following text into approximately 50 words:\n\n${content}`,
//                 },
//             ],
//             max_tokens: 50, // Adjust this based on your needs
//             temperature: 0.7,
//         });

//         return response;
//     } catch (error: any) {
//         console.error(error.response?.data || error.message);
//         throw new Error("Failed to summarize the content with ChatGPT");
//     }
// };

// export const fetchAndSummarizeTextWithChatGPT = async (
//     url: string
// ): Promise<string> => {
//     try {
//         const { data: html } = await axios.get(url);
//         const $ = cheerio.load(html);
//         const content = $("body").text().trim();
//         if (!content) {
//             throw new Error("No content found to summarize.");
//         }

//         const response = await axios.post(
//             "https://api.openai.com/v1/chat/completions",
//             {
//                 model: "gpt-4o-mini",
//                 messages: [
//                     {
//                         role: "system",
//                         content:
//                             "You are a helpful assistant that summarizes website content.",
//                     },
//                     {
//                         role: "user",
//                         content: `Please summarize the following content in plain text in 50 words:\n\n${content}`,
//                     },
//                 ],
//                 max_tokens: 10,
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${openAIApiKey}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );

//         return response.data.choices[0].message.content;
//     } catch (error: any) {
//         console.error(error.response?.data || error.message);
//         throw new Error("Failed to summarize the content with ChatGPT");
//     }
// };
