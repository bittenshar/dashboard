// src/hooks/useFaceOwners.ts
//
// Who really has a face ID, from the face system itself — not guessed from
// whether a photo is on file (a photo can exist with no face made from it).
// One shared list for every view, refreshed at most once a minute.

import { useEffect, useState } from "react";
import { CentralizedApi } from "@/services/centralizedApi";

let cache: { ids: Set<string>; at: number } | null = null;
let inflight: Promise<Set<string>> | null = null;
const listeners = new Set<(ids: Set<string>) => void>();

const load = (): Promise<Set<string>> => {
  if (inflight) return inflight;
  inflight = CentralizedApi.faceReview
    .faceOwners()
    .then((response: any) => {
      const ids = new Set<string>((response?.data?.ownerIds || []).map(String));
      cache = { ids, at: Date.now() };
      listeners.forEach((notify) => notify(ids));
      return ids;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

/** Reload after something changed a face, e.g. a removal. */
export const refreshFaceOwners = () => load().catch(() => cache?.ids ?? new Set<string>());

export const useFaceOwners = () => {
  const [ids, setIds] = useState<Set<string> | null>(cache?.ids ?? null);

  useEffect(() => {
    listeners.add(setIds);
    if (!cache || Date.now() - cache.at > 60_000) load().catch(() => {});
    return () => {
      listeners.delete(setIds);
    };
  }, []);

  /** true / false once known; null while the list is still loading. */
  const hasFaceId = (user: any): boolean | null => {
    if (!ids) return null;
    return [user?.userId, user?._id, user?.id].some((key) => key && ids.has(String(key)));
  };

  return { hasFaceId, loaded: Boolean(ids) };
};
