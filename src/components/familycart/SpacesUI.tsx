import { useEffect, useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Check, ChevronDown, Copy, Plus, Settings, User, Users, UserPlus, Trash2, LogOut, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ManageCategoriesDialog } from "@/components/familycart/ManageCategoriesDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { actions, useFamilyCart } from "@/lib/familycart-store";
import { spaceColorFor, type SharedSpace } from "@/lib/familycart-data";
import { useAuth } from "@/lib/auth";

export function SpaceBadge({ space }: { space: SharedSpace }) {
  const c = spaceColorFor(space);
  const label = space.is_personal ? "אישי" : space.name;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {space.is_personal ? <User className="size-3" /> : <span className={`size-2 rounded-full ${c.dot}`} />}
      {label}
    </span>
  );
}

export function SpaceSwitcher() {
  const { spaces, activeSpace } = useFamilyCart();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState<SharedSpace | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  if (!activeSpace) return null;
  const c = spaceColorFor(activeSpace);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text} hover:opacity-90 transition`}>
            {activeSpace.is_personal ? <User className="size-3.5" /> : <span className={`size-2 rounded-full ${c.dot}`} />}
            {activeSpace.is_personal ? "אישי" : activeSpace.name}
            <ChevronDown className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" dir="rtl" className="w-64 p-2">
          <div className="text-xs text-muted-foreground px-2 py-1">המרחבים שלי</div>
          {spaces.map((s) => {
            const sc = spaceColorFor(s);
            const isActive = s.id === activeSpace.id;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => { actions.setActiveSpace(s.id); setOpen(false); }}
                  className="flex-1 flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted text-right text-sm"
                >
                  {s.is_personal ? <User className="size-4 text-muted-foreground" /> : <span className={`size-2.5 rounded-full ${sc.dot}`} />}
                  <span className="flex-1 truncate">{s.is_personal ? "אישי" : s.name}</span>
                  {isActive && <Check className="size-4 text-primary" />}
                </button>
                <button
                  onClick={() => { setSettingsOpen(s); setOpen(false); }}
                  aria-label="הגדרות"
                  className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
                >
                  <Settings className="size-3.5" />
                </button>
              </div>
            );
          })}
          <div className="border-t mt-2 pt-2">
            <button
              onClick={() => { setCreateOpen(true); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted text-right text-sm text-primary"
            >
              <UserPlus className="size-4" />
              צור מרחב חדש והזמן
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <CreateSpaceDialog open={createOpen} onOpenChange={setCreateOpen} />
      {settingsOpen && (
        <SpaceSettingsDialog
          space={settingsOpen}
          open={true}
          onOpenChange={(v) => { if (!v) setSettingsOpen(null); }}
        />
      )}
    </>
  );
}

export function SettingsPanelButton() {
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [spaceSettings, setSpaceSettings] = useState<SharedSpace | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { spaces } = useFamilyCart();
  const navigate = useNavigate();

  const onLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/login" });
  };

  const onDeleteAccount = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDeleting(true);
    const ok = await actions.deleteAccount();
    if (ok) {
      navigate({ to: "/login" });
    } else {
      setDeleting(false);
      setDeleteAccountOpen(false);
      toast.error("שגיאה במחיקת החשבון");
    }
  };

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label="הגדרות">
        <Settings className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">הגדרות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button className="w-full" onClick={() => { setInviteOpen(true); setOpen(false); }}>
              <UserPlus className="size-4 ml-1" /> הזמן משתתפים
            </Button>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Users className="size-4" /> נהל מרחבים</Label>
              <div className="space-y-1 border rounded-lg p-2">
                {spaces.map((s) => {
                  const sc = spaceColorFor(s);
                  return (
                    <div key={s.id} className="flex items-center gap-1">
                      <div className="flex-1 flex items-center gap-2 px-2 py-2 text-sm">
                        {s.is_personal ? <User className="size-4 text-muted-foreground" /> : <span className={`size-2.5 rounded-full ${sc.dot}`} />}
                        <span className="flex-1 truncate">{s.is_personal ? "אישי" : s.name}</span>
                      </div>
                      <button
                        onClick={() => { setSpaceSettings(s); setOpen(false); }}
                        aria-label="הגדרות מרחב"
                        className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
                      >
                        <Settings className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setCategoriesOpen(true); setOpen(false); }}>
              <Tags className="size-4 ml-1" /> נהל קטגוריות
            </Button>
            <Button variant="outline" className="w-full" onClick={onLogout}>
              <LogOut className="size-4 ml-1" /> התנתק
            </Button>
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => { setDeleteAccountOpen(true); setOpen(false); }}
            >
              <Trash2 className="size-4 ml-1" /> מחק חשבון
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת חשבון</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם אתה בטוח? פעולה זו תמחק את כל הנתונים שלך לצמיתות
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={onDeleteAccount}
            >
              {deleting ? "מוחק..." : "מחק לצמיתות"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting}>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CreateSpaceDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ManageCategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      {spaceSettings && (
        <SpaceSettingsDialog
          space={spaceSettings}
          open={true}
          onOpenChange={(v) => { if (!v) setSpaceSettings(null); }}
        />
      )}
    </>
  );
}

function CreateSpaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { spaces } = useFamilyCart();
  const personal = spaces.find((s) => s.is_personal);
  const [step, setStep] = useState<"name" | "copy" | "done">("name");
  const [name, setName] = useState("");
  const [copyProducts, setCopyProducts] = useState(true);
  const [copyActive, setCopyActive] = useState(false);
  const [copySaved, setCopySaved] = useState(false);
  const [created, setCreated] = useState<SharedSpace | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("name"); setName(""); setCopyProducts(true); setCopyActive(false);
      setCopySaved(false); setCreated(null); setInviteUrl(null);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const space = await actions.createSpace(name);
    if (space) {
      if (personal && (copyProducts || copyActive || copySaved)) {
        await actions.copyDataBetweenSpaces(personal.id, space.id, {
          products: copyProducts, activeLists: copyActive, savedLists: copySaved,
        });
      }
      setCreated(space);
      const invite = await actions.createInvite(space.id);
      if (invite) setInviteUrl(`${window.location.origin}/?invite=${invite.invite_code}`);
      setStep("done");
    }
    setBusy(false);
  };

  const copy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("הקישור הועתק");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">
            {step === "done" ? "המרחב נוצר!" : step === "copy" ? "שכפול נתונים" : "מרחב משותף חדש"}
          </DialogTitle>
        </DialogHeader>
        {step === "done" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">שתף את הקישור הבא — תקף 7 ימים</p>
            <div className="flex gap-2">
              <Input value={inviteUrl ?? ""} readOnly className="text-xs" />
              <Button size="icon" onClick={copy}><Copy className="size-4" /></Button>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>סיום</Button>
          </div>
        ) : step === "copy" ? (
          <>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">האם לשכפל נתונים מהמרחב האישי?</p>
              <ToggleRow label="רשימה ראשית (מוצרים וקטגוריות)" checked={copyProducts} onChange={setCopyProducts} />
              <ToggleRow label="רשימות קנייה פעילות" checked={copyActive} onChange={setCopyActive} />
              <ToggleRow label="רשימות שמורות" checked={copySaved} onChange={setCopySaved} />
            </div>
            <DialogFooter className="sm:justify-start gap-2">
              <Button onClick={submit} disabled={busy}>צור מרחב</Button>
              <Button variant="ghost" onClick={() => setStep("name")}>חזרה</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>שם המרחב</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: משפחת כהן" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) setStep("copy"); }} />
            </div>
            <DialogFooter className="sm:justify-start gap-2">
              <Button onClick={() => setStep("copy")} disabled={!name.trim()}>הבא</Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function SpaceSettingsDialog({ space, open, onOpenChange }: { space: SharedSpace; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const { invites } = useFamilyCart();
  const [name, setName] = useState(space.name);
  const [members, setMembers] = useState<Array<{ user_id: string; email: string; is_owner: boolean }>>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const isOwner = !!user && user.id === space.owner_id;

  const activeInvite = useMemo(() => {
    return invites.filter((i) => i.space_id === space.id && new Date(i.expires_at) > new Date())[0] ?? null;
  }, [invites, space.id]);

  useEffect(() => {
    if (open) actions.getSpaceMembers(space.id).then(setMembers);
  }, [open, space.id]);

  const inviteUrl = activeInvite ? `${window.location.origin}/?invite=${activeInvite.invite_code}` : null;

  const copy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("הקישור הועתק");
  };

  const generate = async () => {
    const inv = await actions.createInvite(space.id);
    if (inv) toast.success("נוצר קישור חדש");
  };

  const formatExp = (iso: string) => new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" }).format(new Date(iso));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl" className="max-w-md max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">הגדרות מרחב</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם</Label>
              {space.is_personal ? (
                <Input value="אישי" readOnly disabled />
              ) : (
                <div className="flex gap-2">
                  <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} />
                  {isOwner && (
                    <Button onClick={() => actions.renameSpace(space.id, name)} disabled={!name.trim() || name === space.name}>שמור</Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Users className="size-4" /> משתתפים ({members.length})</Label>
              <div className="space-y-1 border rounded-lg p-2">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between text-sm py-1">
                    <span className="truncate">{m.email}</span>
                    {m.is_owner && <span className="text-xs text-muted-foreground">בעלים</span>}
                  </div>
                ))}
                {members.length === 0 && <div className="text-xs text-muted-foreground py-1">טוען...</div>}
              </div>
            </div>

            {!space.is_personal && (
              <div className="space-y-2">
                <Label>קישור הזמנה</Label>
                {inviteUrl ? (
                  <>
                    <div className="flex gap-2">
                      <Input value={inviteUrl} readOnly className="text-xs" />
                      <Button size="icon" onClick={copy}><Copy className="size-4" /></Button>
                    </div>
                    {(() => {
                      const exp = new Date(activeInvite!.expires_at);
                      const hoursLeft = (exp.getTime() - Date.now()) / 36e5;
                      const urgent = hoursLeft < 24;
                      return (
                        <p className={"text-xs " + (urgent ? "text-destructive font-medium" : "text-muted-foreground")}>
                          פג תוקף ב: {formatExp(activeInvite!.expires_at)}
                        </p>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">אין קישור פעיל</p>
                )}
                <Button variant="outline" size="sm" onClick={generate} className="w-full">
                  צור קישור חדש
                </Button>
              </div>
            )}

            {!space.is_personal && (
              <ImportFromPersonalSection targetSpaceId={space.id} />
            )}

            {!space.is_personal && (
              <div className="border-t pt-3 space-y-2">
                {isOwner ? (
                  <Button variant="destructive" className="w-full" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="size-4 ml-1" /> מחק מרחב
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setConfirmLeave(true)}>
                    <LogOut className="size-4 ml-1" /> צא מהמרחב
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">למחוק את המרחב?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              כל הנתונים במרחב יימחקו. לא ניתן לבטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { await actions.deleteSpace(space.id); onOpenChange(false); }}
            >מחק</AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">לצאת מהמרחב?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start gap-2">
            <AlertDialogAction
              onClick={async () => { await actions.leaveSpace(space.id); onOpenChange(false); }}
            >צא</AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function JoinInviteHandler() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouterState();
  const search = router.location.search as unknown;
  const [code, setCode] = useState<string | null>(null);
  const [info, setInfo] = useState<{ space_id: string; space_name: string; expires_at: string; already_member: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c: string | null = null;
    if (typeof search === "string") {
      const s = search.startsWith("?") ? search.slice(1) : search;
      c = new URLSearchParams(s).get("invite");
    } else if (search && typeof search === "object") {
      const v = (search as Record<string, unknown>).invite;
      if (typeof v === "string") c = v;
    }
    if (c) setCode(c);
  }, [search]);

  useEffect(() => {
    if (code) actions.getInviteInfo(code).then(setInfo);
  }, [code]);

  const close = () => {
    setCode(null); setInfo(null); setError(null);
    try { window.history.replaceState({}, "", window.location.pathname); } catch { /* ignore */ }
  };

  const join = async () => {
    if (!code) return;
    if (!user) {
      // remember code & go to login
      try { sessionStorage.setItem("pending-invite", code); } catch { /* ignore */ }
      navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    const res = await actions.acceptInvite(code);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    actions.setActiveSpace(res.spaceId);
    toast.success("הצטרפת למרחב!");
    close();
  };

  // After login, auto-pick up pending invite
  useEffect(() => {
    if (!user) return;
    try {
      const pending = sessionStorage.getItem("pending-invite");
      if (pending && !code) { sessionStorage.removeItem("pending-invite"); setCode(pending); }
    } catch { /* ignore */ }
  }, [user, code]);

  if (!code) return null;

  return (
    <Dialog open={true} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">הזמנה למרחב משותף</DialogTitle>
        </DialogHeader>
        {!info ? (
          <p className="text-sm text-muted-foreground">טוען...</p>
        ) : info.already_member ? (
          <div className="space-y-3">
            <p>אתה כבר חבר ב-{info.space_name}</p>
            <Button className="w-full" onClick={() => { actions.setActiveSpace(info.space_id); close(); }}>פתח</Button>
          </div>
        ) : new Date(info.expires_at) < new Date() ? (
          <div className="space-y-3">
            <p className="text-destructive">ההזמנה פגה</p>
            <Button className="w-full" variant="outline" onClick={close}>סגור</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p>הוזמנת להצטרף ל-<strong>{info.space_name}</strong></p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={join} disabled={busy}>
              <Plus className="size-4 ml-1" />
              {user ? `הצטרף ל${info.space_name}` : "התחבר והצטרף"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={close}>אולי אחר כך</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImportFromPersonalSection({ targetSpaceId }: { targetSpaceId: string }) {
  const { spaces } = useFamilyCart();
  const personal = spaces.find((s) => s.is_personal);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState(true);
  const [activeLists, setActiveLists] = useState(false);
  const [savedLists, setSavedLists] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!personal) return null;

  const submit = async () => {
    if (!products && !activeLists && !savedLists) return;
    setBusy(true);
    const ok = await actions.copyDataBetweenSpaces(personal.id, targetSpaceId, { products, activeLists, savedLists });
    setBusy(false);
    if (ok) { toast.success("הנתונים יובאו בהצלחה"); setOpen(false); }
  };

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Download className="size-4 ml-1" /> ייבא מהמרחב האישי
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">ייבוא מהמרחב האישי</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <CheckRow label="רשימה ראשית (מוצרים וקטגוריות)" checked={products} onChange={setProducts} />
            <CheckRow label="רשימות קנייה פעילות" checked={activeLists} onChange={setActiveLists} />
            <CheckRow label="רשימות שמורות" checked={savedLists} onChange={setSavedLists} />
          </div>
          <DialogFooter className="sm:justify-start gap-2">
            <Button onClick={submit} disabled={busy || (!products && !activeLists && !savedLists)}>ייבא נבחרים</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span className="text-sm flex-1">{label}</span>
    </label>
  );
}
