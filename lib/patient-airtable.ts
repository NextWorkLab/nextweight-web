// lib/patient-airtable.ts
// 환자 중심 플랫폼 Airtable 연동 함수 (server-only)

import {
  fetchAll,
  createRecord,
  updateRecord,
  findFirst,
  formulaEq,
  formulaAnd,
  formulaGteIso,
} from "./airtable";
import type {
  PatientUser,
  DailyLog,
  WeeklyLog,
  ShareToken,
  PatientUserFields,
  DailyLogFields,
  WeeklyLogFields,
  ShareTokenFields,
} from "./patient-types";

// ── 테이블 이름 ────────────────────────────────────────────────
function t(envKey: string, fallback: string) {
  return process.env[envKey] || fallback;
}

const Tables = {
  Users: () => t("AIRTABLE_TABLE_USERS", "Users"),
  DailyLogs: () => t("AIRTABLE_TABLE_DAILY_LOGS", "DailyLogs"),
  WeeklyLogs: () => t("AIRTABLE_TABLE_WEEKLY_LOGS", "WeeklyLogs"),
  ShareTokens: () => t("AIRTABLE_TABLE_SHARE_TOKENS", "ShareTokens"),
};

// ── 매핑 헬퍼 ─────────────────────────────────────────────────
function toUser(r: PatientUserFields & { id: string; createdTime: string }): PatientUser {
  return {
    id: r.id,
    user_id: r.user_id || r.id,
    phone: r.phone || "",
    email: r.email,
    consent: Boolean(r.consent),
    created_at: r.created_at || r.createdTime,
  };
}

function toDailyLog(r: DailyLogFields & { id: string; createdTime: string }): DailyLog {
  return {
    id: r.id,
    user_id: r.user_id || "",
    timestamp: r.timestamp || r.createdTime,
    medication_taken: Boolean(r.medication_taken),
    nausea_level: Number(r.nausea_level ?? 0),
    vomiting: Boolean(r.vomiting),
    weight_kg: r.weight_kg ? Number(r.weight_kg) : undefined,
  };
}

function toWeeklyLog(r: WeeklyLogFields & { id: string; createdTime: string }): WeeklyLog {
  return {
    id: r.id,
    user_id: r.user_id || "",
    timestamp: r.timestamp || r.createdTime,
    weight_kg: Number(r.weight_kg ?? 0),
    appetite_change: r.appetite_change || "유지",
    exercise_frequency: r.exercise_frequency || "없음",
  };
}

function toShareToken(r: ShareTokenFields & { id: string; createdTime: string }): ShareToken {
  return {
    id: r.id,
    token: r.token || "",
    user_id: r.user_id || "",
    expires_at: r.expires_at || "",
    created_at: r.created_at || r.createdTime,
    revoked_at: r.revoked_at,
  };
}

// ── Users ──────────────────────────────────────────────────────

export async function findUserByPhone(phone: string): Promise<PatientUser | null> {
  const r = await findFirst<PatientUserFields>(
    Tables.Users(),
    formulaEq("phone", phone)
  );
  return r ? toUser(r) : null;
}

export async function findUserById(user_id: string): Promise<PatientUser | null> {
  const r = await findFirst<PatientUserFields>(
    Tables.Users(),
    formulaEq("user_id", user_id)
  );
  return r ? toUser(r) : null;
}

export async function createUser(phone: string): Promise<PatientUser> {
  const user_id = crypto.randomUUID();
  const now = new Date().toISOString();
  const r = await createRecord<PatientUserFields>(Tables.Users(), {
    user_id,
    phone,
    consent: true,
    created_at: now,
  });
  return toUser(r);
}

export async function upsertUser(phone: string): Promise<PatientUser> {
  const existing = await findUserByPhone(phone);
  if (existing) return existing;
  return createUser(phone);
}

// ── DailyLogs ─────────────────────────────────────────────────

export async function createDailyLog(
  user_id: string,
  data: {
    medication_taken: boolean;
    nausea_level: number;
    vomiting: boolean;
    weight_kg?: number;
  }
): Promise<DailyLog> {
  const timestamp = new Date().toISOString();
  const fields: DailyLogFields = {
    user_id,
    timestamp,
    medication_taken: data.medication_taken,
    nausea_level: data.nausea_level,
    vomiting: data.vomiting,
  };
  if (data.weight_kg !== undefined) fields.weight_kg = data.weight_kg;
  const r = await createRecord<DailyLogFields>(Tables.DailyLogs(), fields);
  return toDailyLog(r);
}

export async function getDailyLogs(
  user_id: string,
  sinceDays = 30
): Promise<DailyLog[]> {
  const since = new Date(Date.now() - sinceDays * 86400 * 1000).toISOString();
  const filter = formulaAnd(
    formulaEq("user_id", user_id),
    formulaGteIso("timestamp", since)
  );
  const records = await fetchAll<DailyLogFields>(Tables.DailyLogs(), {
    filterByFormula: filter,
    sort: [{ field: "timestamp", direction: "desc" }],
  });
  return records.map(toDailyLog);
}

// ── WeeklyLogs ────────────────────────────────────────────────

export async function createWeeklyLog(
  user_id: string,
  data: {
    weight_kg: number;
    appetite_change: string;
    exercise_frequency: string;
  }
): Promise<WeeklyLog> {
  const timestamp = new Date().toISOString();
  const r = await createRecord<WeeklyLogFields>(Tables.WeeklyLogs(), {
    user_id,
    timestamp,
    weight_kg: data.weight_kg,
    appetite_change: data.appetite_change,
    exercise_frequency: data.exercise_frequency,
  });
  return toWeeklyLog(r);
}

export async function getWeeklyLogs(
  user_id: string,
  sinceDays = 30
): Promise<WeeklyLog[]> {
  const since = new Date(Date.now() - sinceDays * 86400 * 1000).toISOString();
  const filter = formulaAnd(
    formulaEq("user_id", user_id),
    formulaGteIso("timestamp", since)
  );
  const records = await fetchAll<WeeklyLogFields>(Tables.WeeklyLogs(), {
    filterByFormula: filter,
    sort: [{ field: "timestamp", direction: "desc" }],
  });
  return records.map(toWeeklyLog);
}

// ── ShareTokens ───────────────────────────────────────────────

export async function createShareToken(
  user_id: string,
  expiresInMinutes: number
): Promise<ShareToken> {
  const token = crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const expires_at = new Date(now.getTime() + expiresInMinutes * 60 * 1000).toISOString();
  const r = await createRecord<ShareTokenFields>(Tables.ShareTokens(), {
    token,
    user_id,
    expires_at,
    created_at: now.toISOString(),
  });
  return toShareToken(r);
}

export async function findShareToken(token: string): Promise<ShareToken | null> {
  const r = await findFirst<ShareTokenFields>(
    Tables.ShareTokens(),
    formulaEq("token", token)
  );
  return r ? toShareToken(r) : null;
}

export async function revokeShareToken(token: string): Promise<void> {
  const r = await findFirst<ShareTokenFields>(
    Tables.ShareTokens(),
    formulaEq("token", token)
  );
  if (!r) return;
  await updateRecord<ShareTokenFields>(Tables.ShareTokens(), r.id, {
    revoked_at: new Date().toISOString(),
  });
}

export async function listShareTokens(user_id: string): Promise<ShareToken[]> {
  const records = await fetchAll<ShareTokenFields>(Tables.ShareTokens(), {
    filterByFormula: formulaEq("user_id", user_id),
    sort: [{ field: "created_at", direction: "desc" }],
    maxRecords: 20,
  });
  return records.map(toShareToken);
}
