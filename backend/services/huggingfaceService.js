import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN);

export const askHuggingFace = async (message) => {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not loaded");
  }

  const response = await hf.chatCompletion({
    model: "openai/gpt-oss-120b:fastest",
    messages: [
      {
        role: "user",
        content: String(message).trim(),
      },
    ],
  });

  return response.choices[0].message.content;
};