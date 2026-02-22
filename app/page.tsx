"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import ArtistResultCard from "@/components/ArtistResult";
import type { ArtistResult as ArtistResultType } from "@/types/artist";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ArtistResultType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setIsSearching(true);
    setResults([]);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en la búsqueda");
      }

      const results = await response.json();
      setResults(Array.isArray(results) ? results : [results]);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header con buscador */}
      <div className={`transition-all duration-300 ${results.length > 0 ? "py-4 border-b border-gray-200 dark:border-gray-800" : "pt-32"}`}>
        <div className="max-w-3xl mx-auto px-4">
          {/* Logo */}
          {results.length === 0 && (
            <div className="text-center mb-8">
              <h1 className="text-6xl font-normal mb-8 text-gray-800 dark:text-gray-100">
                Artist Finder
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Busca artistas por canción
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-2xl font-normal text-gray-800 dark:text-gray-100">
                Artist Finder
              </h1>
            </div>
          )}

          {/* Barra de búsqueda */}
          <SearchBar
            onSearch={handleSearch}
            isSearching={isSearching}
            initialQuery={searchQuery}
          />
        </div>
      </div>

      {/* Resultados */}
      {isSearching && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-48" />
            ))}
          </div>
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Aproximadamente {results.length} resultado{results.length !== 1 ? "s" : ""}
          </div>

          <div className="space-y-6">
            {results.map((result, index) => (
              <ArtistResultCard key={index} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* Sin resultados o error después de búsqueda */}
      {!isSearching && results.length === 0 && searchQuery !== "" && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xl mb-2 text-gray-700 dark:text-gray-300">
              {error || `No se encontraron resultados para "${searchQuery}"`}
            </p>
            <p className="text-sm mb-6">
              Intenta con otra búsqueda o prueba con estos ejemplos:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {["Kendrick Lamar luther", "Bad Bunny Monaco", "Taylor Swift Anti-Hero"].map(
                (example) => (
                  <button
                    key={example}
                    onClick={() => handleSearch(example)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {example}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estado inicial */}
      {!isSearching && results.length === 0 && searchQuery === "" && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-4">Prueba buscar:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {["Kendrick Lamar luther", "Bad Bunny Monaco", "Rosalia Malamente"].map(
                (example) => (
                  <button
                    key={example}
                    onClick={() => handleSearch(example)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {example}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
