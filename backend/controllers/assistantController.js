
import { runAssistant } from "../services/assistantService.js";

export async function assistantChat(req, res) {
  try {
    const {
      query,
      capabilities = [],
      mode = "route"
    } = req.body;

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid message."
      });
    }

    if (!["route", "action"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assistant mode."
      });
    }

    if (!Array.isArray(capabilities)) {
      return res.status(400).json({
        success: false,
        message: "Invalid capability catalogue."
      });
    }

    const safeCapabilities = capabilities
      .filter((item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.description === "string" &&
        ["page", "action"].includes(item.type)
      )
      .slice(0, 100)
      .map((item) => ({
        id: item.id.slice(0, 100),
        name: item.name.slice(0, 150),
        description: item.description.slice(0, 500),
        type: item.type,
        ...(item.type === "page" &&
        typeof item.path === "string"
          ? { path: item.path.slice(0, 300) }
          : {})
      }));

    const result = await runAssistant(
      query.trim(),
      safeCapabilities,
      mode
    );

    return res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error("Assistant error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Assistant could not process your request."
    });
  }
}
