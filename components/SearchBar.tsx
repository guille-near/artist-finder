"use client";

import { useState, FormEvent } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  initialQuery?: string;
}

export default function SearchBar({
  onSearch,
  isSearching,
  initialQuery = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-full shadow-lg group-hover:shadow-xl transition-shadow" />
        
        <div className="relative flex items-center">
          {/* Icono de búsqueda */}
          <div className="absolute left-5 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ej: "Kendrick Lamar luther"'
            disabled={isSearching}
            className="w-full py-4 pl-14 pr-14 rounded-full text-lg bg-transparent focus:outline-none disabled:opacity-50 text-gray-900 dark:text-gray-100"
            autoFocus
          />

          {/* Botón de limpiar */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-16 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Loading spinner o botón de búsqueda */}
          <div className="absolute right-5">
            {isSearching ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <button
                type="submit"
                disabled={!query.trim()}
                className="p-2 disabled:opacity-30"
              >
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
