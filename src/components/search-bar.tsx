"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Ask anything about policies, metrics, or projects..."
          className="pl-12 h-14 text-base rounded-full shadow-lg focus-visible:shadow-xl transition-shadow"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button type="submit" size="lg" className="h-14 px-8 rounded-full shadow-lg hover:shadow-xl transition-shadow">
        Search
      </Button>
    </form>
  );
}
