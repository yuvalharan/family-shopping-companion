// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Fallback Supabase publishable values for the production build, in case the
// build environment does not have access to the .env file (it is gitignored).
// These are public values (project URL + anon/publishable key) and are safe to
// commit to the repository.
const SUPABASE_URL_FALLBACK = "https://ygvbrktxncjedmmejvva.supabase.co";
const SUPABASE_PUBLISHABLE_KEY_FALLBACK =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlndmJya3R4bmNqZWRtbWVqdnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTc4OTQsImV4cCI6MjA5MzQzMzg5NH0.A7rV988dkk9vjD4ehrv1KBQSecd83CMkOyB_3Wq1ijE";
const SUPABASE_PROJECT_ID_FALLBACK = "ygvbrktxncjedmmejvva";

export default defineConfig({
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        process.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK,
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY_FALLBACK,
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        process.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_PROJECT_ID_FALLBACK,
      ),
    },
  },
});
