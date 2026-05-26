import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { rbacAdminApi } from "@/lib/api";
import type { RbacPermissionItem, RbacRole } from "@/types";

interface RbacState {
  companyId: string | null;
  permissions: RbacPermissionItem[];
  roles: RbacRole[];
  loadingPermissions: boolean;
  loadingRoles: boolean;
  saving: boolean;
  deletingRoleId: string | null;
  error: string | null;
}

function normalizePermissionItem(item: unknown): RbacPermissionItem {
  const raw = (item ?? {}) as Record<string, unknown>;
  return { key: String(raw.key ?? "") };
}

function normalizeRole(item: unknown): RbacRole {
  const raw = (item ?? {}) as Record<string, unknown>;
  const rawPermissions = raw.permissions;
  let permissions: string[] = [];

  if (Array.isArray(rawPermissions)) {
    permissions = rawPermissions
      .map((p) => (typeof p === "string" ? p : (p as Record<string, unknown>)?.key))
      .filter((p): p is string => typeof p === "string" && p.length > 0);
  }

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Untitled Role"),
    description: raw.description ? String(raw.description) : undefined,
    isSystem: Boolean(raw.isSystem),
    permissions,
  };
}

export const fetchRbacPermissionsThunk = createAsyncThunk(
  "rbac/fetchPermissions",
  async (companyId: string, { rejectWithValue }) => {
    try {
      const res = await rbacAdminApi.listPermissions(companyId);
      const payload = (res.data ?? {}) as { items?: unknown[] };
      return {
        companyId,
        items: Array.isArray(payload.items) ? payload.items.map(normalizePermissionItem) : [],
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to fetch permissions");
    }
  }
);

export const fetchRbacRolesThunk = createAsyncThunk(
  "rbac/fetchRoles",
  async (companyId: string, { rejectWithValue }) => {
    try {
      const res = await rbacAdminApi.listRoles(companyId);
      const payload = (res.data ?? {}) as { items?: unknown[] };
      return {
        companyId,
        items: Array.isArray(payload.items) ? payload.items.map(normalizeRole) : [],
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to fetch roles");
    }
  }
);

export const createRbacRoleThunk = createAsyncThunk(
  "rbac/createRole",
  async (
    {
      companyId,
      payload,
    }: {
      companyId: string;
      payload: { name: string; description?: string; permissionKeys: string[] };
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await rbacAdminApi.createRole(companyId, payload);
      return { companyId, role: normalizeRole(res.data) };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to create role");
    }
  }
);

export const updateRbacRoleThunk = createAsyncThunk(
  "rbac/updateRole",
  async (
    {
      companyId,
      roleId,
      payload,
    }: {
      companyId: string;
      roleId: string;
      payload: { name: string; description?: string; permissionKeys: string[] };
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await rbacAdminApi.updateRole(companyId, roleId, payload);
      return { companyId, role: normalizeRole(res.data) };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to update role");
    }
  }
);

export const deleteRbacRoleThunk = createAsyncThunk(
  "rbac/deleteRole",
  async ({ companyId, roleId }: { companyId: string; roleId: string }, { rejectWithValue }) => {
    try {
      await rbacAdminApi.deleteRole(companyId, roleId);
      return { companyId, roleId };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to delete role");
    }
  }
);

const initialState: RbacState = {
  companyId: null,
  permissions: [],
  roles: [],
  loadingPermissions: false,
  loadingRoles: false,
  saving: false,
  deletingRoleId: null,
  error: null,
};

const rbacSlice = createSlice({
  name: "rbac",
  initialState,
  reducers: {
    clearRbacError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRbacPermissionsThunk.pending, (state, action) => {
        state.loadingPermissions = true;
        state.error = null;
        state.companyId = action.meta.arg;
      })
      .addCase(fetchRbacPermissionsThunk.fulfilled, (state, action) => {
        state.loadingPermissions = false;
        state.companyId = action.payload.companyId;
        state.permissions = action.payload.items;
      })
      .addCase(fetchRbacPermissionsThunk.rejected, (state, action) => {
        state.loadingPermissions = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRbacRolesThunk.pending, (state, action) => {
        state.loadingRoles = true;
        state.error = null;
        state.companyId = action.meta.arg;
      })
      .addCase(fetchRbacRolesThunk.fulfilled, (state, action) => {
        state.loadingRoles = false;
        state.companyId = action.payload.companyId;
        state.roles = action.payload.items;
      })
      .addCase(fetchRbacRolesThunk.rejected, (state, action) => {
        state.loadingRoles = false;
        state.error = action.payload as string;
      })
      .addCase(createRbacRoleThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createRbacRoleThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.roles.unshift(action.payload.role);
      })
      .addCase(createRbacRoleThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(updateRbacRoleThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateRbacRoleThunk.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.roles.findIndex((role) => role.id === action.payload.role.id);
        if (idx >= 0) state.roles[idx] = action.payload.role;
      })
      .addCase(updateRbacRoleThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(deleteRbacRoleThunk.pending, (state, action) => {
        state.deletingRoleId = action.meta.arg.roleId;
        state.error = null;
      })
      .addCase(deleteRbacRoleThunk.fulfilled, (state, action) => {
        state.deletingRoleId = null;
        state.roles = state.roles.filter((role) => role.id !== action.payload.roleId);
      })
      .addCase(deleteRbacRoleThunk.rejected, (state, action) => {
        state.deletingRoleId = null;
        state.error = action.payload as string;
      });
  },
});

export const { clearRbacError } = rbacSlice.actions;
export default rbacSlice.reducer;
