import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BASE_PRODUCTS } from "@/lib/base-products";
import { actions, useFamilyCart } from "@/lib/familycart-store";
import { CATEGORIES } from "@/lib/familycart-data";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful import (with count). */
  onImported?: (count: number) => void;
  /** Title override for first-time setup vs import flow. */
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
};

export function ImportProductsDialog({
  open,
  onOpenChange,
  onImported,
  title = "ייבא מוצרים נפוצים",
  subtitle = "בחר את המוצרים שאתה קונה בדרך כלל",
  ctaLabel = "ייבא מוצרים נבחרים",
}: Props) {
  const { products } = useFamilyCart();
  const existingKeys = useMemo(
    () => new Set(products.map((p) => `${p.name}|${p.category}`)),
    [products],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof BASE_PRODUCTS>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const p of BASE_PRODUCTS) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, []);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(grouped.map(([c]) => c)));
  const [busy, setBusy] = useState(false);

  const keyOf = (p: { name: string; category: string }) => `${p.name}|${p.category}`;

  const toggle = (k: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat); else n.add(cat);
      return n;
    });
  };

  const selectAll = (cat: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const p of BASE_PRODUCTS.filter((b) => b.category === cat)) {
        if (!existingKeys.has(keyOf(p))) n.add(keyOf(p));
      }
      return n;
    });
  };

  const clearAll = (cat: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const p of BASE_PRODUCTS.filter((b) => b.category === cat)) n.delete(keyOf(p));
      return n;
    });
  };

  const handleImport = async () => {
    const toAdd = BASE_PRODUCTS.filter((p) => selected.has(keyOf(p)) && !existingKeys.has(keyOf(p)));
    if (toAdd.length === 0) {
      toast.info("לא נבחרו מוצרים");
      return;
    }
    setBusy(true);
    const count = await actions.addProductsBulk(toAdd);
    setBusy(false);
    if (count > 0) {
      toast.success(`${count} מוצרים נוספו לרשימה`);
      setSelected(new Set());
      onImported?.(count);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-right">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground text-right">{subtitle}</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {grouped.map(([cat, items]) => {
            const isOpen = openCats.has(cat);
            return (
              <div key={cat} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 hover:bg-muted text-right"
                >
                  <ChevronDown className={`size-4 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  <span className="font-semibold">{cat}</span>
                </button>
                {isOpen && (
                  <div className="p-2 space-y-1">
                    <div className="flex gap-2 px-1 pb-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => selectAll(cat)}>
                        בחר הכל
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => clearAll(cat)}>
                        בטל הכל
                      </Button>
                    </div>
                    {items.map((p) => {
                      const k = keyOf(p);
                      const exists = existingKeys.has(k);
                      const checked = exists || selected.has(k);
                      return (
                        <label
                          key={k}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${exists ? "opacity-50" : "hover:bg-muted cursor-pointer"}`}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={exists}
                            onCheckedChange={() => !exists && toggle(k)}
                          />
                          <span className="text-sm flex-1">{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.default_quantity} {p.unit}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t pt-3 flex gap-2">
          <Button onClick={handleImport} disabled={busy || selected.size === 0} className="flex-1">
            {ctaLabel} {selected.size > 0 && `(${selected.size})`}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
