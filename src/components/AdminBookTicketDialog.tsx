// src/components/AdminBookTicketDialog.tsx
//
// Book tickets for a user without payment. The backend confirms the booking
// and issues and sends one ticket (number + QR) per attendee, exactly as for a
// paid booking, and enforces one ticket per person per event.
//
// Opened from a user (pick the event) or from an event (pick the user).

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Search, Ticket, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { CentralizedApi } from "@/services/centralizedApi";

// The backend caps one booking at 10 tickets.
const MAX_TICKETS = 10;

interface Seating {
  _id: string;
  seatType: string;
  price: number;
  totalSeats: number;
  seatsSold?: number;
  lockedSeats?: number;
  isActive?: boolean;
}

interface EventOption {
  _id: string;
  name: string;
  date: string;
  location?: string;
  seatings?: Seating[];
}

interface Attendee {
  name: string;
  phone: string;
}

const seatsLeft = (s: Seating) => s.totalSeats - (s.seatsSold || 0) - (s.lockedSeats || 0);

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const nameOf = (u: any): string =>
  u?.name || u?.fullName || [u?.firstname, u?.lastname].filter(Boolean).join(" ") || "";

/** Last 10 digits: "+91 98765 43210", "09876543210" and "9876543210" all match. */
const phoneKey = (value: string) => String(value || "").replace(/\D/g, "").slice(-10);

/** api.users arrives in a few shapes depending on the endpoint's envelope. */
const unwrapUsers = (raw: any): any[] =>
  Array.isArray(raw) ? raw : raw?.users || raw?.data?.users || (Array.isArray(raw?.data) ? raw.data : []);

interface Props {
  /** Book for this user — the admin picks the event. */
  user?: any;
  /** Book on this event — the admin picks the user. */
  event?: { _id?: string; id?: string; name?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful booking, e.g. to reload the user's tickets. */
  onBooked?: () => void;
}

const AdminBookTicketDialog = ({ user: fixedUser, event: fixedEvent, open, onOpenChange, onBooked }: Props) => {
  const { toast } = useToast();
  const api = useApiContext();

  const fixedEventId = fixedEvent?._id || fixedEvent?.id || "";
  const [pickedUser, setPickedUser] = useState<any>(null);
  const [userQuery, setUserQuery] = useState("");
  const user = fixedUser || pickedUser;

  const userName: string = nameOf(user);
  const userPhone: string = user?.phone || "";

  const allUsers = useMemo(() => unwrapUsers(api.users), [api.users]);
  const userMatches = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return [];
    return allUsers
      .filter((u) => [nameOf(u), u.phone, u.email].some((v) => String(v || "").toLowerCase().includes(q)))
      .slice(0, 8);
  }, [allUsers, userQuery]);

  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [eventId, setEventId] = useState("");
  const [seatingId, setSeatingId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Whether the user is one of the ticket holders. Off = the booking sits on
  // their account but every ticket is for someone else.
  const [userAttends, setUserAttends] = useState(true);
  const [heldTicket, setHeldTicket] = useState<{ bookedAt?: string } | null>(null);
  const [checkingHeld, setCheckingHeld] = useState(false);

  const usersByPhone = useMemo(() => {
    const map = new Map<string, any>();
    allUsers.forEach((u) => u.phone && map.set(phoneKey(u.phone), u));
    return map;
  }, [allUsers]);

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setEventId(fixedEventId);
    setSeatingId("");
    setQuantity(1);
    setAttendees([]);
    setNotes("");
    setPickedUser(null);
    setUserQuery("");
    setUserAttends(true);
    // Also used to recognise guests who already have a Whooppe account.
    if (allUsers.length === 0) api.fetchUsers?.();

    let cancelled = false;
    (async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        // clientTracking=1: an admin browsing events must not count towards
        // the organiser's impressions or views.
        if (fixedEventId) {
          // Fetched fresh rather than taken from the list, for current seat counts.
          const response: any = await CentralizedApi.get(`/events/${encodeURIComponent(fixedEventId)}?clientTracking=1`);
          const one: EventOption | undefined = response?.data?.event;
          if (!cancelled) setEvents(one ? [one] : []);
        } else {
          const response: any = await CentralizedApi.get("/events/?limit=200&clientTracking=1");
          const list: EventOption[] = response?.data?.events || response?.events || [];
          const today = startOfToday();
          const upcoming = list
            .filter((e) => e.date && new Date(e.date) >= today && (e.seatings || []).length > 0)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          if (!cancelled) setEvents(upcoming);
        }
      } catch (error) {
        if (!cancelled) setEventsError(error instanceof Error ? error.message : "Could not load events");
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Reset only when the dialog opens, not whenever the user list refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedEventId]);

  const event = useMemo(() => events.find((e) => e._id === eventId) || null, [events, eventId]);
  const seatings = useMemo(() => (event?.seatings || []).filter((s) => s.isActive !== false), [event]);
  const seating = useMemo(() => seatings.find((s) => s._id === seatingId) || null, [seatings, seatingId]);
  const maxQuantity = seating ? Math.max(0, Math.min(MAX_TICKETS, seatsLeft(seating))) : MAX_TICKETS;

  // One ticket per person per event: if the user already holds one, this
  // booking can only be for other people. Checked up front rather than left
  // to the backend's refusal.
  const userKey = user?._id || user?.id || "";
  useEffect(() => {
    setHeldTicket(null);
    if (!open || !userKey || !event?._id) return;
    let cancelled = false;
    (async () => {
      setCheckingHeld(true);
      try {
        const response: any = await CentralizedApi.tickets.getByUserId(userKey);
        const held = (response?.data?.bookings || []).find(
          (b: any) =>
            String(b.eventId?._id || b.eventId) === String(event._id) &&
            ["confirmed", "used", "temporary"].includes(b.status) &&
            // Their own seat: named on it, or an older booking with no names.
            (b.myTicket || !(b.attendees || []).length)
        );
        if (!cancelled) {
          setHeldTicket(held || null);
          if (held) setUserAttends(false);
        }
      } catch {
        // Unknown — the backend still enforces the rule on submit.
      } finally {
        if (!cancelled) setCheckingHeld(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userKey, event?._id]);

  // A single ticket for the user themselves needs no names — the backend uses
  // their account. Anything else lists every ticket holder, the user first
  // when they're attending.
  const needsNames = quantity > 1 || !userAttends;
  useEffect(() => {
    if (!needsNames) {
      setAttendees([]);
      return;
    }
    setAttendees((prev) =>
      Array.from({ length: quantity }, (_, i) =>
        userAttends && i === 0
          ? { name: userName, phone: userPhone }
          : prev[i] && !(prev[i].phone && phoneKey(prev[i].phone) === phoneKey(userPhone))
            ? prev[i]
            : { name: "", phone: "" }
      )
    );
  }, [needsNames, quantity, userAttends, userName, userPhone]);

  const updateAttendee = (index: number, field: keyof Attendee, value: string) =>
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));

  const missingAttendee = needsNames && attendees.some((a) => !a.name.trim() || !a.phone.trim());
  // With the user not attending, their own number on a row would make them a
  // ticket holder after all — which the backend refuses if they hold one.
  const ownNumberAsGuest =
    !userAttends && Boolean(userPhone) && attendees.some((a) => phoneKey(a.phone) === phoneKey(userPhone));
  const canSubmit = Boolean(
    user && event && seating && quantity >= 1 && quantity <= maxQuantity && !missingAttendee &&
      !(ownNumberAsGuest && heldTicket) && !submitting
  );

  const submit = async () => {
    if (!user || !event || !seating) return;
    setSubmitting(true);
    try {
      const response: any = await CentralizedApi.tickets.adminBook({
        userId: user._id || user.id,
        eventId: event._id,
        seatingId: seating._id,
        seatType: seating.seatType,
        quantity,
        ...(needsNames ? { attendees: attendees.map((a) => ({ name: a.name.trim(), phone: a.phone.trim() })) } : {}),
        ...(notes.trim() ? { adminNotes: notes.trim() } : {}),
      });
      const issued: any[] = response?.data?.booking?.attendees || [];
      const numbers = issued.map((a) => a.ticketNumber).filter(Boolean).join(", ");
      toast({
        title: `Booked ${quantity} ticket${quantity === 1 ? "" : "s"} for ${event.name}`,
        description: numbers
          ? `Ticket ${numbers}. Sent to the ticket holder${quantity === 1 ? "" : "s"} by WhatsApp/SMS/email.`
          : "The booking is confirmed.",
      });
      onOpenChange(false);
      onBooked?.();
    } catch (error) {
      toast({
        title: "Couldn't book the ticket",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {fixedUser ? `Book ticket for ${userName || "this user"}` : `Book ticket${fixedEvent?.name ? ` — ${fixedEvent.name}` : ""}`}
          </DialogTitle>
          <DialogDescription>
            No payment is taken. The tickets are issued straight away and sent to each ticket holder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!fixedUser && (
            <div className="space-y-2">
              <Label>User</Label>
              {pickedUser ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{nameOf(pickedUser) || "Unnamed user"}</div>
                    <div className="text-xs text-muted-foreground">{pickedUser.phone || pickedUser.email}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPickedUser(null)} aria-label="Choose another user">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Search by name, phone or email"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {userQuery.trim() && (
                    <div className="max-h-48 overflow-y-auto rounded-md border">
                      {userMatches.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          {allUsers.length ? "No users match." : "Loading users…"}
                        </p>
                      ) : (
                        userMatches.map((u) => (
                          <button
                            key={u._id || u.id}
                            type="button"
                            onClick={() => setPickedUser(u)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <div className="font-medium">{nameOf(u) || "Unnamed user"}</div>
                            <div className="text-xs text-muted-foreground">{u.phone || u.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Event</Label>
            {eventsLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading events…
              </p>
            ) : eventsError ? (
              <p className="text-sm text-red-600">Couldn't load events: {eventsError}</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events with seats to book.</p>
            ) : fixedEventId ? (
              <p className="text-sm font-medium">
                {event?.name} · {event?.date ? new Date(event.date).toLocaleDateString(undefined, { dateStyle: "medium" }) : ""}
              </p>
            ) : (
              <Select
                value={eventId}
                onValueChange={(value) => {
                  setEventId(value);
                  setSeatingId("");
                  setQuantity(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e._id} value={e._id}>
                      {e.name} · {new Date(e.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {event?.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
          </div>

          {event && (
            <div className="space-y-2">
              <Label>Seat type</Label>
              {seatings.length === 0 ? (
                <p className="text-sm text-muted-foreground">This event has no seat types on sale.</p>
              ) : (
                <Select
                  value={seatingId}
                  onValueChange={(value) => {
                    setSeatingId(value);
                    setQuantity(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a seat type" />
                  </SelectTrigger>
                  <SelectContent>
                    {seatings.map((s) => {
                      const left = seatsLeft(s);
                      return (
                        <SelectItem key={s._id} value={s._id} disabled={left < 1}>
                          {s.seatType} · ₹{s.price.toLocaleString("en-IN")} · {left < 1 ? "sold out" : `${left} left`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {seating && (
            <div className="space-y-2">
              <Label htmlFor="book-quantity">Number of tickets</Label>
              <Input
                id="book-quantity"
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))}
                className="w-28"
              />
              <p className="text-xs text-muted-foreground">
                Face value ₹{(seating.price * quantity).toLocaleString("en-IN")} — not charged.
              </p>
            </div>
          )}

          {user && seating && (
            <div className="space-y-2">
              {checkingHeld ? (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking {userName || "the user"}'s tickets for this event…
                </p>
              ) : heldTicket ? (
                <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    {userName || "This user"} already has a ticket for this event
                    {heldTicket.bookedAt ? ` (booked ${new Date(heldTicket.bookedAt).toLocaleDateString()})` : ""}. One
                    ticket per person — but you can still book tickets for other people on their account.
                  </span>
                </p>
              ) : (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={userAttends} onCheckedChange={(v) => setUserAttends(v === true)} />
                  Ticket for {userName || "the user"} themselves
                </label>
              )}
            </div>
          )}

          {needsNames && (
            <div className="space-y-2">
              <Label>Who is each ticket for?</Label>
              <p className="text-xs text-muted-foreground">
                Every ticket needs a name and mobile number — each person gets their own ticket and QR code, in their
                own app if the number already has a Whooppe account.
              </p>
              {attendees.map((a, i) => {
                const isUserRow = userAttends && i === 0;
                const key = phoneKey(a.phone);
                const account = key.length === 10 ? usersByPhone.get(key) : null;
                const isOwnNumber = !userAttends && key.length === 10 && key === phoneKey(userPhone);
                return (
                  <div key={i} className="space-y-1">
                    <div className="grid grid-cols-[1fr_1fr] gap-2">
                      <Input
                        placeholder={isUserRow ? "User's name" : `Name ${i + 1}`}
                        value={a.name}
                        onChange={(e) => updateAttendee(i, "name", e.target.value)}
                      />
                      <Input
                        placeholder="Mobile, e.g. 9876543210"
                        value={a.phone}
                        disabled={isUserRow}
                        onChange={(e) => updateAttendee(i, "phone", e.target.value)}
                      />
                    </div>
                    {isOwnNumber ? (
                      <p className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {heldTicket
                          ? `This is ${userName || "the user"}'s own number, and they already have a ticket.`
                          : `This is ${userName || "the user"}'s own number — tick "Ticket for them themselves" instead.`}
                      </p>
                    ) : account && !isUserRow ? (
                      <p className="text-xs text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Whooppe user: {nameOf(account) || account.phone} — the ticket goes to their app
                        {!a.name.trim() && (
                          <button
                            type="button"
                            className="underline ml-1"
                            onClick={() => updateAttendee(i, "name", nameOf(account))}
                          >
                            use their name
                          </button>
                        )}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="book-notes">Note (optional)</Label>
            <Textarea
              id="book-notes"
              rows={2}
              placeholder="Why this ticket was given, e.g. complimentary, payment issue"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Book {quantity > 1 ? `${quantity} tickets` : "ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBookTicketDialog;
