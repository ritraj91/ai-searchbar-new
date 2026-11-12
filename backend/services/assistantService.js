
import OpenAI from "openai";

import {
  getAllTools,
  getTool
} from "../tools/toolRegistry.js";

// Register navigation tools
import "../tools/navigationTools.js";

// ==================================================
// NVIDIA AI CONFIGURATION
// ==================================================

const MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

function getAIClient() {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NVIDIA_API_KEY is missing. Add it to your backend .env file."
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1"
  });
}

// ==================================================
// TOOL DECLARATIONS
// ==================================================

function getNvidiaToolDeclarations() {
  const registeredTools = getAllTools();

  return registeredTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description || "Execute an available tool.",
      parameters: tool.parameters || {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  }));
}

// ==================================================
// VALIDATE CAPABILITIES
// ==================================================

function validateCapabilities(capabilities, expectedType) {
  if (!Array.isArray(capabilities)) {
    throw new Error("Capabilities must be an array.");
  }

  const seenIds = new Set();

  const validCapabilities = [];

  for (const item of capabilities) {
    if (!item || typeof item !== "object") {
      continue;
    }

    if (
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.description !== "string"
    ) {
      continue;
    }

    if (item.type !== expectedType) {
      continue;
    }

    if (seenIds.has(item.id)) {
      continue;
    }

    // Do not allow unavailable capabilities
    if (item.enabled === false || item.visible === false) {
      continue;
    }

    seenIds.add(item.id);

    validCapabilities.push({
      id: item.id,
      name: item.name,
      description: item.description,
      label: item.label || item.name,
      type: item.type,

      category: item.category || "general",

      page: item.page || item.path || null,
      pageTitle: item.pageTitle || null,
      path: item.path || item.page || null,

      risk: item.risk || "normal",
      sensitive: item.sensitive === true,

      enabled: item.enabled !== false,
      visible: item.visible !== false
    });
  }

  return validCapabilities;
}

// ==================================================
// SYSTEM PROMPT
// ==================================================

function createSystemPrompt(capabilities, mode) {
  const capabilityList = capabilities.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    label: item.label,
    type: item.type,
    category: item.category,
    page: item.page,
    pageTitle: item.pageTitle,
    risk: item.risk,
    sensitive: item.sensitive,
    enabled: item.enabled,
    visible: item.visible
  }));

  const commonRules = `
You are Hourmaker AI, an intelligent assistant for an employee management workspace.

Your job is to understand the user's natural language request and select the best matching capability.

AVAILABLE CAPABILITIES:
${JSON.stringify(capabilityList, null, 2)}

IMPORTANT RULES:

1. Understand the meaning and intention of the user's request.
2. Match by meaning, not only exact words.
3. Use capability names, descriptions, labels and categories.
4. Select only an exact capability ID from the supplied list.
5. Never invent a capability ID.
6. Never select a capability that is not in the supplied list.
7. Do not select disabled or invisible capabilities.
8. If no capability matches, respond with exactly:
   No result found.
9. Do not claim that an action has been completed.
10. You are selecting a capability, not directly operating the browser.
`;

  if (mode === "route") {
    return commonRules + `

CURRENT TASK:

The user is searching for a page or requesting an operation.

Choose the most appropriate page from the supplied page capabilities.

Possible intents:

- navigate: The user wants to open or view a page.
- action: The user wants to perform an operation on a page, such as editing, inviting, searching, or changing a status.

Examples:

User: "Open my dashboard"
Intent: navigate

User: "Show team members"
Intent: navigate

User: "Edit an employee"
Intent: action

User: "Invite a new member"
Intent: action

User: "Change employee status"
Intent: action

Select the relevant page capability and use the select_capability tool.

Do not select a button capability in route mode.
`;
  }

  if (mode === "action") {
    return commonRules + `

CURRENT TASK:

The user has reached the relevant page.

Now identify the exact button or operation that matches the user's request.

Rules:

1. Select only an action capability.
2. Use the exact capability ID.
3. Match the user's intention with the button name and description.
4. Do not select a navigation capability.
5. Never invent an action.
6. If no suitable action exists, respond:
   No result found.
7. Sensitive or manual operations must not be executed automatically.
8. The application will independently enforce its safety checks.

Use the select_capability tool with intent "action".
`;
  }

  throw new Error("Invalid assistant mode. Use route or action.");
}

// ==================================================
// PARSE TOOL ARGUMENTS
// ==================================================

function parseToolArguments(argumentsValue) {
  if (typeof argumentsValue === "string") {
    try {
      return JSON.parse(argumentsValue);
    } catch {
      throw new Error("AI returned invalid tool arguments.");
    }
  }

  if (
    argumentsValue &&
    typeof argumentsValue === "object"
  ) {
    return argumentsValue;
  }

  throw new Error("AI returned empty tool arguments.");
}

// ==================================================
// MAIN ASSISTANT FUNCTION
// ==================================================

export async function runAssistant(
  query,
  capabilities = [],
  mode = "route"
) {
  try {
    // Validate query
    if (
      typeof query !== "string" ||
      !query.trim()
    ) {
      throw new Error("Please enter a valid search query.");
    }

    // Validate mode
    if (!["route", "action"].includes(mode)) {
      throw new Error("Invalid assistant mode.");
    }

    // Determine expected capability type
    const expectedType = mode === "route" ? "page" : "action";

    // Validate capability list
    const validCapabilities = validateCapabilities(
      capabilities,
      expectedType
    );

    if (validCapabilities.length === 0) {
      return {
        type: "message",
        message: "No result found."
      };
    }

    // Check tool registration
    const selectionTool = getTool("select_capability");

    if (!selectionTool) {
      throw new Error(
        "select_capability tool is not registered. Check navigationTools.js."
      );
    }

    // Create AI client
    const ai = getAIClient();

    // Get tool declarations
    const tools = getNvidiaToolDeclarations();

    const selectionDeclaration = tools.find(
      (tool) =>
        tool.function.name === "select_capability"
    );

    if (!selectionDeclaration) {
      throw new Error(
        "select_capability tool declaration was not found."
      );
    }

    // Create system prompt
    const systemPrompt = createSystemPrompt(
      validCapabilities,
      mode
    );

    // Send request to NVIDIA
    const completion = await ai.chat.completions.create({
      model: MODEL,

      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: query.trim()
        }
      ],

      tools: [selectionDeclaration],

      tool_choice: "auto",

      temperature: 0.2,

      max_tokens: 1024
    });

    const message = completion.choices?.[0]?.message;

    if (!message) {
      throw new Error("NVIDIA AI returned an empty response.");
    }

    // Handle normal text response
    if (!message.tool_calls || message.tool_calls.length === 0) {
      const answer =
        typeof message.content === "string"
          ? message.content.trim()
          : "";

      if (
        answer.toLowerCase().includes("no result found")
      ) {
        return {
          type: "message",
          message: "No result found."
        };
      }

      return {
        type: "message",
        message: "No result found."
      };
    }

    // Only one capability selection is allowed
    if (message.tool_calls.length !== 1) {
      return {
        type: "message",
        message: "No result found."
      };
    }

    const toolCall = message.tool_calls[0];

    if (
      toolCall.type !== "function" ||
      toolCall.function?.name !== "select_capability"
    ) {
      return {
        type: "message",
        message: "No result found."
      };
    }

    // Parse AI arguments
    const toolArguments = parseToolArguments(
      toolCall.function.arguments
    );

    const capabilityId = toolArguments.capabilityId;
    const intent = toolArguments.intent;

    // Validate intent
    const allowedIntents =
      mode === "route"
        ? ["navigate", "action"]
        : ["action"];

    if (!allowedIntents.includes(intent)) {
      return {
        type: "message",
        message: "No result found."
      };
    }

    // Find exact selected capability
    const selectedCapability = validCapabilities.find(
      (item) => item.id === capabilityId
    );

    if (!selectedCapability) {
      return {
        type: "message",
        message: "No result found."
      };
    }

    // Verify capability type and intent
    if (
      mode === "route" &&
      selectedCapability.type !== "page"
    ) {
      return {
        type: "message",
        message: "No result found."
      };
    }

    if (
      mode === "action" &&
      (
        selectedCapability.type !== "action" ||
        intent !== "action"
      )
    ) {
      return {
        type: "message",
        message: "No result found."
      };
    }

    // Execute registered selection tool
    const toolResult = await selectionTool.execute({
      capabilityId,
      intent
    });

    if (
      !toolResult ||
      toolResult.success !== true ||
      toolResult.capabilityId !== capabilityId ||
      toolResult.intent !== intent
    ) {
      throw new Error("Capability selection failed.");
    }

    // Return response in the format expected by AISearchBar.jsx
    return {
      type: "tool_result",
      tool: "select_capability",

      result: {
        success: true,
        capabilityId: selectedCapability.id,
        intent,

        type: selectedCapability.type,

        page: selectedCapability.name,
        path: selectedCapability.path || null,

        risk: selectedCapability.risk,
        sensitive: selectedCapability.sensitive,

        message:
          "Selected " + selectedCapability.name + "."
      }
    };

  } catch (error) {
    console.error(
      "Hourmaker assistant service error:",
      error
    );

    throw error;
  }
}
