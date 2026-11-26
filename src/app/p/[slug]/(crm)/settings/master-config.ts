/** Field definitions for the generic master-list editor (branches, sources, services, stages). */

export type MasterField = {
  name: string;
  label: string;
  type: "text" | "switch" | "color" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Show as a column in the list. */
  column?: boolean;
};

export const MASTER_TABLES = {
  branches: {
    title: "Branches",
    singular: "branch",
    description: "Locations or teams. Leads, appointments and members can belong to a branch.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Jayanagar", column: true },
      { name: "code", label: "Code", type: "text", placeholder: "e.g. JYN", column: true },
      { name: "city", label: "City", type: "text", column: true },
      { name: "address", label: "Address", type: "text" },
      { name: "phone", label: "Phone", type: "text", column: true },
      { name: "is_active", label: "Active", type: "switch" },
    ],
  },
  lead_sources: {
    title: "Lead sources",
    singular: "source",
    description: "Where leads come from: website, WhatsApp, Meta, Google Ads, walk-in… The webhook adds new ones automatically.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Meta Ads", column: true },
      { name: "is_active", label: "Active", type: "switch" },
    ],
  },
  services: {
    title: "Services",
    singular: "service",
    description: "What you sell or treat. Used on leads, appointments and in reports.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. General Consultation", column: true },
      { name: "category", label: "Category", type: "text", placeholder: "e.g. Consultation", column: true },
      { name: "is_active", label: "Active", type: "switch" },
    ],
  },
  lead_stages: {
    title: "Pipeline stages",
    singular: "stage",
    description: "Columns of the lead kanban. Moving a lead to a “won” stage converts it; “lost” stages clear follow-ups.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Follow-up", column: true },
      { name: "color", label: "Colour", type: "color" },
      {
        name: "kind",
        label: "Type",
        type: "select",
        column: true,
        options: [
          { value: "open", label: "Open" },
          { value: "won", label: "Won (converted)" },
          { value: "lost", label: "Lost" },
        ],
      },
    ],
  },
} satisfies Record<string, { title: string; singular: string; description: string; fields: MasterField[] }>;

export type MasterTable = keyof typeof MASTER_TABLES;

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Jakarta",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "Africa/Nairobi",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];
