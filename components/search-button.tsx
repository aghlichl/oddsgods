import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchButtonProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchButton({ onSearch, className }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSearch(query);
  }, [query, onSearch]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setQuery("");
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (isOpen) {
      setQuery("");
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery("");
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("fixed bottom-16 right-4 z-[60]", className)}>
      {/* Floating Search Input */}
      <div
        className={cn(
          "flex items-center transition-all duration-300 ease-out overflow-hidden",
          "bg-zinc-950/95 backdrop-blur-xl border-2 border-zinc-600 shadow-[4px_4px_0px_0px_#27272a]",
          "hover:shadow-[6px_6px_0px_0px_#27272a] hover:-translate-y-1",
          isOpen ? "w-72 h-12 opacity-100 scale-100" : "w-12 h-12 opacity-70 scale-90 hover:opacity-100 hover:scale-100"
        )}
      >
        {/* Search Icon Button */}
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center justify-center w-12 h-12 flex-shrink-0",
            "text-zinc-400 hover:text-zinc-100 transition-colors duration-200",
            "border-r-2 border-zinc-600",
            isOpen && "border-r-0"
          )}
        >
          {isOpen ? <X size={20} /> : <Search size={20} />}
        </button>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search events..."
          className={cn(
            "flex-1 bg-transparent border-none outline-none",
            "text-zinc-100 placeholder-zinc-500 font-mono text-sm",
            "px-3 py-2 transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0 w-0 p-0"
          )}
        />
      </div>

      {/* Search Results Indicator */}
      {query && (
        <div className="absolute -top-10 left-0 right-0 text-center">
          <span className="inline-block px-2 py-1 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider bg-black/70 border border-zinc-600 rounded">
            SEARCHING: "{query}"
          </span>
        </div>
      )}
    </div>
  );
}
