// src/components/CashfreePayments.tsx
//
// "Payments (Cashfree)" tab: look up Cashfree orders with their payments,
// refunds and settlement; refund an order; make, check and cancel payment
// links; see payouts to the bank and what admins did here. Everything goes
// through the backend (/api/admin/cashfree), which holds the Cashfree keys
// and says whether they are test-mode (sandbox) keys.

import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  FlaskConical,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Undo2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

type Any = Record<string, any>;

const rupees = (value: unknown) =>
  value == null || value === "" ? "—" : `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const when = (value: unknown) =>
  value ? new Date(String(value)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "—";

const day = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

const STATUS_TONE: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  SUCCESS: "bg-green-100 text-green-800",
  ACTIVE: "bg-blue-100 text-blue-800",
  PENDING: "bg-amber-100 text-amber-800",
  ONHOLD: "bg-amber-100 text-amber-800",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
  BLOCKED: "bg-red-100 text-red-800",
  IN_BANK_VALIDATION: "bg-amber-100 text-amber-800",
  IN_BENE_CREATION: "bg-amber-100 text-amber-800",
  ACTION_REQUIRED: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-gray-200 text-gray-700",
  USER_DROPPED: "bg-gray-200 text-gray-700",
  EXPIRED: "bg-gray-200 text-gray-700",
  TERMINATED: "bg-gray-200 text-gray-700",
};

const Status = ({ value }: { value?: string | null }) =>
  value ? <Badge className={`${STATUS_TONE[value] || "bg-gray-100 text-gray-800"} hover:opacity-90`}>{value}</Badge> : <span>—</span>;

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

const copy = async (text: string, toast: ReturnType<typeof useToast>["toast"]) => {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied" });
  } catch {
    toast({ title: "Could not copy", description: text });
  }
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const OrderDetail = ({ orderId, onClose }: { orderId: string; onClose: () => void }) => {
  const { toast } = useToast();
  const [detail, setDetail] = useState<Any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await CentralizedApi.cashfree.order(orderId);
      setDetail(response.data);
    } catch (e) {
      setError(errorText(e));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // A payment Cashfree is still processing (a test order takes up to half a
  // minute): look again every 5 seconds, for up to 2 minutes.
  const processing =
    detail?.order?.order_status === "ACTIVE" &&
    (detail?.payments || []).some((p: Any) => ["PENDING", "NOT_ATTEMPTED"].includes(p.payment_status));
  const [checks, setChecks] = useState(0);
  useEffect(() => {
    if (!processing || checks >= 24) return;
    const timer = setTimeout(() => {
      setChecks((c) => c + 1);
      load();
    }, 5000);
    return () => clearTimeout(timer);
  }, [processing, checks, load]);

  const order = detail?.order;
  const refunded = (detail?.refunds || [])
    .filter((r: Any) => r.refund_status !== "CANCELLED" && r.refund_status !== "FAILED")
    .reduce((sum: number, r: Any) => sum + Number(r.refund_amount || 0), 0);
  const refundable = order ? Math.max(Number(order.order_amount || 0) - refunded, 0) : 0;
  const canRefund = order?.order_status === "PAID" && refundable > 0;

  const refund = async () => {
    setRefunding(true);
    try {
      const response = await CentralizedApi.cashfree.refund(orderId, Number(amount), note.trim());
      toast({ title: "Refund started", description: `${rupees(response.data.refund.refund_amount)} — ${response.data.refund.refund_status}` });
      setAmount("");
      setNote("");
      await load();
    } catch (e) {
      toast({ title: "Refund failed", description: errorText(e), variant: "destructive" });
    } finally {
      setRefunding(false);
      setConfirming(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg break-all">Order {orderId}</CardTitle>
          <CardDescription>
            {order ? `${rupees(order.order_amount)} · created ${when(order.created_at)}` : "Cashfree order"}
            {processing && checks < 24 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                <Loader2 className="h-3 w-3 animate-spin" /> payment going through — refreshing
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && !detail && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Asking Cashfree…
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {order && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Field label="Status"><Status value={order.order_status} /></Field>
              <Field label="Amount">{rupees(order.order_amount)}</Field>
              <Field label="Refunded">{rupees(refunded)}</Field>
              <Field label="Cashfree order no.">{order.cf_order_id ?? "—"}</Field>
              <Field label="Customer">{[order.customer_details?.customer_name, order.customer_details?.customer_phone].filter(Boolean).join(" · ") || "—"}</Field>
              <Field label="Email">{order.customer_details?.customer_email || "—"}</Field>
              <Field label="Note">{order.order_note || "—"}</Field>
              <Field label="Expires">{when(order.order_expiry_time)}</Field>
            </div>

            {detail.booking ? (
              <p className="text-sm text-muted-foreground">
                Booking {detail.booking.id} for <b>{detail.booking.event || "an event"}</b> — booking is {detail.booking.status}, payment{" "}
                {detail.booking.paymentStatus}.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Not a ticket booking (a payment link or a test order).</p>
            )}

            <Section title="Payments" error={detail.errors?.payments}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment no.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.payments.length === 0 && <EmptyRow cols={6} text="No payment tried yet" />}
                  {detail.payments.map((p: Any) => (
                    <TableRow key={p.cf_payment_id}>
                      <TableCell className="font-mono text-xs">{p.cf_payment_id}</TableCell>
                      <TableCell><Status value={p.payment_status} /></TableCell>
                      <TableCell>{rupees(p.payment_amount)}</TableCell>
                      <TableCell>{p.payment_group || "—"}</TableCell>
                      <TableCell>{when(p.payment_completion_time || p.payment_time)}</TableCell>
                      <TableCell className="max-w-[240px] truncate" title={p.payment_message}>{p.payment_message || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>

            <Section title="Refunds" error={detail.errors?.refunds}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund id</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Done</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.refunds.length === 0 && <EmptyRow cols={6} text="No refunds" />}
                  {detail.refunds.map((r: Any) => (
                    <TableRow key={r.cf_refund_id || r.refund_id}>
                      <TableCell className="font-mono text-xs">{r.refund_id}</TableCell>
                      <TableCell><Status value={r.refund_status} /></TableCell>
                      <TableCell>{rupees(r.refund_amount)}</TableCell>
                      <TableCell>{r.refund_note || "—"}</TableCell>
                      <TableCell>{when(r.created_at)}</TableCell>
                      <TableCell>{when(r.processed_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>

            <Section title="Settlement">
              {detail.settlement && (detail.settlement.cf_settlement_id || detail.settlement.settlement_utr) ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <Field label="Settlement no.">{detail.settlement.cf_settlement_id ?? "—"}</Field>
                  <Field label="UTR">{detail.settlement.settlement_utr || "—"}</Field>
                  <Field label="Settled">{rupees(detail.settlement.settlement_amount ?? detail.settlement.transfer_amount)}</Field>
                  <Field label="Date">{when(detail.settlement.transfer_time || detail.settlement.settlement_date)}</Field>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not settled to the bank yet.</p>
              )}
            </Section>

            <Section title="Organiser split (Easy Split)" error={detail.errors?.split}>
              {detail.booking?.split || detail.split?.vendors?.length ? (
                <div className="space-y-3 text-sm">
                  {detail.booking?.split && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Field label="Organiser">{detail.booking.split.organizer || "—"}</Field>
                      <Field label="Vendor">{detail.booking.split.vendorId}</Field>
                      <Field label="Organiser's share">{rupees(detail.booking.split.amount)}</Field>
                      <Field label="We keep (before Cashfree's fee)">{rupees(Number(detail.booking.amount || 0) - Number(detail.booking.split.amount || 0))}</Field>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Settled on</TableHead>
                        <TableHead>UTR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detail.split?.vendors || []).length === 0 && <EmptyRow cols={5} text="Cashfree has not recorded the split yet (it does once the order is paid)" />}
                      {(detail.split?.vendors || []).map((v: Any, i: number) => (
                        <TableRow key={`${v.vendor_id}-${i}`}>
                          <TableCell className="font-mono text-xs">{v.vendor_id}</TableCell>
                          <TableCell>{rupees(v.amount ?? v.settlement_amount ?? v.split_amount)}</TableCell>
                          <TableCell><Status value={v.status || v.settlement_status || v.vendor_settlement_status} /></TableCell>
                          <TableCell>{when(v.settlement_time || v.settled_on || v.transfer_time || v.settlement_eligibility_date)}</TableCell>
                          <TableCell className="font-mono text-xs">{v.utr || v.transfer_utr || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not split: the whole amount settles to us.</p>
              )}
            </Section>

            <Section title="Refund this order">
              {canRefund ? (
                <div className="grid gap-3 md:grid-cols-[160px_1fr_auto] items-end">
                  <div className="space-y-1">
                    <Label htmlFor="refund-amount">Amount (₹)</Label>
                    <Input
                      id="refund-amount"
                      type="number"
                      min={1}
                      max={refundable}
                      step="0.01"
                      placeholder={String(refundable)}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="refund-note">Reason</Label>
                    <Input id="refund-note" maxLength={100} placeholder="Why it is being refunded" value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                  <Button
                    variant="destructive"
                    disabled={refunding || !note.trim() || !(Number(amount) > 0) || Number(amount) > refundable}
                    onClick={() => setConfirming(true)}
                  >
                    <Undo2 className="h-4 w-4 mr-1" /> Refund
                  </Button>
                  <p className="text-xs text-muted-foreground md:col-span-3">
                    Up to {rupees(refundable)} can still be refunded. This only returns the money; the booking stays as it is.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {order.order_status === "PAID" ? "Already refunded in full." : "Only a paid order can be refunded."}
                </p>
              )}
            </Section>
          </>
        )}
      </CardContent>

      <AlertDialog open={confirming} onOpenChange={(open) => !refunding && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund {rupees(amount)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Cashfree will send {rupees(amount)} back to the buyer of order {orderId}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refunding}>Keep the money</AlertDialogCancel>
            <AlertDialogAction
              disabled={refunding}
              onClick={(e) => {
                e.preventDefault();
                refund();
              }}
            >
              {refunding && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

const SOURCE_LABEL: Record<string, string> = { test: "Test order", link: "Payment link", lookup: "Looked up", refund: "Refunded here" };

// Test mode only: an order paid straight away with Cashfree's test UPI id, so
// refunds and organiser splits can be tried without going through a checkout.
const TestOrderCard = ({ onMade }: { onMade: (orderId: string) => void }) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("500");
  const [note, setNote] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendors, setVendors] = useState<Any[]>([]);
  const [making, setMaking] = useState(false);

  useEffect(() => {
    CentralizedApi.cashfree
      .vendors()
      .then((response) => setVendors(response.data.vendors))
      .catch(() => setVendors([]));
  }, []);

  const make = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaking(true);
    try {
      const response = await CentralizedApi.cashfree.testOrder({ amount: Number(amount), note: note || undefined, vendorId: vendorId || undefined });
      const { orderId, vendorShare } = response.data;
      toast({
        title: "Test order paid",
        description: vendorShare != null ? `${orderId} — ${rupees(vendorShare)} split to ${vendorId}` : orderId,
      });
      // The sandbox records the payment a few seconds after it is made.
      setTimeout(() => onMade(orderId), 4000);
    } catch (err) {
      toast({ title: "Could not make the test order", description: errorText(err), variant: "destructive" });
    } finally {
      setMaking(false);
    }
  };

  return (
    <Card className="border-amber-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="h-4 w-4" /> Make a paid test order
        </CardTitle>
        <CardDescription>
          Test mode only. Cashfree treats it as paid by UPI, so you can try refunds and settlements. Pick a vendor to split it as an
          organiser's ticket sale would be.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-[140px_1fr_1fr_auto] items-end" onSubmit={make}>
          <div className="space-y-1">
            <Label htmlFor="t-amount">Amount (₹)</Label>
            <Input id="t-amount" type="number" min={1} max={100000} step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-vendor">Split to vendor</Label>
            <select id="t-vendor" className={SELECT_CLASS} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">No split</option>
              {vendors.map((v) => (
                <option key={v.vendorId} value={v.vendorId}>
                  {v.name} ({v.vendorId}){v.organizer ? ` — ${v.organizer.name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-note">Note (optional)</Label>
            <Input id="t-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" disabled={making}>
            {making && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Make &amp; pay
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const OrdersTab = ({ testMode, orderToOpen, onOpened }: { testMode: boolean; orderToOpen: string | null; onOpened: () => void }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  // An order picked on another tab (a link's order, a refund in the activity).
  useEffect(() => {
    if (orderToOpen) {
      setOpen(orderToOpen);
      onOpened();
    }
  }, [orderToOpen, onOpened]);
  const [orders, setOrders] = useState<Any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [other, setOther] = useState<Any[]>([]);
  const [otherError, setOtherError] = useState<string | null>(null);
  const [otherLoading, setOtherLoading] = useState(true);

  const loadOther = useCallback(async () => {
    setOtherLoading(true);
    setOtherError(null);
    try {
      const response = await CentralizedApi.cashfree.otherOrders();
      setOther(response.data.orders);
    } catch (e) {
      setOtherError(errorText(e));
    } finally {
      setOtherLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOther();
  }, [loadOther]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await CentralizedApi.cashfree.recentOrders(50);
      setOrders(response.data.orders);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) setOpen(query.trim());
        }}
      >
        <Input placeholder="Order id, e.g. bk_6720… or an order from a payment link" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button type="submit" disabled={!query.trim()}>
          <Search className="h-4 w-4 mr-1" /> Look up
        </Button>
      </form>

      {open && <OrderDetail key={open} orderId={open} onClose={() => setOpen(null)} />}

      {testMode && <TestOrderCard onMade={(orderId) => { setOpen(orderId); loadOther(); }} />}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Other orders</CardTitle>
            <CardDescription>Test orders, payment links' orders, and any order looked up or refunded here. Click one to open it.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadOther} disabled={otherLoading}>
            <RefreshCw className={`h-4 w-4 ${otherLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {otherError && <p className="text-sm text-destructive">{otherError}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order id</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!otherLoading && other.length === 0 && <EmptyRow cols={6} text="None yet" />}
              {other.map((o) => (
                <TableRow key={o.orderId} className="cursor-pointer" onClick={() => setOpen(o.orderId)}>
                  <TableCell className="font-mono text-xs">{o.orderId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{SOURCE_LABEL[o.source] || o.source}</Badge>
                    {o.split && <Badge variant="outline" className="ml-1">split</Badge>}
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate" title={o.note || ""}>{o.note || o.customer || "—"}</TableCell>
                  <TableCell>{rupees(o.amount)}</TableCell>
                  <TableCell>
                    <Status value={o.status} />
                    {o.error && <div className="text-xs text-destructive">{o.error}</div>}
                  </TableCell>
                  <TableCell>{when(o.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Ticket bookings paid with Cashfree</CardTitle>
            <CardDescription>Newest first. Click one to see it in Cashfree.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {testMode && (
            <Alert className="mb-4">
              <FlaskConical className="h-4 w-4" />
              <AlertDescription>
                These bookings were paid with real Cashfree, so test mode can't look them up. Use a test order or a payment link's order instead.
              </AlertDescription>
            </Alert>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order id</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && orders.length === 0 && <EmptyRow cols={7} text="No Cashfree bookings yet" />}
              {orders.map((o) => (
                <TableRow key={o.orderId} className="cursor-pointer" onClick={() => setOpen(o.orderId)}>
                  <TableCell className="font-mono text-xs">{o.orderId}</TableCell>
                  <TableCell>{o.event || "—"}</TableCell>
                  <TableCell>{o.buyer ? o.buyer.name || o.buyer.phone : "—"}</TableCell>
                  <TableCell>{rupees(o.amount)}</TableCell>
                  <TableCell>{o.bookingStatus}</TableCell>
                  <TableCell>{o.paymentStatus}</TableCell>
                  <TableCell>{when(o.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payment links
// ---------------------------------------------------------------------------

const emptyLink = { amount: "", purpose: "", phone: "", name: "", email: "", expiresInDays: "7", notify: false };

const LinksTab = ({ onOpenOrder }: { onOpenOrder: (orderId: string) => void }) => {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyLink);
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<Any | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [linkOrders, setLinkOrders] = useState<Any[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await CentralizedApi.cashfree.links();
      setLinks(response.data.links);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof typeof emptyLink) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await CentralizedApi.cashfree.createLink({
        amount: Number(form.amount),
        purpose: form.purpose,
        phone: form.phone,
        name: form.name || undefined,
        email: form.email || undefined,
        expiresInDays: Number(form.expiresInDays) || 7,
        notify: form.notify,
      });
      toast({ title: "Payment link made", description: response.data.link.link_url });
      setForm(emptyLink);
      await load();
    } catch (err) {
      toast({ title: "Could not make the link", description: errorText(err), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const cancel = async () => {
    if (!cancelling) return;
    try {
      await CentralizedApi.cashfree.cancelLink(cancelling.link_id);
      toast({ title: "Link cancelled" });
      await load();
    } catch (err) {
      toast({ title: "Could not cancel", description: errorText(err), variant: "destructive" });
    } finally {
      setCancelling(null);
    }
  };

  const toggle = async (linkId: string) => {
    if (expanded === linkId) {
      setExpanded(null);
      return;
    }
    setExpanded(linkId);
    setLinkOrders(null);
    try {
      const response = await CentralizedApi.cashfree.link(linkId);
      setLinkOrders(response.data.orders);
    } catch (err) {
      setLinkOrders([]);
      toast({ title: "Could not load the link's orders", description: errorText(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New payment link</CardTitle>
          <CardDescription>Anyone with the link can pay through Cashfree's page.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={create}>
            <div className="space-y-1">
              <Label htmlFor="link-amount">Amount (₹)</Label>
              <Input id="link-amount" type="number" min={1} step="0.01" required value={form.amount} onChange={set("amount")} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="link-purpose">For</Label>
              <Input id="link-purpose" required maxLength={500} placeholder="e.g. Stall booking, Diwali fest" value={form.purpose} onChange={set("purpose")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="link-phone">Customer mobile</Label>
              <Input id="link-phone" required inputMode="numeric" placeholder="10 digits" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="link-name">Name (optional)</Label>
              <Input id="link-name" value={form.name} onChange={set("name")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="link-email">Email (optional)</Label>
              <Input id="link-email" type="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="link-days">Expires after (days)</Label>
              <Input id="link-days" type="number" min={1} max={30} value={form.expiresInDays} onChange={set("expiresInDays")} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch id="link-notify" checked={form.notify} onCheckedChange={(notify) => setForm({ ...form, notify })} />
              <Label htmlFor="link-notify">Cashfree sends it by SMS/email</Label>
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />} Make link
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Links made here</CardTitle>
            <CardDescription>The latest 30, with where each stands in Cashfree now.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>For</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && links.length === 0 && <EmptyRow cols={7} text="No links made yet" />}
              {links.map((l) => (
                <Fragment key={l.link_id}>
                  <TableRow className="cursor-pointer" onClick={() => toggle(l.link_id)}>
                    <TableCell>
                      <div className="font-medium">{l.link_purpose}</div>
                      <div className="font-mono text-xs text-muted-foreground">{l.link_id}</div>
                    </TableCell>
                    <TableCell>{[l.customer_details?.customer_name, l.customer_details?.customer_phone].filter(Boolean).join(" · ")}</TableCell>
                    <TableCell>{rupees(l.link_amount)}</TableCell>
                    <TableCell>{rupees(l.link_amount_paid)}</TableCell>
                    <TableCell>
                      <Status value={l.link_status} />
                      {l.error && <div className="text-xs text-destructive">{l.error}</div>}
                    </TableCell>
                    <TableCell>{when(l.link_expiry_time)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {l.link_url && (
                        <>
                          <Button variant="ghost" size="sm" title="Copy link" onClick={() => copy(l.link_url, toast)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Open link" asChild>
                            <a href={l.link_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </>
                      )}
                      {l.link_status === "ACTIVE" && (
                        <Button variant="ghost" size="sm" title="Cancel link" onClick={() => setCancelling(l)}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expanded === l.link_id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/40">
                        {linkOrders === null ? (
                          <span className="text-sm text-muted-foreground">Loading orders…</span>
                        ) : linkOrders.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Nobody has tried to pay yet.</span>
                        ) : (
                          <div className="space-y-1">
                            {linkOrders.map((o: Any) => (
                              <button
                                key={o.order_id}
                                className="flex w-full gap-4 text-left text-sm hover:underline"
                                onClick={() => onOpenOrder(o.order_id)}
                              >
                                <span className="font-mono text-xs">{o.order_id}</span>
                                <Status value={o.order_status} />
                                <span>{rupees(o.order_amount)}</span>
                                <span className="text-muted-foreground">{when(o.created_at)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelling} onOpenChange={(open) => !open && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this link?</AlertDialogTitle>
            <AlertDialogDescription>
              "{cancelling?.link_purpose}" for {rupees(cancelling?.link_amount)} will stop taking payments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={cancel}>Cancel link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Settlements and activity
// ---------------------------------------------------------------------------

const SettlementsTab = () => {
  const [from, setFrom] = useState(day(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(day(new Date()));
  const [rows, setRows] = useState<Any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (more = false) => {
      setLoading(true);
      setError(null);
      try {
        // The range is whole India days.
        const response = await CentralizedApi.cashfree.settlements(`${from}T00:00:00+05:30`, `${to}T23:59:59+05:30`, more ? cursor : null);
        setRows((current) => (more ? current.concat(response.data.settlements) : response.data.settlements));
        setCursor(response.data.cursor);
      } catch (e) {
        setError(errorText(e));
      } finally {
        setLoading(false);
      }
    },
    [from, to, cursor],
  );

  useEffect(() => {
    load();
    // Only on first open; after that the Show button reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = rows.reduce((sum, s) => sum + Number(s.amount_settled ?? s.settlement_amount ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Settlements</CardTitle>
        <CardDescription>Money Cashfree has paid out to the bank account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="settle-from">From</Label>
            <Input id="settle-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="settle-to">To</Label>
            <Input id="settle-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={() => load(false)} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Show
          </Button>
          {rows.length > 0 && <span className="text-sm text-muted-foreground">{rows.length} settlements · {rupees(total)} settled</span>}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Settlement no.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Settled</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Cashfree fee + tax</TableHead>
              <TableHead>UTR</TableHead>
              <TableHead>Payments from – till</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && rows.length === 0 && <EmptyRow cols={7} text="No settlements in these dates" />}
            {rows.map((s) => (
              <TableRow key={s.cf_settlement_id}>
                <TableCell className="font-mono text-xs">{s.cf_settlement_id}</TableCell>
                <TableCell><Status value={s.status} /></TableCell>
                <TableCell>{rupees(s.amount_settled ?? s.settlement_amount)}</TableCell>
                <TableCell>{rupees(s.payment_amount)}</TableCell>
                <TableCell>{rupees(Number(s.service_charge ?? s.pg_service_charge ?? 0) + Number(s.service_tax ?? s.pg_service_tax ?? 0))}</TableCell>
                <TableCell className="font-mono text-xs">{s.settlement_utr || "—"}</TableCell>
                <TableCell className="text-xs">
                  {when(s.payment_from)} – {when(s.payment_till)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {cursor && (
          <Button variant="outline" onClick={() => load(true)} disabled={loading}>
            Load more
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Easy Split vendors
// ---------------------------------------------------------------------------


const emptyVendor = {
  organizerId: "",
  name: "",
  email: "",
  phone: "",
  accountType: "Individual",
  businessType: "Social Media and Entertainment",
  payout: "bank" as "bank" | "upi",
  accountHolder: "",
  accountNumber: "",
  ifsc: "",
  vpa: "",
  pan: "",
  gst: "",
  cin: "",
  verifyAccount: false,
  dashboardAccess: false,
};

const VendorsTab = () => {
  const { toast } = useToast();
  const [options, setOptions] = useState<Any | null>(null);
  const [vendors, setVendors] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyVendor);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [importId, setImportId] = useState("");
  const [importOrganizer, setImportOrganizer] = useState("");
  const [importing, setImporting] = useState(false);

  const importVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    try {
      const response = await CentralizedApi.cashfree.importVendor(importId.trim(), importOrganizer || undefined);
      toast({ title: "Vendor linked", description: `${response.data.vendor.name} — ${response.data.vendor.status}` });
      setImportId("");
      setImportOrganizer("");
      await load();
    } catch (err) {
      toast({ title: "Could not link the vendor", description: errorText(err), variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [opts, list] = await Promise.all([CentralizedApi.cashfree.vendorOptions(), CentralizedApi.cashfree.vendors()]);
      setOptions(opts.data);
      setVendors(list.data.vendors);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof typeof emptyVendor) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  // Picking an organiser fills in their details; they can still be changed.
  const pickOrganizer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const organizer = (options?.organizers || []).find((o: Any) => o.id === e.target.value);
    setForm({
      ...form,
      organizerId: e.target.value,
      ...(organizer ? { name: organizer.name || "", email: organizer.email || "", phone: organizer.phone || "", accountHolder: form.accountHolder || organizer.name || "" } : {}),
    });
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await CentralizedApi.cashfree.createVendor({
        organizerId: form.organizerId || undefined,
        name: form.name,
        email: form.email,
        phone: form.phone,
        accountType: form.accountType,
        businessType: form.businessType,
        ...(form.payout === "bank"
          ? { bank: { accountHolder: form.accountHolder, accountNumber: form.accountNumber, ifsc: form.ifsc } }
          : { upi: { vpa: form.vpa, accountHolder: form.accountHolder || form.name } }),
        pan: form.pan || undefined,
        gst: form.gst || undefined,
        cin: form.cin || undefined,
        verifyAccount: form.verifyAccount,
        dashboardAccess: form.dashboardAccess,
      });
      toast({ title: "Vendor added", description: `${response.data.vendor.name} — ${response.data.vendor.vendor_id} (${response.data.vendor.status})` });
      setForm(emptyVendor);
      await load();
    } catch (err) {
      toast({ title: "Could not add the vendor", description: errorText(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = async (vendorId: string, changes: Record<string, unknown>, done: string) => {
    setBusy(vendorId);
    try {
      await CentralizedApi.cashfree.updateVendor(vendorId, changes);
      toast({ title: done });
      await load();
    } catch (err) {
      toast({ title: "Could not change the vendor", description: errorText(err), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const organizers: Any[] = options?.organizers || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a vendor</CardTitle>
          <CardDescription>
            An organiser or anyone else who can be paid a share of a payment through Cashfree Easy Split. When organiser split is on,
            an organiser's vendor gets their share of each ticket sale straight from Cashfree.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={create}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="v-organizer">Organiser</Label>
                <select id="v-organizer" className={SELECT_CLASS} value={form.organizerId} onChange={pickOrganizer}>
                  <option value="">Not an organiser</option>
                  {organizers.map((o) => (
                    <option key={o.id} value={o.id} disabled={o.hasVendor}>
                      {o.name}
                      {o.hasVendor ? " (already a vendor)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="v-name">Name</Label>
                <Input id="v-name" required maxLength={100} value={form.name} onChange={set("name")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="v-email">Email</Label>
                <Input id="v-email" type="email" required value={form.email} onChange={set("email")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="v-phone">Mobile</Label>
                <Input id="v-phone" required inputMode="numeric" placeholder="10 digits" value={form.phone} onChange={set("phone")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="v-account-type">Account type</Label>
                <select id="v-account-type" className={SELECT_CLASS} value={form.accountType} onChange={set("accountType")}>
                  {(options?.accountTypes || [form.accountType]).map((t: string) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="v-business-type">Business type</Label>
                <select id="v-business-type" className={SELECT_CLASS} value={form.businessType} onChange={set("businessType")}>
                  {(options?.businessTypes || [form.businessType]).map((t: string) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold">Pay the vendor to</span>
                <label className="flex items-center gap-1">
                  <input type="radio" name="v-payout" checked={form.payout === "bank"} onChange={() => setForm({ ...form, payout: "bank" })} /> Bank
                  account
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="v-payout" checked={form.payout === "upi"} onChange={() => setForm({ ...form, payout: "upi" })} /> UPI
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="v-holder">Account holder</Label>
                  <Input id="v-holder" required={form.payout === "bank"} value={form.accountHolder} onChange={set("accountHolder")} />
                </div>
                {form.payout === "bank" ? (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="v-account">Account number</Label>
                      <Input id="v-account" required inputMode="numeric" autoComplete="off" value={form.accountNumber} onChange={set("accountNumber")} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="v-ifsc">IFSC</Label>
                      <Input id="v-ifsc" required placeholder="e.g. HDFC0001234" value={form.ifsc} onChange={set("ifsc")} />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <Label htmlFor="v-vpa">UPI ID</Label>
                    <Input id="v-vpa" required placeholder="name@bank" value={form.vpa} onChange={set("vpa")} />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="v-pan">PAN</Label>
                <Input id="v-pan" placeholder="ABCDE1234F" autoComplete="off" value={form.pan} onChange={set("pan")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="v-gst">GSTIN (if any)</Label>
                <Input id="v-gst" autoComplete="off" value={form.gst} onChange={set("gst")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="v-cin">CIN (companies)</Label>
                <Input id="v-cin" autoComplete="off" value={form.cin} onChange={set("cin")} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.verifyAccount} onCheckedChange={(verifyAccount) => setForm({ ...form, verifyAccount })} />
                Verify the account (Cashfree charges for this)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.dashboardAccess} onCheckedChange={(dashboardAccess) => setForm({ ...form, dashboardAccess })} />
                Give the vendor a Cashfree dashboard login
              </label>
              <Button type="submit" className="ml-auto" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add vendor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Already made in Cashfree?</CardTitle>
          <CardDescription>Link a vendor you added in Cashfree's own dashboard, using its Vendor ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end" onSubmit={importVendor}>
            <div className="space-y-1">
              <Label htmlFor="i-vendor">Vendor ID</Label>
              <Input id="i-vendor" required value={importId} onChange={(e) => setImportId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="i-organizer">Organiser</Label>
              <select id="i-organizer" className={SELECT_CLASS} value={importOrganizer} onChange={(e) => setImportOrganizer(e.target.value)}>
                <option value="">Not an organiser</option>
                {organizers.map((o) => (
                  <option key={o.id} value={o.id} disabled={o.hasVendor}>
                    {o.name}
                    {o.hasVendor ? " (already a vendor)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline" disabled={importing || !importId.trim()}>
              {importing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Link vendor
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Vendors</CardTitle>
            <CardDescription>Added from this page, with their status in Cashfree. Bank and PAN numbers show only their last 4 digits.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Organiser</TableHead>
                <TableHead>Paid to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && vendors.length === 0 && <EmptyRow cols={6} text="No vendors yet" />}
              {vendors.map((v) => {
                const live = v.cashfree || {};
                const status = live.status;
                return (
                  <TableRow key={v.vendorId}>
                    <TableCell>
                      <div className="font-medium">{live.name || v.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{v.vendorId}</div>
                      <div className="text-xs text-muted-foreground">{[live.email, live.phone].filter(Boolean).join(" · ")}</div>
                    </TableCell>
                    <TableCell>
                      <select
                        className={`${SELECT_CLASS} h-8 min-w-[160px]`}
                        value={v.organizer?.id || ""}
                        disabled={busy === v.vendorId}
                        onChange={(e) => update(v.vendorId, { organizerId: e.target.value || null }, e.target.value ? "Organiser linked" : "Organiser unlinked")}
                      >
                        <option value="">None</option>
                        {organizers.map((o) => (
                          <option key={o.id} value={o.id} disabled={o.hasVendor && o.id !== v.organizer?.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-sm">
                      {live.bank ? `${live.bank.account_holder || ""} · ${live.bank.account_number || ""} · ${live.bank.ifsc || ""}` : live.upi ? live.upi.vpa : "—"}
                    </TableCell>
                    <TableCell>
                      <Status value={status} />
                      {v.error && <div className="text-xs text-destructive">{v.error}</div>}
                    </TableCell>
                    <TableCell>{when(v.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {status === "BLOCKED" ? (
                        <Button size="sm" variant="outline" disabled={busy === v.vendorId} onClick={() => update(v.vendorId, { status: "ACTIVE" }, "Vendor unblocked")}>
                          Unblock
                        </Button>
                      ) : status ? (
                        <Button size="sm" variant="outline" disabled={busy === v.vendorId} onClick={() => update(v.vendorId, { status: "BLOCKED" }, "Vendor blocked")}>
                          Block
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const ACTION_LABEL: Record<string, string> = {
  refund: "Refund",
  create_link: "Made link",
  cancel_link: "Cancelled link",
  create_vendor: "Added vendor",
  update_vendor: "Changed vendor",
};

const ActivityTab = ({ onOpenOrder }: { onOpenOrder: (orderId: string) => void }) => {
  const [actions, setActions] = useState<Any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    CentralizedApi.cashfree
      .activity()
      .then((response) => setActions(response.data.actions))
      .catch((e) => setError(errorText(e)));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">What admins did here</CardTitle>
        <CardDescription>The latest 50 refunds and link changes from this page.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>What</TableHead>
              <TableHead>Order / link</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.length === 0 && <EmptyRow cols={6} text="Nothing yet" />}
            {actions.map((a) => (
              <TableRow key={a._id}>
                <TableCell>{when(a.createdAt)}</TableCell>
                <TableCell>{ACTION_LABEL[a.action] || a.action}</TableCell>
                <TableCell className="font-mono text-xs">
                  {a.action === "refund" ? (
                    <button className="hover:underline" onClick={() => onOpenOrder(a.target)}>
                      {a.target}
                    </button>
                  ) : (
                    a.target
                  )}
                </TableCell>
                <TableCell>{rupees(a.amount)}</TableCell>
                <TableCell>{a.note || "—"}</TableCell>
                <TableCell>{a.by?.email || a.by?.name || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="break-words">{children}</div>
  </div>
);

const Section = ({ title, error, children }: { title: string; error?: string | null; children: ReactNode }) => (
  <div className="space-y-2">
    <h3 className="font-semibold">{title}</h3>
    {error ? <p className="text-sm text-destructive">{error}</p> : children}
  </div>
);

const EmptyRow = ({ cols, text }: { cols: number; text: string }) => (
  <TableRow>
    <TableCell colSpan={cols} className="text-center text-sm text-muted-foreground py-6">
      {text}
    </TableCell>
  </TableRow>
);

const CashfreePayments = () => {
  const [environment, setEnvironment] = useState<string | null>(null);
  const [splitOn, setSplitOn] = useState<boolean | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [tab, setTab] = useState("orders");
  const [orderToOpen, setOrderToOpen] = useState<string | null>(null);

  useEffect(() => {
    CentralizedApi.cashfree
      .status()
      .then((response) => {
        setEnvironment(response.data.environment);
        setSplitOn(Boolean(response.data.organizerSplit));
      })
      .catch((e) => setStatusError(errorText(e)));
  }, []);

  const openOrder = (orderId: string) => {
    setOrderToOpen(orderId);
    setTab("orders");
  };
  const opened = useCallback(() => setOrderToOpen(null), []);

  if (statusError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Cashfree is not available: {statusError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const testMode = environment === "sandbox";

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">Payments</h2>
        {environment &&
          (testMode ? (
            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
              <FlaskConical className="h-3 w-3 mr-1" /> Cashfree test mode — no real money moves
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cashfree live — refunds and links use real money</Badge>
          ))}
        {splitOn !== null && (
          <Badge variant="outline" title="CASHFREE_SPLIT_ENABLED on the server">
            Organiser split {splitOn ? "on: organisers with a vendor get their share from Cashfree" : "off"}
          </Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orders">Orders &amp; refunds</TabsTrigger>
          <TabsTrigger value="links">Payment links</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrdersTab testMode={testMode} orderToOpen={orderToOpen} onOpened={opened} />
        </TabsContent>
        <TabsContent value="links">
          <LinksTab onOpenOrder={openOrder} />
        </TabsContent>
        <TabsContent value="settlements">
          <SettlementsTab />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorsTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab onOpenOrder={openOrder} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashfreePayments;
