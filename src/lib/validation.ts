export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Returns the list of required string fields that are missing or not strings.
export function findInvalidStringFields(body: unknown, fields: string[]): string[] {
  if (!isRecord(body)) return [...fields];
  return fields.filter((field) => !isNonEmptyString(body[field]));
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

// Caps attacker-controlled text so a single record cannot bloat the database.
export function clampText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength);
}
