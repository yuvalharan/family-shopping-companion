import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ShoppingCart, ChevronDown, Trash2 } from "lucide-react";
import { formatQuantity } from "@/lib/units";
import { AppHeader } from "@/components/familycart/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { ShoppingList } from "@/lib/familycart-data";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "FamilyCart — רשימות קנייה" },
      { name: "description", content: "ניהול רשימות הקנייה הפעילות והארכיון." },
      { property: "og:title", content: "FamilyCart — רשימות קנייה" },
      { property: "og:description", content: "כל רשימות הקנייה במקום אחד." },
    ],
  }),
  component: ShoppingListsPage,
});

function ShoppingListsPage() {
  const { lists, items, products, loading } = useFamilyCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ list: ShoppingList; isHistory: boolean } | null>(null);

  const active = useMemo(() => lists.filter((l) => !l.is_completed), [lists]);
  const history = useMemo(
    () =>
      lists
        .filter((l) => l.is_completed)
        .sort((a, b) => {
          const da = new Date(a.completed_at ?? a.created_at ?? 0).getTime();
          const db = new Date(b.completed_at ?? b.created_at ?? 0).getTime();
          return db - da;
        }),
    [lists],
  );

  const stats = (listId: string) => {
    const it = items.filter((i) => i.shopping_list_id === listId);
    return { total: it.length, checked: it.filter((i) => i.is_checked).length };
  };

  const productInfo = (id: string) => {
    const p = products.find((p) => p.id === id);
    return { name: p?.name ?? "פריט", unit: p?.unit ?? "" };
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "";
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  };

  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const list = await actions.createShoppingList(name);
    setCreating(false);
    if (list) {
      setOpen(false);
      setName("");
      navigate({ to: "/shopping/$listId", params: { listId: list.id } });
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-6 pb-32 space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground mt-12">טוען רשימות...</p>
        ) : (
          <>
            {active.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <ShoppingCart className="size-9" />
                </div>
                <h2 className="text-xl font-semibold mb-2">אין רשימות פעילות</h2>
                <p className="text-muted-foreground mb-6">צור רשימה חדשה</p>
                <Button onClick={() => setOpen(true)} size="lg" className="rounded-2xl">
                  <Plus className="size-5 ms-1" />
                  צור רשימה
                </Button>
              </div>
            ) : (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">רשימות פעילות</h2>
                {active.map((list) => {
                  const s = stats(list.id);
                  return (
                    <div
                      key={list.id}
                      className="bg-surface rounded-2xl shadow-soft hover:shadow-lift transition-shadow flex items-center gap-2 pe-2"
                    >
                      <Link
                        to="/shopping/$listId"
                        params={{ listId: list.id }}
                        className="flex-1 p-4 min-w-0"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-base truncate">{list.name}</div>
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {s.total} פריטים · {s.checked} בעגלה
                            </div>
                          </div>
                          <div className="text-primary text-sm font-medium shrink-0">פתח</div>
                        </div>
                      </Link>
                      <button
                        onClick={() => setConfirmDelete({ list, isHistory: false })}
                        aria-label="מחק רשימה"
                        className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            {history.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">היסטוריה</h2>
                {history.map((list) => {
                  const listItems = items.filter((i) => i.shopping_list_id === list.id);
                  const isOpen = expandedHistory.has(list.id);
                  return (
                    <div key={list.id} className="bg-muted/60 border border-border rounded-2xl shadow-soft overflow-hidden">
                      <div className="flex items-center gap-2 p-4">
                        <button
                          onClick={() => toggleHistory(list.id)}
                          className="flex-1 flex items-center justify-between gap-3 text-right"
                          aria-expanded={isOpen}
                        >
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{list.name}</div>
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {formatDate(list.completed_at ?? list.created_at)} · {listItems.length} פריטים
                            </div>
                          </div>
                          <ChevronDown
                            className={
                              "size-5 text-muted-foreground transition-transform " +
                              (isOpen ? "" : "-rotate-90")
                            }
                          />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ list, isHistory: true })}
                          aria-label="מחק מהיסטוריה"
                          className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="border-t border-border px-4 py-3 space-y-1.5">
                          {listItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground">אין פריטים ברשימה זו.</p>
                          ) : (
                            listItems.map((it) => {
                              const info = productInfo(it.product_id);
                              return (
                                <div key={it.id} className="text-sm flex justify-between">
                                  <span>{info.name}</span>
                                  <span className="text-muted-foreground">
                                    {(() => { const d = formatQuantity(it.quantity_needed, info.unit); return `${d.value} ${d.unit}`; })()}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-5 inset-x-4 mx-auto max-w-lg z-30 h-14 rounded-2xl text-base font-semibold shadow-lift"
          >
            <Plus className="size-5 ms-1" />
            רשימה חדשה
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">רשימת קנייה חדשה</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: שופרסל שישי"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <DialogFooter className="sm:justify-start gap-2">
            <Button onClick={handleCreate} disabled={!name.trim() || creating}>
              צור רשימה
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => { if (!v) setConfirmDelete(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              {confirmDelete?.isHistory
                ? "האם למחוק מהיסטוריה?"
                : `האם למחוק את הרשימה ${confirmDelete?.list.name}?`}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) actions.deleteShoppingList(confirmDelete.list.id);
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
