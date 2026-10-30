
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import searchData from "../searchData";
import "./AISearchBar.css";

// Normalize text for consistent matching.
function normalize(text = "") {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

// Calculate score only when the title starts with the query.
function calculateScore(item, query) {
  const q = normalize(query);
  const title = normalize(item.title);

  if (!q || !title.startsWith(q)) {
    return 0;
  }

  // Exact title match gets the highest score.
  if (title === q) {
    return 100;
  }

  // Title starts with the query.
  return 80;
}

export default function AISearchBar({ role = "employee" }) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState("");

  // Generate search results using title-only matching.
  const results = useMemo(() => {
    const q = normalize(query);

    if (!q) {
      return [];
    }

    return searchData
      .filter((item) => (item.roles || []).includes(role))
      .map((item) => ({
        ...item,
        score: calculateScore(item, q),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [query, role]);

  // Open selected search result.
  function openResult(item) {
    if (!item?.path) {
      setError("This destination is not available.");
      return;
    }

    setError("");
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);

    navigate(item.path);
  }

  // Handle keyboard navigation.
  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(0);
      return;
    }

    if (!isOpen || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setSelectedIndex((index) =>
        index < results.length - 1 ? index + 1 : 0
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setSelectedIndex((index) =>
        index > 0 ? index - 1 : results.length - 1
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (results[selectedIndex]) {
        openResult(results[selectedIndex]);
      }
    }
  }

  return (
    <div className="ai-search">
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          ⌕
        </span>

        <input
          type="search"
          value={query}
          placeholder="Search Hourmaker pages and actions..."
          aria-label="Search Hourmaker"
          aria-expanded={isOpen}
          aria-controls="hourmaker-search-results"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
            setError("");
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />

        {query && (
          <button
            type="button"
            className="clear-button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setSelectedIndex(0);
              setError("");
              setIsOpen(true);
            }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div
          className="search-results"
          id="hourmaker-search-results"
          role="listbox"
          aria-label="Search suggestions"
        >
          {results.length > 0 ? (
            results.map((item, index) => (
              <button
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                className={`search-result ${
                  index === selectedIndex ? "selected" : ""
                }`}
                key={item.id}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => openResult(item)}
              >
                <span className="result-title">
                  {item.title}
                </span>

                <span className="result-description">
                  {item.description}
                </span>
              </button>
            ))
          ) : (
            <div className="no-results" role="status">
              No results found for "{query}".
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="search-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
