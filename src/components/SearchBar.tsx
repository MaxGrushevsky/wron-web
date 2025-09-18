"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/?search=${query}&page=1`);
  };

  return (
    <form onSubmit={handleSearch} className="mb-4 flex items-center space-x-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj..."
        className="flex-1 px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
      >
        Szukaj 
      </button>
    </form>
  );
}
