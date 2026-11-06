
import OpenAI from "openai";

import {
  getAllTools,
  getTool
} from "../tools/toolRegistry.js";

import "../tools/navigationTools.js";

const ai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

function getNvidiaToolDeclarations() {
  return getAllTools().map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

export async function runAssistant(
  query,
  capabilities = [],
  mode = "route"
) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not configured.");
  }

  if (!Array.isArray(capabilities)) {
    throw new Error("Invalid capability catalogue.");
  }

  if (!["route", "action"].includes(mode)) {
    throw new Error("Invalid assistant mode.");
  }

  // Only allow the type of capability expected in this stage.
  const expectedType = mode === "route" ? "page" : "action";

  const capabilityCatalogue = capabilities
    .filter((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.description === "string" &&
      item.type === expectedType
    )
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      ...(item.type === "page" &&
      typeof item.path === "string"
        ? { path: item.path }
        : {})
    }));

  if (!capabilityCatalogue.length) {
    return {
      type: "message",
      answer:
        mode === "route"
          ? "No pages are currently available for your role."
          : "No buttons were found on the selected page."
    };
  }

  const tools = getNvidiaToolDeclarations();

  const systemPrompt =
    mode === "route"
      ? `
You are Hourmaker AI for an employee management application.

The user has asked for something in the application.

AVAILABLE PAGES:
${JSON.stringify(capabilityCatalogue, null, 2)}

Your task:
Understand whether the user wants to open a page or perform an operation.

Rules:
1. Use the meaning of the user's natural-language request.
2. Do not require exact page names.
3. Do not depend on predefined user query phrases, keywords or aliases.
4. Select only a page from the supplied catalogue.
5. If the user only wants to view, open, visit or navigate to a page, use intent "navigate".
6. If the user wants to click, change, save, remove, invite, activate, deactivate, reset, submit or otherwise perform an operation, select the page containing the relevant operation and use intent "action".
7. For an operation, choose the most relevant page where its button is likely to be displayed.
8. Never invent page IDs or routes.
9. Never claim an operation has already been completed.
10. If no page matches, answer that the feature is unavailable.
11. When a page or action request clearly matches a catalogue item, call select_capability with its exact ID and the correct intent.
`
      : `
You are Hourmaker AI.

The user wants to perform an operation on the currently opened application page.

AVAILABLE BUTTONS:
${JSON.stringify(capabilityCatalogue, null, 2)}

Rules:
1. Understand the user's original request.
2. Match its meaning against the actual button names and descriptions.
3. Do not require exact button names.
4. Do not use hardcoded user query phrases, keywords or aliases.
5. Select only a button from the supplied catalogue.
6. Call select_capability with the exact button ID and intent "action".
7. Never invent button IDs or claim that a button was clicked.
8. If no button matches, explain that the requested operation is not available on this page.
`;

  const response = await ai.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b",

    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: query
      }
    ],

    tools,
    tool_choice: "auto",
    temperature: 0.2,
    max_tokens: 1024
  });

  const message = response.choices?.[0]?.message;

  if (!message) {
    throw new Error("NVIDIA returned an empty response.");
  }

  const functionCall = message.tool_calls?.[0];

  if (!functionCall) {
    return {
      type: "message",
      answer:
        message.content || "I could not generate a response."
    };
  }

  const toolName = functionCall.function.name;
  const selectedTool = getTool(toolName);

  if (!selectedTool) {
    throw new Error(`Tool not registered: ${toolName}`);
  }

  let argumentsData;

  try {
    argumentsData = JSON.parse(
      functionCall.function.arguments || "{}"
    );
  } catch {
    throw new Error("AI returned invalid tool arguments.");
  }

  const toolResult = await selectedTool.execute(argumentsData);

  if (!toolResult.success) {
    return {
      type: "message",
      answer:
        toolResult.message || "Unable to select that feature."
    };
  }

  // Validate the selected ID against this request's catalogue.
  const selectedCapability = capabilityCatalogue.find(
    (item) => item.id === toolResult.capabilityId
  );

  if (!selectedCapability) {
    return {
      type: "message",
      answer:
        "The selected feature is not registered in this application."
    };
  }

  // Validate intent against the current stage.
  const expectedIntent = mode === "route" ? "navigate" : "action";

  if (toolResult.intent !== expectedIntent) {
    return {
      type: "message",
      answer:
        "The AI selection did not match the requested operation."
    };
  }

  return {
    type: "tool_result",
    tool: "select_capability",
    result: {
      success: true,
      capabilityId: selectedCapability.id,
      intent: toolResult.intent,
      type: selectedCapability.type,
      page: selectedCapability.name,
      path: selectedCapability.path || null,
      message: `Selected ${selectedCapability.name}.`
    }
  };
}
