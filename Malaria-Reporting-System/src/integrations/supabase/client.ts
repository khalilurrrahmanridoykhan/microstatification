type AuthEvent = "SIGNED_IN" | "SIGNED_OUT";

export interface MalariaUser {
  id: string;
  email: string;
  username?: string;
}

export interface MalariaProfile {
  user_id?: string | number;
  full_name: string;
  email: string;
  micro_role?: string | null;
}

export interface MalariaSession {
  user: MalariaUser;
  profile: MalariaProfile | null;
  role: "admin" | "sk" | null;
}

interface QueryResult<T = any> {
  data: T | null;
  error: Error | null;
  count?: number | null;
}

const FALLBACK_ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "http://127.0.0.1:9200";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || FALLBACK_ORIGIN).replace(/\/$/, "");
const MALARIA_API_BASE = `${BACKEND_URL}/api/malaria`;
const LOGIN_URL = `${BACKEND_URL}/api/auth/login/`;
const TOKEN_KEY = "malaria_auth_token";

const TABLE_ENDPOINTS: Record<string, string> = {
  profiles: "profiles",
  user_roles: "user-roles",
  districts: "districts",
  upazilas: "upazilas",
  unions: "unions",
  villages: "villages",
  local_records: "local-records",
  non_local_records: "non-local-records",
  monthly_approvals: "monthly-approvals",
};

const listeners = new Set<(event: AuthEvent, session: MalariaSession | null) => void>();

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function buildError(message: string) {
  return new Error(message);
}

function buildSessionFromPayload(payload: any): MalariaSession | null {
  if (!payload?.user?.id) return null;
  return {
    user: {
      id: String(payload.user.id),
      email: payload.user.profile?.email || payload.profile?.email || payload.user.email || "",
      username: payload.user.username,
    },
    profile: payload.profile || payload.user.profile || null,
    role: payload.role || payload.user?.role || null,
  };
}

function emit(event: AuthEvent, session: MalariaSession | null) {
  listeners.forEach((listener) => {
    listener(event, session);
  });
}

async function requestJson<T = any>(
  path: string,
  options: RequestInit = {},
  includeAuth = true,
): Promise<QueryResult<T>> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Token ${token}`);
    }
  }

  try {
    const response = await fetch(path, {
      ...options,
      headers,
      credentials: "include",
    });

    let payload: any = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const message =
        payload?.detail ||
        payload?.error ||
        payload?.message ||
        response.statusText ||
        "Request failed";
      return { data: null, error: buildError(message) };
    }

    return { data: payload as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : buildError("Network request failed"),
    };
  }
}

function mapWritePayload(table: string, input: any): any {
  if (Array.isArray(input)) {
    return input.map((item) => mapWritePayload(table, item));
  }

  const payload = { ...(input || {}) };

  if (table === "local_records") {
    if ("village_id" in payload) {
      payload.village = payload.village_id;
      delete payload.village_id;
    }
    if ("sk_user_id" in payload) {
      payload.sk_user = payload.sk_user_id;
      delete payload.sk_user_id;
    }
  }

  if (table === "non_local_records" && "sk_user_id" in payload) {
    payload.sk_user = payload.sk_user_id;
    delete payload.sk_user_id;
  }

  if (table === "upazilas" && "district_id" in payload) {
    payload.district = payload.district_id;
    delete payload.district_id;
  }

  if (table === "unions" && "upazila_id" in payload) {
    payload.upazila = payload.upazila_id;
    delete payload.upazila_id;
  }

  if (table === "villages" && "union_id" in payload) {
    payload.union = payload.union_id;
    delete payload.union_id;
  }

  return payload;
}

class QueryBuilder {
  private filters = new Map<string, string>();
  private orderBy: { field: string; ascending: boolean } | null = null;
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: any = null;
  private wantsCount = false;
  private wantsMaybeSingle = false;

  constructor(private readonly table: string) { }

  select(_columns?: string, options?: { count?: "exact" }) {
    this.action = "select";
    this.wantsCount = options?.count === "exact";
    return this;
  }

  insert(payload: any) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: any, _options?: { onConflict?: string }) {
    this.action = "upsert";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(field: string, value: string | number | boolean) {
    this.filters.set(field, String(value));
    return this;
  }

  in(field: string, values: Array<string | number>) {
    this.filters.set(`${field}__in`, values.map(String).join(","));
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy = { field, ascending: options?.ascending !== false };
    return this;
  }

  async maybeSingle() {
    this.wantsMaybeSingle = true;
    const result = await this.execute<any[] | any>();
    if (result.error) return result;

    const data = Array.isArray(result.data) ? result.data[0] ?? null : result.data;
    return { ...result, data };
  }

  private buildListUrl() {
    const endpoint = TABLE_ENDPOINTS[this.table];
    if (!endpoint) {
      throw buildError(`Unsupported table: ${this.table}`);
    }

    const url = new URL(`${MALARIA_API_BASE}/${endpoint}/`);
    for (const [key, value] of this.filters.entries()) {
      url.searchParams.set(key, value);
    }
    if (this.orderBy) {
      url.searchParams.set("_order", this.orderBy.field);
      url.searchParams.set("_ascending", this.orderBy.ascending ? "true" : "false");
    }
    if (this.wantsCount) {
      url.searchParams.set("count", "exact");
    }
    return url.toString();
  }

  private getRecordId() {
    return this.filters.get("id");
  }

  async execute<T = any>(): Promise<QueryResult<T>> {
    try {
      const listUrl = this.buildListUrl();
      const recordId = this.getRecordId();

      if (this.action === "select") {
        const result = await requestJson<T | { data: T; count: number }>(listUrl);
        if (result.error) return result as QueryResult<T>;

        if (result.data && typeof result.data === "object" && !Array.isArray(result.data) && "data" in (result.data as any)) {
          const payload = result.data as any;
          return { data: payload.data as T, error: null, count: payload.count ?? null };
        }

        const count = Array.isArray(result.data) ? result.data.length : null;
        return { data: result.data as T, error: null, count };
      }

      if (this.action === "insert" || this.action === "upsert") {
        const result = await requestJson<T>(listUrl, {
          method: "POST",
          body: JSON.stringify(mapWritePayload(this.table, this.payload)),
        });
        return result;
      }

      if (!recordId) {
        return { data: null, error: buildError("Missing id filter for write operation.") };
      }

      const writeUrl = `${MALARIA_API_BASE}/${TABLE_ENDPOINTS[this.table]}/${recordId}/`;

      if (this.action === "update") {
        return requestJson<T>(writeUrl, {
          method: "PATCH",
          body: JSON.stringify(mapWritePayload(this.table, this.payload)),
        });
      }

      if (this.action === "delete") {
        return requestJson<T>(writeUrl, {
          method: "DELETE",
        });
      }

      return { data: null, error: buildError("Unsupported action.") };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : buildError("Unknown client error"),
      };
    }
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

async function fetchSession(): Promise<QueryResult<{ user: any; profile: any; role: string | null }>> {
  return requestJson(`${MALARIA_API_BASE}/auth/session/`);
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth: {
    async getSession() {
      const token = getToken();
      if (!token) {
        return { data: { session: null as MalariaSession | null }, error: null };
      }

      const result = await fetchSession();
      if (result.error || !result.data) {
        clearToken();
        return { data: { session: null as MalariaSession | null }, error: result.error };
      }

      return {
        data: {
          session: buildSessionFromPayload(result.data),
        },
        error: null,
      };
    },

    onAuthStateChange(callback: (event: AuthEvent, session: MalariaSession | null) => void) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(callback);
            },
          },
        },
      };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const loginId = email.trim();
      const loginResult = await requestJson<{ token: string }>(
        LOGIN_URL,
        {
          method: "POST",
          body: JSON.stringify({ username: loginId, password }),
        },
        false,
      );

      if (loginResult.error || !loginResult.data?.token) {
        return { data: null, error: loginResult.error || buildError("Login failed") };
      }

      setToken(loginResult.data.token);
      const sessionResult = await fetchSession();
      if (sessionResult.error || !sessionResult.data) {
        clearToken();
        return {
          data: null,
          error: sessionResult.error || buildError("This account does not have malaria access."),
        };
      }

      const session = buildSessionFromPayload(sessionResult.data);
      emit("SIGNED_IN", session);
      return { data: { session }, error: null };
    },

    async signOut() {
      const token = getToken();
      if (token) {
        await requestJson(`${MALARIA_API_BASE}/auth/logout/`, { method: "POST" });
      }
      clearToken();
      emit("SIGNED_OUT", null);
      return { error: null };
    },

    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string } };
    }) {
      const result = await requestJson<{ user: { id: string; email: string } }>(
        `${MALARIA_API_BASE}/users/create/`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            full_name: options?.data?.full_name || email,
          }),
        },
      );

      if (result.error || !result.data?.user) {
        return { data: null, error: result.error || buildError("Failed to create user") };
      }

      return {
        data: {
          user: result.data.user,
        },
        error: null,
      };
    },
  },
};
