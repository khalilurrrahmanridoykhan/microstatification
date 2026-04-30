export type AppRole = "admin" | "sk";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type RecordType = "local" | "non_local";

export interface SessionUser {
  id: string;
  email: string;
}

export interface AuthProfile {
  full_name: string;
  email: string;
  micro_role?: string;
  micro_district?: string | number | null;
  micro_upazila?: string | number | null;
  micro_union?: string | number | null;
  micro_village?: string | number | null;
  micro_villages?: Array<string | number>;
  micro_ward_no?: string | null;
}

export interface SessionData {
  user: SessionUser;
  profile: AuthProfile;
  role: AppRole;
}

export interface LoginResponse extends SessionData {
  token: string;
}

export interface MonthlyValues {
  jan_cases: number;
  feb_cases: number;
  mar_cases: number;
  apr_cases: number;
  may_cases: number;
  jun_cases: number;
  jul_cases: number;
  aug_cases: number;
  sep_cases: number;
  oct_cases: number;
  nov_cases: number;
  dec_cases: number;
}

export interface LocalRecord extends MonthlyValues {
  id: string;
  village_id: string;
  sk_user_id: string;
  district_id: string;
  upazila_id: string;
  union_id: string;
  reporting_year: number;
  sk_user_display_name: string;
  sk_user_designation: string;
  sk_user_ss_name: string;
  hh: number;
  population: number;
  itn_2023: number;
  itn_2024: number;
  itn_2025: number;
  itn_2026: number;
  district_name: string;
  upazila_name: string;
  union_name: string;
  village_name: string;
  village_name_bn: string;
  village_code: string;
  village_latitude: number | null;
  village_longitude: number | null;
  village_population: number | null;
  village_sk_shw_name: string;
  village_ss_name: string;
  village_mmw_hp_chwc_name: string;
  village_distance_from_upazila_office_km: number | null;
  village_bordering_country_name: string;
  village_other_activities: string;
  ward_no: string | null;
}

export interface NonLocalRecord extends MonthlyValues {
  id: string;
  sk_user_id: string;
  reporting_year: number;
  country: string;
  district_or_state: string;
  upazila_or_township: string;
  union_name: string;
  village_name: string;
}

export interface ApprovalRow {
  record_id: string;
  month: number;
  status: ApprovalStatus;
}

export interface ReviewRow extends MonthlyValues {
  id: string;
  record_type: RecordType;
  sk_user_id: string;
  sk_name: string;
  location: string;
  reporting_year: number;
}

export interface ReviewResponse {
  rows: ReviewRow[];
  approvals: ApprovalRow[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  created_at: string;
  assignment_count: number;
}

export interface VillageNode {
  id: string;
  name: string;
  ward_no: string | null;
}

export interface UnionNode {
  id: string;
  name: string;
  villages: VillageNode[];
}

export interface UpazilaNode {
  id: string;
  name: string;
  unions: UnionNode[];
}

export interface DistrictNode {
  id: string;
  name: string;
  upazilas: UpazilaNode[];
}

export interface MasterDistrict {
  id: number;
  name: string;
}

export interface MasterUpazila {
  id: number;
  name: string;
  district_id: number;
}

export interface MasterUnion {
  id: number;
  name: string;
  upazila_id: number;
}

export interface MasterVillage {
  id: number;
  name: string;
  ward_no: string | null;
  union_id: number;
}

export interface MalariaMasterData {
  districts: MasterDistrict[];
  upazilas: MasterUpazila[];
  unions: MasterUnion[];
  villages: MasterVillage[];
}

export interface Assignment {
  id: string;
  sk_user_id: string;
  village_id: string;
  sk_name: string;
  district_name: string;
  upazila_name: string;
  union_name: string;
  village_name: string;
  ward_no: string | null;
}

export interface LocalRecordUpdate extends MonthlyValues {
  hh: number;
  population: number;
  itn_2023: number;
  itn_2024: number;
  itn_2025: number;
  itn_2026: number;
  sk_user_designation?: string;
}

export interface LocalRecordCreatePayload extends MonthlyValues {
  village: string | number;
  sk_user?: string;
  reporting_year: number;
  hh: number;
  population: number;
  itn_2023: number;
  itn_2024: number;
  itn_2025: number;
  itn_2026: number;
}

export interface NonLocalRecordPayload extends MonthlyValues {
  sk_user_id?: string;
  reporting_year: number;
  country: string;
  district_or_state: string;
  upazila_or_township: string;
  union_name: string;
  village_name: string;
}

export interface VillageUpdatePayload {
  name: string;
  name_bn: string;
  village_code: string;
  latitude: number | null;
  longitude: number | null;
  ward_no: string | null;
  sk_shw_name: string;
  ss_name: string;
  mmw_hp_chwc_name: string;
  distance_from_upazila_office_km: number | null;
  bordering_country_name: string;
  other_activities: string;
}

export interface MonthAccessSetting {
  id: string;
  reporting_year: number;
  month: number;
  is_open: boolean;
  close_date: string | null;
}

export interface UserPayload {
  full_name: string;
  email: string;
  role: AppRole;
  password?: string;
}

const authTokenStorageKey = "malaria_reporting_auth_token";
const legacyMalariaTokenKey = "malaria_auth_token";
const mainSessionTokenKey = "authToken";
const mainSessionUserKey = "userInfo";
const requestTimeoutMs = 8000;
const getRequestCacheTtlMs = 30_000;
const getRequestCache = new Map<string, { expiresAt: number; data: unknown }>();

export function getAuthToken(): string | null {
  const primary = window.localStorage.getItem(authTokenStorageKey);
  if (primary) return primary;

  const legacy = window.localStorage.getItem(legacyMalariaTokenKey);
  if (legacy) {
    window.localStorage.setItem(authTokenStorageKey, legacy);
    return legacy;
  }

  const mainSession = window.sessionStorage.getItem(mainSessionTokenKey);
  if (mainSession) {
    window.localStorage.setItem(authTokenStorageKey, mainSession);
    return mainSession;
  }

  return null;
}

export function setAuthToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token);
    window.localStorage.setItem(legacyMalariaTokenKey, token);
    window.sessionStorage.setItem(mainSessionTokenKey, token);
    return;
  }

  window.localStorage.removeItem(authTokenStorageKey);
  window.localStorage.removeItem(legacyMalariaTokenKey);
  window.sessionStorage.removeItem(mainSessionTokenKey);
  window.sessionStorage.removeItem(mainSessionUserKey);
}

function parseLegacyRole(value: unknown, microRole: unknown): AppRole {
  const numericRole = Number(value);
  const normalizedMicroRole = String(microRole || "").toLowerCase();
  if (numericRole === 1 || numericRole === 7 || normalizedMicroRole === "micro_admin") {
    return "admin";
  }
  return "sk";
}

function getLegacySessionFromMainApp(): SessionData | null {
  const userInfoRaw = window.sessionStorage.getItem(mainSessionUserKey);
  if (!userInfoRaw) return null;

  try {
    const userInfo = JSON.parse(userInfoRaw) as {
      id?: string | number;
      email?: string;
      username?: string;
      full_name?: string;
      role?: number | string;
      profile?: { micro_role?: string; email?: string; full_name?: string };
    };

    const email =
      String(userInfo.email || userInfo.profile?.email || "").trim() ||
      `${String(userInfo.username || "user").trim()}@commicplan.local`;
    const fullName =
      String(userInfo.full_name || userInfo.profile?.full_name || "").trim() || "User";

    return {
      user: {
        id: String(userInfo.id || email),
        email,
      },
      profile: {
        full_name: fullName,
        email,
        micro_role: String(userInfo.profile?.micro_role || ""),
        micro_district: userInfo.profile?.micro_district ?? null,
        micro_upazila: userInfo.profile?.micro_upazila ?? null,
        micro_union: userInfo.profile?.micro_union ?? null,
        micro_village: userInfo.profile?.micro_village ?? null,
        micro_villages: Array.isArray((userInfo.profile as { micro_villages?: unknown[] } | undefined)?.micro_villages)
          ? ((userInfo.profile as { micro_villages?: unknown[] }).micro_villages || []).map((item) =>
              String(item),
            )
          : [],
        micro_ward_no: String(userInfo.profile?.micro_ward_no || ""),
      },
      role: parseLegacyRole(userInfo.role, userInfo.profile?.micro_role),
    };
  } catch (_error) {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAuthToken();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      signal: controller.signal,
      headers,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please reload and try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const errorPayload = (await response.json()) as { error?: string };
      if (errorPayload.error) {
        message = errorPayload.error;
      }
    } catch (_error) {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function clearGetRequestCache(prefix?: string): void {
  if (!prefix) {
    getRequestCache.clear();
    return;
  }
  for (const key of getRequestCache.keys()) {
    if (key.includes(prefix)) {
      getRequestCache.delete(key);
    }
  }
}

async function requestCached<T>(path: string, ttlMs: number = getRequestCacheTtlMs): Promise<T> {
  const now = Date.now();
  const cacheKey = path;
  const cached = getRequestCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }
  const data = await request<T>(path);
  getRequestCache.set(cacheKey, { data, expiresAt: now + ttlMs });
  return data;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>("/malaria/auth/logout/", { method: "POST" });
}

export function getSession(): Promise<SessionData> {
  // Always prefer malaria API session so scope fields (district/upazila/union/village) stay accurate.
  return request<SessionData>("/malaria/auth/session/");
}

export function fetchLocalRecords(year?: number | "latest"): Promise<LocalRecord[]> {
  const query =
    year === "latest"
      ? "?reporting_year=latest"
      : Number.isFinite(year)
      ? `?reporting_year=${year}`
      : "";
  return requestCached<LocalRecord[]>(`/malaria/local-records/${query}`);
}

export function fetchLocalRecordsPage(params: {
  year?: number | "latest";
  page?: number;
  pageSize?: number;
  fields?: string[];
}): Promise<PaginatedResponse<LocalRecord>> {
  const query = new URLSearchParams();
  if (params.year === "latest") {
    query.set("reporting_year", "latest");
  } else if (Number.isFinite(params.year)) {
    query.set("reporting_year", String(params.year));
  }
  query.set("paginate", "1");
  query.set("page", String(params.page || 1));
  query.set("page_size", String(params.pageSize || 100));
  if (params.fields?.length) {
    query.set("_fields", params.fields.join(","));
  }
  return requestCached<PaginatedResponse<LocalRecord>>(`/malaria/local-records/?${query.toString()}`);
}

export function updateLocalRecord(id: string, payload: LocalRecordUpdate): Promise<{ success: boolean }> {
  clearGetRequestCache("/malaria/local-records/");
  return request<{ success: boolean }>(`/malaria/local-records/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteLocalRecord(id: string): Promise<void> {
  clearGetRequestCache("/malaria/local-records/");
  return request<void>(`/malaria/local-records/${id}/`, {
    method: "DELETE",
  });
}

export function updateVillage(id: string, payload: VillageUpdatePayload): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/malaria/villages/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createVillage(payload: VillageUpdatePayload & { union: string | number }): Promise<{ id: string }> {
  return request<{ id: string }>("/malaria/villages/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDistrict(id: string, payload: { name: string }): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/malaria/districts/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createDistrict(payload: { name: string }): Promise<{ id: string }> {
  return request<{ id: string }>("/malaria/districts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUpazila(
  id: string,
  payload: { name: string; district?: string },
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/malaria/upazilas/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createUpazila(payload: { name: string; district: string | number }): Promise<{ id: string }> {
  return request<{ id: string }>("/malaria/upazilas/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUnion(
  id: string,
  payload: { name: string; upazila?: string },
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/malaria/unions/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createUnion(payload: { name: string; upazila: string | number }): Promise<{ id: string }> {
  return request<{ id: string }>("/malaria/unions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMonthAccessSettings(year: number): Promise<MonthAccessSetting[]> {
  return requestCached<MonthAccessSetting[]>(`/malaria/month-access-settings/?reporting_year=${year}`);
}

export function fetchNonLocalRecords(year?: number | "latest"): Promise<NonLocalRecord[]> {
  const query =
    year === "latest"
      ? "?reporting_year=latest"
      : Number.isFinite(year)
      ? `?reporting_year=${year}`
      : "";
  return requestCached<NonLocalRecord[]>(`/malaria/non-local-records/${query}`);
}

export function fetchNonLocalRecordsPage(params: {
  year?: number | "latest";
  page?: number;
  pageSize?: number;
  fields?: string[];
}): Promise<PaginatedResponse<NonLocalRecord>> {
  const query = new URLSearchParams();
  if (params.year === "latest") {
    query.set("reporting_year", "latest");
  } else if (Number.isFinite(params.year)) {
    query.set("reporting_year", String(params.year));
  }
  query.set("paginate", "1");
  query.set("page", String(params.page || 1));
  query.set("page_size", String(params.pageSize || 100));
  if (params.fields?.length) {
    query.set("_fields", params.fields.join(","));
  }
  return requestCached<PaginatedResponse<NonLocalRecord>>(`/malaria/non-local-records/?${query.toString()}`);
}

export function createNonLocalRecord(payload: NonLocalRecordPayload): Promise<NonLocalRecord> {
  clearGetRequestCache("/malaria/non-local-records/");
  return request<NonLocalRecord>("/malaria/non-local-records/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateNonLocalRecord(id: string, payload: NonLocalRecordPayload): Promise<{ success: boolean }> {
  clearGetRequestCache("/malaria/non-local-records/");
  return request<{ success: boolean }>(`/malaria/non-local-records/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createLocalRecord(payload: LocalRecordCreatePayload): Promise<LocalRecord> {
  clearGetRequestCache("/malaria/local-records/");
  return request<LocalRecord>("/malaria/local-records/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteNonLocalRecord(id: string): Promise<void> {
  clearGetRequestCache("/malaria/non-local-records/");
  return request<void>(`/malaria/non-local-records/${id}/`, {
    method: "DELETE",
  });
}

export function fetchReviews(year: number, recordType: RecordType): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/admin/reviews?year=${year}&recordType=${recordType}`);
}

export function upsertMonthlyApproval(payload: {
  recordType: RecordType;
  recordId: string;
  reportingYear: number;
  month: number;
  status: ApprovalStatus;
}): Promise<{ success: boolean }> {
  clearGetRequestCache("/malaria/monthly-approvals/");
  return request<{ success: boolean }>("/malaria/monthly-approvals/", {
    method: "POST",
    body: JSON.stringify({
      record_type: payload.recordType,
      record_id: payload.recordId,
      reporting_year: payload.reportingYear,
      month: payload.month,
      status: payload.status,
    }),
  });
}

export function fetchMonthlyApprovals(params: {
  recordType: RecordType;
  reportingYear: number;
  status?: ApprovalStatus;
}): Promise<ApprovalRow[]> {
  const query = new URLSearchParams({
    record_type: params.recordType,
    reporting_year: String(params.reportingYear),
  });
  if (params.status) {
    query.set("status", params.status);
  }
  query.set("_fields", "record_id,month,status");
  return requestCached<ApprovalRow[]>(`/malaria/monthly-approvals/?${query.toString()}`);
}

export function fetchUsers(): Promise<AdminUser[]> {
  return request<AdminUser[]>("/admin/users");
}

export function createUser(payload: UserPayload): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: string, payload: UserPayload): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: string): Promise<void> {
  return request<void>(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export function fetchLocations(): Promise<DistrictNode[]> {
  return request<DistrictNode[]>("/admin/locations");
}

export function fetchAssignments(): Promise<Assignment[]> {
  return request<Assignment[]>("/admin/assignments");
}

export function fetchMalariaMasterData(options?: { includeVillages?: boolean }): Promise<MalariaMasterData> {
  const includeVillages = options?.includeVillages ?? true;
  return requestCached<MalariaMasterData>(`/malaria/master-data/?include_villages=${includeVillages ? "1" : "0"}`);
}

export function fetchVillagesByUnion(unionId: string | number): Promise<MasterVillage[]> {
  return requestCached<MasterVillage[]>(`/malaria/villages/?union_id=${unionId}&_fields=id,name,ward_no,union_id&limit=200`);
}

export function assignVillage(skUserId: string, villageId: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>("/admin/assignments", {
    method: "POST",
    body: JSON.stringify({ skUserId, villageId }),
  });
}
