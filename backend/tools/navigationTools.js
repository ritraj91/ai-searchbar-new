
import { registerTool } from "./toolRegistry.js";

registerTool({
  name: "select_capability",

  description:
    "Select one exact registered page or button capability. Also specify whether the user wants to navigate to a page or perform an action.",

  parameters: {
    type: "object",
    properties: {
      capabilityId: {
        type: "string",
        description:
          "The exact ID of a capability supplied in the current catalogue."
      },
      intent: {
        type: "string",
        enum: ["navigate", "action"],
        description:
          "Use navigate when the user only wants to open a page. Use action when the user wants to perform or click an operation."
      }
    },
    required: ["capabilityId", "intent"],
    additionalProperties: false
  },

  execute: async ({ capabilityId, intent }) => {
    if (
      typeof capabilityId !== "string" ||
      !capabilityId.trim()
    ) {
      return {
        success: false,
        message: "A valid capability ID is required."
      };
    }

    if (!["navigate", "action"].includes(intent)) {
      return {
        success: false,
        message: "A valid action intent is required."
      };
    }

    return {
      success: true,
      capabilityId: capabilityId.trim(),
      intent
    };
  }
});
