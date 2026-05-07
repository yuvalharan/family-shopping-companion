import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bookmark, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { actions, useFamilyCart } from "@/lib/familycart-store";
import type { SavedList, ShoppingList } from "@/lib/familycart-data";

export function SavedListsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { savedLists, savedItems, lists } = useFamilyCart();
  const navigate = useNavigate();

  const [loadTarget, setLoadTarget] = useState<SavedList | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SavedList | null>(null);
  const [conflict, setConflict] = useState<{ saved: SavedList; existing: ShoppingList; name: string } | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    savedItems.forEach((i) => map.set(i.saved_list_id, (map.get(i.saved_list_id) ?? 0) + 1));
    return map;
  }, [savedItems]);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  };

  const openLoad = (t: SavedList) => {
    setNewName(t.name);
    setLoadTarget(t);
  };

  const close = () => {
    onOpenChange(false);
  };

  const goToList = (id: string) => {
    onOpenChange(false);
    setLoadTarget(null);
    setConflict(null);
    navigate({ to: "/shopping/$listId", params: { listId: id } });
  };

  const createList = async (savedId: string, name: string) => {
    setCreating(true);
    const list = await actions.loadSavedListAsActive(savedId, name);
    setCreating(false);
    if (list) goToList(list.id);
  };

  const handleLoad = async () => {
    if (!loadTarget) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    const existing = lists.find((l) => !l.is_completed && l.name === trimmed);
    if (existing) {
      setConflict({ saved: loadTarget, existing, name: trimmed });
      setLoadTarget(null);
      return;
    }
    await createList(loadTarget.id, trimmed);
    setLoadTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85dvh] flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">רשימות שמורות</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-3">
            {savedLists.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Bookmark className="size-7" />
                </div>
                <p className="text-muted-foreground text-sm">
                  אין רשימות שמורות. שמור רשימת קנייה פעילה כדי להשתמש בה שוב.
                </p>
              </div>
            ) : (
              savedLists.map((t) => {
                const count = counts.get(t.id) ?? 0;
                return (
                  <div key={t.id} className="bg-surface rounded-2xl shadow-soft p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{t.name}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {count} פריטים · {formatDate(t.created_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(t)}
                        aria-label="מחק רשימה שמורה"
                        className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <Button onClick={() => openLoad(t)} className="w-full rounded-xl">
                      טען רשימה
                    </Button>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="sm:justify-start">
            <Button variant="ghost" onClick={close}>סגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!loadTarget} onOpenChange={(v) => { if (!v) setLoadTarget(null); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">שם הרשימה החדשה</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLoad(); }}
          />
          <DialogFooter className="sm:justify-start gap-2">
            <Button onClick={handleLoad} disabled={!newName.trim() || creating}>
              צור רשימה
            </Button>
            <Button variant="ghost" onClick={() => setLoadTarget(null)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!conflict} onOpenChange={(v) => { if (!v) setConflict(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              רשימה בשם זה כבר קיימת — האם ליצור עותק או לפתוח את הקיימת?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              onClick={async () => {
                if (!conflict) return;
                const { saved, name } = conflict;
                setConflict(null);
                await createList(saved.id, `${name} (עותק)`);
              }}
            >
              צור עותק
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                if (!conflict) return;
                const id = conflict.existing.id;
                setConflict(null);
                goToList(id);
              }}
            >
              פתח קיימת
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => { if (!v) setConfirmDelete(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם למחוק את הרשימה השמורה?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) actions.deleteSavedList(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
