const EARTH_RADIUS_KM = 6371;

export function hashString(value: string): number {
  // FNV-1a: small, stable, and good enough to derive mock inventory.
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function distanceKm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Formats an instant as wall-clock time in a fixed UTC offset.
export function formatLocalTime(epochMs: number, tzMinutes: number): string {
  const shifted = new Date(epochMs + tzMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    shifted.getUTCFullYear(),
    pad(shifted.getUTCMonth() + 1),
    pad(shifted.getUTCDate()),
  ].join("-") +
    "T" +
    [pad(shifted.getUTCHours()), pad(shifted.getUTCMinutes())].join(":");
}

// Turns a "YYYY-MM-DD" plus local clock time at an airport into an epoch,
// so durations can be computed without a timezone database.
export function localWallClockEpoch(isoDate: string, time: string, tzMinutes: number): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes) - tzMinutes * 60_000;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// "2026-11-04T09:30" -> "09:30"; keeps the day offset when arrival rolls over.
export function timePart(localIso: string): string {
  return localIso.slice(11, 16);
}

export function dayOffset(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`) -
      Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`)) /
      86_400_000
  );
}
