/**
 * The notification bell for one event: what has gone out, and sending the
 * "new event" announcement or an "event updated" push by hand.
 */
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CentralizedApi } from "@/services/centralizedApi";

type Kind = "announcement" | "update";

interface Wording {
  title: string;
  body: string;
}

interface Sent extends Wording {
  sentAt: string;
  sentTo: number;
}

interface Status {
  notifications: { announcement?: Sent; lastUpdate?: Sent };
  audience: { appUsers: number; ticketHolders: number };
  defaults: { announcement: Wording; update: Wording };
}

interface Props {
  event?: { _id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_DRAFT: Wording = { title: "", body: "" };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const EventNotificationsDialog = ({ event, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<Kind, Wording>>({ announcement: EMPTY_DRAFT, update: EMPTY_DRAFT });
  const [confirming, setConfirming] = useState<Kind | null>(null);
  const [sending, setSending] = useState<Kind | null>(null);

  const load = useCallback(async () => {
    if (!event) return;
    setLoading(true);
    setError("");
    try {
      const response = (await CentralizedApi.eventNotifications.get(event._id)) as { data: Status };
      setStatus(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    if (open) {
      setDrafts({ announcement: EMPTY_DRAFT, update: EMPTY_DRAFT });
      load();
    }
  }, [open, load]);

  const audienceFor = (kind: Kind) =>
    kind === "announcement"
      ? plural(status?.audience.appUsers ?? 0, "app user")
      : plural(status?.audience.ticketHolders ?? 0, "ticket holder");

  // What will actually go out: the admin's text, else the standard wording.
  const outgoing = (kind: Kind): Wording => ({
    title: drafts[kind].title.trim() || status?.defaults[kind].title || "",
    body: drafts[kind].body.trim() || status?.defaults[kind].body || "",
  });

  const send = async (kind: Kind) => {
    if (!event) return;
    setSending(kind);
    try {
      const { title, body } = drafts[kind];
      const response = (await CentralizedApi.eventNotifications.send(event._id, {
        kind,
        ...(title.trim() && { title: title.trim() }),
        ...(body.trim() && { body: body.trim() }),
      })) as { data: { sent: Sent } };
      toast({
        title: "Notification sent",
        description: `Sent to ${plural(response.data.sent.sentTo, kind === "announcement" ? "app user" : "ticket holder")}.`,
      });
      setDrafts((prev) => ({ ...prev, [kind]: EMPTY_DRAFT }));
      await load();
    } catch (err) {
      toast({
        title: "Couldn't send the notification",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const section = (kind: Kind, heading: string, hint: string, sent?: Sent) => {
    const reach = kind === "announcement" ? status?.audience.appUsers : status?.audience.ticketHolders;
    const defaults = status?.defaults[kind];
    return (
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <div>
          <h3 className="font-medium text-gray-900">{heading}</h3>
          <p className="text-sm text-gray-500">{hint}</p>
        </div>

        {sent?.sentAt ? (
          <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>
                {kind === "announcement" ? "Sent" : "Last sent"} {new Date(sent.sentAt).toLocaleString()} to{" "}
                {plural(sent.sentTo, kind === "announcement" ? "app user" : "ticket holder")}
              </p>
              <p className="text-green-700">“{sent.title}: {sent.body}”</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{kind === "announcement" ? "Not sent yet." : "No update sent yet."}</p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-title`}>Title (optional)</Label>
          <Input
            id={`${kind}-title`}
            maxLength={100}
            value={drafts[kind].title}
            placeholder={defaults?.title}
            onChange={(e) => setDrafts((prev) => ({ ...prev, [kind]: { ...prev[kind], title: e.target.value } }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-body`}>{kind === "update" ? "What changed? (optional)" : "Message (optional)"}</Label>
          <Textarea
            id={`${kind}-body`}
            rows={2}
            maxLength={500}
            value={drafts[kind].body}
            placeholder={kind === "update" ? "e.g. The venue has moved to Hall B" : defaults?.body}
            onChange={(e) => setDrafts((prev) => ({ ...prev, [kind]: { ...prev[kind], body: e.target.value } }))}
          />
        </div>

        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          disabled={!reach || sending !== null}
          onClick={() => setConfirming(kind)}
        >
          {sending === kind ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {!reach
            ? kind === "announcement" ? "No app users to notify yet" : "No ticket holders yet"
            : `${sent?.sentAt && kind === "announcement" ? "Send again" : "Send"} to ${audienceFor(kind)}`}
        </Button>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Notifications
            </DialogTitle>
            <DialogDescription>{event?.name}</DialogDescription>
          </DialogHeader>

          {loading && !status ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" onClick={load}>Try again</Button>
            </div>
          ) : status ? (
            <div className="space-y-4">
              {section(
                "announcement",
                "New event announcement",
                "A push to everyone with the app installed.",
                status.notifications.announcement,
              )}
              {section(
                "update",
                "Update to ticket holders",
                "A push to everyone with a confirmed ticket for this event.",
                status.notifications.lastUpdate,
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirming !== null} onOpenChange={(isOpen) => !isOpen && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send to {confirming ? audienceFor(confirming) : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>This push goes out straight away and can't be recalled.</p>
                {confirming && (
                  <div className="rounded-md bg-gray-50 p-3 text-gray-800">
                    <p className="font-medium">{outgoing(confirming).title}</p>
                    <p>{outgoing(confirming).body}</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                const kind = confirming;
                setConfirming(null);
                if (kind) send(kind);
              }}
            >
              Send now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventNotificationsDialog;
