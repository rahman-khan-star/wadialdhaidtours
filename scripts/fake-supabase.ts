// In-memory PostgREST stand-in used by the flight-pricing verification
// suite. It mirrors only the query shapes supabase-js issues in this app:
// `GET` with select/limit/order, `POST` insert, and `PATCH` with `eq` filters.
//
// Fidelity notes that matter for the pricing regression tests:
//  * `GET` without `order` returns rows in physical order, like a heap scan.
//  * `PATCH` re-inserts the updated row at the END of the store, mimicking
//    how Postgres writes a new tuple version (the old one becomes invisible).
//  * `Accept: application/vnd.pgrst.object+json` (`.single()`) returns a bare
//    object, or a PGRST116 error when no row matches; anything else returns
//    an array, which postgrest-js unwraps for `.maybeSingle()`.
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";

export type Row = Record<string, unknown>;

export interface FakeDb {
  settings: Row[];
  activity_logs: Row[];
  login_history: Row[];
}

export interface FakeSupabase {
  db: FakeDb;
  url: string;
  requests: string[];
  close: () => Promise<void>;
}

function project(row: Row, select: string): Row {
  if (!select || select === "*") return { ...row };
  const out: Row = {};
  for (const field of select.split(",")) {
    const name = field.trim();
    if (name) out[name] = row[name];
  }
  return out;
}

function matchesFilters(row: Row, params: URLSearchParams): boolean {
  for (const [key, raw] of params.entries()) {
    if (["select", "limit", "offset", "order"].includes(key)) continue;
    if (raw.startsWith("eq.")) {
      if (String(row[key]) !== raw.slice(3)) return false;
    } else if (raw !== String(row[key])) {
      return false;
    }
  }
  return true;
}

function applyOrder(rows: Row[], params: URLSearchParams): Row[] {
  const spec = params.get("order");
  if (!spec) return rows;
  const [column = "", direction = "asc"] = spec.split(",")[0].split(".");
  const factor = direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const left = a[column];
    const right = b[column];
    if (left === right) return 0;
    if (left === undefined || left === null) return -1 * factor;
    if (right === undefined || right === null) return 1 * factor;
    return (left < right ? -1 : 1) * factor;
  });
}

export function startFakeSupabase(db: FakeDb): Promise<FakeSupabase> {
  const requests: string[] = [];
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const url = new URL(req.url ?? "/", "http://localhost");
      const table = url.pathname.split("/").pop() ?? "";
      const body = Buffer.concat(chunks).toString("utf8");
      const accept = req.headers.accept ?? "";
      requests.push(`${req.method} ${url.pathname}${url.search}`);
      const store = db[table as keyof FakeDb];
      const json = (payload: unknown, status = 200) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(payload));
      };
      const single = accept === "application/vnd.pgrst.object+json";
      const respondRows = (rows: Row[]) =>
        single
          ? rows.length === 1
            ? json(rows[0])
            : json(
                {
                  code: "PGRST116",
                  details: `Results contain ${rows.length} rows, application/vnd.pgrst.object+json requires 1 row`,
                  hint: null,
                  message: "JSON object requested, multiple (or no) rows returned",
                },
                406
              )
          : json(rows);

      if (!store) return json({ message: `relation "${table}" does not exist` }, 404);

      if (req.method === "GET") {
        const select = url.searchParams.get("select") ?? "*";
        const limit = Number(url.searchParams.get("limit") ?? "0");
        let rows = store.filter((row) => matchesFilters(row, url.searchParams));
        rows = applyOrder(rows, url.searchParams);
        if (limit > 0) rows = rows.slice(0, limit);
        return respondRows(rows.map((row) => project(row, select)));
      }

      if (req.method === "POST") {
        const payload = body ? JSON.parse(body) : [];
        const list = Array.isArray(payload) ? payload : [payload];
        const inserted = list.map((entry: Row) => {
          const row: Row = {
            id: randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...entry,
          };
          store.push(row);
          return row;
        });
        return respondRows(inserted);
      }

      if (req.method === "PATCH") {
        const patch = body ? JSON.parse(body) : {};
        const select = url.searchParams.get("select") ?? "*";
        const remaining: Row[] = [];
        const newVersions: Row[] = [];
        for (const row of store) {
          if (matchesFilters(row, url.searchParams)) {
            newVersions.push({ ...row, ...patch, updated_at: new Date().toISOString() });
          } else {
            remaining.push(row);
          }
        }
        // New tuple versions land at the end of the heap; the old versions
        // are gone from the visible scan.
        store.length = 0;
        store.push(...remaining, ...newVersions);
        return respondRows(newVersions.map((row) => project(row, select)));
      }

      json({ message: "method not allowed" }, 405);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({
        db,
        url: `http://127.0.0.1:${port}`,
        requests,
        close: () =>
          new Promise<void>((done, fail) =>
            server.close((err) => (err ? fail(err) : done()))
          ),
      });
    });
  });
}
