import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Inject auth header on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bp_admin_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/platform-admin/auth/login", { email, password }),
  me: () => api.get("/platform-admin/auth/me"),
  rotateApiKey: (reason: string) =>
    api.post("/platform-admin/auth/rotate-api-key", { reason }),
};

// ─── Overview ────────────────────────────────────────────────────────────────

export const overviewApi = {
  getStats: () => api.get("/platform-admin/overview"),
};

// ─── Companies ───────────────────────────────────────────────────────────────

export const companiesApi = {
  list: (page = 1, limit = 20, search = "") =>
    api.get("/platform-admin/companies", { params: { page, limit, search } }),
  pendingApprovals: (page = 1, limit = 20) =>
    api.get("/platform-admin/companies/pending-approvals", { params: { page, limit } }),
  getById: (companyId: string) =>
    api.get(`/platform-admin/companies/${companyId}`),
  setApproval: (companyId: string, isActive: boolean) =>
    api.patch(`/platform-admin/companies/${companyId}/approval`, { isActive }),
};

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptionsApi = {
  list: (page = 1, limit = 20, search = "") =>
    api.get("/platform-admin/subscriptions", { params: { page, limit, search } }),
  updateStatus: (subscriptionId: string, status: string) =>
    api.patch(`/platform-admin/subscriptions/${subscriptionId}/status`, { status }),
};

// ─── Billing ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (page = 1, limit = 20, search = "") =>
    api.get("/platform-admin/billing/payments", { params: { page, limit, search } }),
};

// ─── Platform Admin RBAC ────────────────────────────────────────────────────

export const rbacAdminApi = {
  listPermissions: (companyId: string) =>
    api.get(`/platform-admin/companies/${companyId}/rbac/permissions`),
  listRoles: (companyId: string) =>
    api.get(`/platform-admin/companies/${companyId}/rbac/roles`),
  getRole: (companyId: string, roleId: string) =>
    api.get(`/platform-admin/companies/${companyId}/rbac/roles/${roleId}`),
  createRole: (
    companyId: string,
    payload: { name: string; description?: string; permissionKeys: string[] }
  ) => api.post(`/platform-admin/companies/${companyId}/rbac/roles`, payload),
  updateRole: (
    companyId: string,
    roleId: string,
    payload: { name: string; description?: string; permissionKeys: string[] }
  ) => api.put(`/platform-admin/companies/${companyId}/rbac/roles/${roleId}`, payload),
  deleteRole: (companyId: string, roleId: string) =>
    api.delete(`/platform-admin/companies/${companyId}/rbac/roles/${roleId}`),
  addPermissions: (companyId: string, roleId: string, permissionKeys: string[]) =>
    api.post(`/platform-admin/companies/${companyId}/rbac/roles/${roleId}/permissions`, { permissionKeys }),
  removePermission: (companyId: string, roleId: string, permissionKey: string) =>
    api.delete(`/platform-admin/companies/${companyId}/rbac/roles/${roleId}/permissions/${encodeURIComponent(permissionKey)}`),
  listUserRoles: (companyId: string, userId: string) =>
    api.get(`/platform-admin/companies/${companyId}/rbac/users/${userId}/roles`),
  assignRoleToUser: (companyId: string, userId: string, roleId: string) =>
    api.post(`/platform-admin/companies/${companyId}/rbac/users/${userId}/roles`, { roleId }),
  removeRoleFromUser: (companyId: string, userId: string, roleId: string) =>
    api.delete(`/platform-admin/companies/${companyId}/rbac/users/${userId}/roles/${roleId}`),
};

export default api;
