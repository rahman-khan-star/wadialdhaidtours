import { clampText, isNonEmptyString, isRecord } from "@/lib/validation";

const TEXT_LIMITS = {
  country: 120,
  flag: 16,
  type: 120,
  duration: 60,
  processingTime: 60,
} as const;

const MAX_PRICE = 1_000_000;
const MAX_DISPLAY_ORDER = 100_000;
const MAX_REQUIREMENTS = 50;
const MAX_REQUIREMENT_LENGTH = 300;

export type VisaServiceDraft = {
  country: string;
  flag: string;
  type: string;
  duration: string;
  price: number;
  processingTime: string;
  requirements: string[];
  isActive: boolean;
  // Omitted values are filled with the next free slot by the service layer.
  displayOrder?: number;
};

type VisaServiceFields = Partial<VisaServiceDraft>;

type ParseSuccess<T> = { ok: true; value: T };
type ParseFailure = { ok: false; error: string };
type ParseResult<T> = ParseSuccess<T> | ParseFailure;

const TEXT_FIELDS = [
  { key: "country", label: "Country" },
  { key: "flag", label: "Flag" },
  { key: "type", label: "Visa type" },
  { key: "duration", label: "Duration" },
  { key: "processingTime", label: "Processing time" },
] as const;

function readText(
  body: Record<string, unknown>,
  key: (typeof TEXT_FIELDS)[number]["key"],
  label: string,
  limit: number
): string | undefined {
  const raw = body[key];
  if (raw === undefined) return undefined;
  if (!isNonEmptyString(raw)) throw new ValidationError(`${label} is required`);
  return clampText(raw.trim(), limit);
}

class ValidationError extends Error {}

// Shared field parsing for create (partial: false, all fields required) and
// update (partial: true, only supplied fields are validated and returned).
function parseFields(
  body: unknown,
  { partial }: { partial: boolean }
): ParseResult<VisaServiceFields> {
  if (!isRecord(body)) return { ok: false, error: "Invalid request body" };

  const value: VisaServiceFields = {};
  const missing: string[] = [];

  try {
    for (const { key, label } of TEXT_FIELDS) {
      const parsed = readText(body, key, label, TEXT_LIMITS[key]);
      if (parsed === undefined) {
        if (!partial) missing.push(label);
      } else {
        value[key] = parsed;
      }
    }

    if (body.price === undefined) {
      if (!partial) missing.push("Price");
    } else {
      const price = body.price;
      if (
        typeof price !== "number" ||
        !Number.isInteger(price) ||
        price < 0 ||
        price > MAX_PRICE
      ) {
        return {
          ok: false,
          error: `Price must be a whole number between 0 and ${MAX_PRICE}`,
        };
      }
      value.price = price;
    }

    if (body.requirements === undefined) {
      if (!partial) missing.push("Requirements");
    } else {
      const requirements = body.requirements;
      if (!Array.isArray(requirements)) {
        return { ok: false, error: "Requirements must be a list" };
      }
      if (requirements.length > MAX_REQUIREMENTS) {
        return {
          ok: false,
          error: `Requirements must contain at most ${MAX_REQUIREMENTS} items`,
        };
      }
      if (!requirements.every((item) => typeof item === "string")) {
        return { ok: false, error: "Requirements must be a list of text entries" };
      }
      value.requirements = requirements
        .map((item) => clampText(item.trim(), MAX_REQUIREMENT_LENGTH))
        .filter((item) => item.length > 0);
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return { ok: false, error: "Active status must be true or false" };
      }
      value.isActive = body.isActive;
    }

    if (body.displayOrder !== undefined) {
      const displayOrder = body.displayOrder;
      if (
        typeof displayOrder !== "number" ||
        !Number.isInteger(displayOrder) ||
        displayOrder < 0 ||
        displayOrder > MAX_DISPLAY_ORDER
      ) {
        return {
          ok: false,
          error: `Display order must be a whole number between 0 and ${MAX_DISPLAY_ORDER}`,
        };
      }
      value.displayOrder = displayOrder;
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  if (missing.length > 0) {
    return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
  }

  if (partial && Object.keys(value).length === 0) {
    return { ok: false, error: "No fields to update" };
  }

  return { ok: true, value };
}

// Validates a full payload for creating a visa service.
export function parseVisaServicePayload(
  body: unknown
): ParseResult<VisaServiceDraft> {
  const parsed = parseFields(body, { partial: false });
  if (!parsed.ok) return parsed;

  const raw = parsed.value;
  if (
    raw.country === undefined ||
    raw.flag === undefined ||
    raw.type === undefined ||
    raw.duration === undefined ||
    raw.processingTime === undefined ||
    raw.price === undefined ||
    raw.requirements === undefined
  ) {
    // Unreachable: partial: false already rejected every missing field.
    return { ok: false, error: "Invalid visa service payload" };
  }

  return {
    ok: true,
    value: {
      country: raw.country,
      flag: raw.flag,
      type: raw.type,
      duration: raw.duration,
      price: raw.price,
      processingTime: raw.processingTime,
      requirements: raw.requirements,
      isActive: raw.isActive ?? true,
      displayOrder: raw.displayOrder,
    },
  };
}

// Validates a partial payload for updating a visa service.
export function parseVisaServiceUpdates(
  body: unknown
): ParseResult<Partial<VisaServiceDraft>> {
  return parseFields(body, { partial: true });
}
