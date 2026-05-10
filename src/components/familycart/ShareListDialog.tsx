import { useEffect, useState } from "react";
import { Copy, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Share = {
  id: string;
  share_code: string;
  expires_at: string | null;
  created_at: string;
};

type Expiry = "never" | "week" | "day";

function expiryToTimestamp(e: Expiry): string | null {
  if (e === "never") return null;
  const d = new Date();
  if (e === "week") d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function randomCode(len = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

export function ShareListDialog({
  open,
  onOpenChange,
  listId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listId: string;
}) {
  const [shares, setShares] = useState<Share[]>([]);
  const [expiry, setExpiry] = useState<Expiry>("never");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("list_shares")
      .select("id, share_code, expires_at, created_at")
      .eq("shopping_list_id", listId)
      .order("created_at", { ascending: false });
    setShares(data ?? []);
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listId]);

  const create = async () => {
    setCreating(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("list_shares").insert({
      shopping_list_id: listId,
      share_code: randomCode(),
      expires_at: expiryToTimestamp(expiry),
      created_by: u.user?.id,
    });
    setCreating(false);
    if (error) {
      toast.error("שגיאה ביצירת קישור");
      return;
    }
    void load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("list_shares").delete().eq("id", id);
    if (error) {
      toast.error("שגיאה בביטול הקישור");
      return;
    }
    void load();
  };

  const linkFor = (code: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${code}`;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(linkFor(code));
      toast.success("הקישור הועתק");
    } catch {
      toast.error("ההעתקה נכשלה");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            שיתוף הרשימה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-sm text-muted-foreground">תוקף הקישור</Label>
              <Select value={expiry} onValueChange={(v) => setExpiry(v as Expiry)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">ללא תפוגה</SelectItem>
                  <SelectItem value="week">שבוע</SelectItem>
                  <SelectItem value="day">יום</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={create} disabled={creating} className="rounded-xl h-10">
              צור קישור
            </Button>
          </div>

          <div className="space-y-2">
            {shares.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין קישורים פעילים
              </p>
            )}
            {shares.map((s) => {
              const expired = s.expires_at && new Date(s.expires_at) < new Date();
              return (
                <div
                  key={s.id}
                  className="rounded-xl border p-3 space-y-2 bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={linkFor(s.share_code)}
                      className="text-xs h-9 ltr"
                      dir="ltr"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-xl size-9 shrink-0"
                      onClick={() => copy(s.share_code)}
                      aria-label="העתק"
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-xl size-9 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => revoke(s.id)}
                      aria-label="בטל"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {expired
                      ? "פג תוקף"
                      : s.expires_at
                        ? `בתוקף עד ${new Date(s.expires_at).toLocaleDateString("he-IL")}`
                        : "ללא תפוגה"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
