/**
 * Ticket Studio — the per-ticket editor on the Create Event form, with the
 * same fields and rules as the publisher's. Each ticket type is a collapsed
 * row; one is open at a time.
 */
import { useState } from "react";
import { ChevronRight, Copy, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TICKET_TYPES } from "@/constants/eventOptions";
import { count, emptyTicket, money, newKey, ticketTotals, type TicketDraft } from "@/lib/tickets";

/** The discount badge, computed the same way the server does. */
const discountLabel = (ticket: TicketDraft) => {
  const price = Number(ticket.price) || 0;
  const strike = Number(ticket.strikePrice) || 0;
  if (!strike || strike <= price || ticket.discountDisplayType === "none") return null;
  const off = strike - price;
  return ticket.discountDisplayType === "percentage" ? `${Math.round((off / strike) * 100)}% OFF` : `₹${off} OFF`;
};

const Hint = ({ children }: { children: React.ReactNode }) => <p className="text-xs text-muted-foreground">{children}</p>;
const Warning = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{children}</p>
);
const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 rounded-lg bg-gray-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
    {children}
  </div>
);

interface TicketRowProps {
  ticket: TicketDraft;
  index: number;
  expanded: boolean;
  canRemove: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<TicketDraft>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function TicketRow({ ticket, index, expanded, canRemove, onToggle, onChange, onRemove, onDuplicate }: TicketRowProps) {
  const id = (field: string) => `ticket-${ticket.key}-${field}`;
  const text = (field: keyof TicketDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ [field]: e.target.value });

  const isComp = ticket.ticketType === "complimentary";
  const discount = discountLabel(ticket);

  return (
    <div className={`rounded-lg border ${expanded ? "border-violet-200 bg-white" : "border-gray-200 bg-gray-50/50"} ${ticket.isActive ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-3 p-4">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={expanded}>
          <ChevronRight className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-gray-900">{ticket.seatType || `Ticket ${index + 1}`}</span>
              {isComp && <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">Free</Badge>}
              {discount && <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">{discount}</Badge>}
              {ticket.isHidden && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Hidden</Badge>}
              {!ticket.isActive && <Badge variant="outline">Disabled</Badge>}
            </span>
            <span className="mt-0.5 block text-xs tabular-nums text-gray-500">
              {isComp ? "Free" : money(Number(ticket.price))} · {count(Number(ticket.totalSeats))} available
              {ticket.maxPerOrder ? ` · max ${ticket.maxPerOrder}/order` : ""}
            </span>
          </span>
        </button>
        <Button type="button" variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate this ticket" aria-label="Duplicate this ticket">
          <Copy className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={!canRemove} title="Remove" aria-label="Remove this ticket" className="hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-5 border-t px-4 pb-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={id("name")}>Ticket name *</Label>
              <Input id={id("name")} value={ticket.seatType} onChange={text("seatType")} placeholder="Early bird, Regular, Group of 4…" maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("type")}>Ticket type</Label>
              <Select value={ticket.ticketType} onValueChange={(v) => onChange({ ticketType: v })}>
                <SelectTrigger id={id("type")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Hint>{TICKET_TYPES.find((t) => t.value === ticket.ticketType)?.hint}</Hint>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={id("description")}>Description</Label>
            <Textarea id={id("description")} value={ticket.description} onChange={text("description")} rows={2} maxLength={280} placeholder="Includes one welcome drink and priority entry" />
            <Hint>Shown under the ticket name at checkout. Optional.</Hint>
          </div>

          <Group title="Pricing">
            {isComp ? (
              <p className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
                Complimentary tickets are always free — price and discount fields don't apply.
              </p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={id("price")}>Price (₹) *</Label>
                    <Input id={id("price")} type="number" min="0" step="1" value={ticket.price} onChange={text("price")} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={id("strike")}>Strike price (₹)</Label>
                    <Input id={id("strike")} type="number" min="0" step="1" value={ticket.strikePrice} onChange={text("strikePrice")} placeholder="—" />
                    <Hint>Optional. Shown struck through.</Hint>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={id("discount")}>Show discount as</Label>
                    <Select value={ticket.discountDisplayType} onValueChange={(v) => onChange({ discountDisplayType: v })} disabled={!ticket.strikePrice}>
                      <SelectTrigger id={id("discount")}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Don't show</SelectItem>
                        <SelectItem value="percentage">Percentage — 25% OFF</SelectItem>
                        <SelectItem value="absolute">Amount — ₹200 OFF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {Number(ticket.strikePrice) > 0 && Number(ticket.strikePrice) <= Number(ticket.price) && (
                  <Warning>The strike price must be higher than the real price, or there's no discount to show.</Warning>
                )}

                {ticket.ticketType === "entry_plus_cover" && (
                  <div className="space-y-2">
                    <Label htmlFor={id("cover")}>Redeemable cover amount (₹)</Label>
                    <Input id={id("cover")} type="number" min="0" step="1" value={ticket.coverChargeAmount} onChange={text("coverChargeAmount")} placeholder="0" />
                    <Hint>How much of the ticket price can be spent inside. Must not exceed the price.</Hint>
                  </div>
                )}

                {ticket.ticketType === "cover_charge" && <Hint>The full {money(Number(ticket.price))} is redeemable inside.</Hint>}
              </>
            )}
          </Group>

          <Group title="Inventory">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={id("quantity")}>Total quantity *</Label>
                <Input id={id("quantity")} type="number" min="1" step="1" value={ticket.totalSeats} onChange={text("totalSeats")} placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={id("min")}>Min per order</Label>
                <Input id={id("min")} type="number" min="1" step="1" value={ticket.minPerOrder} onChange={text("minPerOrder")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={id("max")}>Max per order</Label>
                <Input id={id("max")} type="number" min="1" step="1" value={ticket.maxPerOrder} onChange={text("maxPerOrder")} />
              </div>
            </div>
            {Number(ticket.maxPerOrder) < Number(ticket.minPerOrder) && <Warning>Maximum per order can't be lower than the minimum.</Warning>}
          </Group>

          <Group title="When it's on sale">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={id("sales-start")}>Sales start</Label>
                <Input id={id("sales-start")} type="datetime-local" value={ticket.salesStartAt} onChange={text("salesStartAt")} />
                <Hint>Leave empty to sell from the moment the event is created.</Hint>
              </div>
              <div className="space-y-2">
                <Label htmlFor={id("sales-end")}>Sales end</Label>
                <Input id={id("sales-end")} type="datetime-local" value={ticket.salesEndAt} onChange={text("salesEndAt")} />
                <Hint>Leave empty to sell until the event begins.</Hint>
              </div>
            </div>
            {ticket.salesStartAt && ticket.salesEndAt && ticket.salesEndAt <= ticket.salesStartAt && <Warning>Sales must end after they start.</Warning>}
          </Group>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Switch id={id("active")} checked={ticket.isActive} onCheckedChange={(v) => onChange({ isActive: v })} />
              <div>
                <Label htmlFor={id("active")}>On sale</Label>
                <Hint>Switch off to stop selling this ticket without deleting it.</Hint>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Switch id={id("hidden")} checked={ticket.isHidden} onCheckedChange={(v) => onChange({ isHidden: v })} />
              <div>
                <Label htmlFor={id("hidden")}>Hidden ticket</Label>
                <Hint>Kept out of the public list — only people with the share link can buy it. Use for presales and guest lists.</Hint>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TicketStudioProps {
  tickets: TicketDraft[];
  onChange: (tickets: TicketDraft[]) => void;
  error?: string | null;
}

export default function TicketStudio({ tickets, onChange, error }: TicketStudioProps) {
  // The first ticket starts open, so a new event isn't a wall of collapsed rows.
  const [expandedKey, setExpandedKey] = useState<string | null>(tickets[0]?.key ?? null);

  const update = (key: string, patch: Partial<TicketDraft>) => onChange(tickets.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  const add = () => {
    const ticket = emptyTicket();
    onChange([...tickets, ticket]);
    setExpandedKey(ticket.key);
  };

  const duplicate = (source: TicketDraft) => {
    const copy = { ...source, key: newKey(), seatType: `${source.seatType || "Ticket"} copy` };
    onChange([...tickets, copy]);
    setExpandedKey(copy.key);
  };

  const totals = ticketTotals(tickets);

  return (
    <div className="space-y-4">
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

      <div className="space-y-3">
        {tickets.map((ticket, i) => (
          <TicketRow
            key={ticket.key}
            ticket={ticket}
            index={i}
            expanded={expandedKey === ticket.key}
            canRemove={tickets.length > 1}
            onToggle={() => setExpandedKey(expandedKey === ticket.key ? null : ticket.key)}
            onChange={(patch) => update(ticket.key, patch)}
            onRemove={() => onChange(tickets.filter((t) => t.key !== ticket.key))}
            onDuplicate={() => duplicate(ticket)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="mr-2 h-4 w-4" /> Add ticket type
        </Button>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs text-gray-500">Total inventory</p>
            <p className="text-sm font-semibold tabular-nums text-gray-900">{count(totals.quantity)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">If it sells out</p>
            <p className="text-sm font-semibold tabular-nums text-gray-900">{money(totals.value)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
