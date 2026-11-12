import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";


import searchData from "../searchData";

import {
  discoverCurrentPage,
  findDiscoveredButton,
  isSensitiveButton,
  observePageButtons
} from "./autoDiscovery";

import "./AISearchBar.css";

// ==================================================
// CONFIGURATION
// ==================================================

const PENDING_KEY = "hourmaker_pending_ai_action";

const API_BASE_URL = (
import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_URL = API_BASE_URL + "/api/assistant/chat";

// ==================================================
// SEARCH CONFIGURATION
// ==================================================

const STOP_WORDS = [
"i", "me", "my", "the", "a", "an", "to",
"please", "can", "could", "would", "want",
"like", "need", "show", "open", "go",
"take", "bring", "navigate", "get", "see",
"view", "let", "us"
];

const PAGE_ALIASES = {
Dashboard: ["home", "home page", "overview", "main page"],

"Dashboard Statistics": [
"statistics",
"dashboard stats",
"stats"
],

"Recent Team Activity": [
"team activity",
"recent activity"
],

"Dashboard Quick Actions": [
"quick actions",
"quick action",
"actions"
],

"Team Management": [
"team",
"employees",
"staff",
"people"
],

"Team Members List": [
"employee list",
"team list",
"all employees",
"members list"
],

"Search Team Members": [
"find employee",
"search employee",
"find member",
"search members"
],

"Edit Team Member": [
"edit employee",
"update employee",
"change employee details"
],

"Remove Team Member": [
"remove employee",
"delete employee",
"remove member"
],

"Manage Member Status": [
"member status",
"employee status",
"active inactive"
],

"Invite a Team Member": [
"invite",
"add employee",
"new employee"
],

"Account Settings": [
"settings",
"account",
"profile settings"
],

"Edit Profile": [
"edit my profile",
"change profile"
],

"Email Notifications": [
"notifications",
"email settings"
],

"Theme Settings": [
"theme",
"dark mode",
"light mode"
],

"Billing and Payments": [
"billing",
"payments",
"subscription"
]
};

// ==================================================
// HELPER FUNCTIONS
// ==================================================

function normalize(value) {
return String(value || "")
.toLowerCase()
.replace(/[^\w\s]/g, " ")
.replace(/\s+/g, " ")
.trim();
}

function getSelectedCapability(result, capabilities) {
if (
!result ||
result.type !== "tool_result" ||
result.tool !== "select_capability" ||
!result.result ||
result.result.success !== true
) {
return null;
}

const capabilityId = result.result.capabilityId;

if (!capabilityId) {
return null;
}

return capabilities.find(function (item) {
return item.id === capabilityId;
}) || null;
}

// ==================================================
// BACKEND API REQUEST
// ==================================================

async function askAssistant(query, capabilities, mode) {
let response;

try {
response = await fetch(API_URL, {
method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify({
query: query,
capabilities: capabilities,
mode: mode
})
});
} catch (error) {
console.error("Backend connection error:", error);

throw new Error(
"Cannot connect to backend. Check whether your backend is running at " +
API_BASE_URL
);
}

let data;

try {
data = await response.json();
} catch (error) {
throw new Error(
"Backend returned an invalid response. HTTP status: " +
response.status
);
}

if (!response.ok || data.success === false) {
throw new Error(
data.message ||
data.answer ||
"Backend request failed. HTTP status: " + response.status
);
}

return data;
}

// ==================================================
// WAIT FOR BUTTON DISCOVERY
// ==================================================

async function waitForDiscoveredButtons() {
const maxAttempts = 15;
const delay = 200;

for (let attempt = 0; attempt < maxAttempts; attempt++) {
const buttons = discoverCurrentPage();

if (buttons && buttons.length > 0) {
return buttons;
}

await new Promise(function (resolve) {
setTimeout(resolve, delay);
});
}

return [];
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export default function AISearchBar({ role }) {
const navigate = useNavigate();
const location = useLocation();

const currentRole = String(role || "employee").toLowerCase();

const [query, setQuery] = useState("");
const [showSuggestions, setShowSuggestions] = useState(false);
const [loading, setLoading] = useState(false);
const [aiResponse, setAiResponse] = useState("");
const [error, setError] = useState("");
const [discoveredCapabilities, setDiscoveredCapabilities] = useState([]);
  


  // AUTOMATIC UI DISCOVERY
  useEffect(() => {
    let stopObserving = () => {};

    const startDiscovery = () => {
      const initialButtons = discoverCurrentPage();

      setDiscoveredCapabilities(initialButtons);

      stopObserving = observePageButtons((updatedButtons) => {
        setDiscoveredCapabilities(updatedButtons);

        console.log("Hourmaker AI: UI updated", updatedButtons);
      });
    };

    const timer = setTimeout(startDiscovery, 200);

    return () => {
      clearTimeout(timer);
      stopObserving();
    };
  }, [location.pathname, location.search, location.key]);

// ==================================================
// SEARCH SUGGESTIONS
// ==================================================

const meaningfulWords = normalize(query)
.split(/\s+/)
.filter(function (word) {
return word && !STOP_WORDS.includes(word);
});

const suggestions = (Array.isArray(searchData) ? searchData : [])
.filter(function (item) {
const allowedRoles = (item.roles || []).map(function (itemRole) {
return String(itemRole).toLowerCase();
});

if (!allowedRoles.includes(currentRole)) {
return false;
}

if (meaningfulWords.length === 0) {
return false;
}

const searchableText = [
item.title,
item.description,
...(PAGE_ALIASES[item.title] || [])
].join(" ");

const searchableWords = normalize(searchableText).split(/\s+/);

return meaningfulWords.every(function (queryWord) {
return searchableWords.some(function (word) {
return word.startsWith(queryWord);
});
});
})
.slice(0, 5);

// ==================================================
// CLEAR SEARCH
// ==================================================

function clearSearch() {
setQuery("");
setShowSuggestions(false);
setAiResponse("");
setError("");
}

// ==================================================
// OPEN PAGE FROM SUGGESTION
// ==================================================

function openPage(path) {
sessionStorage.removeItem(PENDING_KEY);

clearSearch();

navigate(path);
}

// ==================================================
// STAGE 2: DISCOVER AND SELECT BUTTON
// ==================================================

useEffect(function () {
let cancelled = false;

async function continuePendingAction() {
const raw = sessionStorage.getItem(PENDING_KEY);

if (!raw) {
return;
}

let pending;

try {
pending = JSON.parse(raw);
} catch (error) {
sessionStorage.removeItem(PENDING_KEY);
return;
}

if (
!pending ||
typeof pending.query !== "string" ||
typeof pending.path !== "string"
) {
sessionStorage.removeItem(PENDING_KEY);
return;
}

if (
pending.role &&
String(pending.role).toLowerCase() !== currentRole
) {
sessionStorage.removeItem(PENDING_KEY);
setAiResponse("No result found.");
return;
}

const expectedPath = pending.path.split("?")[0];

if (location.pathname !== expectedPath) {
return;
}

sessionStorage.removeItem(PENDING_KEY);

setLoading(true);
setAiResponse("");
setError("");

try {
// Discover buttons on current page
const discoveredButtons = await waitForDiscoveredButtons();

if (cancelled) {
return;
}

if (!discoveredButtons || discoveredButtons.length === 0) {
setAiResponse("No result found.");
return;
}

// Prepare button catalogue
const buttonCapabilities = discoveredButtons.map(function (item) {
return {
id: item.id,
name: item.name,
label: item.label,
description: item.description,
type: item.type,
category: item.category,
page: item.page,
pageTitle: item.pageTitle,
risk: item.risk,
sensitive: item.sensitive,
enabled: item.enabled,
visible: item.visible
};
});

// Ask AI to select action
const result = await askAssistant(
pending.query,
buttonCapabilities,
"action"
);

if (cancelled) {
return;
}

if (!result || result.type === "message") {
setAiResponse("No result found.");
return;
}

// Validate selected capability
const selected = getSelectedCapability(
result,
buttonCapabilities
);

if (!selected) {
console.warn("Invalid AI selection:", result);
setAiResponse("No result found.");
return;
}

if (result.result.intent !== "action") {
setAiResponse("No result found.");
return;
}

// Find actual button
const button = findDiscoveredButton(selected);

if (!button) {
setAiResponse("No result found.");
return;
}

// Validate button
if (
cancelled ||
!button.isConnected ||
button.disabled ||
button.getAttribute("aria-disabled") === "true"
) {
setAiResponse("No result found.");
return;
}

// Block sensitive operations
if (
selected.sensitive === true ||
selected.risk === "manual" ||
isSensitiveButton(button)
) {
setAiResponse(
"This operation requires manual action."
);
return;
}

// Final validation
if (
cancelled ||
!button.isConnected ||
button.disabled ||
button.getAttribute("aria-disabled") === "true"
) {
setAiResponse("No result found.");
return;
}

// Execute action
button.click();

setAiResponse("");

} catch (err) {
console.error("Button discovery error:", err);

if (!cancelled) {
setError(
err.message || "Unable to complete the action."
);
}

} finally {
if (!cancelled) {
setLoading(false);
}
}
}

const timer = setTimeout(function () {
continuePendingAction();
}, 200);

return function () {
cancelled = true;
clearTimeout(timer);
};

}, [
location.pathname,
location.search,
location.key,
currentRole
]);

// ==================================================
// STAGE 1: PAGE SEARCH AND NAVIGATION
// ==================================================

async function handleSearch(event) {
event.preventDefault();

const searchTerm = query.trim();

if (!searchTerm || loading) {
return;
}

setShowSuggestions(false);
setAiResponse("");
setError("");
setLoading(true);

sessionStorage.removeItem(PENDING_KEY);

try {
// Prepare role-based page catalogue
const pageCapabilities = (Array.isArray(searchData) ? searchData : [])
.filter(function (item) {
return (item.roles || []).some(function (itemRole) {
return String(itemRole).toLowerCase() === currentRole;
});
})
.map(function (item) {
return {
id: "page:" + item.id,
name: item.title,
description: item.description || "",
type: "page",
category: "navigation",
page: item.path,
pageTitle: item.title,
path: item.path
};
});

if (pageCapabilities.length === 0) {
setAiResponse("No result found.");
return;
}

// Ask AI to select page
const result = await askAssistant(
searchTerm,
pageCapabilities,
"route"
);

if (!result || result.type === "message") {
setAiResponse("No result found.");
return;
}

// Validate selection
const selected = getSelectedCapability(
result,
pageCapabilities
);

if (!selected || !selected.path) {
console.warn("Invalid AI page selection:", result);
setAiResponse("No result found.");
return;
}

const intent = result.result.intent;

// Normal navigation
if (intent === "navigate") {
clearSearch();

navigate(selected.path, {
state: {
aiNavigation: Date.now()
}
});

return;
}

// User wants an action on the selected page
if (intent === "action") {
const pending = {
query: searchTerm,
path: selected.path,
role: currentRole,
createdAt: Date.now()
};

sessionStorage.setItem(
PENDING_KEY,
JSON.stringify(pending)
);

setQuery("");

setShowSuggestions(false);

setAiResponse(
"Opening " + selected.name +
" to find the requested action..."
);

navigate(selected.path, {
state: {
aiActionDiscovery: Date.now()
}
});

return;
}

setAiResponse("No result found.");

} catch (err) {
console.error("Hourmaker AI search error:", err);

setError(
err.message || "Unable to connect to Hourmaker AI."
);

} finally {
setLoading(false);
}
}

// ==================================================
// INPUT CHANGE
// ==================================================

function handleChange(event) {
setQuery(event.target.value);

setAiResponse("");
setError("");

setShowSuggestions(true);
}

// ==================================================
// UI
// ==================================================

return (
<div className="ai-search-container">

<form
        className="ai-search-form"
        onSubmit={handleSearch}
      >

<span className="search-icon">
✧
</span>

<input
type="text"
placeholder="Ask Hourmaker AI or search your workspace..."
value={query}
onChange={handleChange}
onFocus={function () {
if (query.trim()) {
setShowSuggestions(true);
}
}}
disabled={loading}
/>

{query && (
<button
            type="button"
            className="search-clear-button"
            onClick={clearSearch}
            aria-label="Clear search"
          >
✕
</button>
)}

<button
type="submit"
className="unified-search-button"
disabled={loading || !query.trim()}
>
{loading ? "Searching..." : "Search"}
</button>

</form>

{/* SEARCH SUGGESTIONS */}

{showSuggestions && query.trim() && !loading && (
<div className="search-suggestions">

{suggestions.length > 0 ? (

suggestions.map(function (item) {
return (
<button
type="button"
className="suggestion-item"
key={item.id}
onClick={function () {
openPage(item.path);
}}
>

<span className="suggestion-icon">
⌕
</span>

<span>
<strong>{item.title}</strong>

<small>{item.description}</small>
</span>

</button>
);
})

) : (

<div className="no-suggestions">
No direct suggestions. Press Search to ask Hourmaker AI.
</div>

)}

</div>
)}

{/* AI RESPONSE */}

{(aiResponse || error) && (
<div className="ai-answer ai-response">

<h3>
✧ Hourmaker AI
</h3>

{aiResponse && (
<p>{aiResponse}</p>
)}

{error && (
<p className="search-error">
{error}
</p>
)}

</div>
)}

{/* LOADING */}

{loading && (
<div className="ai-loading-overlay">

<div className="ai-loading-card">

<div className="ai-loading-spinner" />

<h3>
Hourmaker AI is thinking...
</h3>

<p>
Understanding your request and discovering available actions.
</p>

</div>

</div>
)}

</div>
);
}
