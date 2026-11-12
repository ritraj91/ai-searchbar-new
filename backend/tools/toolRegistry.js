
const tools = new Map();

// --------------------------------------------------
// REGISTER TOOL
// --------------------------------------------------

export function registerTool(tool) {
  if (!tool || typeof tool !== "object") {
    throw new Error("Invalid tool configuration.");
  }

  if (
    typeof tool.name !== "string" ||
    !tool.name.trim()
  ) {
    throw new Error("Tool name is required.");
  }

  if (typeof tool.execute !== "function") {
    throw new Error(
      "A tool needs an execute function."
    );
  }

  if (
    typeof tool.description !== "string" ||
    !tool.description.trim()
  ) {
    throw new Error(
      "Tool description is required."
    );
  }

  if (
    !tool.parameters ||
    typeof tool.parameters !== "object"
  ) {
    throw new Error(
      "Tool parameters must be an object."
    );
  }

  if (tools.has(tool.name)) {
    throw new Error(
      `Tool already registered: ${tool.name}`
    );
  }

  tools.set(tool.name, {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    execute: tool.execute
  });

  return true;
}

// --------------------------------------------------
// GET SINGLE TOOL
// --------------------------------------------------

export function getTool(name) {
  if (typeof name !== "string") {
    return undefined;
  }

  return tools.get(name);
}

// --------------------------------------------------
// GET ALL REGISTERED TOOLS
// --------------------------------------------------

export function getAllTools() {
  return Array.from(tools.values());
}

// --------------------------------------------------
// CHECK TOOL REGISTRATION
// --------------------------------------------------

export function hasTool(name) {
  return tools.has(name);
}

// --------------------------------------------------
// REMOVE TOOL
// --------------------------------------------------

export function unregisterTool(name) {
  return tools.delete(name);
}

// --------------------------------------------------
// CLEAR REGISTRY
// --------------------------------------------------

export function clearTools() {
  tools.clear();
}
