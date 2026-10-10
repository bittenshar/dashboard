/**
 * Ticket types on the Create Event form: the draft shape, the rules and the
 * payload. The rules mirror the server's (seating.normalize.js) and the
 * publisher's Ticket Studio.
 */

export interface TicketDraft {
  key: string;
  seatType: string;
  description: string;
  price: string;
  totalSeats: string;
  ticketType: string;
  coverChargeAmount: string;
  strikePrice: string;
  discountDisplayType: string;
  minPerOrder: string;
  maxPerOrder: string;
  salesStartAt: string;
  salesEndAt: string;
  /** Which show this ticket admits to, when the event has several; "" is a pass for all of them. */
  showKey: string;
  isActive: boolean;
  isHidden: boolean;
}

export const newKey = () => Math.random().toString(36).slice(2);

export const emptyTicket = (): TicketDraft => ({
  key: newKey(),
  seatType: "",
  description: "",
  price: "",
  totalSeats: "",
  ticketType: "standard",
  coverChargeAmount: "",
  strikePrice: "",
  discountDisplayType: "none",
  minPerOrder: "1",
  maxPerOrder: "10",
  salesStartAt: "",
  salesEndAt: "",
  showKey: "",
  isActive: true,
  isHidden: false,
});

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const money = (value: number) => inr.format(value || 0);
export const count = (value: number) => new Intl.NumberFormat("en-IN").format(value || 0);

/** What the event is worth if every ticket sells; complimentary tickets are free. */
export const ticketTotals = (tickets: TicketDraft[]) =>
  tickets.reduce(
    (acc, t) => {
      const qty = Number(t.totalSeats) || 0;
      const price = t.ticketType === "complimentary" ? 0 : Number(t.price) || 0;
      return { quantity: acc.quantity + qty, value: acc.value + qty * price };
    },
    { quantity: 0, value: 0 }
  );

/**
 * The first problem with the tickets, or null. Mirrors the server's own rules
 * (seating.normalize.js) so it surfaces before the form is sent.
 */
export const ticketsError = (tickets: TicketDraft[]): string | null => {
  if (tickets.length === 0) return "Add at least one ticket type.";

  const names = new Set<string>();
  for (const [i, t] of tickets.entries()) {
    const name = t.seatType.trim();
    const label = name || `Ticket ${i + 1}`;

    if (!name) return `${label}: a ticket name is required.`;
    if (names.has(name.toLowerCase())) return `You have two ticket types called "${name}". Give them different names.`;
    names.add(name.toLowerCase());

    const qty = Number(t.totalSeats);
    if (!Number.isInteger(qty) || qty < 1) return `${label}: the quantity must be a whole number above zero.`;

    if (t.ticketType !== "complimentary") {
      const price = Number(t.price);
      if (t.price === "" || !Number.isFinite(price) || price < 0) return `${label}: the price must be zero or more.`;
      if (t.strikePrice && Number(t.strikePrice) <= price) return `${label}: the strike price must be higher than the actual price.`;
      if (t.ticketType === "entry_plus_cover" && Number(t.coverChargeAmount || 0) > price) {
        return `${label}: the cover charge cannot exceed the ticket price.`;
      }
    }

    if (Number(t.maxPerOrder) < Number(t.minPerOrder)) return `${label}: maximum per order cannot be below the minimum.`;
    if (Number(t.minPerOrder) > qty) return `${label}: the minimum per order is higher than the total quantity.`;
    if (t.salesStartAt && t.salesEndAt && t.salesEndAt <= t.salesStartAt) return `${label}: sales must end after they start.`;
  }
  return null;
};

/**
 * The shape the API stores, from what was typed. `showStart` gives the start
 * of the show a ticket is tied to, or null for a pass.
 */
export const ticketsPayload = (tickets: TicketDraft[], showStart: (ticket: TicketDraft) => string | null = () => null) =>
  tickets.map((t, i) => ({
    seatType: t.seatType.trim(),
    description: t.description || "",
    price: t.ticketType === "complimentary" ? 0 : Number(t.price) || 0,
    totalSeats: Number(t.totalSeats),
    ticketType: t.ticketType,
    coverChargeAmount: Number(t.coverChargeAmount) || 0,
    // Empty means "no strike price", not zero.
    strikePrice: t.strikePrice === "" ? null : Number(t.strikePrice),
    discountDisplayType: t.discountDisplayType,
    minPerOrder: Number(t.minPerOrder) || 1,
    maxPerOrder: Number(t.maxPerOrder) || 10,
    salesStartAt: t.salesStartAt ? new Date(t.salesStartAt).toISOString() : null,
    salesEndAt: t.salesEndAt ? new Date(t.salesEndAt).toISOString() : null,
    showStart: showStart(t),
    isActive: t.isActive,
    isHidden: t.isHidden,
    sortOrder: i,
  }));
