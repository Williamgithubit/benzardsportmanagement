"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  MdArticle,
  MdAssignment,
  MdClear,
  MdEmojiEvents,
  MdEvent,
  MdHistory,
  MdPerson,
  MdSchool,
  MdSearch,
  MdSettings,
} from "react-icons/md";
import {
  performGlobalSearch,
  getRecentSearches,
  saveRecentSearch,
  SearchResult,
} from "@/services/globalSearchService";

interface GlobalSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
}

interface SearchTypeMeta {
  icon: IconType;
  className: string;
}

const searchTypeMeta: Record<SearchResult["type"], SearchTypeMeta> = {
  user: {
    icon: MdPerson,
    className: "border-sky-200 bg-sky-50 text-sky-600",
  },
  program: {
    icon: MdSchool,
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  event: {
    icon: MdEvent,
    className: "border-emerald-200 bg-emerald-50 text-emerald-600",
  },
  admission: {
    icon: MdAssignment,
    className: "border-amber-200 bg-amber-50 text-amber-600",
  },
  certificate: {
    icon: MdEmojiEvents,
    className: "border-violet-200 bg-violet-50 text-violet-600",
  },
  report: {
    icon: MdArticle,
    className: "border-secondary/20 bg-secondary/10 text-secondary",
  },
  setting: {
    icon: MdSettings,
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onResultClick,
  placeholder = "Search users, programs, events...",
}) => {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const searchResults = await performGlobalSearch(searchQuery, {
        limit: 10,
        includeInactive: false,
      });

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const recent = getRecentSearches();
    setRecentSearches(recent);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void performSearch(query);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [performSearch, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (query.trim()) {
      saveRecentSearch(query);
      setRecentSearches(getRecentSearches());
    }

    setQuery("");
    setResults([]);
    setOpen(false);

    if (onResultClick) {
      onResultClick(result);
      return;
    }

    router.push(result.url);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    setOpen(true);
    void performSearch(recentQuery);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const shouldShowPanel =
    open && (query.trim().length > 0 || recentSearches.length > 0);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-secondary/20 focus-within:shadow-[0_20px_40px_-28px_rgba(0,0,84,0.55)]">
        <MdSearch size={20} className="text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear search"
          >
            <MdClear size={18} />
          </button>
        ) : null}
      </div>

      {shouldShowPanel ? (
        <div className="glass-panel absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[28px] border border-slate-200/80">
          {loading ? (
            <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-secondary" />
              <p className="text-sm font-medium text-slate-600">Searching…</p>
            </div>
          ) : query.trim().length === 0 && recentSearches.length > 0 ? (
            <div className="p-3">
              <div className="flex items-center gap-2 px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <MdHistory size={16} />
                Recent Searches
              </div>

              <div className="space-y-1">
                {recentSearches.map((recentQuery) => (
                  <button
                    key={recentQuery}
                    type="button"
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                      <MdHistory size={18} />
                    </span>
                    <span className="truncate">{recentQuery}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="p-3">
              <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Search Results ({results.length})
              </div>

              <div className="space-y-1">
                {results.map((result) => {
                  const meta = searchTypeMeta[result.type];
                  const ResultIcon = meta.icon;

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => handleResultClick(result)}
                      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                    >
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${meta.className}`}
                      >
                        <ResultIcon size={18} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {result.title}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${meta.className}`}
                          >
                            {result.type}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {result.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : query.trim().length > 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-400">
                <MdSearch size={24} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  No results found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try a different keyword for “{query}”.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default GlobalSearch;
