import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SearchButtonProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchButton({ onSearch, className }: SearchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onSearch(query);
  }, [query, onSearch]);

  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      // Focus input after modal animation completes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isModalOpen]);

  const handleToggle = () => {
    if (isModalOpen) {
      setQuery("");
      setIsModalOpen(false);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery("");
      setIsModalOpen(false);
    } else if (e.key === 'Enter') {
      // Enter key explicitly triggers search (though it already searches on change)
      e.preventDefault();
      // Could add additional search logic here if needed
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    // Focus back to input after selecting suggestion
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Minimalist search suggestions
  const searchSuggestions = [
    "trump",
    "election",
    "crypto",
    "bitcoin",
    "sports",
    "football",
    "basketball",
    "whale",
    "god whale"
  ];

  return (
    <>
      {/* Floating Search Button */}
      <div className={cn("fixed bottom-16 right-4 z-60", className)}>
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center justify-center w-12 h-12",
            "bg-zinc-950/95 backdrop-blur-xl border-2 border-zinc-600 shadow-[4px_4px_0px_0px_#27272a]",
            "hover:shadow-[6px_6px_0px_0px_#27272a] hover:-translate-y-1",
            "text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
          )}
        >
          <Search size={20} />
        </button>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center bg-zinc-950/95 backdrop-blur-xl border-2 border-zinc-600 shadow-[4px_4px_0px_0px_#27272a] rounded-lg overflow-hidden">
                <input
                  ref={inputRef}
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search events..."
                  className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 font-mono text-lg px-4 py-4"
                />
                <button
                  onClick={() => {
                    setQuery("");
                    setIsModalOpen(false);
                  }}
                  className="flex items-center justify-center w-12 h-12 text-zinc-400 hover:text-zinc-100 transition-colors duration-200 border-l border-zinc-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Suggestions */}
              {!query && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-4 space-y-2"
                >
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
                    Popular searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1 text-sm font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-zinc-700 rounded transition-colors duration-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
