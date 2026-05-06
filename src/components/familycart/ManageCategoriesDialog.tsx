import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { actions, useFamilyCart } from "@/lib/familycart-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ManageCategoriesDialog({ open, onOpenChange }: Props) {
  const { categories } = useFamilyCart();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string | null>(null);

  const startEdit = (name: string) => {
    setEditing(name);
    setEditValue(name);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const result = await actions.renameCategory(editing, editValue);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    setEditing(null);
    setEditError(null);
  };

  const handleAdd = async () => {
    const result = await actions.addCategory(newName);
    if (!result.ok) {
      setNewError(result.error);
      return;
    }
    setAdding(false);
    setNewName("");
    setNewError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">ניהול קטגוריות</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {categories.map((c) => {
            const isEditing = editing === c;
            const isConfirming = confirmDelete === c;
            const isProtected = false;
            return (
              <div key={c} className="bg-surface rounded-xl p-3 flex items-center gap-2">
                {isEditing ? (
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => { setEditValue(e.target.value); setEditError(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditing(null);
                        }}
                        autoFocus
                        className="h-9"
                      />
                      <Button size="sm" onClick={saveEdit} className="h-9 px-2">
                        <Check className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)} className="h-9 px-2">
                        <X className="size-4" />
                      </Button>
                    </div>
                    {editError && <p className="text-sm text-destructive">{editError}</p>}
                  </div>
                ) : isConfirming ? (
                  <>
                    <span className="flex-1 text-sm">האם למחוק את הקטגוריה?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => { await actions.deleteCategory(c); setConfirmDelete(null); }}
                    >
                      מחק
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                      ביטול
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{c}</span>
                    <button
                      onClick={() => startEdit(c)}
                      className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
                      aria-label="ערוך קטגוריה"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(c)}
                      disabled={isProtected}
                      className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      aria-label="מחק קטגוריה"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t pt-3">
          {adding ? (
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setNewError(null); }}
                  placeholder="שם קטגוריה חדשה"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") { setAdding(false); setNewName(""); setNewError(null); }
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
                  הוסף
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewName(""); setNewError(null); }}>
                  ביטול
                </Button>
              </div>
              {newError && <p className="text-sm text-destructive">{newError}</p>}
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="size-4 ms-1" />
              הוסף קטגוריה
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
