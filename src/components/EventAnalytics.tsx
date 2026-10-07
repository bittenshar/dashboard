/**
 * One event's analytics: the publisher's event page, for any organiser's
 * event. The numbers come from the same backend code the publisher uses, so
 * the two always agree.
 */
import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Copy,
  Download,
  Link2,
  Loader2,
  MapPin,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CentralizedApi } from "@/services/centralizedApi";

interface EventAnalyticsProps {
  eventId: string;
  eventName: string;
  onClose: () => void;
}

interface EventStats {
  event: {
    id: string;
    name: string;
    date?: string;
    location?: string;
    coverImage?: string;
    status?: string;
    eventType?: string;
  };
  organizer: { id: string; name?: string; email?: string; phone?: string } | null;
  totals: { orders: number; tickets: number; amount: number; capacity: number; sellThrough: number; admitted: number };
  byTicketType: Array<{ _id: string; tickets: number; amount: number; orders: number }>;
  daily: Array<{ date: string; tickets: number; amount: number }>;
  inventory: Array<{
    seatingId: string;
    seatType: string;
    price: number;
    totalSeats: number;
    seatsSold: number;
    lockedSeats: number;
    remaining: number;
    status?: string;
    isActive?: boolean;
  }>;
}

interface Order {
  id: string;
  reference?: string;
  seatType: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt?: string;
  buyer: { name?: string; phone?: string; email?: string } | null;
  admitted: number;
  attendeeCount: number;
}

interface OrdersPage {
  pagination: { page: number; limit: number; total: number; pages: number };
  orders: Order[];
}

interface OneLink {
  _id: string;
  code: string;
  title?: string;
  url: string;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  clicks: number;
}

const ORDERS_PER_PAGE = 50;

/* ------------------------------------------------------------------ *
 * Formatting — the same rules the publisher uses
 * ------------------------------------------------------------------ */

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const money = (value?: number) => inr.format(Number(value || 0));

/** 1.2L / 45.3K — for stat tiles where the exact rupee isn't the point. */
const compactMoney = (value?: number) => {
  const n = Number(value || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n >= 100000000 ? 0 : 2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return inr.format(n);
};

const count = (value?: number) => new Intl.NumberFormat("en-IN").format(Number(value || 0));
const percent = (value?: number) => `${Number(value || 0).toFixed(1)}%`;

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
const formatDate = (value?: string) => (value ? dateFmt.format(new Date(value)) : "—");
const formatDateTime = (value?: string) =>
  value ? `${dateFmt.format(new Date(value))}, ${timeFmt.format(new Date(value))}` : "—";

/** "fast_filling" → "Fast Filling". */
const humanize = (value?: string) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const TONES = {
  green: "border-green-200 bg-green-50 text-green-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  gray: "border-gray-200 bg-gray-50 text-gray-600",
};

// Event, ticket-type and order statuses share one palette.
const STATUS_TONE: Record<string, keyof typeof TONES> = {
  active: "green",
  upcoming: "blue",
  completed: "gray",
  cancelled: "red",
  available: "green",
  fast_filling: "amber",
  sold_out: "red",
  confirmed: "green",
  used: "blue",
  refunded: "amber",
};

const StatusBadge = ({ status }: { status?: string }) => (
  <Badge variant="outline" className={TONES[STATUS_TONE[status || ""] || "gray"]}>
    {humanize(status) || "—"}
  </Badge>
);

/* ------------------------------------------------------------------ */

const EventAnalytics = ({ eventId, eventName, onClose }: EventAnalyticsProps) => {
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [reloadKey, setReloadKey] = useState(0);

  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [links, setLinks] = useState<OneLink[] | null>(null);
  const [linksError, setLinksError] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrdersPage | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (CentralizedApi.eventAnalytics.stats(eventId) as Promise<{ data: EventStats }>)
      .then((res) => !cancelled && setStats(res.data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => !cancelled && setLoading(false));

    setLinksError(null);
    (CentralizedApi.eventAnalytics.oneLinks(eventId) as Promise<{ data: { links: OneLink[] } }>)
      .then((res) => !cancelled && setLinks(res.data.links))
      .catch((err) => !cancelled && setLinksError(err instanceof Error ? err.message : String(err)));

    return () => {
      cancelled = true;
    };
  }, [eventId, reloadKey]);

  // Like the publisher, orders load once their tab is opened.
  useEffect(() => {
    if (tab !== "orders") return;
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);
    (CentralizedApi.eventAnalytics.orders(eventId, ordersPage, ORDERS_PER_PAGE) as Promise<{ data: OrdersPage }>)
      .then((res) => !cancelled && setOrders(res.data))
      .catch((err) => !cancelled && setOrdersError(err instanceof Error ? err.message : String(err)))
      .finally(() => !cancelled && setOrdersLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, eventId, ordersPage, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await CentralizedApi.eventAnalytics.exportSales(eventId);
      const name = (stats?.event.name || eventName || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}-sales-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast({
        title: "Couldn't export sales",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const copyLink = async (link: OneLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(link._id);
      setTimeout(() => setCopied((c) => (c === link._id ? null : c)), 1500);
    } catch {
      toast({ title: "Couldn't copy the link", description: link.url });
    }
  };

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onClose} className="h-10 w-10 p-0" aria-label="Back to events">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Event Analytics</h2>
          <p className="text-gray-600">{stats?.event.name || eventName}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button onClick={exportCsv} disabled={exporting || !stats}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export CSV
        </Button>
      </div>
    </div>
  );

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        {header}
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-2 font-medium text-red-600">Couldn't load this event's analytics</p>
            <p className="text-sm text-gray-600">{error || "No data came back."}</p>
            <Button onClick={refresh} className="mt-4">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { event, organizer, totals } = stats;
  const sold = Math.min(Math.max(totals.sellThrough || 0, 0), 100);
  const maxTypeTickets = Math.max(...stats.byTicketType.map((t) => t.tickets), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {header}

      {/* Event */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row">
          {event.coverImage ? (
            <img src={event.coverImage} alt="" className="h-32 w-full shrink-0 rounded-lg bg-gray-100 object-cover sm:w-56" />
          ) : (
            <div className="grid h-32 w-full shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600 sm:w-56">
              <Ticket className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={event.status} />
              {event.eventType && <Badge variant="outline">{humanize(event.eventType)}</Badge>}
            </div>
            <h3 className="text-xl font-semibold leading-snug text-gray-900">{event.name}</h3>
            <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {formatDate(event.date)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {event.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {organizer ? (
                  <>
                    {organizer.name}
                    {(organizer.phone || organizer.email) && (
                      <span className="text-gray-400">· {organizer.phone || organizer.email}</span>
                    )}
                  </>
                ) : (
                  "Organiser not found"
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
        {[
          { label: "Gross sales", value: compactMoney(totals.amount), sub: `${count(totals.orders)} orders`, tone: "blue" },
          { label: "Tickets sold", value: count(totals.tickets), sub: `of ${count(totals.capacity)}`, tone: "green" },
          { label: "Sell-through", value: percent(totals.sellThrough), sub: "of capacity", tone: "purple" },
          { label: "Checked in", value: count(totals.admitted), sub: "at the gate", tone: "orange" },
        ].map((s) => (
          <Card
            key={s.label}
            className={
              {
                blue: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100",
                green: "border-green-200 bg-gradient-to-br from-green-50 to-green-100",
                purple: "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100",
                orange: "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100",
              }[s.tone]
            }
          >
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-600">{s.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 border border-gray-200 bg-white/70 shadow-sm backdrop-blur-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ({stats.inventory.length})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({count(totals.orders)})</TabsTrigger>
          <TabsTrigger value="links">One-links{links ? ` (${links.length})` : ""}</TabsTrigger>
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales over time</CardTitle>
                <CardDescription>Since this event went live</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.daily.length === 0 ? (
                  <p className="py-24 text-center text-sm text-gray-500">No sales yet.</p>
                ) : (
                  <ChartContainer config={{ amount: { label: "Sales", color: "#7c3aed" } }} className="h-[300px] w-full">
                    <AreaChart data={stats.daily} margin={{ left: 4, right: 12, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d: string) => shortDateFmt.format(new Date(d))}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        tickFormatter={(v: number) => compactMoney(v)}
                        tickLine={false}
                        axisLine={false}
                        width={64}
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
                              <p className="font-medium text-gray-900">{formatDate(String(label))}</p>
                              <p className="text-gray-600">
                                {money(payload[0].payload.amount)} · {count(payload[0].payload.tickets)} tickets
                              </p>
                            </div>
                          ) : null
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--color-amount)"
                        fill="var(--color-amount)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={stats.daily.length === 1}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sell-through</CardTitle>
                </CardHeader>
                <CardContent className="grid place-items-center pb-8">
                  <div className="relative h-36 w-36">
                    <PieChart width={144} height={144}>
                      <Pie
                        data={[{ value: sold }, { value: 100 - sold }]}
                        dataKey="value"
                        innerRadius={54}
                        outerRadius={66}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        <Cell fill="#7c3aed" />
                        <Cell fill="#ede9fe" />
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 grid place-items-center text-center">
                      <div>
                        <p className="text-2xl font-bold tabular-nums text-gray-900">{percent(totals.sellThrough)}</p>
                        <p className="text-xs text-gray-500">sold</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>By ticket type</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.byTicketType.length === 0 ? (
                    <p className="text-sm text-gray-500">No tickets sold yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {stats.byTicketType.map((t) => (
                        <li key={t._id}>
                          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate font-medium text-gray-700">{t._id}</span>
                            <span className="shrink-0 tabular-nums">
                              <span className="font-semibold text-gray-900">{count(t.tickets)}</span>
                              <span className="text-gray-500"> · {money(t.amount)}</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-violet-50">
                            <div
                              className="h-2 rounded-full bg-violet-500"
                              style={{ width: `${(t.tickets / maxTypeTickets) * 100}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Inventory ---------------- */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Ticket inventory</CardTitle>
              <CardDescription>What's left, by type</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {stats.inventory.length === 0 ? (
                <p className="px-6 pb-8 text-sm text-gray-500">This event has no ticket types.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket type</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Held</TableHead>
                      <TableHead className="text-right">Left</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.inventory.map((row) => (
                      <TableRow key={row.seatingId}>
                        <TableCell className="font-medium text-gray-900">{row.seatType}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(row.price)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {count(row.seatsSold)}
                          <span className="text-gray-400"> / {count(row.totalSeats)}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-gray-500">{count(row.lockedSeats)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-gray-900">{count(row.remaining)}</TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Orders ---------------- */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Orders</CardTitle>
                <CardDescription>Every ticket bought for this event</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {ordersError ? (
                <div className="px-6 pb-8 text-sm">
                  <p className="text-red-600">Couldn't load orders: {ordersError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
                    Try again
                  </Button>
                </div>
              ) : ordersLoading && !orders ? (
                <div className="flex items-center gap-2 px-6 pb-8 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
                </div>
              ) : !orders || orders.orders.length === 0 ? (
                <p className="px-6 pb-8 text-sm text-gray-500">No orders yet. Sales show up here the moment someone buys.</p>
              ) : (
                <>
                  <Table className={ordersLoading ? "opacity-60" : undefined}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Ticket</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Entry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Booked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium tabular-nums text-gray-900">{o.reference || "—"}</TableCell>
                          <TableCell>
                            <p className="text-gray-900">{o.buyer?.name || "—"}</p>
                            <p className="text-xs text-gray-500">{o.buyer?.phone || o.buyer?.email || ""}</p>
                          </TableCell>
                          <TableCell>{o.seatType}</TableCell>
                          <TableCell className="text-right tabular-nums">{count(o.quantity)}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums text-gray-900">{money(o.totalPrice)}</TableCell>
                          <TableCell className={`text-right tabular-nums ${o.admitted > 0 ? "text-green-600" : "text-gray-400"}`}>
                            {count(o.admitted)}/{count(o.attendeeCount)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={o.status} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-gray-500">{formatDateTime(o.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {orders.pagination.pages > 1 && (
                    <div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm text-gray-600">
                      <span>
                        {count((orders.pagination.page - 1) * orders.pagination.limit + 1)}–
                        {count(Math.min(orders.pagination.page * orders.pagination.limit, orders.pagination.total))} of{" "}
                        {count(orders.pagination.total)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={ordersLoading || orders.pagination.page <= 1}
                          onClick={() => setOrdersPage((p) => p - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={ordersLoading || orders.pagination.page >= orders.pagination.pages}
                          onClick={() => setOrdersPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- One-links ---------------- */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>One-links</CardTitle>
              <CardDescription>The organiser's trackable links for this event, and how often each was opened</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {linksError ? (
                <p className="px-6 pb-8 text-sm text-red-600">Couldn't load one-links: {linksError}</p>
              ) : !links ? (
                <div className="flex items-center gap-2 px-6 pb-8 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading one-links…
                </div>
              ) : links.length === 0 ? (
                <div className="px-6 pb-8 text-sm text-gray-500">
                  <Link2 className="mb-2 h-5 w-5 text-gray-400" />
                  No one-links yet. Organisers create them in the publisher, one per channel, to see which one sells.
                </div>
              ) : (
                <ul className="divide-y border-t">
                  {links.map((l) => (
                    <li key={l._id} className="flex items-center gap-4 px-6 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{l.title || l.code}</p>
                        <p className="mt-0.5 truncate text-sm text-violet-600">{l.url}</p>
                        {(l.source || l.medium || l.campaign) && (
                          <p className="mt-1 text-xs text-gray-500">
                            {[l.source, l.medium, l.campaign].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-semibold tabular-nums text-gray-900">{count(l.clicks)}</p>
                        <p className="text-xs text-gray-500">clicks</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyLink(l)} aria-label="Copy link">
                        {copied === l._id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventAnalytics;
