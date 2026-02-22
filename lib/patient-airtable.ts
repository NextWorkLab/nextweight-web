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
  MagicLink,
  DailyLog,
  WeeklyLog,
  ShareToken,
  PatientUserFields,
  MagicLinkFields,
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
  MagicLinks: () => t("AIRTABLE_TABLE_MAGIC_LINKS", "MagicLinks"),
  DailyLogs: () => t("AIRTABLE_TABLE_DAILY_LOGS", "DailyLogs"),
  WeeklyLogs: () => t("AIRTABLE_TABLE_WEEKLY_LOGS", "WeeklyLogs"),
  ShareTokens: () => t("AIRTABLE_TABLE_SHARE_TOKENS", "ShareTokens"),
};

// ── 매핑 헬퍼 ─────────────────────────────────────────────────
function toUser(r: PatientUserFields & { id: string; createdTime: string }): PatientUser {
  return {
    id: r.id,
    user_id: r.user_id || r.id,
    email: r.email || "",
    phone: r.phone,
    consent: Boolean(r.consent),
    created_at: r.created_at || r.createdTime,
  };
}

function toMagicLink(r: MagicLinkFields & { id: string; createdTime: string }): MagicLink {
  return {
    id: r.id,
    token: r.token || "",
    code_hash: r.code_hash || "",
    user_id: r.user_id || "",
    expires_at: r.expires_at || "",
    created_at: r.created_at || r.createdTime,
    used_at: r.used_at,
    revoked_at: r.revoked_at,
    attempts: Number(r.attempts ?? 0),
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

// ── Users (이메일 기반) ────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<PatientUser | null> {
  const r = await findFirst<PatientUserFields>(
    Tables.Users(),
    formulaEq("email", email)
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

export async function createUserByEmail(email: string): Promise<PatientUser> {
  const user_id = crypto.randomUUID();
  const now = new Date().toISOString();
  const r = await createRecord<PatientUserFields>(Tables.Users(), {
    user_id,
    email,
    consent: true,
    created_at: now,
  });
  return toUser(r);
}

export async function upsertUserByEmail(email: string): Promise<PatientUser> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  return createUserByEmail(email);
}

// ── Users (레거시 폰 기반 — 하위 호환) ─────────────────────────

export async function findUserByPhone(phone: string): Promise<PatientUser | null> {
  const r = await findFirst<PatientUserFields>(
    Tables.Users(),
    formulaEq("phone", phone)
  );
  return r ? toUser(r) : null;
}

export async function upsertUser(phone: string): Promise<PatientUser> {
  const existing = await findUserByPhone(phone);
  if (existing) return existing;
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

// ── MagicLinks ────────────────────────────────────────────────

export async function createMagicLink(data: {
  token: string;
  code_hash: string;
  user_id: string;
  expires_at: string;
}): Promise<MagicLink> {
  const now = new Date().toISOString();
  const r = await createRecord<MagicLinkFields>(Tables.MagicLinks(), {
    token: data.token,
    code_hash: data.code_hash,
    user_id: data.user_id,
    expires_at: data.expires_at,
    created_at: now,
    attempts: 0,
  });
  return toMagicLink(r);
}

export async function findMagicLinkByToken(token: string): Promise<MagicLink | null> {
  const r = await findFirst<MagicLinkFields>(
    Tables.MagicLinks(),
    formulaEq("token", token)
  );
  return r ? toMagicLink(r) : null;
}

/** 특정 user_id의 최신 미사용·미폐기 매직링크 반환 */
export async function findLatestMagicLinkByUserId(
  user_id: string
): Promise<MagicLink | null> {
  // user_id로 필터, created_at desc 정렬, 최근 5건만 조회 후 코드에서 조건 확인
  const records = await fetchAll<MagicLinkFields>(Tables.MagicLinks(), {
    filterByFormula: formulaAnd(
      formulaEq("user_id", user_id),
      `{used_at}=''`,
      `{revoked_at}=''`
    ),
    sort: [{ field: "created_at", direction: "desc" }],
    maxRecords: 1,
  });
  if (!records.length) return null;
  return toMagicLink(records[0]);
}

export async function markMagicLinkUsed(id: string): Promise<void> {
  await updateRecord<MagicLinkFields>(Tables.MagicLinks(), id, {
    used_at: new Date().toISOString(),
  });
}

export async function incrementMagicLinkAttempts(
  id: string,
  newAttempts: number
): Promise<void> {
  await updateRecord<MagicLinkFields>(Tables.MagicLinks(), id, {
    attempts: newAttempts,
  });
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
