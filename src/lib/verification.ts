// src/lib/verification.ts
//
// One definition of "who does an admin still need to verify", so the header,
// the sidebar badge and the Face ID Check list always agree.

export type VerificationState = "to_verify" | "no_selfie" | "verified" | "rejected";

/**
 * - to_verify: pending with a selfie to review — the admin's actual queue.
 * - no_selfie: pending but nothing uploaded yet, so nothing to check.
 * - verified / rejected: decided.
 */
export const verificationState = (user: any): VerificationState => {
  if (user?.verificationStatus === "verified") return "verified";
  if (user?.verificationStatus === "rejected") return "rejected";
  const hasSelfie = Boolean(user?.uploadedPhoto) || user?.faceStatus === "pending_review";
  return hasSelfie ? "to_verify" : "no_selfie";
};

export const VERIFICATION_LABEL: Record<VerificationState, string> = {
  to_verify: "To verify",
  no_selfie: "No selfie",
  verified: "Verified",
  rejected: "Rejected",
};

export const countByVerificationState = (users: any[]): Record<VerificationState, number> => {
  const counts: Record<VerificationState, number> = { to_verify: 0, no_selfie: 0, verified: 0, rejected: 0 };
  users.forEach((u) => {
    counts[verificationState(u)] += 1;
  });
  return counts;
};

/** api.users arrives in a few shapes depending on the endpoint's envelope. */
export const unwrapUsers = (raw: any): any[] =>
  Array.isArray(raw) ? raw : raw?.users || raw?.data?.users || (Array.isArray(raw?.data) ? raw.data : []);
