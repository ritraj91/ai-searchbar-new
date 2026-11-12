
import { registerTool } from "./toolRegistry.js";

registerTool({
  name: "select_capability",

  description:
    "Select an available page or button capability using its exact ID.",

  parameters: {
    type: "object",

    properties: {
      capabilityId: {
        type: "string",
        description: "Exact ID of the selected capability."
      },

      intent: {
        type: "string",
        enum: ["navigate", "action"],
        description: "Requested operation intent."
      }
    },

    required: ["capabilityId", "intent"],
    additionalProperties: false
  },

  execute: async ({ capabilityId, intent }) => {
    if (
      typeof capabilityId !== "string" ||
      !capabilityId.trim() ||
      !["navigate", "action"].includes(intent)
    ) {
      return {
        success: false,
        message: "Invalid capability selection."
      };
    }

    return {
      success: true,
      capabilityId,
      intent
    };
  }
});
