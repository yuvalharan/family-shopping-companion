import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { UNITS, type Unit, type Product } from "@/lib/familycart-data";
import { actions, useFamilyCart } from "@/lib/familycart-store";


const ADD_NEW_SENTINEL = "__add_new__";

type Props = {
  product?: Product;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  prefill?: { name: string; category: string; default_quantity: number; unit: Unit };
};

export function AddProductDialog({ product, open: controlledOpen, onOpenChange, prefill }: Props) {
  const { categories } = useFamilyCart();
  const isEdit = !!product;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setInternalOpen(v);
  };

  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<Unit>("יחידות");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatError, setNewCatError] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const newCatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setQty(product.default_quantity);
      setUnit(product.unit);
    } else if (prefill) {
      setName(prefill.name);
      setCategory(prefill.category);
      setQty(prefill.default_quantity);
      setUnit(prefill.unit);
    } else {
      setName("");
      setCategory(categories[0] ?? "");
      setQty(1);
      setUnit("יחידות");
    }
    setAddingCategory(false);
    setNewCatName("");
  }, [open]);


  const handleCategoryChange = (v: string) => {
    if (v === ADD_NEW_SENTINEL) {
      setAddingCategory(true);
      setNewCatName("");
      setTimeout(() => newCatInputRef.current?.focus(), 0);
    } else {
      setCategory(v);
      setAddingCategory(false);
    }
  };

  const confirmNewCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    setSavingCat(true);
    setNewCatError(null);
    const result = await actions.addCategory(trimmed);
    setSavingCat(false);
    if (!result.ok) {
      setNewCatError(result.error);
      return;
    }
    setCategory(result.name);
    setAddingCategory(false);
    setNewCatName("");
  };

  const submit = () => {
    if (!name.trim()) return;
    const safeQty = qty > 0 ? qty : 1;
    if (isEdit && product) {
      actions.updateProduct(product.id, { name: name.trim(), category, default_quantity: safeQty, unit });
    } else {
      actions.addProduct({ name: name.trim(), category, default_quantity: safeQty, unit });
    }
    handleOpenChange(false);
  };

  const content = (
    <DialogContent className="max-w-md" dir="rtl">
      <DialogHeader>
        <DialogTitle className="text-right">
          {isEdit ? "עריכת מוצר" : "הוספת מוצר לרשימה הראשית"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prod-name">שם המוצר</Label>
          <ProductNameField
            value={name}
            onChange={setName}
            disabled={isEdit}
            onPick={(bp) => {
              setName(bp.name);
              setCategory(bp.category);
              setQty(bp.default_quantity);
              setUnit(bp.unit);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>קטגוריה</Label>
          <Select value={addingCategory ? "" : category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder={addingCategory ? "קטגוריה חדשה..." : undefined} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
              <SelectItem value={ADD_NEW_SENTINEL} className="text-primary font-medium border-t mt-1 pt-2">
                + הוסף קטגוריה חדשה...
              </SelectItem>
            </SelectContent>
          </Select>
          {addingCategory && (
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  ref={newCatInputRef}
                  value={newCatName}
                  onChange={(e) => { setNewCatName(e.target.value); setNewCatError(null); }}
                  placeholder="שם קטגוריה חדשה"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmNewCategory();
                    if (e.key === "Escape") setAddingCategory(false);
                  }}
                />
                <Button size="sm" onClick={confirmNewCategory} disabled={!newCatName.trim() || savingCat}>
                  שמור
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingCategory(false)}>
                  ביטול
                </Button>
              </div>
              {newCatError && <p className="text-sm text-destructive">{newCatError}</p>}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="prod-qty">כמות</Label>
            <Input
              id="prod-qty"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              value={qty}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                setQty(Number.isFinite(n) && n > 0 ? n : 0);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>יחידה</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter className="sm:justify-start gap-2">
        <Button onClick={submit} disabled={!name.trim()}>
          {isEdit ? "שמור שינויים" : "הוסף"}
        </Button>
        <Button variant="ghost" onClick={() => handleOpenChange(false)}>ביטול</Button>
      </DialogFooter>
    </DialogContent>
  );

  if (isEdit || controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-5 inset-x-4 mx-auto max-w-lg z-30 h-14 rounded-2xl text-base font-semibold shadow-lift"
        >
          <Plus className="size-5 ms-1" />
          הוסף מוצר חדש
        </Button>
      </DialogTrigger>
      {content}
    </Dialog>
  );
}

function ProductNameField({
  value,
  onChange,
  onPick,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (bp: BaseProduct) => void;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<BaseProduct | null>(null);
  const [aiQuery, setAiQuery] = useState<string>("");
  const trimmed = value.trim();

  const matches = useMemo(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    return BASE_PRODUCTS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [trimmed]);

  useEffect(() => {
    if (!focused || disabled) return;
    if (!trimmed || trimmed.length < 2) {
      setAiSuggestion(null);
      return;
    }
    if (matches.length > 0) {
      setAiSuggestion(null);
      return;
    }
    if (aiSuggestion && aiQuery === trimmed) return;

    const handle = setTimeout(async () => {
      setAiLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-product-search", {
          body: { query: trimmed },
        });
        if (error) throw error;
        if (data?.error) {
          if (data.error.includes("קרדיטים") || data.error.includes("בקשות")) {
            toast.error(data.error);
          }
          return;
        }
        if (data?.name && data?.category && data?.unit) {
          setAiSuggestion(data as BaseProduct);
          setAiQuery(trimmed);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAiLoading(false);
      }
    }, 0);
    return () => clearTimeout(handle);
  }, [trimmed, matches.length, focused, disabled, aiSuggestion, aiQuery]);

  const showDropdown = !disabled && focused && trimmed.length > 0 &&
    (matches.length > 0 || aiLoading || aiSuggestion);

  return (
    <div className="relative">
      <Input
        id="prod-name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="לדוגמה: לחם פרוס"
        disabled={disabled}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          <ul className="max-h-56 overflow-y-auto">
            {matches.map((p) => (
              <li key={`${p.name}-${p.category}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPick(p)}
                  className="w-full text-right px-3 py-2 hover:bg-muted flex items-center justify-between gap-2"
                >
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.category} · {p.default_quantity} {p.unit}
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 && aiLoading && (
              <li className="px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                מחפש הצעה חכמה...
              </li>
            )}
            {matches.length === 0 && !aiLoading && aiSuggestion && (
              <li className="px-3 py-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onPick(aiSuggestion); setAiSuggestion(null); }}
                >
                  + הוסף
                </Button>
                <div className="flex flex-col items-end gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{aiSuggestion.name}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                      <Sparkles className="size-3" />
                      הצעת AI
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {aiSuggestion.category} · {aiSuggestion.default_quantity} {aiSuggestion.unit}
                  </span>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

