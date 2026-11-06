
import "dotenv/config";
import OpenAI from "openai";

const apiKey = process.env.NVIDIA_API_KEY;

if (!apiKey) {
  throw new Error(
    "NVIDIA_API_KEY is missing. Please check backend/.env"
  );
}

const ai = new OpenAI({
  apiKey,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function generateAIResponse(query) {
  const response = await ai.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant for HourMaker.",
      },
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0.6,
    max_tokens: 2048,
  });

  return (
    response.choices?.[0]?.message?.content ||
    "No response generated."
  );
}
