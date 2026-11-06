
import { useEffect, useState } from "react";
import {
  useNavigate,
  useLocation
} from "react-router-dom";

import searchData from "../searchData";

import {
  discoverCurrentPage,
  findDiscoveredButton,
  isSensitiveButton
} from "./autoDiscovery";

import "./AISearchBar.css";

const PENDING_KEY = "hourmaker_pending_ai_action";

const stopWords = new Set([
  "i", "me", "my", "the", "a", "an", "to", "please",
  "can", "could", "would", "want", "like", "need",
  "show", "open", "go", "take", "bring", "navigate",
  "get", "see", "view", "let", "us"
]);

const pageAliases = {
  Dashboard: ["home", "home page", "overview", "main page"],
  "Dashboard Statistics": ["statistics", "dashboard stats", "stats"],
  "Recent Team Activity": ["team activity", "recent activity"],
  "Team Management": ["team", "employees", "staff", "people"],
  "Team Members List": ["employee list", "team list", "all employees"],
  "Search Team Members": ["find employee", "search employee"],
  "Invite a Team Member": ["invite", "add employee", "new employee"],
  "Account Settings": ["settings", "account", "profile settings"],
  "Edit Profile": ["edit my profile", "change profile"],
  "Email Notifications": ["notifications", "email settings"],
  "Theme Settings": ["theme", "dark mode", "light mode"],
  "Billing and Payments": ["billing", "payments", "subscription"]
};

const normalize = (value = "") =>
  value.toLowerCase().replace(/[^\w\s]/g, " ").trim();

async function askAssistant(query, capabilities, mode) {
  const response = await fetch(
    "http://127.0.0.1:5000/api/assistant/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        mode,
        capabilities
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "AI assistant request failed."
    );
  }

  return data;
}

export default function AISearchBar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentRole = (role || "employee").toLowerCase();

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState("");

  const meaningfulWords = normalize(query)
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(word));

  // Existing suggestions are preserved.
  const suggestions = searchData.filter((item) => {
    const allowedRoles = (item.roles || []).map((r) =>
      r.toLowerCase()
    );

    if (!allowedRoles.includes(currentRole)) return false;
    if (!meaningfulWords.length) return false;

    const searchableText = [
      item.title,
      item.description,
      ...(pageAliases[item.title] || [])
    ].join(" ");

    const searchableWords = normalize(searchableText).split(/\s+/);

    return meaningfulWords.every((queryWord) =>
      searchableWords.some((word) => word.startsWith(queryWord))
    );
  }).slice(0, 5);

  function clearSearch() {
    setQuery("");
    setShowSuggestions(false);
    setAiResponse("");
    setError("");
  }

  function openPage(path) {
    navigate(path);
    clearSearch();
  }

  // Stage 2: after navigation, discover the rendered page's buttons.
  useEffect(() => {
    let cancelled = false;

    async function continuePendingAction() {
      const raw = sessionStorage.getItem(PENDING_KEY);

      if (!raw) return;

      let pending;

      try {
        pending = JSON.parse(raw);
      } catch {
        sessionStorage.removeItem(PENDING_KEY);
        return;
      }

      const currentPath =
        location.pathname + location.search;

      if (currentPath !== pending.path) return;

      // Remove immediately so it cannot execute twice.
      sessionStorage.removeItem(PENDING_KEY);

      setLoading(true);
      setAiResponse("");
      setError("");

      try {
        // Wait briefly for the page content to render.
        await new Promise((resolve) => setTimeout(resolve, 150));

        if (cancelled) return;

        const discoveredButtons = discoverCurrentPage();

        if (!discoveredButtons.length) {
          setAiResponse(
            "I opened the requested page, but no available buttons were found there."
          );
          return;
        }

        const result = await askAssistant(
          pending.query,
          discoveredButtons.map(({ id, name, description, type }) => ({
            id,
            name,
            description,
            type
          })),
          "action"
        );

        if (cancelled) return;

        if (
          result.type !== "tool_result" ||
          result.tool !== "select_capability" ||
          !result.result?.success
        ) {
          setAiResponse(
            result.answer ||
            result.result?.message ||
            "I could not identify the requested button."
          );
          return;
        }

        const selected = discoveredButtons.find(
          (item) => item.id === result.result.capabilityId
        );

        if (!selected) {
          throw new Error(
            "AI selected a button that is not available on this page."
          );
        }

        const button = findDiscoveredButton(selected);

        if (!button) {
          throw new Error(
            "The selected button is no longer available. Please try again."
          );
        }

        // Sensitive actions must always be completed manually.
        if (isSensitiveButton(button)) {
          setAiResponse(
            `I found "${selected.name}". For safety, please click it yourself to complete this action.`
          );
          return;
        }

        const confirmed = window.confirm(
          `Hourmaker AI found "${selected.name}". Do you want to click this button?`
        );

        if (!confirmed) {
          setAiResponse("Action cancelled.");
          return;
        }

        button.click();

        setAiResponse(
          `"${selected.name}" was clicked. Check the page for the result.`
        );

      } catch (err) {
        console.error("Pending AI action error:", err);
        setError(err.message || "Unable to complete the action.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    continuePendingAction();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, location.key]);

  // Stage 1: ask AI to navigate or identify the destination page.
  async function handleSearch(event) {
    event.preventDefault();

    const searchTerm = query.trim();

    if (!searchTerm || loading) return;

    setShowSuggestions(false);
    setAiResponse("");
    setError("");
    setLoading(true);

    try {
      const pageCapabilities = searchData
        .filter((item) =>
          (item.roles || []).some(
            (itemRole) => itemRole.toLowerCase() === currentRole
          )
        )
        .map((item) => ({
          id: `page:${item.id}`,
          name: item.title,
          description: item.description,
          type: "page",
          path: item.path,
          roles: item.roles
        }));

      const result = await askAssistant(
        searchTerm,
        pageCapabilities,
        "route"
      );

      if (result.type !== "tool_result") {
        setAiResponse(
          result.answer || "I could not understand your request."
        );
        return;
      }

      if (
        result.tool !== "select_capability" ||
        !result.result?.success
      ) {
        setAiResponse(
          result.result?.message || "No matching feature was found."
        );
        return;
      }

      const selected = pageCapabilities.find(
        (item) => item.id === result.result.capabilityId
      );

      if (!selected) {
        throw new Error(
          "AI selected a page that is not registered for your role."
        );
      }

      if (!selected.path) {
        throw new Error("The selected page has no route.");
      }

      const intent = result.result.intent || "navigate";

      if (intent === "navigate") {
        clearSearch();

        navigate(selected.path, {
          state: { aiNavigation: Date.now() }
        });

        return;
      }

      if (intent === "action") {
        const pending = {
          query: searchTerm,
          path: selected.path,
          role: currentRole
        };

        sessionStorage.setItem(
          PENDING_KEY,
          JSON.stringify(pending)
        );

        setQuery("");
        setShowSuggestions(false);
        setAiResponse(`Opening ${selected.name} to find the requested action...`);

        navigate(selected.path, {
          state: { aiActionDiscovery: Date.now() }
        });

        return;
      }

      throw new Error("Unsupported AI intent.");

    } catch (err) {
      console.error("AI Assistant error:", err);
      setError(err.message || "Unable to connect to Hourmaker AI.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    setQuery(event.target.value);
    setAiResponse("");
    setError("");
    setShowSuggestions(true);
  }

  return (
    <div className="ai-search-container">
      <form className="ai-search-form" onSubmit={handleSearch}>
        <span className="search-icon">✧</span>

        <input
          type="text"
          placeholder="Ask Hourmaker AI or search your workspace..."
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.trim()) setShowSuggestions(true);
          }}
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

      {showSuggestions && query.trim() && !loading && (
        <div className="search-suggestions">
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                type="button"
                className="suggestion-item"
                key={item.id}
                onClick={() => openPage(item.path)}
              >
                <span className="suggestion-icon">⌕</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))
          ) : (
            <div className="no-suggestions">
              No direct suggestions. Press Search to ask Hourmaker AI.
            </div>
          )}
        </div>
      )}

      {(aiResponse || error) && (
        <div className="ai-answer ai-response">
          <h3>✧ Hourmaker AI</h3>
          {aiResponse && <p>{aiResponse}</p>}
          {error && <p className="search-error">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="ai-loading-overlay">
          <div className="ai-loading-card">
            <div className="ai-loading-spinner"></div>
            <h3>Hourmaker AI is thinking...</h3>
            <p>Understanding your request and discovering available actions</p>
          </div>
        </div>
      )}
    </div>
  );
}
