import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ShoppingCart, ChevronDown, Trash2 } from "lucide-react";
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
import { actions, useFamilyCart } from "@/lib/familycart-store";

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
  const { lists, items, loading } = useFamilyCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const active = useMemo(() => lists.filter((l) => !l.is_completed), [lists]);

  const stats = (listId: string) => {
    const it = items.filter((i) => i.shopping_list_id === listId);
    return { total: it.length, checked: it.filter((i) => i.is_checked).length };
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
      <main className="mx-auto max-w-xl px-4 py-6 pb-32 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground mt-12">טוען רשימות...</p>
        ) : active.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ShoppingCart className="size-9" />
            </div>
            <h2 className="text-xl font-semibold mb-2">אין עדיין רשימות קנייה</h2>
            <p className="text-muted-foreground">צרו רשימה ראשונה כדי להתחיל.</p>
          </div>
        ) : (
          active.map((list) => {
            const s = stats(list.id);
            return (
              <Link
                key={list.id}
                to="/shopping/$listId"
                params={{ listId: list.id }}
                className="block bg-surface rounded-2xl shadow-soft p-4 hover:shadow-lift transition-shadow"
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
            );
          })
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
    </div>
  );
}
