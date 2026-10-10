/**
 * Events waiting for review.
 *
 * An event an organiser creates is not live until an admin approves it here,
 * or sends it back with a note saying what to change. Nothing renders when
 * the queue is empty.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, Clock, Undo2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CentralizedApi } from "@/services/centralizedApi";

interface PendingEvent {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  locationlink?: string;
  coverImage?: string;
  eventType?: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  schedule?: Array<{ startTime: string; endTime: string }>;
  seatings?: Array<{ _id: string; seatType: string; price: number; totalSeats: number; ticketType?: string; showStart?: string | null }>;
  organizer?: { name?: string; email?: string; phone?: string } | string;
  review?: { status: string; note?: string; submittedAt?: string };
}

// Times are stored as the organiser typed them, so they are read back in UTC.
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
const when = (value: string) => `${dayFmt.format(new Date(value))}, ${timeFmt.format(new Date(value))}`;
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const MAX_NOTE = 500;

// Covers are stored as a path on the API (/api/images/…) or, rarely, a full link.
const coverUrl = (cover: string) => (cover.startsWith("/api/") ? CentralizedApi.buildUrl(cover.slice(4)) : cover);

export default function EventReviewQueue({ onChanged }: { onChanged?: () => void }) {
  const { toast } = useToast();
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sendingBack, setSendingBack] = useState<PendingEvent | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const response: any = await CentralizedApi.events.awaitingReview();
      setEvents(response?.data?.events || []);
    } catch {
      // The rest of the page still works; the queue just stays as it was.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (event: PendingEvent, decision: "approve" | "reject", reason = "") => {
    setBusyId(event._id);
    try {
      await CentralizedApi.events.review(event._id, decision, reason);
      toast({
        title: decision === "approve" ? "Event approved" : "Sent back to the organiser",
        description: decision === "approve" ? `${event.name} is now live.` : `${event.name} stays hidden until they fix it and resubmit.`,
      });
      setSendingBack(null);
      setNote("");
      await load();
      onChanged?.();
    } catch (error) {
      toast({ title: "Couldn't save the decision", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  if (events.length === 0) return null;

  return (
    <Card className="border-amber-200" data-testid="review-queue">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-amber-600" />
          Waiting for review
          <Badge className="bg-amber-100 text-amber-800">{events.length}</Badge>
        </CardTitle>
        <CardDescription>Events from organisers. They are hidden from the app until you approve them.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => {
          const organiser = typeof event.organizer === "object" ? event.organizer : undefined;
          const shows = event.schedule?.length ? event.schedule : [{ startTime: event.startTime, endTime: event.endTime }];
          const tickets = event.seatings || [];
          const open = openId === event._id;
          return (
            <div key={event._id} className="rounded-lg border border-gray-200 bg-white">
              <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                {event.coverImage && (
                  <img src={coverUrl(event.coverImage)} alt="" className="h-16 w-12 shrink-0 rounded object-cover bg-gray-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{event.name}</p>
                  <p className="text-sm text-gray-600">
                    {organiser?.name || "Unknown organiser"} · {when(shows[0].startTime)}
                    {shows.length > 1 ? ` · ${shows.length} shows` : ""}
                    {event.isRecurring ? " · repeats" : ""}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {event.location} · {tickets.length} ticket type{tickets.length === 1 ? "" : "s"}
                    {event.review?.submittedAt ? ` · submitted ${dayFmt.format(new Date(event.review.submittedAt))}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpenId(open ? null : event._id)} aria-expanded={open}>
                    <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} /> Details
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={busyId === event._id} onClick={() => { setSendingBack(event); setNote(""); }}>
                    <Undo2 className="mr-1 h-4 w-4" /> Send back
                  </Button>
                  <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700" disabled={busyId === event._id} onClick={() => decide(event, "approve")}>
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                </div>
              </div>

              {open && (
                <div className="space-y-4 border-t border-gray-100 p-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">About</p>
                    <p className="mt-1 whitespace-pre-line text-gray-700">{event.description}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shows</p>
                      <ul className="mt-1 space-y-1 text-gray-700">
                        {shows.map((d) => <li key={d.startTime}>{when(d.startTime)} to {when(d.endTime)}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tickets</p>
                      <ul className="mt-1 space-y-1 text-gray-700">
                        {tickets.map((t) => (
                          <li key={t._id}>
                            {t.seatType} · {t.ticketType === "complimentary" ? "Free" : inr.format(t.price)} · {t.totalSeats} available
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Venue</p>
                      <p className="mt-1 text-gray-700">{event.location}</p>
                      {event.locationlink && (
                        <a href={event.locationlink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open the map link</a>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Organiser</p>
                      <p className="mt-1 text-gray-700">{[organiser?.name, organiser?.email, organiser?.phone].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>

      <Dialog open={Boolean(sendingBack)} onOpenChange={(isOpen) => { if (!isOpen) setSendingBack(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send back to the organiser</DialogTitle>
            <DialogDescription>
              {sendingBack?.name} stays hidden. The organiser sees your note, fixes the event and resubmits it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="review-note">What needs to change?</Label>
            <Textarea id="review-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={MAX_NOTE} placeholder="e.g. The venue address is incomplete, and the cover image is blurred." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSendingBack(null)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={!note.trim() || busyId === sendingBack?._id} onClick={() => sendingBack && decide(sendingBack, "reject", note.trim())}>
              Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
