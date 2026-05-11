import { Outlet, Link, createRootRoute, HeadContent, Scripts, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { JoinInviteHandler } from "@/components/familycart/SpacesUI";
import { PwaInstall } from "@/components/familycart/PwaInstall";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#3FA67A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "FamilyCart" },
      { title: "FamilyCart — רשימת קניות משפחתית" },
      { name: "description", content: "אפליקציית רשימת קניות פשוטה לבית — מוצרים קבועים ורשימת קנייה נוחה." },
      { name: "author", content: "FamilyCart" },
      { property: "og:title", content: "FamilyCart — רשימת קניות משפחתית" },
      { property: "og:description", content: "אפליקציית רשימת קניות פשוטה לבית — מוצרים קבועים ורשימת קנייה נוחה." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "FamilyCart — רשימת קניות משפחתית" },
      { name: "twitter:description", content: "אפליקציית רשימת קניות פשוטה לבית — מוצרים קבועים ורשימת קנייה נוחה." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fae12d31-fb61-45fb-a6f2-cd77cca26aa5/id-preview-8eaf0e43--ecc12ad9-3e5a-4013-800e-75f4b0749845.lovable.app-1778416915768.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fae12d31-fb61-45fb-a6f2-cd77cca26aa5/id-preview-8eaf0e43--ecc12ad9-3e5a-4013-800e-75f4b0749845.lovable.app-1778416915768.png" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Varela+Round&family=Heebo:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isPublic = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/shared/");

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      // Preserve invite code through login
      const raw: unknown = search;
      let code: string | null = null;
      if (typeof raw === "string") {
        const s = raw.startsWith("?") ? raw.slice(1) : raw;
        code = new URLSearchParams(s).get("invite");
      } else if (raw && typeof raw === "object") {
        const v = (raw as Record<string, unknown>).invite;
        if (typeof v === "string") code = v;
      }
      if (code) { try { sessionStorage.setItem("pending-invite", code); } catch { /* ignore */ } }
      navigate({ to: "/login" });
    }
  }, [user, loading, isPublic, navigate, search]);

  if (loading) return <div className="min-h-screen" />;
  if (!user && !isPublic) return <div className="min-h-screen" />;
  return <Outlet />;
}

function RootComponent() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") || host.includes("lovableproject.com");
    const isLocal = host === "localhost" || host === "127.0.0.1";

    if (isInIframe || isPreviewHost || isLocal || !("serviceWorker" in navigator)) {
      // Make sure no stale SW lingers in dev/preview/iframe contexts.
      navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => undefined);
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return (
    <AuthProvider>
      <AuthGate />
      <JoinInviteMount />
      <PwaInstall />
      <Toaster position="bottom-center" richColors />
    </AuthProvider>
  );
}

function JoinInviteMount() {
  const { user } = useAuth();
  if (!user) return null;
  return <JoinInviteHandler />;
}
