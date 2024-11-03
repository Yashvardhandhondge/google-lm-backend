import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { Groq } from "groq-sdk";
import OpenAI from "openai";

dotenv.config();

const openAIApiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
    apiKey: openAIApiKey,
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const MAX_TOKENS = 4096; 

function truncateText(text: string): string {
    const words = text.split(" ");
    return words.slice(0, MAX_TOKENS).join(" "); 
}

export async function summarizeContent(url: string): Promise<string> {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const content = truncateText($("body").text());
    if (!content) {
        throw new Error("No content found to summarize.");
    }
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

export const fetchAndSummarizeTextWithChatGPT = async (url: string) => {
    try {
        // const { data: html } = await axios.get(url);
        // const $ = cheerio.load(html);
        // const content = $("body").text().trim();
        // if (!content) {
        //     throw new Error("No content found to summarize.");
        // }
        const content = `Made glorious summer by this sun of York;
            And all the clouds that lour'd upon our house
            In the deep bosom of the ocean buried.
            Now are our brows bound with victorious wreaths;
            Our bruised arms hung up for monuments;
            Our stern alarums changed to merry meetings,
            Our dreadful marches to delightful measures.
            Grim-visaged war hath smooth'd his wrinkled front;
            And now, instead of mounting barded steeds
            To fright the souls of fearful adversaries,
            He capers nimbly in a lady's chamber
            To the lascivious pleasing of a lute.
            But I, that am not shaped for sportive tricks,
            Nor made to court an amorous looking-glass;
            I, that am rudely stamp'd, and want love's majesty
            To strut before a wanton ambling nymph;
            I, that am curtail'd of this fair proportion,
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // You can use 'gpt-4' if you have access
            messages: [
                {
                    role: "user",
                    content: `Summarize the following text into approximately 50 words:\n\n${content}`,
                },
            ],
            max_tokens: 50, // Adjust this based on your needs
            temperature: 0.7,
        });

        return response;
    } catch (error: any) {
        console.error(error.response?.data || error.message);
        throw new Error("Failed to summarize the content with ChatGPT");
    }
};

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
