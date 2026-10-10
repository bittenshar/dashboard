/**
 * What an event actually is, for the admin looking at it: its cover, the
 * description, shows, venue, organiser and tickets, with the decision that
 * goes with them. Approve puts an event live; Stop takes it off the app and
 * tells the organiser why.
 */
import { useState } from "react";
import { Check, CircleSlash, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CentralizedApi } from "@/services/centralizedApi";
import { type ReviewableEvent, MAX_NOTE, coverUrl, dayFmt, inr, reviewStatusOf, showsOf, when } from "@/lib/eventDisplay";

const humanize = (value?: string) => (value ? value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—");
const same = (a: string, b: string) => new Date(a).getTime() === new Date(b).getTime();

const STATUS = {
  pending: { label: "In review", className: "bg-amber-100 text-amber-800", line: "Waiting for your decision. Hidden from the app until you approve it." },
  rejected: { label: "Stopped", className: "bg-red-100 text-red-800", line: "Hidden from the app. Nobody can open or book it." },
  approved: { label: "Live", className: "bg-green-100 text-green-800", line: "Visible in the app and open for booking." },
};

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
    <div className="mt-1 text-sm text-gray-700">{children}</div>
  </div>
);

export default function EventDetailsPanel({ event, onChanged }: { event: ReviewableEvent; onChanged?: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [note, setNote] = useState("");

  const status = reviewStatusOf(event);
  const organiser = typeof event.organizer === "object" ? event.organizer : undefined;
  const shows = showsOf(event);
  const tickets = event.seatings || [];
  const several = shows.length > 1;
  const showOf = (start?: string | null) => (start ? shows.findIndex((d) => same(d.startTime, start)) : -1);

  const decide = async (decision: "approve" | "reject", reason = "") => {
    setBusy(true);
    try {
      await CentralizedApi.events.review(event._id, decision, reason);
      toast({
        title: decision === "approve" ? "Event approved" : "Event stopped",
        description: decision === "approve" ? `${event.name} is now live.` : `${event.name} is off the app. The organiser sees your note.`,
      });
      setStopping(false);
      setNote("");
      onChanged?.();
    } catch (error) {
      toast({ title: "Couldn't save the decision", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white" data-testid="event-details">
      {/* Status and the decision */}
      <div className="flex flex-col gap-3 border-b border-gray-200 p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge className={STATUS[status].className}>{STATUS[status].label}</Badge>
            <p className="text-sm text-gray-600">{STATUS[status].line}</p>
          </div>
          {status === "rejected" && event.review?.note && (
            <p className="mt-2 text-sm text-gray-700"><span className="font-medium">Your note to the organiser:</span> {event.review.note}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {status !== "approved" && (
            <Button type="button" className="bg-green-600 hover:bg-green-700" disabled={busy} onClick={() => decide("approve")}>
              <Check className="mr-1 h-4 w-4" /> Approve
            </Button>
          )}
          {status !== "rejected" && (
            <Button type="button" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" disabled={busy} onClick={() => { setStopping(true); setNote(""); }}>
              <CircleSlash className="mr-1 h-4 w-4" /> {status === "pending" ? "Send back" : "Stop event"}
            </Button>
          )}
        </div>
      </div>

      {/* The event itself */}
      <div className="flex flex-col gap-5 p-5 md:flex-row">
        {event.coverImage && (
          <img src={coverUrl(event.coverImage)} alt="" className="h-48 w-36 shrink-0 rounded-lg bg-gray-100 object-cover" />
        )}
        <div className="min-w-0 flex-1 space-y-4">
          <Block title="About">
            <p className="whitespace-pre-line">{event.description || "—"}</p>
          </Block>
          <div className="grid gap-4 sm:grid-cols-2">
            <Block title={several ? "Shows" : "When"}>
              <ul className="space-y-1">
                {shows.map((d, i) => (
                  <li key={d.startTime}>
                    {several ? `${i + 1}. ` : ""}{when(d.startTime)} to {when(d.endTime)}
                  </li>
                ))}
              </ul>
              {event.isRecurring && (
                <p className="mt-1 text-gray-500">
                  Repeats: {humanize(event.recurringDays || undefined)}
                  {event.recurringEndDate ? `, until ${dayFmt.format(new Date(event.recurringEndDate))}` : ""}
                </p>
              )}
            </Block>
            <Block title="Venue">
              <p>{event.location || "—"}</p>
              {event.locationlink && (
                <a href={event.locationlink} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 hover:underline">
                  Open the map link <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </Block>
            <Block title="Organiser">
              <p>{organiser?.name || "—"}</p>
              <p className="text-gray-500">{[organiser?.email, organiser?.phone].filter(Boolean).join(" · ")}</p>
            </Block>
            <Block title="Type">
              <p>{[humanize(event.eventType), event.language, event.agelimit].filter(Boolean).join(" · ")}</p>
            </Block>
          </div>
        </div>
      </div>

      {/* Tickets */}
      <div className="border-t border-gray-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tickets</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2 font-medium">Ticket</th>
                {several && <th className="pb-2 font-medium">Valid for</th>}
                <th className="pb-2 text-right font-medium">Price</th>
                <th className="pb-2 text-right font-medium">Sold</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-t border-gray-100">
                  <td className="py-2 text-gray-900">
                    {t.seatType}
                    {t.isActive === false && <Badge variant="outline" className="ml-2">Off</Badge>}
                    {t.isHidden && <Badge variant="outline" className="ml-2">Hidden</Badge>}
                  </td>
                  {several && <td className="py-2 text-gray-600">{showOf(t.showStart) >= 0 ? `Show ${showOf(t.showStart) + 1}` : "All shows"}</td>}
                  <td className="py-2 text-right tabular-nums text-gray-900">{t.ticketType === "complimentary" ? "Free" : inr.format(t.price)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-600">{t.seatsSold || 0} of {t.totalSeats}</td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td className="py-2 text-gray-500" colSpan={several ? 4 : 3}>No tickets.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={stopping} onOpenChange={(isOpen) => { if (!isOpen) setStopping(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{status === "pending" ? "Send back to the organiser" : "Stop this event"}</DialogTitle>
            <DialogDescription>
              {status === "pending"
                ? `${event.name} stays hidden. The organiser sees your note, fixes the event and resubmits it.`
                : `${event.name} comes off the app and nobody can book it. Tickets already sold stay valid. The organiser sees your note; when they save a change, it comes back to you for approval.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="stop-note">{status === "pending" ? "What needs to change?" : "Why is it being stopped?"}</Label>
            <Textarea id="stop-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={MAX_NOTE} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStopping(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={!note.trim() || busy} onClick={() => decide("reject", note.trim())}>
              {status === "pending" ? "Send back" : "Stop event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
