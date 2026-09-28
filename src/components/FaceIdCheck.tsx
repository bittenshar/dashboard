// src/components/FaceIdCheck.tsx
//
// "Face ID Check" tab: for any user, test a photo against AWS to see whether it
// comes back as that same user, and remove a face ID whose photo is too poor
// to rely on. The test is search-only on the backend — the photo is never
// stored or indexed, so testing can't change who matches whom.

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ImageOff,
  Loader2,
  ScanFace,
  Search,
  Trash2,
  Upload,
  UserX,
  XCircle,
} from "lucide-react";
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

const mongoId = (u: AnyUser): string => u?._id || u?.id || "";
const displayName = (u: AnyUser): string => u?.name || u?.fullName || u?.digilockerName || "Unnamed user";

/** api.users arrives in a few shapes depending on the endpoint's envelope. */
const unwrapUsers = (raw: unknown): AnyUser[] => {
  if (Array.isArray(raw)) return raw;
  const obj = raw as AnyUser | null;
  if (Array.isArray(obj?.users)) return obj!.users;
  if (Array.isArray(obj?.data?.users)) return obj!.data.users;
  if (Array.isArray(obj?.data)) return obj!.data;
  return [];
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

  const [removeOpen, setRemoveOpen] = useState(false);
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [removing, setRemoving] = useState(false);

  const users = useMemo(() => unwrapUsers(api.users), [api.users]);

  useEffect(() => {
    if (!users.length) api.fetchUsers?.();
    // Only on first open; the list refreshes elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke the preview's object URL when it's replaced or the tab closes.
  useEffect(() => () => { if (testPreview) URL.revokeObjectURL(testPreview); }, [testPreview]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? users.filter((u) =>
          [displayName(u), u.email, u.phone, u.userId].some((v) => String(v || "").toLowerCase().includes(q))
        )
      : users;
    return list.slice(0, 50);
  }, [users, query]);

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
      const response = await CentralizedApi.faceReview.search(testFile, selected.userId);
      setResult(response.data);
    } catch (error) {
      toast({ title: "Test failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const removeFace = async () => {
    if (!selected) return;
    setRemoving(true);
    try {
      const response: any = await CentralizedApi.faceReview.removeFace(mongoId(selected), reason.trim());
      const { facesDeleted = 0, photosDeleted = 0 } = response?.data || {};
      toast({
        title: "Face ID removed",
        description: `${facesDeleted} face${facesDeleted === 1 ? "" : "s"} deleted from AWS and ${photosDeleted} photo${photosDeleted === 1 ? "" : "s"} removed. The user has been asked for a new selfie.`,
      });
      setRemoveOpen(false);
      setReason(DEFAULT_REASON);
      api.fetchUsers?.();
      await loadUser(selected);
    } catch (error) {
      toast({ title: "Couldn't remove the face ID", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  };

  const faceUser = faceInfo?.user || selected || {};
  const hasFaceId = Boolean(faceInfo?.hasFaceId);
  const canRemove = hasFaceId || Boolean(faceUser.pendingFacePhoto?.s3Key);

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
            <CardTitle className="text-base">Users</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Name, phone, email or user ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto space-y-1 p-2">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground p-3">
                {users.length
                  ? "No users match this search."
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
                  <div className="font-medium truncate">{displayName(u)}</div>
                  <div className={`text-xs truncate ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {u.phone || u.email || u.userId}
                  </div>
                </button>
              );
            })}
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
                      {faceUser.userId || "No user ID"} · {faceUser.phone || faceUser.email || "—"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">{faceUser.verificationStatus || "pending"}</Badge>
                    {loadingUser ? (
                      <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Checking AWS</Badge>
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
                    <span>Couldn't ask AWS about this user's face ID — {faceInfo.faceLookupError}</span>
                  </p>
                )}
                {faceUser.faceReviewNote && (
                  <p className="text-xs text-muted-foreground mt-1">Last note: {faceUser.faceReviewNote}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PhotoBox label="Selfie on file" url={photos.selfie} loading={loadingUser} />
                  <PhotoBox label="DigiLocker photo" url={photos.digilocker} loading={loadingUser} />
                </div>
              </CardContent>
            </Card>

            {/* ---------------- Test ---------------- */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test a photo</CardTitle>
                <CardDescription>
                  Upload the same photo or any other photo of this person. AWS says which registered user it
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
                  <Button onClick={runTest} disabled={!testFile || testing || !faceUser.userId}>
                    {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanFace className="h-4 w-4 mr-2" />}
                    Run test
                  </Button>
                  {!faceUser.userId && (
                    <span className="text-xs text-muted-foreground">This user has no user ID, so nothing can match them.</span>
                  )}
                </div>

                {testPreview && (
                  <img src={testPreview} alt="Photo to test" className="h-40 w-40 rounded-md object-cover border" />
                )}

                {result && <TestVerdict result={result} expectedName={displayName(faceUser)} hasFaceId={hasFaceId} />}
              </CardContent>
            </Card>

            {/* ---------------- Remove ---------------- */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-700">Remove face ID</CardTitle>
                <CardDescription>
                  If the selfie is unclear, remove the face ID completely: it's deleted from AWS, the user's photos are
                  deleted, and they're asked to upload a new selfie, which then waits for approval like any other.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" disabled={!canRemove || loadingUser} onClick={() => setRemoveOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Remove face ID
                </Button>
                {!canRemove && !loadingUser && (
                  <p className="text-xs text-muted-foreground mt-2">This user has no face ID or waiting selfie to remove.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AlertDialog open={removeOpen} onOpenChange={(open) => !removing && setRemoveOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {displayName(faceUser)}'s face ID?</AlertDialogTitle>
            <AlertDialogDescription>
              Their face is deleted from AWS and their selfies are deleted. Until they upload a new selfie and it's
              approved, face check-in won't recognise them. This can't be undone.
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
              Remove face ID
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const PhotoBox = ({ label, url, loading }: { label: string; url: string | null; loading: boolean }) => {
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
          <a href={url} target="_blank" rel="noreferrer" className="h-full w-full">
            <img src={url} alt={label} className="h-full w-full object-cover" />
          </a>
        )}
      </div>
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
      detail = `AWS thinks this photo is someone else, not ${expectedName}. At check-in this person would be recognised as that other user.`;
      break;
    case "no_match":
      tone = "border-amber-200 bg-amber-50";
      icon = <UserX className="h-5 w-5 text-amber-600" />;
      title = "No match";
      detail = hasFaceId
        ? `AWS found nobody like this photo, not even ${expectedName}. If it's really them, their stored face may be poor — consider replacing it.`
        : `${expectedName} has no face ID yet, so there is nothing for this photo to match.`;
      break;
    case "no_face":
      icon = <ImageOff className="h-5 w-5 text-muted-foreground" />;
      title = "No face found in this photo";
      detail = "AWS couldn't find a clear face. Try a sharper, front-facing photo.";
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
