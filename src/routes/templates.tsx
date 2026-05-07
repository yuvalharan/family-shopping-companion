import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookmarkPlus, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/familycart/AppHeader";
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
import type { SavedList } from "@/lib/familycart-data";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "FamilyCart — תבניות" },
      { name: "description", content: "תבניות רשימות קנייה שמורות לשימוש חוזר." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { savedLists, savedItems, loading } = useFamilyCart();
  const navigate = useNavigate();

  const [loadDialog, setLoadDialog] = useState<SavedList | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SavedList | null>(null);

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
    setLoadDialog(t);
  };

  const handleLoad = async () => {
    if (!loadDialog || !newName.trim()) return;
    setCreating(true);
    const list = await actions.loadSavedListAsActive(loadDialog.id, newName);
    setCreating(false);
    if (list) {
      setLoadDialog(null);
      navigate({ to: "/shopping/$listId", params: { listId: list.id } });
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-6 pb-16 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground mt-12">טוען תבניות...</p>
        ) : savedLists.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <BookmarkPlus className="size-9" />
            </div>
            <h2 className="text-xl font-semibold mb-2">אין תבניות שמורות</h2>
            <p className="text-muted-foreground">
              שמור רשימת קנייה פעילה כדי ליצור תבנית לשימוש חוזר
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold">תבניות שמורות</h2>
            {savedLists.map((t) => {
              const count = counts.get(t.id) ?? 0;
              return (
                <div
                  key={t.id}
                  className="bg-surface rounded-2xl shadow-soft p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{t.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {count} פריטים · {formatDate(t.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(t)}
                      aria-label="מחק תבנית"
                      className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <Button
                    onClick={() => openLoad(t)}
                    className="w-full rounded-xl"
                  >
                    טען רשימה
                  </Button>
                </div>
              );
            })}
          </>
        )}
      </main>

      <Dialog open={!!loadDialog} onOpenChange={(v) => { if (!v) setLoadDialog(null); }}>
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
            <Button variant="ghost" onClick={() => setLoadDialog(null)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => { if (!v) setConfirmDelete(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם למחוק את התבנית?</AlertDialogTitle>
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
    </div>
  );
}
