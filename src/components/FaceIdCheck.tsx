// src/components/FaceIdCheck.tsx
//
// "Face ID Check" tab: for any user, test a photo against AWS to see whether it
// comes back as that same user, and remove a face ID whose photo is too poor
// to rely on. The test is search-only on the backend — the photo is never
// stored or indexed, so testing can't change who matches whom.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ImageOff,
  Loader2,
  ScanFace,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserX,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useToast } from "@/hooks/use-toast";
import { CentralizedApi } from "@/services/centralizedApi";
import { refreshFaceOwners } from "@/hooks/useFaceOwners";
import {
  VERIFICATION_LABEL,
  countByVerificationState,
  unwrapUsers,
  verificationState,
  type VerificationState,
} from "@/lib/verification";

type AnyUser = Record<string, any>;

interface FaceRecord {
  faceId: string;
  name: string | null;
  status: string | null;
  createdAt: string | null;
}

interface FaceInfo {
  user: AnyUser;
  faceRecords: FaceRecord[];
  hasFaceId: boolean;
  // Set when AWS couldn't be asked; the face ID state is then unknown.
  faceLookupError?: string | null;
}

interface Match {
  faceId: string;
  similarity: number;
  userId: string | null;
  name: string | null;
  passesCheckIn: boolean;
  isExpectedUser: boolean;
}

interface TestResult {
  verdict: "same_user" | "different_user" | "no_match" | "no_face" | "matched";
  checkInThreshold?: number;
  expectedUserId: string | null;
  matches: Match[];
}

const DEFAULT_REASON = "Your face photo was not clear. Please upload a new photo.";
const DEFAULT_DIGILOCKER_REASON = "We couldn't use your DigiLocker details.";
const DEFAULT_REJECT_REASON = "Your selfie doesn't match your DigiLocker details. Please upload a clear photo of yourself.";

const mongoId = (u: AnyUser): string => u?._id || u?.id || "";
const displayName = (u: AnyUser): string => u?.name || u?.fullName || u?.digilockerName || "Unnamed user";

// Status pill colours for the user list.
const STATE_STYLE: Record<VerificationState, string> = {
  to_verify: "bg-amber-100 text-amber-800",
  no_selfie: "bg-gray-100 text-gray-600",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

const STATE_FILTERS: VerificationState[] = ["to_verify", "no_selfie", "verified", "rejected"];

type DigilockerFilter = "any" | "verified" | "not_verified" | "mismatch";

const profileName = (u: AnyUser): string =>
  u?.name || u?.fullName || [u?.firstname, u?.lastname].filter(Boolean).join(" ") || "";

/** Whether the user went through DigiLocker, and if so whether the names agree. */
const digilockerStatus = (u: AnyUser) => {
  const done = Boolean(u?.digilockerVerified || u?.digilockerName);
  const mine = profileName(u);
  const doc = u?.digilockerName || "";
  const mismatch = done && Boolean(mine && doc) && nameKey(mine) !== nameKey(doc);
  return { done, mismatch };
};

const DIGILOCKER_FILTERS: { key: DigilockerFilter; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "verified", label: "Verified" },
  { key: "not_verified", label: "Not verified" },
  { key: "mismatch", label: "Name mismatch" },
];

// Ready-made messages for the usual reasons to nudge people.
const NOTIFY_PRESETS = {
  upload_selfie: {
    label: "Upload selfie",
    title: "📸 Add your selfie",
    body: "Upload a clear selfie in the Whooppe app so you can walk into events with face check-in.",
  },
  digilocker: {
    label: "Verify with DigiLocker",
    title: "🪪 Verify with DigiLocker",
    body: "Verify your identity with DigiLocker in the Whooppe app to finish setting up your account.",
  },
  selfie_and_digilocker: {
    label: "DigiLocker + selfie",
    title: "🪪 Verify with DigiLocker and upload your selfie",
    body: "Finish setting up your Whooppe account: verify your identity with DigiLocker and upload a clear selfie, so you can walk into events with face check-in.",
  },
  custom: { label: "Custom", title: "", body: "" },
} as const;
type NotifyPurpose = keyof typeof NOTIFY_PRESETS;

const matchesDigilocker = (u: AnyUser, filter: DigilockerFilter) => {
  if (filter === "any") return true;
  const { done, mismatch } = digilockerStatus(u);
  if (filter === "verified") return done;
  if (filter === "not_verified") return !done;
  return mismatch;
};

const FACE_STATUS_TEXT: Record<string, string> = {
  pending_review: "Selfie waiting for approval — no face ID until it's verified in User Verification",
  approved: "Selfie approved — face ID created from it",
  rejected: "Last selfie was rejected — no face ID from it",
  removed: "Face ID was removed — waiting for a new selfie",
};

const FaceIdCheck = () => {
  const api = useApiContext();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | VerificationState>("all");
  const [digilockerFilter, setDigilockerFilter] = useState<DigilockerFilter>("any");
  const [selected, setSelected] = useState<AnyUser | null>(null);
  const [faceInfo, setFaceInfo] = useState<FaceInfo | null>(null);
  const [photos, setPhotos] = useState<{ selfie: string | null; digilocker: string | null }>({
    selfie: null,
    digilocker: null,
  });
  const [loadingUser, setLoadingUser] = useState(false);

  const [testFile, setTestFile] = useState<File | null>(null);
  const [testPreview, setTestPreview] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [deciding, setDeciding] = useState<null | "verified" | "rejected">(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [dlResetOpen, setDlResetOpen] = useState(false);
  const [dlReason, setDlReason] = useState(DEFAULT_DIGILOCKER_REASON);
  const [dlResetting, setDlResetting] = useState(false);
  const [rejectReason, setRejectReason] = useState(DEFAULT_REJECT_REASON);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [removing, setRemoving] = useState(false);

  const users = useMemo(() => unwrapUsers(api.users), [api.users]);

  // Opened from a User Verification card: /face-check?user=<Mongo _id>.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedUser = searchParams.get("user");
  useEffect(() => {
    if (!requestedUser || !users.length) return;
    const match = users.find((u) => mongoId(u) === requestedUser || u.userId === requestedUser);
    if (match) loadUser(match);
    // Consume it, so picking another user isn't overridden on the next render.
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedUser, users.length]);

  useEffect(() => {
    if (!users.length) api.fetchUsers?.();
    // Only on first open; the list refreshes elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke the preview's object URL when it's replaced or the tab closes.
  useEffect(() => () => { if (testPreview) URL.revokeObjectURL(testPreview); }, [testPreview]);

  const stateCounts = useMemo(() => countByVerificationState(users), [users]);

  // DigiLocker counts within the chosen verification state, so the numbers on
  // the buttons are what you'd get by clicking them.
  const digilockerCounts = useMemo(() => {
    const inState = users.filter((u) => stateFilter === "all" || verificationState(u) === stateFilter);
    return Object.fromEntries(
      DIGILOCKER_FILTERS.map(({ key }) => [key, inState.filter((u) => matchesDigilocker(u, key)).length])
    ) as Record<DigilockerFilter, number>;
  }, [users, stateFilter]);

  // Everyone the filters and search match; only the first 50 are listed, but
  // "Select all" takes all of them.
  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (stateFilter === "all" || verificationState(u) === stateFilter) &&
        matchesDigilocker(u, digilockerFilter) &&
        (!q || [displayName(u), u.email, u.phone, u.userId].some((v) => String(v || "").toLowerCase().includes(q)))
    );
  }, [users, query, stateFilter, digilockerFilter]);
  const filtered = useMemo(() => matching.slice(0, 50), [matching]);

  // ---- Batch notification: goes to everyone the filters and search match ----
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyPurpose, setNotifyPurpose] = useState<NotifyPurpose>("upload_selfie");
  const [notifyTitle, setNotifyTitle] = useState<string>(NOTIFY_PRESETS.upload_selfie.title);
  const [notifyBody, setNotifyBody] = useState<string>(NOTIFY_PRESETS.upload_selfie.body);
  const [notifying, setNotifying] = useState(false);

  const choosePreset = (purpose: NotifyPurpose) => {
    setNotifyPurpose(purpose);
    setNotifyTitle(NOTIFY_PRESETS[purpose].title);
    setNotifyBody(NOTIFY_PRESETS[purpose].body);
  };

  // The group, in words, as the filters define it.
  const audienceLabel = [
    stateFilter === "all" ? null : VERIFICATION_LABEL[stateFilter],
    digilockerFilter === "any" ? null : `DigiLocker: ${DIGILOCKER_FILTERS.find((f) => f.key === digilockerFilter)?.label}`,
    query.trim() ? `matching "${query.trim()}"` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const openNotify = () => {
    // Start from the message that fits the group.
    if (digilockerFilter === "not_verified" && stateFilter === "no_selfie") choosePreset("selfie_and_digilocker");
    else if (digilockerFilter === "not_verified") choosePreset("digilocker");
    else if (stateFilter === "no_selfie") choosePreset("upload_selfie");
    setNotifyOpen(true);
  };

  const sendNotification = async () => {
    setNotifying(true);
    try {
      const response: any = await CentralizedApi.faceReview.notify({
        userIds: matching.map((u) => mongoId(u)),
        title: notifyTitle.trim(),
        body: notifyBody.trim(),
        purpose: notifyPurpose,
      });
      const t = response?.data || {};
      toast({
        title: `Sent to ${t.recipients ?? matching.length} user${t.recipients === 1 ? "" : "s"}`,
        description: `${t.pushed ?? 0} got a push on their phone; ${t.inAppOnly ?? 0} will see it in the app's Notifications only (no phone registered)${
          t.failed ? `; ${t.failed} failed` : ""
        }.`,
      });
      setNotifyOpen(false);
    } catch (error) {
      toast({
        title: "Couldn't send the notification",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setNotifying(false);
    }
  };

  const loadUser = async (user: AnyUser) => {
    setSelected(user);
    setFaceInfo(null);
    setPhotos({ selfie: null, digilocker: null });
    setResult(null);
    setTestFile(null);
    setTestPreview(null);
    setLoadingUser(true);

    const id = mongoId(user);
    const [info, signed] = await Promise.allSettled([
      CentralizedApi.faceReview.getUser(id),
      CentralizedApi.get<any>(`/users/${encodeURIComponent(user.userId || id)}/presigned-urls?expires=3600`),
    ]);

    if (info.status === "fulfilled") {
      setFaceInfo((info.value as any).data);
    } else {
      const message = String(info.reason?.message || info.reason);
      console.error(`Face status for ${id} failed:`, info.reason);
      toast({ title: "Couldn't load face status", description: `${message} (user ${user.userId || id})`, variant: "destructive" });
    }
    if (signed.status === "fulfilled") {
      const data = signed.value || {};
      setPhotos({
        selfie: data.images?.[0]?.url || data.urls?.uploadedPhoto || null,
        digilocker: data.urls?.digilockerPhoto || null,
      });
    }
    setLoadingUser(false);
  };

  const pickFile = (file: File | null) => {
    setResult(null);
    setTestFile(file);
    setTestPreview(file ? URL.createObjectURL(file) : null);
  };

  const runTest = async () => {
    if (!selected || !testFile) return;
    setTesting(true);
    try {
      const response = await CentralizedApi.faceReview.search(testFile, mongoId(selected));
      setResult(response.data);
    } catch (error) {
      toast({ title: "Test failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  /**
   * Verify or reject, same as the User Verification tab (PATCH /users/:id/verify):
   * verifying moves a waiting selfie to where its face ID gets made, rejecting
   * deletes it; either way the user is notified.
   */
  const decide = async (status: "verified" | "rejected", reasonText?: string) => {
    if (!selected) return;
    setDeciding(status);
    const name = displayName(faceInfo?.user || selected);
    try {
      const response: any = await CentralizedApi.patch(`/users/${mongoId(selected)}/verify`, {
        verificationStatus: status,
        ...(reasonText ? { reason: reasonText } : {}),
      });
      const promoted = response?.faceDecision?.action === "promoted";
      toast({
        title: status === "verified" ? `Verified ${name}` : `Rejected ${name}`,
        description:
          status === "verified"
            ? promoted
              ? "Their face ID is being created — it shows as active here in about a minute."
              : "They've been notified."
            : "Their waiting selfie was deleted and they've been told why.",
      });
      setRejectOpen(false);
      setRejectReason(DEFAULT_REJECT_REASON);
      api.fetchUsers?.();
      await loadUser(selected);
    } catch (error) {
      toast({
        title: status === "verified" ? "Couldn't verify" : "Couldn't reject",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeciding(null);
    }
  };

  const resetDigilocker = async () => {
    if (!selected) return;
    setDlResetting(true);
    try {
      const response: any = await CentralizedApi.faceReview.resetDigilocker(mongoId(selected), dlReason.trim());
      const sent = response?.data?.notification?.sent > 0;
      toast({
        title: "DigiLocker data cleared",
        description: `${displayName(faceInfo?.user || selected)} is back to pending and has been asked to verify with DigiLocker again${
          sent ? "" : " (in-app notification only — no phone registered for push)"
        }.`,
      });
      setDlResetOpen(false);
      setDlReason(DEFAULT_DIGILOCKER_REASON);
      api.fetchUsers?.();
      await loadUser(selected);
    } catch (error) {
      toast({
        title: "Couldn't clear DigiLocker data",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDlResetting(false);
    }
  };

  const removeFace = async () => {
    if (!selected) return;
    setRemoving(true);
    try {
      const response: any = await CentralizedApi.faceReview.removeFace(mongoId(selected), reason.trim());
      const { facesDeleted = 0, photosDeleted = 0 } = response?.data || {};
      toast({
        title: facesDeleted ? "Face ID removed" : "Selfie removed",
        description: `${facesDeleted} face${facesDeleted === 1 ? "" : "s"} deleted from the face system and ${photosDeleted} photo${photosDeleted === 1 ? "" : "s"} removed. The user has been asked for a new selfie.`,
      });
      setRemoveOpen(false);
      setReason(DEFAULT_REASON);
      api.fetchUsers?.();
      refreshFaceOwners();
      await loadUser(selected);
    } catch (error) {
      toast({ title: "Couldn't remove the face ID", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const faceUser = faceInfo?.user || selected || {};
  const hasFaceId = Boolean(faceInfo?.hasFaceId);
  // A photo on file with no face made from it can still be cleared, so the
  // user is asked for a new one.
  const hasSelfieOnFile = Boolean(faceUser.uploadedPhoto || faceUser.pendingFacePhoto?.s3Key || photos.selfie);
  const canRemove = hasFaceId || hasSelfieOnFile;
  const removeLabel = hasFaceId ? "Remove face ID" : "Remove selfie";
  const currentState = verificationState(faceUser);

  // Verify / Reject, shown under the photos and in the enlarged compare view.
  const decisionBar = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
      <p className="text-sm text-muted-foreground">
        {currentState === "verified"
          ? "Verified."
          : currentState === "rejected"
            ? "Rejected — waiting for a new selfie."
            : currentState === "no_selfie"
              ? "No selfie on file yet — nothing to verify."
              : "Does the selfie match the DigiLocker photo and details?"}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
          disabled={Boolean(deciding) || loadingUser || currentState === "rejected"}
          onClick={() => setRejectOpen(true)}
        >
          <XCircle className="h-4 w-4 mr-2" /> Reject
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={Boolean(deciding) || loadingUser || currentState === "verified" || currentState === "no_selfie"}
          onClick={() => decide("verified")}
        >
          {deciding === "verified" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Verify
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ScanFace className="h-6 w-6" /> Face ID Check
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Test any photo against a user's face ID, and remove face IDs made from unclear photos.
          Test photos are only compared — they are never saved and never create a face ID.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ---------------- User picker ---------------- */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Users
              {stateCounts.to_verify > 0 && (
                <span className="text-xs font-medium text-amber-700">{stateCounts.to_verify} need verification</span>
              )}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setStateFilter("all")}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${stateFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
              >
                All {users.length}
              </button>
              {STATE_FILTERS.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setStateFilter(state)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${stateFilter === state ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  {VERIFICATION_LABEL[state]} {stateCounts[state]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-0.5">DigiLocker</span>
              {DIGILOCKER_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDigilockerFilter(key)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${digilockerFilter === key ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  {label} {digilockerCounts[key]}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Name, phone, email or user ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {matching.length} user{matching.length === 1 ? "" : "s"} match
              </span>
              <Button size="sm" className="h-7 px-2 text-xs" disabled={matching.length === 0} onClick={openNotify}>
                <Send className="h-3 w-3 mr-1" /> Notify these {matching.length}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto space-y-1 p-2">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground p-3">
                {users.length
                  ? "No users match this filter."
                  : api.errors?.users
                    ? `Couldn't load users: ${api.errors.users}`
                    : api.loading?.users
                      ? "Loading users…"
                      : "No users yet."}
              </p>
            )}
            {filtered.map((u) => {
              const active = selected && mongoId(selected) === mongoId(u);
              return (
                <button
                  key={mongoId(u) || u.userId}
                  onClick={() => loadUser(u)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{displayName(u)}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATE_STYLE[verificationState(u)]}`}>
                      {VERIFICATION_LABEL[verificationState(u)]}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs truncate ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {(() => {
                      const dl = digilockerStatus(u);
                      if (!dl.done) return null;
                      return dl.mismatch ? (
                        <ShieldAlert className={`h-3 w-3 shrink-0 ${active ? "" : "text-amber-600"}`} aria-label="DigiLocker name mismatch" />
                      ) : (
                        <ShieldCheck className={`h-3 w-3 shrink-0 ${active ? "" : "text-green-600"}`} aria-label="DigiLocker verified" />
                      );
                    })()}
                    {u.phone || u.email || u.userId}
                  </div>
                </button>
              );
            })}
            {matching.length > filtered.length && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Showing 50 of {matching.length}. Notify sends to all {matching.length}.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ---------------- Selected user ---------------- */}
        {!selected ? (
          <Card className="flex items-center justify-center min-h-[300px]">
            <p className="text-muted-foreground text-sm">Pick a user to check their face ID.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{displayName(faceUser)}</CardTitle>
                    <CardDescription className="mt-1">
                      {faceUser.userId || `ID ${mongoId(faceUser)}`} · {faceUser.phone || faceUser.email || "—"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">{faceUser.verificationStatus || "pending"}</Badge>
                    {loadingUser ? (
                      <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Checking face ID</Badge>
                    ) : faceInfo?.faceLookupError ? (
                      <Badge variant="destructive">Face ID unknown</Badge>
                    ) : hasFaceId ? (
                      <Badge className="bg-green-600 hover:bg-green-600">Face ID active</Badge>
                    ) : (
                      <Badge variant="secondary">No face ID</Badge>
                    )}
                  </div>
                </div>
                {faceUser.faceStatus && FACE_STATUS_TEXT[faceUser.faceStatus] && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4" /> {FACE_STATUS_TEXT[faceUser.faceStatus]}
                  </p>
                )}
                {faceInfo?.faceLookupError && (
                  <p className="text-sm text-red-600 flex items-start gap-2 mt-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Couldn't check this user's face ID — {faceInfo.faceLookupError}</span>
                  </p>
                )}
                {faceUser.faceReviewNote && (
                  <p className="text-xs text-muted-foreground mt-1">Last note: {faceUser.faceReviewNote}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PhotoBox label="Selfie on file" url={photos.selfie} loading={loadingUser} onOpen={() => setViewerOpen(true)} />
                  <div className="space-y-3">
                    <PhotoBox label="DigiLocker photo" url={photos.digilocker} loading={loadingUser} onOpen={() => setViewerOpen(true)} />
                    {!loadingUser && <DigilockerDetails user={faceUser} />}
                    {!loadingUser && digilockerStatus(faceUser).done && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-800 hover:bg-amber-50"
                        onClick={() => setDlResetOpen(true)}
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" /> Redo DigiLocker
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4">{decisionBar}</div>
              </CardContent>
            </Card>

            {/* ---------------- Test ---------------- */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test a photo</CardTitle>
                <CardDescription>
                  Upload the same photo or any other photo of this person. The face system says which registered user it
                  matches — it should be {displayName(faceUser)}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Label
                    htmlFor="face-test-file"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" /> {testFile ? "Choose another photo" : "Choose photo"}
                  </Label>
                  <input
                    id="face-test-file"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={runTest} disabled={!testFile || testing}>
                    {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanFace className="h-4 w-4 mr-2" />}
                    Run test
                  </Button>
                </div>

                {testPreview && (
                  <button type="button" onClick={() => setViewerOpen(true)} title="Compare with the photos on file">
                    <img src={testPreview} alt="Photo to test" className="h-40 w-40 rounded-md object-cover border" />
                  </button>
                )}

                {result && <TestVerdict result={result} expectedName={displayName(faceUser)} hasFaceId={hasFaceId} />}
              </CardContent>
            </Card>

            {/* ---------------- Remove ---------------- */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-700">{removeLabel}</CardTitle>
                <CardDescription>
                  {hasFaceId
                    ? "If the selfie is unclear, remove the face ID completely: it's deleted from the face system, the user's photos are deleted, and they're asked to upload a new selfie, which then waits for approval like any other."
                    : "This user has no face ID — only a photo on file. Remove it and they're asked to upload a new selfie, which then waits for approval like any other."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" disabled={!canRemove || loadingUser} onClick={() => setRemoveOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> {removeLabel}
                </Button>
                {!canRemove && !loadingUser && (
                  <p className="text-xs text-muted-foreground mt-2">This user has no face ID and no photo on file.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Large side-by-side view, for comparing the faces properly */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-6xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>{displayName(faceUser)} — compare photos</DialogTitle>
          </DialogHeader>
          <div className={`grid gap-4 ${testPreview ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {[
              { label: "Selfie on file", url: photos.selfie },
              { label: "DigiLocker photo", url: photos.digilocker },
              ...(testPreview ? [{ label: "Photo being tested", url: testPreview }] : []),
            ].map(({ label, url }) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                </div>
                <div className="flex h-[70vh] items-center justify-center rounded-md border bg-black/90">
                  {!url ? (
                    <span className="text-sm text-gray-400">None on file</span>
                  ) : /\.pdf(\?|$)/i.test(url) ? (
                    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-white underline">Open document (PDF)</a>
                  ) : (
                    <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {decisionBar}
        </DialogContent>
      </Dialog>

      <Dialog open={notifyOpen} onOpenChange={(open) => !notifying && setNotifyOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Notify {matching.length} user{matching.length === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              {audienceLabel ? (
                <>Everyone matching <span className="font-medium text-foreground">{audienceLabel}</span>. </>
              ) : (
                <span className="font-medium text-amber-700">No filter is set — this goes to every user. </span>
              )}
              Each gets a push on their phone, if one is registered, and an entry in the app's Notifications list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(NOTIFY_PRESETS) as NotifyPurpose[]).map((purpose) => (
                <button
                  key={purpose}
                  type="button"
                  onClick={() => choosePreset(purpose)}
                  className={`rounded-full border px-3 py-1 text-xs ${notifyPurpose === purpose ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  {NOTIFY_PRESETS[purpose].label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notify-title">Title</Label>
              <Input id="notify-title" maxLength={65} value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notify-body">Message</Label>
              <Textarea id="notify-body" rows={3} maxLength={240} value={notifyBody} onChange={(e) => setNotifyBody(e.target.value)} />
              <p className="text-xs text-muted-foreground text-right">{notifyBody.length}/240</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyOpen(false)} disabled={notifying}>
              Cancel
            </Button>
            <Button onClick={sendNotification} disabled={notifying || !notifyTitle.trim() || !notifyBody.trim()}>
              {notifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send to {matching.length}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dlResetOpen} onOpenChange={(open) => !dlResetting && setDlResetOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ask {displayName(faceUser)} to redo DigiLocker?</AlertDialogTitle>
            <AlertDialogDescription>
              Their DigiLocker details and document are deleted, and they go back to pending — anything verified against
              that data needs verifying again. They're sent this message and asked to verify with DigiLocker in the app.
              Their face ID is not touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="dl-reason">Message to the user</Label>
            <Textarea id="dl-reason" rows={3} value={dlReason} onChange={(e) => setDlReason(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              They'll see: "{dlReason.trim() || "Please verify your identity with DigiLocker again in the app."}
              {dlReason.trim() ? " Please verify with DigiLocker again in the app." : ""}"
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dlResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open until the request finishes.
                e.preventDefault();
                resetDigilocker();
              }}
              disabled={dlResetting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {dlResetting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Clear and notify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectOpen} onOpenChange={(open) => !deciding && setRejectOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {displayName(faceUser)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their waiting selfie is deleted, so no face ID is made from it. They're sent this message and can upload
              a new selfie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Message to the user</Label>
            <Textarea id="reject-reason" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deciding)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open until the request finishes.
                e.preventDefault();
                decide("rejected", rejectReason.trim());
              }}
              disabled={Boolean(deciding)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deciding === "rejected" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={removeOpen} onOpenChange={(open) => !removing && setRemoveOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasFaceId ? `Remove ${displayName(faceUser)}'s face ID?` : `Remove ${displayName(faceUser)}'s selfie?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasFaceId
                ? "Their face is deleted from the face system and their selfies are deleted. Until they upload a new selfie and it's approved, face check-in won't recognise them. This can't be undone."
                : "Their photo is deleted and they're asked for a new selfie. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="remove-reason">Message to the user</Label>
            <Textarea id="remove-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open until the request finishes.
                e.preventDefault();
                removeFace();
              }}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {removeLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const PhotoBox = ({
  label,
  url,
  loading,
  onOpen,
}: {
  label: string;
  url: string | null;
  loading: boolean;
  onOpen?: () => void;
}) => {
  const isPdf = Boolean(url && /\.pdf(\?|$)/i.test(url));
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="aspect-square w-full max-w-[260px] rounded-md border bg-muted/40 flex items-center justify-center overflow-hidden">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : !url ? (
          <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <ImageOff className="h-5 w-5" /> None on file
          </span>
        ) : isPdf ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-sm underline">Open document (PDF)</a>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="group relative h-full w-full"
            title="Click to enlarge and compare"
          >
            <img src={url} alt={label} className="h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-80 group-hover:opacity-100">
              <ZoomIn className="h-3 w-3" /> Enlarge
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

/** Letters only, lower-case, word order ignored: "SHARMA  Daksh" == "daksh sharma". */
const nameKey = (name: string) =>
  name.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null;

const DOC_TYPE_LABEL: Record<string, string> = {
  AADHAAR: "Aadhaar",
  DRIVING_LICENCE: "Driving licence",
  VOTER_ID: "Voter ID",
};

/**
 * What DigiLocker told us about this person, next to their DigiLocker photo,
 * with the one check an admin otherwise does by eye: does the name on the
 * document match the name on the profile?
 */
const DigilockerDetails = ({ user }: { user: AnyUser }) => {
  if (!user.digilockerVerified && !user.digilockerName) {
    return <p className="text-sm text-muted-foreground">Not verified with DigiLocker.</p>;
  }

  const profileName: string =
    user.name || user.fullName || [user.firstname, user.lastname].filter(Boolean).join(" ") || "";
  const docName: string = user.digilockerName || "";
  const namesMatch = Boolean(profileName && docName && nameKey(profileName) === nameKey(docName));

  const rows: [string, ReactNode][] = [
    ["Name", docName || "—"],
    ["Date of birth", user.digilockerDob || "—"],
    [
      "Age",
      user.digilockerAge != null ? (
        <span className="inline-flex items-center gap-2">
          {user.digilockerAge}
          {user.digilockerAgeVerified ? (
            <Badge variant="outline" className="border-green-300 text-green-700">18+</Badge>
          ) : (
            <Badge variant="outline" className="border-red-300 text-red-700">Under 18</Badge>
          )}
        </span>
      ) : (
        "—"
      ),
    ],
    ["Document", DOC_TYPE_LABEL[user.digilockerDocType] || user.digilockerDocType || "Photo only"],
    ["Verified on", formatDateTime(user.digilockerVerifiedAt) || "—"],
  ];

  return (
    <div className="rounded-md border p-3 text-sm max-w-[360px]">
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {docName && profileName && (
        <p className={`mt-3 flex items-start gap-2 text-xs ${namesMatch ? "text-green-700" : "text-amber-700"}`}>
          {namesMatch ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {namesMatch
            ? "Matches the name on the profile."
            : `Different from the name on the profile ("${profileName}").`}
        </p>
      )}
    </div>
  );
};

const TestVerdict = ({
  result,
  expectedName,
  hasFaceId,
}: {
  result: TestResult;
  expectedName: string;
  hasFaceId: boolean;
}) => {
  const top = result.matches[0];
  const threshold = result.checkInThreshold ?? 90;

  let tone = "border-muted bg-muted/40";
  let icon = <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
  let title = "";
  let detail = "";

  switch (result.verdict) {
    case "same_user":
      tone = "border-green-200 bg-green-50";
      icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
      title = `Same user — matched ${expectedName} at ${top.similarity}%`;
      detail = top.passesCheckIn
        ? "Face check-in would accept this person."
        : `Below the ${threshold}% check-in threshold, so check-in would not accept it. Consider replacing the face ID.`;
      break;
    case "different_user":
      tone = "border-red-200 bg-red-50";
      icon = <XCircle className="h-5 w-5 text-red-600" />;
      title = `Different user — matched ${top.name || top.userId || "another user"} at ${top.similarity}%`;
      detail = `The face system thinks this photo is someone else, not ${expectedName}. At check-in this person would be recognised as that other user.`;
      break;
    case "no_match":
      tone = "border-amber-200 bg-amber-50";
      icon = <UserX className="h-5 w-5 text-amber-600" />;
      title = "No match";
      detail = hasFaceId
        ? `The face system found nobody like this photo, not even ${expectedName}. If it's really them, their stored face may be poor — consider replacing it.`
        : `${expectedName} has no face ID yet, so there is nothing for this photo to match.`;
      break;
    case "no_face":
      icon = <ImageOff className="h-5 w-5 text-muted-foreground" />;
      title = "No face found in this photo";
      detail = "No clear face was found in it. Try a sharper, front-facing photo.";
      break;
    default:
      title = top ? `Matched ${top.name || top.userId} at ${top.similarity}%` : "No match";
  }

  return (
    <div className={`rounded-md border p-4 space-y-3 ${tone}`}>
      <div className="flex gap-3">
        {icon}
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
      </div>

      {result.matches.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 font-medium">Matched user</th>
              <th className="py-1 font-medium">User ID</th>
              <th className="py-1 font-medium text-right">Similarity</th>
              <th className="py-1 font-medium text-right">Check-in</th>
            </tr>
          </thead>
          <tbody>
            {result.matches.map((m) => (
              <tr key={m.faceId} className="border-t">
                <td className="py-1.5">
                  {m.name || "—"} {m.isExpectedUser && <Badge variant="outline" className="ml-1">this user</Badge>}
                </td>
                <td className="py-1.5 font-mono text-xs">{m.userId || "no record"}</td>
                <td className="py-1.5 text-right">{m.similarity}%</td>
                <td className="py-1.5 text-right">{m.passesCheckIn ? "Accepts" : "Rejects"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FaceIdCheck;
