
const normalize = (value = "") =>
  value.replace(/\s+/g, " ").trim();

export function discoverCurrentPage() {
  const main = document.querySelector(".main-content");

  if (!main) return [];

  const pageTitle =
    normalize(main.querySelector(".page-heading h1")?.textContent) ||
    document.title ||
    "Hourmaker";

  const buttons = [
    ...main.querySelectorAll("button")
  ].filter((button) => {
    return (
      !button.closest(".topbar") &&
      !button.closest(".ai-search-container") &&
      !button.closest("[data-ai-ignore]") &&
      !button.disabled &&
      !button.hidden &&
      button.getAttribute("aria-hidden") !== "true" &&
      button.getClientRects().length > 0
    );
  });

  return buttons
    .map((button, index) => {
      const name = normalize(
        button.getAttribute("aria-label") ||
        button.getAttribute("title") ||
        button.innerText ||
        button.textContent
      );

      if (!name) return null;

      const isSubmit =
        button.type === "submit" ||
        Boolean(button.closest("form"));

      return {
        id: `button:${index}`,
        name,
        description: `Button "${name}" displayed on ${pageTitle}.`,
        type: "action",
        index,
        risk: isSubmit ? "manual" : "confirm"
      };
    })
    .filter(Boolean);
}

export function findDiscoveredButton(action) {
  const main = document.querySelector(".main-content");

  if (!main || !action) return null;

  const buttons = [
    ...main.querySelectorAll("button")
  ].filter((button) => {
    return (
      !button.closest(".topbar") &&
      !button.closest(".ai-search-container") &&
      !button.disabled &&
      !button.hidden &&
      button.getAttribute("aria-hidden") !== "true" &&
      button.getClientRects().length > 0
    );
  });

  const button = buttons[action.index];

  if (!button) return null;

  const currentName = normalize(
    button.getAttribute("aria-label") ||
    button.getAttribute("title") ||
    button.innerText ||
    button.textContent
  );

  return currentName === action.name ? button : null;
}

export function isSensitiveButton(button) {
  if (!button) return true;

  const label = normalize(
    button.getAttribute("aria-label") ||
    button.getAttribute("title") ||
    button.innerText ||
    button.textContent
  );

  const sensitivePattern =
    /\b(delete|remove|deactivate|activate|logout|log out|sign out|save|submit|create|invite|send|pay|purchase|reset|disable|enable|manage plan)\b/i;

  return (
    button.type === "submit" ||
    Boolean(button.closest("form")) ||
    button.classList.contains("danger-button") ||
    button.closest(".danger-zone") !== null ||
    sensitivePattern.test(label)
  );
}
