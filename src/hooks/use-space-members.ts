import { useEffect, useState } from "react";
import { actions } from "@/lib/familycart-store";

export type SpaceMemberMap = Map<string, string>; // user_id -> display name (email local part)

const cache = new Map<string, SpaceMemberMap>();

export function useSpaceMembers(spaceId: string | null | undefined): SpaceMemberMap {
  const [map, setMap] = useState<SpaceMemberMap>(() =>
    spaceId ? (cache.get(spaceId) ?? new Map()) : new Map(),
  );

  useEffect(() => {
    if (!spaceId) {
      setMap(new Map());
      return;
    }
    let cancelled = false;
    const cached = cache.get(spaceId);
    if (cached) setMap(cached);
    actions.getSpaceMembers(spaceId).then((rows) => {
      if (cancelled) return;
      const next: SpaceMemberMap = new Map();
      rows.forEach((r) => {
        const name = (r.email ?? "").split("@")[0] || "משתמש";
        next.set(r.user_id, name);
      });
      cache.set(spaceId, next);
      setMap(next);
    });
    return () => { cancelled = true; };
  }, [spaceId]);

  return map;
}
