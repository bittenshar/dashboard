/**
 * How an event's details are shown on the dashboard: the fields an admin
 * reviews, and the formatting they share.
 */
import { CentralizedApi } from "@/services/centralizedApi";

export interface ReviewableEvent {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  locationlink?: string;
  coverImage?: string;
  eventType?: string;
  language?: string;
  agelimit?: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurringDays?: string | null;
  recurringEndDate?: string | null;
  schedule?: Array<{ startTime: string; endTime: string }>;
  seatings?: Array<{
    _id: string;
    seatType: string;
    price: number;
    totalSeats: number;
    seatsSold?: number;
    ticketType?: string;
    isActive?: boolean;
    isHidden?: boolean;
    showStart?: string | null;
  }>;
  organizer?: { name?: string; email?: string; phone?: string } | string;
  review?: { status: string; note?: string; submittedAt?: string; decidedAt?: string };
}

// Times are stored as the organiser typed them, so they are read back in UTC.
export const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
export const when = (value: string) => `${dayFmt.format(new Date(value))}, ${timeFmt.format(new Date(value))}`;
export const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** The longest note an admin can send an organiser with a decision. */
export const MAX_NOTE = 500;

// Covers are stored as a path on the API (/api/images/…) or, rarely, a full link.
export const coverUrl = (cover: string) => (cover.startsWith("/api/") ? CentralizedApi.buildUrl(cover.slice(4)) : cover);

/** The event's shows as a list, whether or not it stores a schedule. */
export const showsOf = (event: ReviewableEvent) =>
  event.schedule?.length ? event.schedule : [{ startTime: event.startTime, endTime: event.endTime }];

/** Live unless it is waiting for review or has been stopped. */
export const reviewStatusOf = (event: { review?: { status?: string } }): "pending" | "rejected" | "approved" => {
  const status = event.review?.status;
  return status === "pending" || status === "rejected" ? status : "approved";
};
