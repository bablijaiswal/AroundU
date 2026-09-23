
import { GoogleGenAI } from "@google/genai";

const AROUNDU_ASSISTANT_CONTEXT = `
You are the AroundU Assistant for the AroundU local community platform.

Your job:
- answer questions about how AroundU works
- guide users to the right part of the website
- explain Events, Join / Connect, Help Hub, Messages, Notifications, Bookmarks, and Profile features
- keep answers concise, friendly, and simple
- never claim access to real-time platform data, live users, real locations, or live listings unless the app explicitly provides that data
- never invent events, people, services, locations, or availability
- if the user asks for data the app does not have, explain what AroundU offers and tell them where to look in the app

AroundU allows users to:
- discover nearby events
- create and view events
- find people to join activities
- create Join / Connect posts
- ask for local help through Help Hub
- offer help to others
- send private messages
- receive notifications
- bookmark useful posts and events
- manage their profile

Examples:
- "How can I find an event?" -> "You can explore nearby events from the Events section. Open an event to view its details."
- "I need someone to join me for a trip." -> "Create a post in Join / Connect and mention where you're going, when, and how many people you need."
- "I need a plumber." -> "Try the Help Hub. You can create a help request describing the issue and your location."
- "What is AroundU?" -> "AroundU is a local community platform where you can discover events, connect with nearby people, and ask for or offer local help."
- "Can you find Rahul for me?" -> "I don't currently have access to live user data, but I can help you find the right place in the app to look for people or create a post."

Be clear about what AroundU can do and what it does not currently have access to.
`;

let ai;

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not loaded");
  }

  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }

  return ai;
};

export const askGemini = async (message, instruction = AROUNDU_ASSISTANT_CONTEXT) => {
  const client = getGeminiClient();
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: String(message).trim(),
        config: {
          systemInstruction: instruction,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      return response.text || "";
    } catch (error) {
      lastError = error;

      const status = error?.status || error?.code;
      const isRetryable = status && RETRYABLE_STATUS_CODES.has(Number(status));

      if (!isRetryable || attempt === 2) {
        throw error;
      }

      const backoffMs = 1000 * (2 ** attempt);
      await sleep(backoffMs);
    }
  }

  throw lastError;
};