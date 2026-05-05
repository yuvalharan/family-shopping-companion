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
};

export function AddProductDialog({ product, open: controlledOpen, onOpenChange }: Props) {
  const { categories } = useFamilyCart();
  const isEdit = !!product;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setInternalOpen(v);
  };

  const [name, setName] = useState("");
  const [category, setCategory] = useState("אחר");
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
    } else {
      setName("");
      setCategory("אחר");
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
    if (isEdit && product) {
      actions.updateProduct(product.id, { name: name.trim(), category, default_quantity: qty, unit });
    } else {
      actions.addProduct({ name: name.trim(), category, default_quantity: qty, unit });
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
          <Input
            id="prod-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: לחם פרוס"
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
