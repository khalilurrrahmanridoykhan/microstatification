export type AppRole = "admin" | "sk";
export type ApprovalStatus = "PENDING" | "APPROVED";
export type RecordType = "local" | "non_local";

export interface SessionUser {
  id: string;
  email: string;
}

export interface AuthProfile {
  full_name: string;
  email: string;
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
  reporting_year: number;
  hh: number;
  population: number;
  itn_2023: number;
  itn_2024: number;
  itn_2025: number;
  district_name: string;
  upazila_name: string;
  union_name: string;
  village_name: string;
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
    return;
  }

  window.localStorage.removeItem(authTokenStorageKey);
  window.localStorage.removeItem(legacyMalariaTokenKey);
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

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

export function getSession(): Promise<SessionData> {
  const legacySession = getLegacySessionFromMainApp();
  if (legacySession && getAuthToken()) {
    return Promise.resolve(legacySession);
  }

  return request<SessionData>("/auth/me");
}

export function fetchLocalRecords(year: number): Promise<LocalRecord[]> {
  return request<LocalRecord[]>(`/local-records?year=${year}`);
}

export function updateLocalRecord(id: string, payload: LocalRecordUpdate): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/local-records/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function fetchNonLocalRecords(year: number): Promise<NonLocalRecord[]> {
  return request<NonLocalRecord[]>(`/non-local-records?year=${year}`);
}

export function createNonLocalRecord(payload: NonLocalRecordPayload): Promise<NonLocalRecord> {
  return request<NonLocalRecord>("/non-local-records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateNonLocalRecord(id: string, payload: NonLocalRecordPayload): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/non-local-records/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteNonLocalRecord(id: string): Promise<void> {
  return request<void>(`/non-local-records/${id}`, {
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
  return request<{ success: boolean }>("/admin/monthly-approvals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function assignVillage(skUserId: string, villageId: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>("/admin/assignments", {
    method: "POST",
    body: JSON.stringify({ skUserId, villageId }),
  });
}
