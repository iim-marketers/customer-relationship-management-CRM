export const singularOf = (label: string) => (label.endsWith("s") ? label.slice(0, -1) : label);
