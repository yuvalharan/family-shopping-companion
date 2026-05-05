import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBasket } from "lucide-react";

export function AppHeader() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/", label: "רשימה ראשית" },
    { to: "/shopping", label: "רשימות קנייה" },
  ] as const;

  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <ShoppingBasket className="size-6" />
          <span className="text-xl font-semibold">FamilyCart</span>
        </div>
      </div>
      <nav className="mx-auto max-w-xl px-4 flex gap-2">
        {tabs.map((t) => {
          const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={
                "flex-1 py-3 text-center font-medium text-sm transition-colors border-b-2 " +
                (active
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
