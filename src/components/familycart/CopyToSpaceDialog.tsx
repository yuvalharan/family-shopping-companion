import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actions, useFamilyCart } from "@/lib/familycart-store";
import { CATEGORIES, type Unit } from "@/lib/familycart-data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CopyToSpaceDialog({ open, onOpenChange }: Props) {
  const { products, spaces, allProducts, activeSpace } = useFamilyCart();
  const sharedSpaces = useMemo(
    () => spaces.filter((s) => !s.is_personal && s.id !== activeSpace?.id),
    [spaces, activeSpace?.id],
  );

  const [targetId, setTargetId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(products.map((p) => p.id)));
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(new Set(products.map((p) => p.id)));
      setTargetId(sharedSpaces[0]?.id ?? "");
      // open all categories by default
      const cats = new Set<string>();
      products.forEach((p) => cats.add(p.category));
      setOpenCats(cats);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const p of products) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    const cats = [...new Set([...CATEGORIES, ...Array.from(map.keys())])];
    return cats.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
  }, [products]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
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
  const selectAllCat = (cat: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      products.filter((p) => p.category === cat).forEach((p) => n.add(p.id));
      return n;
    });
  };
  const clearAllCat = (cat: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      products.filter((p) => p.category === cat).forEach((p) => n.delete(p.id));
      return n;
    });
  };

  const handleCopy = async () => {
    if (!targetId) { toast.error("בחר חלל יעד"); return; }
    const existingNames = new Set(
      allProducts
        .filter((p) => p.space_id === targetId)
        .map((p) => p.name.trim().toLowerCase()),
    );
    const toAdd = products
      .filter((p) => selected.has(p.id) && !existingNames.has(p.name.trim().toLowerCase()))
      .map((p) => ({
        name: p.name,
        category: p.category,
        default_quantity: p.default_quantity,
        unit: p.unit as Unit,
      }));
    if (toAdd.length === 0) {
      toast.info("אין מוצרים להעתקה");
      return;
    }
    setBusy(true);
    const count = await actions.addProductsBulk(toAdd, targetId);
    setBusy(false);
    if (count > 0) {
      toast.success(`${count} מוצרים הועתקו בהצלחה`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-right">העתק לחלל משותף</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">חלל יעד</label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="בחר חלל משותף" />
            </SelectTrigger>
            <SelectContent>
              {sharedSpaces.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2">
          {grouped.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">אין מוצרים ברשימה</p>
          )}
          {grouped.map(([cat, items]) => {
            const isOpen = openCats.has(cat);
            return (
              <div key={cat} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/50 hover:bg-muted text-right"
                >
                  <ChevronDown className={`size-4 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  <span className="font-semibold">{cat} ({items.length})</span>
                </button>
                {isOpen && (
                  <div className="p-2 space-y-1">
                    <div className="flex gap-2 px-1 pb-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => selectAllCat(cat)}>
                        בחר הכל
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => clearAllCat(cat)}>
                        בטל הכל
                      </Button>
                    </div>
                    {items.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={selected.has(p.id)}
                          onCheckedChange={() => toggle(p.id)}
                        />
                        <span className="text-sm flex-1">{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.default_quantity} {p.unit}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t pt-3 flex gap-2">
          <Button onClick={handleCopy} disabled={busy || !targetId || selected.size === 0} className="flex-1">
            העתק נבחרים {selected.size > 0 && `(${selected.size})`}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
