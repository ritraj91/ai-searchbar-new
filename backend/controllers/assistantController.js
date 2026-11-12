import { runAssistant } from "../services/assistantService.js";

export async function assistantChat(req, res) {
  try {
    const {
      query,
      capabilities = [],
      mode = "route"
    } = req.body || {};

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
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.description === "string" &&
          ["page", "action"].includes(item.type)
      )
      .slice(0, 100)
      .map((item) => ({
        id: item.id,
        name: item.name,
        label: item.label || item.name,
        description: item.description,
        type: item.type,
        category: item.category || "general",
        page: item.page || "",
        pageTitle: item.pageTitle || "",
        risk: ["normal", "confirm", "manual"].includes(item.risk)
          ? item.risk
          : "manual",
        sensitive: item.sensitive === true,
        enabled: item.enabled !== false,
        visible: item.visible !== false,
        ...(item.type === "page" && typeof item.path === "string"
          ? { path: item.path }
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
      message: error.message || "Assistant request failed."
    });
  }
}