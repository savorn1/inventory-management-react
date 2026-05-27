import { useState, useEffect, useRef } from "react";
import type { ProductDTO } from "@/api/products.api";

export interface AppProductComboboxProps {
  /** Called with the trimmed query; should resolve to matching products. */
  onSearch: (query: string) => Promise<ProductDTO[]>;
  /** Called when the user selects a product from the dropdown. */
  onSelect: (product: ProductDTO) => void;
  placeholder?: string;
  /**
   * When true, out-of-stock products are still selectable (useful for
   * purchase orders where you're restocking from a supplier).
   */
  allowOutOfStock?: boolean;
}

/**
 * Searchable product combobox.
 *
 * - Debounces the query 300 ms then calls `onSearch`
 * - Shows a loading spinner while fetching
 * - Keyboard navigation: ↑ ↓ to move, Enter to pick, Escape to close
 * - Stock badge: amber "Low (n)" when stock ≤ 5, red "Out of stock" (unselectable) when 0
 * - Resets and keeps focus after each selection for fast consecutive adds
 */
export function AppProductCombobox({
  onSearch,
  onSelect,
  placeholder = "Search product…",
  allowOutOfStock = false,
}: AppProductComboboxProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── scroll highlighted row into view ────────────────────────────────────
  useEffect(() => {
    if (listRef.current && activeIdx >= 0) {
      const el = listRef.current.children[activeIdx] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  // ── debounced API search ────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim();
    const timer = setTimeout(async () => {
      if (!q) {
        setItems([]);
        setOpen(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const results = await onSearch(q);
        setItems(results);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // ── helpers ─────────────────────────────────────────────────────────────
  function pick(product: ProductDTO) {
    onSelect(product);
    setQuery("");
    setItems([]);
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.focus(); // stay focused for consecutive adds
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        break;
      case "Enter": {
        e.preventDefault();
        const target = activeIdx >= 0 ? items[activeIdx] : undefined;
        if (target) {
          const isBlocked =
            target.stock !== undefined && target.stock === 0 && !allowOutOfStock;
          if (!isBlocked) pick(target);
        }
        break;
      }
      case "Escape":
        setOpen(false);
        setActiveIdx(-1);
        break;
    }
  }

  const showDropdown =
    open && (loading || items.length > 0 || query.trim().length > 0);

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={containerRef}>
      {/* Input row */}
      <div
        className={`flex items-center border rounded-lg bg-white transition-colors ${
          open ? "border-indigo-500" : "border-slate-200"
        }`}
      >
        {/* Search / loading icon */}
        {loading ? (
          <svg
            className="w-4 h-4 text-indigo-400 ml-3 shrink-0 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-slate-400 ml-3 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        )}

        <input
          ref={inputRef}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(-1);
            if (e.target.value.trim()) setLoading(true);
          }}
          onFocus={() => {
            if (items.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 h-9 px-3 text-sm outline-none bg-transparent placeholder:text-slate-400"
        />

        {query && (
          <button
            type="button"
            onMouseDown={() => {
              setQuery("");
              setItems([]);
              setOpen(false);
              setActiveIdx(-1);
            }}
            className="pr-3 text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Loading row */}
          {loading && items.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
              <svg
                className="w-4 h-4 animate-spin text-indigo-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Searching…
            </li>
          )}

          {/* Empty row */}
          {!loading && items.length === 0 && query.trim().length > 0 && (
            <li className="px-4 py-3 text-sm text-slate-400 text-center">
              No products found for &ldquo;{query}&rdquo;
            </li>
          )}

          {/* Result rows */}
          {items.map((p, i) => {
            const outOfStock = p.stock !== undefined && p.stock === 0;
            const lowStock =
              p.stock !== undefined && p.stock > 0 && p.stock <= 5;
            const blocked = outOfStock && !allowOutOfStock;
            return (
              <li
                key={p.id}
                onMouseDown={() => !blocked && pick(p)}
                className={`px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                  blocked
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                } ${
                  i === activeIdx
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {(() => {
                  const src = p.imageUrl ?? p.imageUrls?.[0];
                  return src ? (
                    <img
                      src={src}
                      alt={p.name}
                      className="w-7 h-7 rounded-md object-cover shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null;
                })()}
                <span className="flex-1 font-medium truncate">{p.name}</span>
                {p.brandName && (
                  <span className="text-slate-400 text-xs shrink-0">
                    {p.brandName}
                  </span>
                )}
                {outOfStock && (
                  <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                    Out of stock
                  </span>
                )}
                {lowStock && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                    Low ({p.stock})
                  </span>
                )}
                <span className="text-slate-500 text-xs font-semibold shrink-0">
                  ${p.price.toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
