
/*
  src/components/autoDiscovery.js

  Automatically discovers buttons and action links on the
  currently rendered Hourmaker page.

  No manual button registration is required.
*/

const ELEMENT_ID_ATTRIBUTE = "data-hourmaker-ai-id";

const discoveredElements = new Map();
const elementIds = new WeakMap();

let nextElementId = 1;

// --------------------------------------------------
// GET MAIN PAGE CONTENT
// --------------------------------------------------

function getMainContent() {
  return (
    document.querySelector(".main-content") ||
    document.querySelector("#main-content") ||
    document.querySelector('[role="main"]') ||
    document.querySelector("main") ||
    document.body
  );
}

// --------------------------------------------------
// GET BUTTON LABEL
// --------------------------------------------------

function getElementLabel(element) {
  if (!element) return "";

  const ariaLabel = element.getAttribute("aria-label");
  const title = element.getAttribute("title");

  const text =
    element.innerText ||
    element.textContent ||
    "";

  return String(ariaLabel || title || text)
    .replace(/\s+/g, " ")
    .trim();
}

// --------------------------------------------------
// CHECK VISIBILITY
// --------------------------------------------------

function isVisible(element) {
  if (!element || !element.isConnected) {
    return false;
  }

  const style = window.getComputedStyle(element);

  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }

  return element.getClientRects().length > 0;
}

// --------------------------------------------------
// CHECK DISABLED STATE
// --------------------------------------------------

function isDisabled(element) {
  return (
    element.disabled === true ||
    element.getAttribute("aria-disabled") === "true"
  );
}

// --------------------------------------------------
// DETECT SENSITIVE ACTIONS
// --------------------------------------------------

export function isSensitiveButton(element) {
  if (!element) return false;

  const label = getElementLabel(element).toLowerCase();

  const sensitivePatterns = [
    "delete",
    "remove",
    "terminate",
    "deactivate",
    "disable account",
    "reset password",
    "change password",
    "logout",
    "log out",
    "sign out",
    "payment",
    "billing",
    "purchase",
    "refund",
    "approve",
    "reject",
    "send invitation",
    "invite user",
    "submit application",
    "save changes",
    "confirm",
    "publish",
    "archive"
  ];

  return sensitivePatterns.some(function (word) {
    return label.includes(word);
  });
}

// --------------------------------------------------
// GET ELIGIBLE BUTTONS AND LINKS
// --------------------------------------------------

function getEligibleButtons() {
  const container = getMainContent();

  if (!container) {
    console.warn(
      "Hourmaker AI: Main content container not found."
    );

    return [];
  }

  const elements = Array.from(
    container.querySelectorAll(
      'button, [role="button"], a[href]'
    )
  );

  return elements.filter(function (element) {
    return (
      !element.closest(".topbar") &&
      !element.closest(".navbar") &&
      !element.closest(".sidebar") &&
      !element.closest(".ai-search-container") &&
      !element.closest("[data-ai-ignore]") &&
      !element.closest('[aria-hidden="true"]') &&
      !isDisabled(element) &&
      isVisible(element) &&
      getElementLabel(element).length > 0
    );
  });
}

// --------------------------------------------------
// CREATE STABLE ELEMENT ID
// --------------------------------------------------

function getElementId(element) {
  let id = elementIds.get(element);

  if (!id) {
    id = element.getAttribute(ELEMENT_ID_ATTRIBUTE);

    if (!id) {
      id = "hourmaker-action-" + nextElementId++;

      element.setAttribute(
        ELEMENT_ID_ATTRIBUTE,
        id
      );
    }

    elementIds.set(element, id);
  }

  return id;
}

// --------------------------------------------------
// DISCOVER CURRENT PAGE BUTTONS
// --------------------------------------------------

export function discoverCurrentPage() {
  if (typeof document === "undefined") {
    return [];
  }

  const elements = getEligibleButtons();

  const capabilities = elements.map(function (element) {
    const id = getElementId(element);
    const label = getElementLabel(element);

    const sensitive = isSensitiveButton(element);

    discoveredElements.set(id, element);

    return {
      id: id,
      name: label,
      label: label,
      description:
        element.getAttribute("title") ||
        element.getAttribute("aria-label") ||
        label,

      type: "action",
      category: "ui-action",

      page: window.location.pathname,
      pageTitle: document.title,

      risk: sensitive ? "manual" : "normal",
      sensitive: sensitive,

      enabled: !isDisabled(element),
      visible: isVisible(element)
    };
  });

  // Remove disconnected elements from the lookup map.
  discoveredElements.forEach(function (element, id) {
    if (!element || !element.isConnected) {
      discoveredElements.delete(id);
    }
  });

  console.log(
    "Hourmaker AI: Discovered actions:",
    capabilities
  );

  return capabilities;
}

// --------------------------------------------------
// FIND ACTUAL DOM BUTTON FROM AI SELECTION
// --------------------------------------------------

export function findDiscoveredButton(selected) {
  if (!selected || !selected.id) {
    return null;
  }

  const element = discoveredElements.get(selected.id);

  if (!element || !element.isConnected) {
    return null;
  }

  return element;
}

// --------------------------------------------------
// AUTOMATICALLY WATCH FOR NEW BUTTONS
// --------------------------------------------------

export function observePageButtons(callback) {
  if (typeof document === "undefined") {
    return function () {};
  }

  if (typeof callback !== "function") {
    console.error(
      "Hourmaker AI: Observer callback must be a function."
    );

    return function () {};
  }

  const container = getMainContent();

  if (!container) {
    console.warn(
      "Hourmaker AI: Cannot observe page buttons."
    );

    return function () {};
  }

  // Initial discovery
  callback(discoverCurrentPage());

  let updateTimeout = null;

  const observer = new MutationObserver(function () {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(function () {
      callback(discoverCurrentPage());
    }, 150);
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "disabled",
      "aria-disabled",
      "aria-label",
      "title",
      "class",
      "style",
      "hidden"
    ]
  });

  // Cleanup function
  return function stopObserving() {
    observer.disconnect();

    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
  };
}
