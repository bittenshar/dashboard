import type { EventNotify } from "@/hooks/useApiIntegration";

/** Trim the text and drop empty fields, so the backend falls back to its standard wording. */
export const notifyPayload = (value: EventNotify): EventNotify => ({
  send: value.send,
  ...(value.send && value.title?.trim() && { title: value.title.trim() }),
  ...(value.send && value.body?.trim() && { body: value.body.trim() }),
});
