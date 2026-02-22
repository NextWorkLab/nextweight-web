// lib/airtable.ts
// Airtable REST API helper (server-only)

type AirtableRecord<TFields> = {
  id: string;
  createdTime: string;
  fields: TFields;
};

type AirtableListResponse<TFields> = {
  records: AirtableRecord<TFields>[];
  offset?: string;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function airtableBaseUrl() {
  const baseId = requiredEnv("AIRTABLE_BASE_ID");
  return `https://api.airtable.com/v0/${baseId}`;
}

function airtableHeaders() {
  const pat = requiredEnv("AIRTABLE_PAT");
  return {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };
}

function tableName(envKey: string, fallback: string) {
  return process.env[envKey] || fallback;
}

export const tables = {
  Patients: tableName("AIRTABLE_TABLE_PATIENTS", "Patients"),
  DailyResponses: tableName("AIRTABLE_TABLE_DAILY", "DailyResponses"),
  WeeklyResponses: tableName("AIRTABLE_TABLE_WEEKLY", "WeeklyResponses"),
};

function encodeQS(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).length > 0) sp.set(k, String(v));
  }
  return sp.toString();
}

export async function fetchAll<TFields>(
  table: string,
  options?: {
    view?: string;
    filterByFormula?: string;
    fields?: string[];
    sort?: { field: string; direction?: "asc" | "desc" }[];
    maxRecords?: number;
    pageSize?: number;
  }
): Promise<(TFields & { id: string; createdTime: string })[]> {
  const baseUrl = airtableBaseUrl();
  const pageSize = Math.min(Math.max(options?.pageSize || 100, 1), 100);

  let offset: string | undefined = undefined;
  const out: (TFields & { id: string; createdTime: string })[] = [];

  while (true) {
    const qs = encodeQS({
      pageSize: String(pageSize),
      view: options?.view,
      filterByFormula: options?.filterByFormula,
      maxRecords: options?.maxRecords ? String(options.maxRecords) : undefined,
    });

    const url = `${baseUrl}/${encodeURIComponent(table)}?${qs}`;

    // fields / sort 는 URLSearchParams로 여러 번 들어가야 해서 별도로 구성
    const u = new URL(url);
    if (options?.fields?.length) {
      for (const f of options.fields) u.searchParams.append("fields[]", f);
    }
    if (options?.sort?.length) {
      options.sort.forEach((s, i) => {
        u.searchParams.append(`sort[${i}][field]`, s.field);
        u.searchParams.append(`sort[${i}][direction]`, s.direction || "asc");
      });
    }
    if (offset) u.searchParams.set("offset", offset);

    const res = await fetch(u.toString(), {
      method: "GET",
      headers: airtableHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable fetch failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as AirtableListResponse<TFields>;
    for (const r of data.records || []) {
      out.push({ ...(r.fields as any), id: r.id, createdTime: r.createdTime });
    }

    offset = data.offset;
    if (!offset) break;

    if (options?.maxRecords && out.length >= options.maxRecords) {
      return out.slice(0, options.maxRecords);
    }
  }

  return out;
}

function escapeFormulaString(s: string) {
  // Airtable formula uses single quotes for strings
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function formulaEq(field: string, value: string) {
  return `{${field}}='${escapeFormulaString(value)}'`;
}

export function formulaAnd(...parts: (string | undefined | null)[]) {
  const cleaned = parts.filter(Boolean) as string[];
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  return `AND(${cleaned.join(",")})`;
}

export function formulaGteIso(field: string, iso: string) {
  // ISO string compare works for Airtable DATETIME in many setups,
  // but safest is to compare with DATETIME_PARSE
  return `DATETIME_PARSE({${field}}) >= DATETIME_PARSE('${escapeFormulaString(iso)}')`;
}

/**
 * Dashboard route에서 import 하는 타입들 (유연하게)
 * 실제 Airtable 필드 스키마가 변해도 최대한 깨지지 않게 optional로 둡니다.
 */
export interface PatientFields {
  clinic_id?: string;
  clinic?: string | string[];
  patient_id?: string;
  patient_code?: string;
  phone?: string;
  name_or_initial?: string;
  weekly_day?: string;
  consent?: boolean | string;
  status?: string;
  Status?: string;
  Select?: string;
  ["상태"]?: string;
  created_at?: string;
  updated_at?: string;
  last_daily_response_at?: string;
  last_weekly_response_at?: string;
  [key: string]: any;
}

export interface DailyResponseFields {
  timestamp?: string;
  patient_code?: string;
  patient?: string[] | string;
  medication_taken?: boolean | string;
  nausea_level?: number;
  vomiting?: boolean | string;
  dizziness?: boolean | string;
  abdominal_discomfort?: boolean | string;
  overall_condition?: number;
  [key: string]: any;
}

export interface WeeklyResponseFields {
  timestamp?: string;
  patient_code?: string;
  patient?: string[] | string;
  weight_kg?: number;
  body_fat_percent?: number;
  appetite_change?: string;
  meal_amount_change?: string;
  exercise_frequency?: string;
  [key: string]: any;
}

// ── 범용 쓰기 헬퍼 ───────────────────────────────────────────────

export async function createRecord<TFields extends Record<string, unknown>>(
  table: string,
  fields: TFields
): Promise<TFields & { id: string; createdTime: string }> {
  const baseUrl = airtableBaseUrl();
  const url = `${baseUrl}/${encodeURIComponent(table)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: airtableHeaders(),
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable createRecord failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as AirtableRecord<TFields>;
  return { ...(data.fields as any), id: data.id, createdTime: data.createdTime };
}

export async function updateRecord<TFields extends Record<string, unknown>>(
  table: string,
  recordId: string,
  fields: Partial<TFields>
): Promise<void> {
  const baseUrl = airtableBaseUrl();
  const url = `${baseUrl}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: airtableHeaders(),
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable updateRecord failed (${res.status}): ${text}`);
  }
}

export async function findFirst<TFields>(
  table: string,
  filterByFormula: string
): Promise<(TFields & { id: string; createdTime: string }) | null> {
  const records = await fetchAll<TFields>(table, { filterByFormula, maxRecords: 1 });
  return records[0] ?? null;
}
