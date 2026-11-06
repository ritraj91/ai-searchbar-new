
const tools = new Map();

export function registerTool(tool) {
  if (!tool.name || typeof tool.execute !== "function") {
    throw new Error("A tool needs a name and execute function.");
  }

  if (tools.has(tool.name)) {
    throw new Error(`Tool already registered: ${tool.name}`);
  }

  tools.set(tool.name, tool);
}

export function getTool(name) {
  return tools.get(name);
}

export function getAllTools() {
  return Array.from(tools.values());
}
