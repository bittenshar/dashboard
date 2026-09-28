// src/components/Notifications.tsx
//
// "Notifications" tab: messages that go beyond face checks. For now, telling
// everyone to update the app — each phone is sent to its own store.

import { useEffect, useState } from "react";
import { Apple, Bell, ExternalLink, Loader2, Radar, Save, Send, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { CentralizedApi } from "@/services/centralizedApi";

type Platform = "ios" | "android";

interface PlatformReach {
  phones: number;
  users: number;
  storeUrl: string | null;
  latestVersion: string | null;
  forceUpdate: boolean;
}

const PLATFORM_INFO: Record<Platform, { label: string; store: string; icon: typeof Apple }> = {
  ios: { label: "iPhone", store: "App Store", icon: Apple },
  android: { label: "Android", store: "Play Store", icon: Smartphone },
};

interface VersionSettings {
  latestVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
}

const toSettings = (r: PlatformReach): VersionSettings => ({
  latestVersion: r.latestVersion || "",
  forceUpdate: r.forceUpdate,
  storeUrl: r.storeUrl || "",
});

type ReachStatus = "reachable" | "app_removed" | "logged_out" | "no_phone" | "error";

interface ReachRow {
  _id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: ReachStatus;
  platforms: Platform[];
  detail: string | null;
}

interface ReachResult {
  checkedAt: string;
  summary: Partial<Record<ReachStatus, number>>;
  phonesChecked: number;
  deadRemoved: number;
  loggedOutPhones: number;
  users: ReachRow[];
}

const REACH_INFO: Record<ReachStatus, { label: string; style: string; hint: string }> = {
  reachable: { label: "Reachable", style: "bg-green-100 text-green-800", hint: "Gets push notifications" },
  app_removed: {
    label: "App removed",
    style: "bg-red-100 text-red-700",
    hint: "App deleted, reinstalled or its data cleared — their old registration was removed",
  },
  logged_out: { label: "Logged out", style: "bg-amber-100 text-amber-800", hint: "Signed out of the app" },
  no_phone: {
    label: "No phone",
    style: "bg-gray-100 text-gray-600",
    hint: "No phone registered — never allowed notifications, or logged out / removed before this was tracked",
  },
  error: { label: "Push error", style: "bg-purple-100 text-purple-800", hint: "Firebase refused their phone for another reason" },
};

const REACH_ORDER: ReachStatus[] = ["reachable", "app_removed", "logged_out", "no_phone", "error"];

/**
 * Who a push can reach right now. Every registered phone is tested with a
 * Firebase dry run — nothing is delivered — and dead registrations removed.
 */
const ReachCheckCard = () => {
  const { toast } = useToast();
  const [result, setResult] = useState<ReachResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState<ReachStatus | "all">("all");

  const runCheck = async () => {
    setChecking(true);
    try {
      const response: any = await CentralizedApi.broadcasts.reachCheck();
      setResult(response?.data || null);
      setFilter("all");
    } catch (error) {
      toast({
        title: "Couldn't check the phones",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const rows = (result?.users || []).filter((r) => filter === "all" || r.status === filter);

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-lg">Who can get notifications</CardTitle>
        <CardDescription>
          Checks every registered phone with Firebase without sending anything, and shows which users a push can reach
          — and why not for the rest. Registrations of deleted or reinstalled apps are cleaned up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runCheck} disabled={checking}>
          {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Radar className="h-4 w-4 mr-2" />}
          {result ? "Check again" : "Check all phones"}
        </Button>

        {result && (
          <>
            <p className="text-xs text-muted-foreground">
              Checked {result.phonesChecked} phone{result.phonesChecked === 1 ? "" : "s"} at{" "}
              {new Date(result.checkedAt).toLocaleTimeString()}
              {result.deadRemoved ? ` · removed ${result.deadRemoved} dead registration${result.deadRemoved === 1 ? "" : "s"}` : ""}
              {result.loggedOutPhones ? ` · ${result.loggedOutPhones} phone${result.loggedOutPhones === 1 ? " is" : "s are"} signed out of every account` : ""}
            </p>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
              >
                All {result.users.length}
              </button>
              {REACH_ORDER.filter((st) => result.summary[st]).map((st) => (
                <button
                  key={st}
                  type="button"
                  title={REACH_INFO[st].hint}
                  onClick={() => setFilter(st)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${filter === st ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  {REACH_INFO[st].label} {result.summary[st]}
                </button>
              ))}
            </div>

            {filter !== "all" && <p className="text-xs text-muted-foreground">{REACH_INFO[filter].hint}.</p>}

            <div className="max-h-[50vh] overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">User</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="px-3 py-2">
                        {r.name || "Unnamed user"}
                        {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {r.phone || "—"}
                        {r.platforms.length > 0 && (
                          <div className="text-muted-foreground">
                            {r.platforms.map((p) => PLATFORM_INFO[p].label).join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${REACH_INFO[r.status].style}`}>
                          {REACH_INFO[r.status].label}
                        </span>
                        {r.detail && <div className="mt-0.5 text-xs text-muted-foreground">{r.detail}</div>}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-xs text-muted-foreground">
                        Nobody in this group.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const DEFAULT_TITLE = "🚀 Update Whooppe";
const DEFAULT_BODY = "A new version of Whooppe is out with fixes and improvements. Update now to keep your tickets and face check-in working smoothly.";

const Notifications = () => {
  const { toast } = useToast();

  const [reach, setReach] = useState<Record<Platform, PlatformReach> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<Record<Platform, boolean>>({ ios: true, android: true });
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  // Editable copy of the version settings; `reach` holds what's saved.
  const [versions, setVersions] = useState<Record<Platform, VersionSettings> | null>(null);
  const [savingVersions, setSavingVersions] = useState(false);

  const loadReach = async () => {
    setLoadError(null);
    try {
      const response: any = await CentralizedApi.broadcasts.appUpdatePreview();
      const platformsReach = response?.data?.platforms || null;
      setReach(platformsReach);
      if (platformsReach) {
        setVersions({ ios: toSettings(platformsReach.ios), android: toSettings(platformsReach.android) });
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load");
    }
  };

  // Only what differs from the saved settings is sent.
  const versionChanges = (() => {
    if (!reach || !versions) return {};
    const changes: Partial<Record<Platform, Partial<VersionSettings>>> = {};
    (Object.keys(PLATFORM_INFO) as Platform[]).forEach((p) => {
      const saved = toSettings(reach[p]);
      const edited = versions[p];
      const diff: Partial<VersionSettings> = {};
      if (edited.latestVersion.trim() !== saved.latestVersion) diff.latestVersion = edited.latestVersion.trim();
      if (edited.forceUpdate !== saved.forceUpdate) diff.forceUpdate = edited.forceUpdate;
      if (edited.storeUrl.trim() !== saved.storeUrl) diff.storeUrl = edited.storeUrl.trim();
      if (Object.keys(diff).length) changes[p] = diff;
    });
    return changes;
  })();
  const hasVersionChanges = Object.keys(versionChanges).length > 0;

  const updateVersion = (p: Platform, field: keyof VersionSettings, value: string | boolean) =>
    setVersions((prev) => (prev ? { ...prev, [p]: { ...prev[p], [field]: value } } : prev));

  const saveVersions = async () => {
    setSavingVersions(true);
    try {
      await CentralizedApi.broadcasts.saveAppVersion(versionChanges);
      toast({
        title: "App version settings saved",
        description: "The app picks them up the next time it starts.",
      });
      await loadReach();
    } catch (error) {
      toast({
        title: "Couldn't save the version settings",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingVersions(false);
    }
  };

  useEffect(() => {
    loadReach();
  }, []);

  const chosen = (Object.keys(platforms) as Platform[]).filter((p) => platforms[p]);
  const phoneCount = reach ? chosen.reduce((sum, p) => sum + reach[p].phones, 0) : 0;
  const missingStore = reach ? chosen.filter((p) => !reach[p].storeUrl) : [];
  const canSend = chosen.length > 0 && phoneCount > 0 && missingStore.length === 0 && title.trim() && body.trim() && !sending;

  const send = async () => {
    setSending(true);
    try {
      const response: any = await CentralizedApi.broadcasts.sendAppUpdate({
        title: title.trim(),
        body: body.trim(),
        platforms: chosen,
      });
      const t = response?.data || {};
      toast({
        title: `Update notice sent to ${t.sent ?? 0} phone${t.sent === 1 ? "" : "s"}`,
        description: `${t.users ?? 0} users also see it in the app's Notifications.${
          t.removedDeadPhones ? ` ${t.removedDeadPhones} phone${t.removedDeadPhones === 1 ? " was" : "s were"} no longer registered and have been removed.` : ""
        }${
          t.failed
            ? ` ${t.failed} failed: ${Object.entries(t.failureReasons || {})
                .map(([reason, count]) => `${reason} (${count})`)
                .join(", ")}.`
            : ""
        }`,
      });
      setConfirmOpen(false);
      loadReach();
    } catch (error) {
      toast({
        title: "Couldn't send the update notice",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="h-6 w-6" /> Notifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Messages to app users. To message only the users without a selfie or DigiLocker, use Face ID Check.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">App versions</CardTitle>
          <CardDescription>
            The app checks these every time it starts. When the latest version here is newer than the one installed, it
            shows its update screen with the store link. With force update on, they must update before using the app.
            Raise the version after the new release is live in the store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!versions ? (
            !loadError && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {(Object.keys(PLATFORM_INFO) as Platform[]).map((p) => {
                  const info = PLATFORM_INFO[p];
                  const Icon = info.icon;
                  const v = versions[p];
                  return (
                    <div key={p} className="space-y-3 rounded-md border p-4">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <Icon className="h-4 w-4" /> {info.label}
                        {versionChanges[p] && <Badge variant="outline" className="ml-auto">edited</Badge>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${p}-version`} className="text-xs">Latest version</Label>
                        <Input
                          id={`${p}-version`}
                          placeholder="e.g. 1.2.0"
                          value={v.latestVersion}
                          onChange={(e) => updateVersion(p, "latestVersion", e.target.value)}
                        />
                      </div>
                      <label className="flex items-center justify-between gap-2 text-sm">
                        <span>
                          Force update
                          <span className="block text-xs text-muted-foreground">
                            {v.forceUpdate ? "Older versions must update before using the app" : "Update can be skipped"}
                          </span>
                        </span>
                        <Switch checked={v.forceUpdate} onCheckedChange={(checked) => updateVersion(p, "forceUpdate", checked)} />
                      </label>
                      <div className="space-y-1">
                        <Label htmlFor={`${p}-store`} className="text-xs">{info.store} link</Label>
                        <Input
                          id={`${p}-store`}
                          value={v.storeUrl}
                          onChange={(e) => updateVersion(p, "storeUrl", e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveVersions} disabled={!hasVersionChanges || savingVersions}>
                  {savingVersions ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save version settings
                </Button>
                {hasVersionChanges && (
                  <Button variant="ghost" onClick={() => reach && setVersions({ ios: toSettings(reach.ios), android: toSettings(reach.android) })}>
                    Undo changes
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Ask users to update the app</CardTitle>
          <CardDescription>
            Every registered phone gets a push. iPhones are pointed to the App Store and Android phones to the Play
            Store. When they open the app, its update check shows the update screen for their store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadError && <p className="text-sm text-red-600">Couldn't load phone counts: {loadError}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PLATFORM_INFO) as Platform[]).map((p) => {
              const info = PLATFORM_INFO[p];
              const r = reach?.[p];
              const Icon = info.icon;
              return (
                <label
                  key={p}
                  className={`flex cursor-pointer gap-3 rounded-md border p-4 ${platforms[p] ? "border-primary bg-primary/5" : ""}`}
                >
                  <Checkbox
                    checked={platforms[p]}
                    onCheckedChange={(v) => setPlatforms((prev) => ({ ...prev, [p]: v === true }))}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4" /> {info.label}
                    </div>
                    {r ? (
                      <>
                        <p>
                          {r.phones} phone{r.phones === 1 ? "" : "s"} · {r.users} user{r.users === 1 ? "" : "s"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Latest version {r.latestVersion || "—"}{" "}
                          {r.forceUpdate && <Badge variant="outline" className="ml-1">force update on</Badge>}
                        </p>
                        {r.storeUrl ? (
                          <a
                            href={r.storeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs underline break-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {info.store} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-xs text-red-600">No {info.store} link saved</p>
                        )}
                        {p === "android" && (
                          <p className="text-xs text-muted-foreground">Includes phones that don't report a platform.</p>
                        )}
                      </>
                    ) : (
                      !loadError && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="update-title">Title</Label>
            <Input id="update-title" maxLength={65} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="update-body">Message</Label>
            <Textarea id="update-body" rows={3} maxLength={240} value={body} onChange={(e) => setBody(e.target.value)} />
            <p className="text-xs text-muted-foreground text-right">{body.length}/240</p>
          </div>

          {missingStore.length > 0 && (
            <p className="text-sm text-red-600">
              Save a store link for {missingStore.map((p) => PLATFORM_INFO[p].label).join(" and ")} before sending.
            </p>
          )}

          <Button disabled={!canSend} onClick={() => setConfirmOpen(true)}>
            <Send className="h-4 w-4 mr-2" /> Send to {phoneCount} phone{phoneCount === 1 ? "" : "s"}
          </Button>
        </CardContent>
      </Card>

      <ReachCheckCard />

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !sending && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send the update notice to {phoneCount} phones?</AlertDialogTitle>
            <AlertDialogDescription>
              "{title.trim()}" goes to every registered {chosen.map((p) => PLATFORM_INFO[p].label).join(" and ")} phone
              right away. This can't be taken back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open until the request finishes.
                e.preventDefault();
                send();
              }}
              disabled={sending}
            >
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Notifications;
