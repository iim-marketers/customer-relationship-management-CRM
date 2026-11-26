/** Industry presets: picking one sets what the "contacts" tab is called. */
export const INDUSTRIES = [
  { value: "healthcare", label: "Clinic / Healthcare", contactLabel: "Patients" },
  { value: "wellness", label: "Wellness / Salon / Spa", contactLabel: "Clients" },
  { value: "education", label: "Education / Coaching", contactLabel: "Students" },
  { value: "real_estate", label: "Real estate", contactLabel: "Buyers" },
  { value: "services", label: "Agency / Services", contactLabel: "Clients" },
  { value: "retail", label: "Retail / D2C", contactLabel: "Customers" },
  { value: "other", label: "Something else", contactLabel: "Customers" },
] as const;

export function contactLabelFor(industry: string | null | undefined) {
  return INDUSTRIES.find((i) => i.value === industry)?.contactLabel ?? "Customers";
}

export function industryLabel(industry: string | null | undefined) {
  return INDUSTRIES.find((i) => i.value === industry)?.label ?? industry ?? "";
}
