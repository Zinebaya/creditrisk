const getApiBase = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    const hostname = window.location.hostname
    // In production, Flask runs behind the same reverse proxy (same origin)
    // In local dev, Flask runs on port 8000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:8000`
    }
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
}
const API_BASE = getApiBase()

export type ApiUser = { id: number; email: string; role: string; is_active?: boolean; first_name?: string; last_name?: string; parent_id?: number; phone?: string; wilaya?: string; address?: string; photo_url?: string; company_name?: string; company_sector?: string; plan_tier?: string; subscription_status?: string; monthly_predictions_used?: number; created_at?: string }
export type Client = { id: number; name: string; first_name?: string; gender?: string; email: string; phone: string; address?: string; wilaya: string; city: string; sector?: string; repayment_status?: string; notes?: string; owner_id?: number; created_at: string }
export type Prediction = { id: number; user_id?: number; client_id?: number; user_email?: string; input_json?: Record<string, any>; prediction: string; probability: number; decision: string; explanation?: any; created_at: string }
export type ClientMessage = { id: number; name: string; email: string; subject: string; message: string; message_type: string; is_read: boolean; read_at?: string; response_message?: string; responded_at?: string; created_at: string; updated_at?: string }
export type BatchPredictionResult = { predictions: Array<Record<string, any> & { rowNumber: number; prediction: string; probability: number; decision: string; status?: string; error?: string }>; count: number }
export type Analytics = { total_predictions: number; average_probability: number; risk_distribution: Record<string, number>; monthly_predictions: { month: string; count: number }[] }
export type AdminStats = {
  total_users: number
  total_clients: number
  total_predictions: number
  active_subscriptions: number
  high_risk_cases: number
  plan_distribution: Record<string, number>
  role_distribution: { admin: number; client: number }
  active_distribution: { active: number; inactive: number }
  recent_predictions_week: number
  monthly_predictions: { month: string; count: number }[]
}
export type SystemLog = { id: number; action: string; level: string; details: any; created_at: string }

export function getToken() {
  if (typeof window === "undefined") return null
  const cookieMatch = document.cookie.match(/(?:^|; )paypredict\.token=([^;]+)/)
  if (cookieMatch) return cookieMatch[1]
  return localStorage.getItem("paypredict.token")
}

export function setToken(token: string) {
  localStorage.setItem("paypredict.token", token)
  document.cookie = `paypredict.token=${token}; path=/; max-age=86400; SameSite=Lax`
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null
  const cookieMatch = document.cookie.match(/(?:^|; )paypredict\.refresh_token=([^;]+)/)
  if (cookieMatch) return cookieMatch[1]
  return localStorage.getItem("paypredict.refresh_token")
}

export function setRefreshToken(token: string) {
  localStorage.setItem("paypredict.refresh_token", token)
  document.cookie = `paypredict.refresh_token=${token}; path=/; max-age=604800; SameSite=Lax`
}

export function clearToken() {
  localStorage.removeItem("paypredict.token")
  localStorage.removeItem("paypredict.refresh_token")
  localStorage.removeItem("paypredict.user")
  document.cookie = "paypredict.token=; path=/; max-age=0; SameSite=Lax"
  document.cookie = "paypredict.refresh_token=; path=/; max-age=0; SameSite=Lax"
  document.cookie = "paypredict.session=; path=/; max-age=0; SameSite=Lax"
}

async function request<T>(path: string, options: RequestInit = {}, useRefreshToken = false): Promise<T> {
  const token = useRefreshToken ? getRefreshToken() : getToken()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  // Timeout to prevent infinite loading: 60s for file upload/FormData, 30s for regular requests
  const controller = new AbortController()
  const timeoutMs = (options.body instanceof FormData) ? 60000 : 30000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Request timeout: server took too long to respond")
    }
    throw new Error(`Network request failed: ${error?.message || "Unknown error"}`)
  } finally {
    clearTimeout(timeoutId)
  }

  const data = await res.json().catch(() => ({}))

  if (res.ok) {
    return data as T
  }

  if (res.status === 401 && !useRefreshToken && getRefreshToken()) {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      const refreshController = new AbortController()
      const refreshTimeout = setTimeout(() => refreshController.abort(), 8000)
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          signal: refreshController.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        })
        const refreshData = await refreshRes.json().catch(() => ({}))
        if (refreshRes.ok && refreshData.token) {
          setToken(refreshData.token)
          if (refreshData.refresh_token) {
            setRefreshToken(refreshData.refresh_token)
          }
          return request<T>(path, options)
        }
        // Refresh failed — clear tokens
        clearToken()
      } catch {
        clearToken()
      } finally {
        clearTimeout(refreshTimeout)
      }
    }
  }

  throw new Error(data.error || `Request failed: ${res.status}`)
}


export type ApiLoginResponse = {
  token: string
  refresh_token: string
  user: ApiUser
}

export type ApiRefreshResponse = {
  token: string
  refresh_token?: string
}

export type Api = {
  login: (email: string, password: string) => Promise<ApiLoginResponse>
  refresh: () => Promise<ApiRefreshResponse>
  me: () => Promise<{ user: ApiUser }>
  listAdmins: () => Promise<{ admins: ApiUser[] }>
  createAdmin: (email: string, password: string) => Promise<{ user: ApiUser }>
  listUsers: () => Promise<{ users: ApiUser[] }>
  deleteUser: (id: number) => Promise<{ message: string }>
  updateUserRole: (id: number, role: string) => Promise<{ message: string }>
  updateUserPlan: (id: number, plan_tier: string) => Promise<{ message: string }>
  clients: () => Promise<{ clients: Client[] }>
  createClient: (payload: Omit<Client, "id" | "created_at">) => Promise<{ client: Client }>
  updateClient: (id: number, payload: Partial<Client>) => Promise<{ client: Client }>
  deleteClient: (id: number) => Promise<{ ok: true }>
  predict: (payload: Record<string, any>) => Promise<any>
  batchPredict: (file: File) => Promise<BatchPredictionResult>
  history: () => Promise<{ predictions: Prediction[] }>
  analytics: () => Promise<Analytics>
  usage: () => Promise<{ plan_tier: string; used: number; limit: number | null; remaining: number | null; limit_reached: boolean; subscription_status: string }>
  adminStats: () => Promise<AdminStats>
  adminAllPredictions: (limit?: number) => Promise<{ predictions: Prediction[] }>
  adminToggleUserActive: (id: number) => Promise<{ user: { id: number; email: string; is_active: boolean } }>
  adminLogs: (limit?: number) => Promise<{ logs: SystemLog[] }>
  adminUserPredictions: (userId: number) => Promise<{ predictions: Prediction[] }>
  enterpriseUsers: () => Promise<{ users: ApiUser[] }>
  createEnterpriseUser: (payload: any) => Promise<{ user: ApiUser }>
  updateEnterpriseUser: (id: number, payload: any) => Promise<{ user: ApiUser }>
  deleteEnterpriseUser: (id: number) => Promise<{ ok: boolean }>
  resetEnterpriseUserPassword: (id: number, payload: any) => Promise<{ ok: boolean }>
  enterpriseProfile: () => Promise<{ profile: ApiUser }>
  updateEnterpriseProfile: (payload: any) => Promise<{ profile: ApiUser }>
  adminProfile: () => Promise<{ profile: ApiUser }>
  updateAdminProfile: (payload: any) => Promise<{ profile: ApiUser }>
  adminCreateUser: (payload: any) => Promise<{ user: ApiUser }>
  adminUpdateUser: (id: number, payload: any) => Promise<{ user: ApiUser }>
  superadminCompanies: () => Promise<{ companies: any[] }>
  superadminUpdateCompanyPlan: (companyId: number, planTier: string) => Promise<{ ok: boolean; plan_tier: string }>
  superadminToggleCompanyActive: (companyId: number) => Promise<{ ok: boolean; is_active: boolean }>
  superadminUsers: () => Promise<{ users: any[] }>
  superadminSectors: () => Promise<{ sectors: any }>
  superadminAnalytics: () => Promise<any>
  clientMessages: () => Promise<{ messages: ClientMessage[] }>
  clientCreateMessage: (payload: { subject: string; message: string }) => Promise<{ success: boolean; contact_id: number }>
  logout: () => Promise<{ message: string }>
}

export const api: Api = {
  login: (email: string, password: string) => request<ApiLoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  refresh: () => request<ApiRefreshResponse>("/auth/refresh", { method: "POST" }, true),
  me: () => request<{ user: ApiUser }>("/auth/me"),
  listAdmins: () => request<{ admins: ApiUser[] }>("/auth/admins"),
  createAdmin: (email: string, password: string) => request<{ user: ApiUser }>("/auth/admins", { method: "POST", body: JSON.stringify({ email, password }) }),
  listUsers: () => request<{ users: ApiUser[] }>("/auth/users"),
  deleteUser: (id: number) => request<{ message: string }>(`/auth/users/${id}`, { method: "DELETE" }),
  updateUserRole: (id: number, role: string) => request<{ message: string }>(`/auth/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  updateUserPlan: (id: number, plan_tier: string) => request<{ message: string }>(`/auth/users/${id}/plan`, { method: "PUT", body: JSON.stringify({ plan_tier }) }),
  clients: () => request<{ clients: Client[] }>("/api/clients"),
  createClient: (payload: Omit<Client, "id" | "created_at">) => request<{ client: Client }>("/api/clients", { method: "POST", body: JSON.stringify(payload) }),
  updateClient: (id: number, payload: Partial<Client>) => request<{ client: Client }>(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteClient: (id: number) => request<{ ok: true }>(`/api/clients/${id}`, { method: "DELETE" }),
  predict: (payload: Record<string, any>) => request<any>("/api/predict", { method: "POST", body: JSON.stringify(payload) }),
  batchPredict: (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    return request<BatchPredictionResult>("/api/batch_predict", { method: "POST", body: formData })
  },
  history: () => request<{ predictions: Prediction[] }>("/api/history"),
  analytics: () => request<Analytics>("/api/analytics"),
  usage: () => request<{ plan_tier: string; used: number; limit: number | null; remaining: number | null; limit_reached: boolean; subscription_status: string }>("/api/usage"),
  adminStats: () => request<AdminStats>("/api/admin/stats"),
  adminAllPredictions: (limit?: number) => request<{ predictions: Prediction[] }>(`/api/admin/predictions${limit ? `?limit=${limit}` : ""}`),
  adminToggleUserActive: (id: number) => request<{ user: { id: number; email: string; is_active: boolean } }>(`/api/admin/users/${id}/toggle-active`, { method: "PUT" }),
  adminLogs: (limit?: number) => request<{ logs: SystemLog[] }>(`/api/admin/logs${limit ? `?limit=${limit}` : ""}`),
  adminUserPredictions: (userId: number) => request<{ predictions: Prediction[] }>(`/api/admin/users/${userId}/predictions`),
  enterpriseUsers: () => request<{ users: ApiUser[] }>("/api/enterprise/users"),
  createEnterpriseUser: (payload: any) => request<{ user: ApiUser }>("/api/enterprise/users", { method: "POST", body: JSON.stringify(payload) }),
  updateEnterpriseUser: (id: number, payload: any) => request<{ user: ApiUser }>(`/api/enterprise/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteEnterpriseUser: (id: number) => request<{ ok: boolean }>(`/api/enterprise/users/${id}`, { method: "DELETE" }),
  resetEnterpriseUserPassword: (id: number, payload: any) => request<{ ok: boolean }>(`/api/enterprise/users/${id}/reset-password`, { method: "POST", body: JSON.stringify(payload) }),
  enterpriseProfile: () => request<{ profile: ApiUser }>("/api/enterprise/profile"),
  updateEnterpriseProfile: (payload: any) => request<{ profile: ApiUser }>("/api/enterprise/profile", { method: "PUT", body: JSON.stringify(payload) }),
  adminProfile: () => request<{ profile: ApiUser }>("/api/admin/profile"),
  updateAdminProfile: (payload: any) => request<{ profile: ApiUser }>("/api/admin/profile", { method: "PUT", body: JSON.stringify(payload) }),
  adminCreateUser: (payload: any) => request<{ user: ApiUser }>("/api/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  adminUpdateUser: (id: number, payload: any) => request<{ user: ApiUser }>(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  superadminCompanies: () => request<{ companies: any[] }>("/api/superadmin/companies"),
  superadminUpdateCompanyPlan: (companyId: number, planTier: string) => request<{ ok: boolean; plan_tier: string }>(`/api/superadmin/companies/${companyId}/plan`, { method: "PUT", body: JSON.stringify({ plan_tier: planTier }) }),
  superadminToggleCompanyActive: (companyId: number) => request<{ ok: boolean; is_active: boolean }>(`/api/superadmin/companies/${companyId}/toggle-active`, { method: "PUT" }),
  superadminUsers: () => request<{ users: any[] }>("/api/superadmin/users"),
  superadminSectors: () => request<{ sectors: any }>("/api/superadmin/sectors"),
  superadminAnalytics: () => request<any>("/api/superadmin/analytics"),
  clientMessages: () => request<{ messages: ClientMessage[] }>("/api/client/messages"),
  clientCreateMessage: (payload: { subject: string; message: string }) => request<{ success: boolean; contact_id: number }>("/api/client/messages", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: getRefreshToken() }) }),
}
