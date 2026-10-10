/**
 * The choices on the Create Event form. Kept identical to the publisher's
 * (organizer-dashboard/src/lib/constants.js and TicketStudio.jsx in the
 * backend repo) so an event made here looks the same as one made there.
 */

/** Mirrors the `eventType` enum on the Event schema, grouped for scanning. */
export const EVENT_TYPE_GROUPS = [
  {
    label: "Music & nightlife",
    types: ["concert", "music_festival", "dj_night", "live_show", "party", "nightlife", "new_year_party"],
  },
  {
    label: "Comedy & theatre",
    types: ["comedy_show", "standup_comedy", "theater", "drama", "movie_screening"],
  },
  {
    label: "Sports & fitness",
    types: ["sports", "cricket", "football", "basketball", "marathon", "fitness", "yoga", "wellness", "adventure"],
  },
  {
    label: "Business & learning",
    types: [
      "conference", "business_conference", "tech_conference", "startup_event", "seminar",
      "workshop", "training", "networking", "meetup", "hackathon", "webinar",
    ],
  },
  {
    label: "Exhibitions & fests",
    types: [
      "exhibition", "trade_show", "expo", "college_fest", "cultural_fest",
      "fashion_show", "award_ceremony", "competition", "art_exhibition", "photography",
    ],
  },
  {
    label: "Food & community",
    types: [
      "food_festival", "wine_tasting", "community_event", "charity_event", "fundraiser",
      "religious_event", "spiritual_event", "kids_event", "family_event", "travel_event",
    ],
  },
  {
    label: "Gaming & launches",
    types: ["gaming", "esports", "book_launch", "product_launch", "online_event"],
  },
  {
    label: "Private",
    types: ["wedding", "engagement", "birthday", "private_event", "other"],
  },
];

export const AGE_LIMITS = [
  { value: "All ages", label: "All ages" },
  { value: "5+", label: "5 years and above" },
  { value: "12+", label: "12 years and above" },
  { value: "16+", label: "16 years and above" },
  { value: "18+", label: "18 years and above" },
  { value: "21+", label: "21 years and above" },
];

export const LANGUAGES = [
  "English", "Hindi", "Punjabi", "Marathi", "Gujarati", "Bengali",
  "Tamil", "Telugu", "Kannada", "Malayalam", "Multilingual", "Non-verbal",
];

export const RECURRING_DAYS = [
  { value: "everyday", label: "Every day" },
  { value: "weekend", label: "Weekends (Sat & Sun)" },
  { value: "saturday", label: "Saturdays only" },
  { value: "sunday", label: "Sundays only" },
];

export const TICKET_TYPES = [
  { value: "standard", label: "Standard", hint: "Plain entry to the event." },
  { value: "cover_charge", label: "Cover charge", hint: "The whole amount is redeemable inside." },
  { value: "entry_plus_cover", label: "Entry + cover", hint: "Entry fee plus a redeemable amount." },
  { value: "complimentary", label: "Complimentary", hint: "Free — for guest lists and comps." },
];

/** "music_festival" → "Music Festival". */
export const humanize = (value?: string) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
