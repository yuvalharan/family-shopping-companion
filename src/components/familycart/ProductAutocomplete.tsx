import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BASE_PRODUCTS, type BaseProduct } from "@/lib/base-products";
import type { Unit } from "@/lib/familycart-data";

export type ProductSuggestion = {
  name: string;
  category: string;
  default_quantity: number;
  unit: Unit;
};

type ProductAutocompleteProps = {
  query: string;
  onPick: (product: ProductSuggestion) => void;
  className?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

function scoreMatch(product: BaseProduct, query: string) {
  const name = normalize(product.name);
  const q = normalize(query);
  if (!q || !name.includes(q)) return Number.POSITIVE_INFINITY;
  const index = name.indexOf(q);
  const exactBonus = name === q ? -100 : 0;
  const prefixBonus = index === 0 ? -50 : 0;
  const wordBonus = name.split(/\s+/).some((word) => word.startsWith(q)) ? -25 : 0;
  return exactBonus + prefixBonus + wordBonus + index * 10 + Math.abs(name.length - q.length);
}

export function ProductAutocomplete({ query, onPick, className }: ProductAutocompleteProps) {
  const q = query.trim();
  const matches = useMemo(() => {
    if (!q) return [];
    return BASE_PRODUCTS
      .map((product) => ({ product, score: scoreMatch(product, q) }))
      .filter(({ score }) => Number.isFinite(score))
      .sort((a, b) => a.score - b.score || a.product.name.localeCompare(b.product.name, "he"))
      .slice(0, 5)
      .map(({ product }) => product);
  }, [q]);

  const [aiSuggestion, setAiSuggestion] = useState<ProductSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiQueryRef = useRef("");

  useEffect(() => {
    if (!q || q.length < 2 || matches.length > 0) {
      setAiSuggestion(null);
      setAiLoading(false);
      return;
    }

    let cancelled = false;
    aiQueryRef.current = q;
    setAiLoading(true);
    setAiSuggestion(null);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("ai-product-search", { body: { query: q } });
        if (cancelled || aiQueryRef.current !== q) return;
        if (error) throw error;
        if (data?.error) {
          if (data.error.includes("קרדיטים") || data.error.includes("בקשות")) {
            toast.error(data.error);
          }
          return;
        }
        if (data?.name && data?.category && data?.unit) {
          setAiSuggestion(data as ProductSuggestion);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled && aiQueryRef.current === q) setAiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [q, matches.length]);

  if (matches.length === 0 && !aiSuggestion && !aiLoading) return null;

  return (
    <div className={className ?? "rounded-md border bg-popover shadow-sm overflow-hidden"} dir="rtl">
      {matches.map((product) => (
        <SuggestionButton key={product.name} product={product} onPick={onPick} />
      ))}
      {matches.length === 0 && aiLoading && (
        <div className="px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground text-right">
          <Loader2 className="size-4 animate-spin" />
          מחפש הצעה חכמה...
        </div>
      )}
      {matches.length === 0 && aiSuggestion && (
        <SuggestionButton product={aiSuggestion} onPick={onPick} ai />
      )}
    </div>
  );
}

function SuggestionButton({ product, onPick, ai = false }: { product: ProductSuggestion; onPick: (product: ProductSuggestion) => void; ai?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onPick(product)}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-accent text-right"
    >
      <span className="text-xs text-muted-foreground shrink-0">
        {product.default_quantity} {product.unit} · {product.category}
      </span>
      <span className="flex items-center gap-2 min-w-0">
        {ai && (
          <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
            <Sparkles className="size-3" />
            הצעת AI
          </span>
        )}
        <span className="font-medium truncate">{product.name}</span>
      </span>
    </button>
  );
}