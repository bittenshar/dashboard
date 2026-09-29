// src/components/FaceCost.tsx
//
// What face recognition costs, per event: every face check (gate app, Android
// app), admin photo test and face enrolment is counted by the backend and
// priced at an editable rate — for unit economics like cost per ticket sold
// and per person admitted.
//
// The figures sit behind their own MPIN. The backend enforces it (no cost
// data without an unlock token); unlocking lasts 30 minutes in this tab.

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, Lock, Pencil, ScanFace } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CentralizedApi } from "@/services/centralizedApi";

export interface Cost {
  usd: number;
  inr: number;
}

export interface EventFaceUsage {
  eventId: string;
  eventName: string;
  calls: number;
  billed: number;
  bySource: Record<string, number>;
  outcomes: Record<string, number>;
  ticketsSold: number;
  admitted: number;
  cost: Cost;
  inrPerTicket: number | null;
  inrPerAdmitted: number | null;
  firstDay?: string;
  lastAt?: string | null;
}

interface Rates {
  usdPerCheck: number;
  inrPerUsd: number;
  updatedBy: string | null;
  updatedAt: string | null;
}

interface UsageData {
  rates: Rates;
  events: EventFaceUsage[];
  other: Record<string, { calls: number; billed: number; cost: Cost }>;
  total: { billed: number; cost: Cost };
}

const SOURCE_LABEL: Record<string, string> = {
  gate: "Ticket checker app",
  android: "Android check-in app",
  admin_test: "Admin photo tests",
  enrolment: "Face enrolment",
};

const OUTCOME_LABEL: Record<string, string> = {
  admitted: "Entry allowed",
  already_in: "Already checked in",
  no_ticket: "No ticket",
  not_registered: "Not registered",
  matched: "Recognised",
  no_face: "No clear face (not billed)",
  error: "Failed",
  enrolled: "Faces created",
};

export const inr = (value: number) =>
  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: value < 10 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const usd = (value: number) => `$${value.toFixed(value < 1 ? 3 : 2)}`;

// ---- The unlock, kept for this tab only ----------------------------------

const TOKEN_KEY = "faceCostUnlock";

const readUnlock = (): { token: string; expiresAt: number } | null => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null");
    return saved && saved.expiresAt > Date.now() ? saved : null;
  } catch {
    return null;
  }
};

const saveUnlock = (token: string, expiresInSeconds: number) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt: Date.now() + expiresInSeconds * 1000 }));
  } catch {
    /* private mode: the unlock just won't survive a reload */
  }
};

const clearUnlock = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing stored */
  }
};

/** Loads the usage when unlocked; `reload` after anything that changes it. */
export const useFaceUsage = () => {
  const [unlock, setUnlock] = useState(readUnlock);
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lock = useCallback(() => {
    clearUnlock();
    setUnlock(null);
    setData(null);
  }, []);

  const unlockWith = useCallback((token: string, expiresInSeconds: number) => {
    saveUnlock(token, expiresInSeconds);
    setUnlock(readUnlock());
  }, []);

  const reload = useCallback(async () => {
    const current = readUnlock();
    if (!current) {
      lock();
      return;
    }
    try {
      const response: any = await CentralizedApi.faceReview.usage(current.token);
      setData(response?.data || null);
      setError(null);
    } catch (err) {
      if ((err as { status?: number })?.status === 403) {
        lock();
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load face check costs");
    }
  }, [lock]);

  useEffect(() => {
    if (unlock) reload();
  }, [unlock, reload]);

  // Lock again when the 30 minutes run out.
  useEffect(() => {
    if (!unlock) return;
    const timer = setTimeout(lock, Math.max(0, unlock.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [unlock, lock]);

  const byEvent = new Map((data?.events || []).map((e) => [e.eventId, e]));
  return { data, error, reload, byEvent, locked: !unlock, lock, unlockWith, token: unlock?.token || null, expiresAt: unlock?.expiresAt || null };
};

export type FaceUsageState = ReturnType<typeof useFaceUsage>;

/** One line for an event card. */
export const faceCostLine = (usage?: EventFaceUsage) =>
  usage ? `${usage.billed} face check${usage.billed === 1 ? "" : "s"} · ≈ ${inr(usage.cost.inr)}` : null;

// ---- MPIN box -------------------------------------------------------------

const pinOk = (pin: string) => /^\d{4,6}$/.test(pin);

const PinInput = (props: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; onEnter?: () => void }) => (
  <Input
    id={props.id}
    type="password"
    inputMode="numeric"
    autoComplete="off"
    maxLength={6}
    placeholder={props.placeholder || "••••"}
    className="w-32 tracking-[0.4em]"
    value={props.value}
    autoFocus={props.autoFocus}
    onChange={(e) => props.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
    onKeyDown={(e) => e.key === "Enter" && props.onEnter?.()}
  />
);

type PinMode = "unlock" | "setup" | "change" | "forgot";

const CostPinGate = ({ onUnlocked }: { onUnlocked: (token: string, seconds: number) => void }) => {
  const [status, setStatus] = useState<{ isSet: boolean; owner: string | null; isOwner: boolean } | null>(null);
  const [mode, setMode] = useState<PinMode>("unlock");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [code, setCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(() => {
    setError(null);
    CentralizedApi.faceReview
      .costPinStatus()
      .then((r: any) => {
        setStatus(r?.data || null);
        setMode(r?.data?.isSet ? "unlock" : "setup");
      })
      .catch((err) => setError(`Couldn't check the MPIN (${err instanceof Error ? err.message : "no answer"}).`));
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const go = (next: PinMode) => {
    setMode(next);
    setPin("");
    setPin2("");
    setCode("");
    setError(null);
  };

  const run = async (call: () => Promise<any>) => {
    setBusy(true);
    setError(null);
    try {
      const r: any = await call();
      if (r?.data?.costToken) onUnlocked(r.data.costToken, r.data.expiresInSeconds);
      return r;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (mode === "unlock") {
      if (!pinOk(pin)) return setError("Enter your 4–6 digit MPIN.");
      return run(() => CentralizedApi.faceReview.unlockCost(pin));
    }
    if (mode === "setup") {
      if (!pinOk(pin)) return setError("Choose 4 to 6 digits.");
      if (pin !== pin2) return setError("The two MPINs don't match.");
      return run(() => CentralizedApi.faceReview.setupCostPin(pin));
    }
    if (mode === "change") {
      if (!pinOk(pin)) return setError("Enter the current MPIN.");
      if (!pinOk(pin2)) return setError("The new MPIN must be 4 to 6 digits.");
      return run(() => CentralizedApi.faceReview.changeCostPin(pin, pin2));
    }
    if (!codeSentTo) return;
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from the email.");
    if (!pinOk(pin2)) return setError("The new MPIN must be 4 to 6 digits.");
    return run(() => CentralizedApi.faceReview.resetCostPin(code, pin2));
  };

  const sendCode = async () => {
    const r = await run(() => CentralizedApi.faceReview.forgotCostPin());
    if (r?.data?.sentTo) setCodeSentTo(r.data.sentTo);
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Face recognition cost</h2>
        </div>

        {!status && !error && (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
          </p>
        )}

        {status && mode === "setup" && (
          <p className="text-sm text-gray-600">
            Protect the cost figures with an MPIN. You'll be its owner — only you can reset it if it's forgotten.
          </p>
        )}
        {status && mode === "unlock" && <p className="text-sm text-gray-600">Enter the MPIN to see what face checks cost.</p>}
        {mode === "change" && <p className="text-sm text-gray-600">Enter the current MPIN and choose a new one.</p>}
        {mode === "forgot" && (
          <p className="text-sm text-gray-600">
            {codeSentTo
              ? `A 6-digit code went to ${codeSentTo}. Enter it and choose a new MPIN.`
              : status?.isOwner
                ? "We'll email you a code to set a new MPIN."
                : `Only the MPIN's owner (${status?.owner || "the admin who set it"}) can reset it.`}
          </p>
        )}

        {status && (
          <div className="flex flex-wrap items-end gap-3">
            {(mode === "unlock" || mode === "setup" || mode === "change") && (
              <div className="space-y-1">
                <Label htmlFor="cost-pin" className="text-xs">
                  {mode === "setup" ? "New MPIN" : mode === "change" ? "Current MPIN" : "MPIN"}
                </Label>
                <PinInput id="cost-pin" value={pin} onChange={setPin} autoFocus onEnter={submit} />
              </div>
            )}
            {(mode === "setup" || mode === "change" || (mode === "forgot" && codeSentTo)) && (
              <>
                {mode === "forgot" && (
                  <div className="space-y-1">
                    <Label htmlFor="cost-code" className="text-xs">Code from email</Label>
                    <Input
                      id="cost-code"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-32 tracking-[0.3em]"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="cost-pin-2" className="text-xs">{mode === "setup" ? "Repeat MPIN" : "New MPIN"}</Label>
                  <PinInput id="cost-pin-2" value={pin2} onChange={setPin2} onEnter={submit} />
                </div>
              </>
            )}

            {mode === "forgot" && !codeSentTo ? (
              status.isOwner && (
                <Button onClick={sendCode} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Email me a code
                </Button>
              )
            ) : (
              <Button onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                {mode === "setup" ? "Set MPIN" : mode === "unlock" ? "Unlock" : "Save new MPIN"}
              </Button>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">
            {error}
            {!status && (
              <button type="button" className="ml-2 text-violet-700 underline" onClick={loadStatus}>
                Try again
              </button>
            )}
          </p>
        )}

        {status?.isSet && (
          <div className="flex gap-4 text-xs">
            {mode !== "unlock" ? (
              <button type="button" className="text-violet-700 hover:underline" onClick={() => go("unlock")}>
                Back
              </button>
            ) : (
              <>
                <button type="button" className="text-violet-700 hover:underline" onClick={() => go("change")}>
                  Change MPIN
                </button>
                <button type="button" className="text-violet-700 hover:underline" onClick={() => { go("forgot"); setCodeSentTo(null); }}>
                  Forgot MPIN?
                </button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ---- Summary panel ----------------------------------------------------------

/**
 * Totals across all events, what isn't tied to an event, and the rates —
 * editable, since the estimate is only as good as the price per check.
 */
export const FaceCostSummary = ({ usage }: { usage: FaceUsageState }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const { data, error } = usage;

  if (usage.locked) return <CostPinGate onUnlocked={usage.unlockWith} />;

  const startEditing = () => {
    if (!data) return;
    setPrice(String(data.rates.usdPerCheck));
    setRate(String(data.rates.inrPerUsd));
    setEditing(true);
  };

  const save = async () => {
    if (!usage.token) return;
    setSaving(true);
    try {
      await CentralizedApi.faceReview.saveCostRates({ usdPerCheck: Number(price), inrPerUsd: Number(rate) }, usage.token);
      toast({ title: "Rates saved", description: "Every cost shown is recalculated with the new rates." });
      setEditing(false);
      usage.reload();
    } catch (err) {
      toast({
        title: "Couldn't save the rates",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-red-600">Couldn't load face check costs: {error}</CardContent>
      </Card>
    );
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading face check costs…
        </CardContent>
      </Card>
    );
  }

  const eventBilled = data.events.reduce((n, e) => n + e.billed, 0);
  const eventCost = data.events.reduce((n, e) => n + e.cost.inr, 0);
  const other = Object.entries(data.other);
  const minutesLeft = usage.expiresAt ? Math.max(1, Math.round((usage.expiresAt - Date.now()) / 60000)) : null;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ScanFace className="h-5 w-5" /> Face recognition cost
            </h2>
            <p className="text-sm text-gray-500">
              Estimated from every face check made, at {usd(data.rates.usdPerCheck)} per check and ₹{data.rates.inrPerUsd} per
              dollar. Counting started when this was switched on — earlier checks aren't included.
            </p>
          </div>
          <div className="flex gap-2">
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-2" /> Edit rates
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={usage.lock} title={minutesLeft ? `Locks by itself in ${minutesLeft} min` : undefined}>
              <Lock className="h-4 w-4 mr-2" /> Lock
            </Button>
          </div>
        </div>

        {editing && (
          <div className="flex flex-wrap items-end gap-3 rounded-md border bg-gray-50 p-3">
            <div className="space-y-1">
              <Label htmlFor="usd-per-check" className="text-xs">US$ per face check</Label>
              <Input id="usd-per-check" type="number" step="0.0001" min="0" className="w-36" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inr-per-usd" className="text-xs">₹ per US$</Label>
              <Input id="inr-per-usd" type="number" step="0.01" min="1" className="w-28" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <p className="w-full text-xs text-gray-500">
              Take the price per check from your AWS bill: the face recognition charge divided by the number of images.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="All face checks" value={inr(data.total.cost.inr)} note={`${data.total.billed} billed · ${usd(data.total.cost.usd)}`} />
          <Stat label="At events" value={inr(eventCost)} note={`${eventBilled} checks · ${data.events.length} event${data.events.length === 1 ? "" : "s"}`} />
          {other.map(([source, u]) => (
            <Stat key={source} label={SOURCE_LABEL[source] || source} value={inr(u.cost.inr)} note={`${u.billed} billed`} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const Stat = ({ label, value, note }: { label: string; value: string; note: string }) => (
  <div className="rounded-lg border bg-white p-3">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-xl font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500">{note}</div>
  </div>
);

// ---- Per-event breakdown ----------------------------------------------------

/** The breakdown inside an event's details. */
export const EventFaceCost = ({ usage, rates, locked }: { usage?: EventFaceUsage; rates?: Rates; locked?: boolean }) => {
  if (locked) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-500" /> Face check cost
        </h3>
        <p className="text-sm text-gray-500">Locked — enter the MPIN at the top of Event Management to see it.</p>
      </div>
    );
  }
  if (!usage) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Face check cost</h3>
        <p className="text-sm text-gray-500">No face checks recorded for this event yet.</p>
      </div>
    );
  }

  const outcomes = Object.entries(usage.outcomes || {}).sort((a, b) => b[1] - a[1]);
  const sources = Object.entries(usage.bySource || {});

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Face check cost</h3>
        {rates && <span className="text-xs text-gray-500">at {usd(rates.usdPerCheck)}/check</span>}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
          <div className="text-xl font-bold text-violet-700">{inr(usage.cost.inr)}</div>
          <div className="text-xs text-violet-600">{usage.billed} checks · {usd(usage.cost.usd)}</div>
        </div>
        <div className="rounded-lg bg-gray-50 border p-3">
          <div className="text-xl font-bold text-gray-900">{usage.inrPerTicket != null ? inr(usage.inrPerTicket) : "—"}</div>
          <div className="text-xs text-gray-500">per ticket sold ({usage.ticketsSold})</div>
        </div>
        <div className="rounded-lg bg-gray-50 border p-3">
          <div className="text-xl font-bold text-gray-900">{usage.inrPerAdmitted != null ? inr(usage.inrPerAdmitted) : "—"}</div>
          <div className="text-xs text-gray-500">per person admitted ({usage.admitted})</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Results</div>
          {outcomes.map(([outcome, n]) => (
            <div key={outcome} className="flex justify-between">
              <span className="text-gray-600">{OUTCOME_LABEL[outcome] || outcome}</span>
              <span className="font-medium">{n}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Checked by</div>
          {sources.map(([source, n]) => (
            <div key={source} className="flex justify-between">
              <span className="text-gray-600">{SOURCE_LABEL[source] || source}</span>
              <span className="font-medium">{n}</span>
            </div>
          ))}
          {usage.calls > usage.billed && (
            <p className="mt-2 text-xs text-gray-500">{usage.calls - usage.billed} of {usage.calls} calls found no face and aren't billed.</p>
          )}
        </div>
      </div>
    </div>
  );
};
