/**
 * Create an event on an organiser's behalf. Collects and sends exactly what
 * the publisher's own Create Event form does, so an event made here is
 * complete: ticket types, cover image, schedule, restrictions and all.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiContext } from "@/contexts/ApiIntegrationContext";
import { useToast } from "@/hooks/use-toast";
import { CentralizedApi } from "@/services/centralizedApi";
import { AGE_LIMITS, EVENT_TYPE_GROUPS, LANGUAGES, RECURRING_DAYS, humanize } from "@/constants/eventOptions";
import EventNotifyFields from "./EventNotifyFields";
import TicketStudio from "./TicketStudio";
import { count, emptyTicket, money, ticketTotals, ticketsError, ticketsPayload, type TicketDraft } from "@/lib/tickets";
import { notifyPayload } from "@/lib/eventNotify";
import type { EventNotify } from "@/hooks/useApiIntegration";

// New events are announced to every app user unless the admin switches it off.
const DEFAULT_NOTIFY: EventNotify = { send: true };

// The organiser's own name, rather than one of their brands.
const NO_BRAND = "none";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

interface Brand {
  _id: string;
  name: string;
}

// One more day of an event that runs over several, with its own hours.
interface ExtraDay {
  key: string;
  date: string;
  startTime: string;
  endTime: string;
}

const newDay = (): ExtraDay => ({ key: Math.random().toString(36).slice(2), date: "", startTime: "", endTime: "" });

const blankForm = () => ({
  organiserId: "",
  brand: NO_BRAND,
  name: "",
  description: "",
  eventType: "concert",
  language: "English",
  agelimit: "All ages",
  location: "",
  locationlink: "",
  date: "",
  startTime: "",
  endTime: "",
  extraDays: [] as ExtraDay[],
  isRecurring: false,
  recurringDays: "everyday",
  recurringEndDate: "",
  isRestricted: false,
  allowedDomains: "",
});

type FormState = ReturnType<typeof blankForm>;
type Errors = Partial<Record<keyof FormState | "coverImage" | "seatings", string>>;

// Top to bottom, so the first problem found is the first one on screen.
const FIELD_ORDER: Array<keyof Errors> = [
  "organiserId", "name", "description", "coverImage", "date", "startTime", "endTime",
  "extraDays", "location", "locationlink", "recurringEndDate", "seatings", "allowedDomains",
];

const Section = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <section className="space-y-5 rounded-xl border border-gray-200 p-5">
    <div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
    {children}
  </section>
);

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const Field = ({ id, label, required, error, hint, className, children }: FieldProps) => (
  <div className={`space-y-2 ${className || ""}`} data-field={id}>
    <Label htmlFor={id}>
      {label}
      {required && " *"}
    </Label>
    {children}
    {error ? (
      <p className="text-xs text-red-600" role="alert">{error}</p>
    ) : (
      hint && <p className="text-xs text-muted-foreground">{hint}</p>
    )}
  </div>
);

const CreateEventModal = ({ isOpen, onClose, onEventCreated }: CreateEventModalProps) => {
  const api = useApiContext();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState<FormState>(blankForm);
  const [tickets, setTickets] = useState<TicketDraft[]>(() => [emptyTicket()]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notify, setNotify] = useState<EventNotify>(DEFAULT_NOTIFY);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  // Fetch organizers when modal opens
  useEffect(() => {
    if (isOpen && (!api.organizers || api.organizers.length === 0) && !api.loading.organizers) {
      api.fetchOrganizers();
    }
  }, [isOpen, api.organizers, api.loading.organizers, api.fetchOrganizers]);

  // "Publish as" offers the chosen organiser's approved brands.
  useEffect(() => {
    setBrands([]);
    if (!form.organiserId) return;
    let cancelled = false;
    (CentralizedApi.organizers.brands(form.organiserId) as Promise<{ data: { brands: Brand[] } }>)
      .then((res) => !cancelled && setBrands(res.data.brands))
      .catch(() => undefined); // no brands to offer; the event goes out under the organiser's name
    return () => {
      cancelled = true;
    };
  }, [form.organiserId]);

  const organisers = useMemo(
    () => (api.organizers || []).filter((o) => o.status === "active").map((o) => ({ id: String(o._id || o.organiserId), name: o.name, email: o.email })),
    [api.organizers]
  );
  const organiser = organisers.find((o) => o.id === form.organiserId);
  const totals = ticketTotals(tickets);
  // "Repeats weekly" and "runs over several days" are different things; an
  // event with extra days is not also a repeating one.
  const repeats = form.isRecurring && form.extraDays.length === 0;

  const setDays = (extraDays: ExtraDay[]) => {
    setForm((f) => ({ ...f, extraDays }));
    setErrors((e) => ({ ...e, extraDays: undefined }));
  };
  const setDay = (key: string, patch: Partial<ExtraDay>) => setDays(form.extraDays.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === "organiserId" && { brand: NO_BRAND }) }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const text = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value as never);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErrors((x) => ({ ...x, coverImage: "Please choose an image file" }));
    if (file.size > 10 * 1024 * 1024) return setErrors((x) => ({ ...x, coverImage: "Image must be under 10MB" }));

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((x) => ({ ...x, coverImage: undefined }));
  };

  const reset = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setForm(blankForm());
    setTickets([emptyTicket()]);
    setImageFile(null);
    setImagePreview(null);
    setNotify(DEFAULT_NOTIFY);
    setErrors({});
    if (fileRef.current) fileRef.current.value = "";
  };

  /** Mirrors the server's own rules, so problems show next to the field. */
  const validate = () => {
    const e: Errors = {};
    if (!form.organiserId) e.organiserId = "Choose who is organising this event";
    if (!form.name.trim()) e.name = "Give the event a name";
    if (!form.description.trim()) e.description = "Describe what people are coming to";
    if (!imageFile) e.coverImage = "A cover image is required";
    if (!form.date) e.date = "Pick a date";
    if (!form.startTime) e.startTime = "Pick a start time";
    if (!form.endTime) e.endTime = "Pick an end time";
    if (!form.location.trim()) e.location = "Where is it happening?";
    if (!form.locationlink.trim()) e.locationlink = "Add a Google Maps link (or the join link for an online event)";
    // Same rules as the server: every day complete, each later than the one before.
    let previous = form.date;
    form.extraDays.forEach((d, i) => {
      if (e.extraDays) return;
      const label = `Day ${i + 2}`;
      if (!d.date || !d.startTime || !d.endTime) e.extraDays = `${label}: pick a date, a start time and an end time.`;
      else if (d.startTime === d.endTime) e.extraDays = `${label}: the end time must be different from the start time.`;
      else if (previous && d.date <= previous) e.extraDays = `${label} must be on a later date than day ${i + 1}.`;
      previous = d.date;
    });
    if (repeats && !form.recurringEndDate) e.recurringEndDate = "Recurring events need an end date";
    const ticketProblem = ticketsError(tickets);
    if (ticketProblem) e.seatings = ticketProblem;
    if (form.isRestricted && !form.allowedDomains.split(",").some((d) => d.trim())) {
      e.allowedDomains = "List at least one email domain, or switch the restriction off";
    }

    setErrors(e);
    const firstBad = FIELD_ORDER.find((key) => e[key]);
    if (firstBad) {
      formRef.current?.querySelector(`[data-field="${firstBad}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast({ title: "Some details are missing", description: e[firstBad], variant: "destructive" });
    }
    return !firstBad;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      // Times are stored as typed, the way the publisher stores them.
      const at = (time: string) => new Date(`${form.date}T${time}:00.000Z`).toISOString();

      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("eventType", form.eventType);
      fd.append("language", form.language);
      fd.append("agelimit", form.agelimit);
      fd.append("location", form.location.trim());
      fd.append("locationlink", form.locationlink.trim());
      fd.append("date", new Date(`${form.date}T00:00:00.000Z`).toISOString());
      fd.append("startTime", at(form.startTime));
      fd.append("endTime", at(form.endTime));
      fd.append("organizer", form.organiserId);
      if (form.brand !== NO_BRAND) fd.append("brand", form.brand);

      // Every day with its own hours. The server works the event's overall date
      // and start/end out of these; the three fields above are day 1.
      fd.append(
        "schedule",
        JSON.stringify(
          [form, ...form.extraDays].map((d) => ({
            date: new Date(`${d.date}T00:00:00.000Z`).toISOString(),
            startTime: new Date(`${d.date}T${d.startTime}:00.000Z`).toISOString(),
            endTime: new Date(`${d.date}T${d.endTime}:00.000Z`).toISOString(),
          }))
        )
      );

      fd.append("isRecurring", String(repeats));
      if (repeats) {
        fd.append("recurringDays", form.recurringDays);
        fd.append("recurringEndDate", new Date(`${form.recurringEndDate}T23:59:59.000Z`).toISOString());
      }

      fd.append("isRestricted", String(form.isRestricted));
      if (form.isRestricted) {
        form.allowedDomains.split(",").map((d) => d.trim()).filter(Boolean).forEach((d) => fd.append("allowedDomains[]", d));
      }

      fd.append("seatings", JSON.stringify(ticketsPayload(tickets)));
      fd.append("coverImage", imageFile as File);

      const announce = notifyPayload(notify);
      fd.append("notify[send]", String(announce.send));
      if (announce.title) fd.append("notify[title]", announce.title);
      if (announce.body) fd.append("notify[body]", announce.body);

      await CentralizedApi.events.createFromForm(fd);

      toast({
        title: "Event created",
        description: `${form.name.trim()} is on sale${announce.send ? " and app users are being notified" : ""}.`,
      });
      reset();
      await api.fetchEvents();
      onEventCreated?.();
      onClose();
    } catch (error) {
      toast({
        title: "Couldn't create the event",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl gradient-text">
            <Plus className="h-6 w-6" />
            <span>Create New Event</span>
          </DialogTitle>
          <DialogDescription>
            The same details an organiser fills in on the publisher. The event goes on sale as soon as it's created.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6 mt-2">
          {/* ---------------- Organiser ---------------- */}
          <Section title="Organiser" subtitle="Whose event this is, and the name it's published under.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="organiserId"
                label="Organiser"
                required
                error={errors.organiserId || (api.errors.organizers ? `Couldn't load organisers: ${api.errors.organizers}` : undefined)}
                hint={organisers.length === 0 && !api.loading.organizers ? "No active organisers yet. Add one under Organisers first." : undefined}
              >
                <Select value={form.organiserId} onValueChange={(v) => set("organiserId", v)}>
                  <SelectTrigger id="organiserId" className="glass-input">
                    <SelectValue placeholder={api.loading.organizers ? "Loading organisers…" : "Select an organiser"} />
                  </SelectTrigger>
                  <SelectContent>
                    {organisers.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name} <span className="text-xs text-gray-500">({o.email})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="brand" label="Publish as" hint={!form.organiserId ? "Choose an organiser first." : brands.length ? "One of the organiser's approved brands, or their own name." : "This organiser has no approved brands, so their own name is used."}>
                <Select value={form.brand} onValueChange={(v) => set("brand", v)} disabled={brands.length === 0}>
                  <SelectTrigger id="brand" className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_BRAND}>{organiser?.name || "The organiser's own name"}</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          {/* ---------------- Basics ---------------- */}
          <Section title="The basics" subtitle="What is this event, and what does it look like?">
            <Field id="name" label="Event name" required error={errors.name}>
              <Input id="name" value={form.name} onChange={text("name")} placeholder="e.g. Midnight Sessions — Vol. 4" maxLength={120} className="glass-input" />
            </Field>

            <Field id="description" label="Description" required error={errors.description} hint="Line-up, what to expect, anything people should know before buying.">
              <Textarea id="description" value={form.description} onChange={text("description")} rows={5} placeholder="Tell people what the night looks like…" className="glass-input" />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="eventType" label="Event type" required>
                <Select value={form.eventType} onValueChange={(v) => set("eventType", v)}>
                  <SelectTrigger id="eventType" className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPE_GROUPS.map((g) => (
                      <SelectGroup key={g.label}>
                        <SelectLabel>{g.label}</SelectLabel>
                        {g.types.map((t) => <SelectItem key={t} value={t}>{humanize(t)}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="language" label="Language" required>
                <Select value={form.language} onValueChange={(v) => set("language", v)}>
                  <SelectTrigger id="language" className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="agelimit" label="Age limit" required>
                <Select value={form.agelimit} onValueChange={(v) => set("agelimit", v)}>
                  <SelectTrigger id="agelimit" className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGE_LIMITS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field id="coverImage" label="Cover image" required error={errors.coverImage} hint="Shown everywhere the event appears. Landscape, at least 1200px wide, under 10MB.">
              <div className="flex flex-wrap items-center gap-4">
                <div className={`grid h-28 w-48 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed ${errors.coverImage ? "border-red-400" : "border-gray-300 bg-gray-50"}`}>
                  {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-gray-300" />}
                </div>
                <div>
                  <input ref={fileRef} id="coverImage" type="file" accept="image/*" onChange={pickImage} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                    {imagePreview ? "Replace image" : "Upload image"}
                  </Button>
                  {imageFile && <p className="mt-2 text-xs text-gray-500">{imageFile.name}</p>}
                </div>
              </div>
            </Field>
          </Section>

          {/* ---------------- Date & venue ---------------- */}
          <Section title="Date & venue" subtitle="When it happens, and how people find it.">
            {form.extraDays.length > 0 && <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Day 1</p>}
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="date" label="Date" required error={errors.date}>
                <Input id="date" type="date" value={form.date} onChange={text("date")} className="glass-input" />
              </Field>
              <Field id="startTime" label="Start time" required error={errors.startTime}>
                <Input id="startTime" type="time" value={form.startTime} onChange={text("startTime")} className="glass-input" />
              </Field>
              <Field id="endTime" label="End time" required error={errors.endTime} hint="Past midnight is fine.">
                <Input id="endTime" type="time" value={form.endTime} onChange={text("endTime")} className="glass-input" />
              </Field>
            </div>

            {/* More days, each with its own hours */}
            <div className="space-y-5" data-field="extraDays">
              {form.extraDays.map((d, i) => (
                <div key={d.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Day {i + 2}</p>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDays(form.extraDays.filter((x) => x.key !== d.key))}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove day
                    </Button>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field id={`day-${d.key}-date`} label="Date" required>
                      <Input id={`day-${d.key}-date`} type="date" value={d.date} min={form.date || undefined} onChange={(e) => setDay(d.key, { date: e.target.value })} className="glass-input" />
                    </Field>
                    <Field id={`day-${d.key}-start`} label="Start time" required>
                      <Input id={`day-${d.key}-start`} type="time" value={d.startTime} onChange={(e) => setDay(d.key, { startTime: e.target.value })} className="glass-input" />
                    </Field>
                    <Field id={`day-${d.key}-end`} label="End time" required>
                      <Input id={`day-${d.key}-end`} type="time" value={d.endTime} onChange={(e) => setDay(d.key, { endTime: e.target.value })} className="glass-input" />
                    </Field>
                  </div>
                </div>
              ))}

              {errors.extraDays && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{errors.extraDays}</p>}

              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => setDays([...form.extraDays, newDay()])}>
                  <Plus className="mr-2 h-4 w-4" /> Add another day
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">For an event that runs over several days. Each day gets its own date and hours.</p>
              </div>
            </div>

            <Field id="location" label="Venue" required error={errors.location} hint="For an online event, name the platform.">
              <Input id="location" value={form.location} onChange={text("location")} placeholder="e.g. Antisocial, Hauz Khas Village, Delhi" className="glass-input" />
            </Field>

            <Field id="locationlink" label="Google Maps link" required error={errors.locationlink} hint="Ticket holders tap this to navigate. For an online event, the join link.">
              <Input id="locationlink" type="url" value={form.locationlink} onChange={text("locationlink")} placeholder="https://maps.app.goo.gl/…" className="glass-input" />
            </Field>

            <div className="space-y-5 border-t pt-5">
              <div className="flex items-start gap-3">
                <Switch id="isRecurring" checked={repeats} disabled={form.extraDays.length > 0} onCheckedChange={(v) => set("isRecurring", v)} />
                <div>
                  <Label htmlFor="isRecurring">This event repeats</Label>
                  <p className="text-xs text-muted-foreground">
                    {form.extraDays.length > 0
                      ? "Not available for an event with several days. Remove the extra days to use it."
                      : "A weekly night or a run of shows, rather than a one-off."}
                  </p>
                </div>
              </div>

              {repeats && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="recurringDays" label="Repeats on" required>
                    <Select value={form.recurringDays} onValueChange={(v) => set("recurringDays", v)}>
                      <SelectTrigger id="recurringDays" className="glass-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RECURRING_DAYS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field id="recurringEndDate" label="Repeats until" required error={errors.recurringEndDate}>
                    <Input id="recurringEndDate" type="date" value={form.recurringEndDate} onChange={text("recurringEndDate")} min={form.date} className="glass-input" />
                  </Field>
                </div>
              )}
            </div>
          </Section>

          {/* ---------------- Tickets ---------------- */}
          <Section title="Tickets" subtitle="Each type gets its own price, inventory and sale window.">
            <div data-field="seatings">
              <TicketStudio
                tickets={tickets}
                onChange={(next) => {
                  setTickets(next);
                  setErrors((e) => ({ ...e, seatings: undefined }));
                }}
                error={errors.seatings}
              />
            </div>
          </Section>

          {/* ---------------- Settings ---------------- */}
          <Section title="Settings" subtitle="Who is allowed to buy a ticket.">
            <div className="flex items-start gap-3">
              <Switch id="isRestricted" checked={form.isRestricted} onCheckedChange={(v) => set("isRestricted", v)} />
              <div>
                <Label htmlFor="isRestricted">Restrict to specific email domains</Label>
                <p className="text-xs text-muted-foreground">For campus or company-only events — only these email domains can buy.</p>
              </div>
            </div>

            {form.isRestricted && (
              <Field id="allowedDomains" label="Allowed domains" error={errors.allowedDomains} hint="Comma separated, without the @ — e.g. jecrc.ac.in, iitj.ac.in">
                <Input id="allowedDomains" value={form.allowedDomains} onChange={text("allowedDomains")} placeholder="jecrc.ac.in, iitj.ac.in" className="glass-input" />
              </Field>
            )}
          </Section>

          <EventNotifyFields
            id="create-notify"
            value={notify}
            onChange={setNotify}
            label="Notify all app users about this event"
            hint="Sends a push to everyone with the app installed as soon as the event is created."
            bodyLabel="Message (optional)"
            titlePlaceholder="🎉 New Event Live!"
            bodyPlaceholder={`${form.name || "Event name"} is now live${form.location ? ` at ${form.location}` : ""}. Book your tickets now!`}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-sm text-gray-500">
              {count(totals.quantity)} tickets in total · {money(totals.value)} if it sells out
            </p>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={onClose} className="hover-glow" disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary hover-glow" disabled={loading}>
                {loading ? "Creating…" : "Create Event"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
