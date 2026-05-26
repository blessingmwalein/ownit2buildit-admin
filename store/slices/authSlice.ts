import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "@/lib/api";
import type { AdminProfile, AuthState } from "@/types";

function normalizeProfile(payload: unknown): AdminProfile {
  const raw = (payload ?? {}) as Record<string, unknown>;
  const admin = ((raw.admin as Record<string, unknown> | undefined) ?? raw) as Record<string, unknown>;

  return {
    id: String(admin.id ?? ""),
    email: String(admin.email ?? ""),
    name: String(admin.displayName ?? admin.name ?? ""),
    displayName: admin.displayName ? String(admin.displayName) : undefined,
    apiKey: admin.apiKey ? String(admin.apiKey) : undefined,
    isActive: typeof admin.isActive === "boolean" ? admin.isActive : undefined,
    createdAt: admin.createdAt ? String(admin.createdAt) : undefined,
    updatedAt: admin.updatedAt ? String(admin.updatedAt) : undefined,
    lastLoginAt: admin.lastLoginAt ? String(admin.lastLoginAt) : null,
  };
}

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.login(email, password);
      const token: string = res.data.accessToken;
      localStorage.setItem("bp_admin_token", token);
      const profileRes = await authApi.me();
      return { token, profile: normalizeProfile(profileRes.data) };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const fetchProfileThunk = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.me();
      return normalizeProfile(res.data);
    } catch {
      return rejectWithValue("Session expired");
    }
  }
);

export const rotateApiKeyThunk = createAsyncThunk(
  "auth/rotateApiKey",
  async (reason: string, { rejectWithValue }) => {
    try {
      const res = await authApi.rotateApiKey(reason);
      const payload = (res.data ?? {}) as Record<string, unknown>;
      return {
        newApiKey: String(payload.newApiKey ?? payload.apiKey ?? ""),
        rotatedAt: String(payload.rotatedAt ?? new Date().toISOString()),
      } as { newApiKey: string; rotatedAt: string };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to rotate key");
    }
  }
);

const initialState: AuthState = {
  token: null,
  profile: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.profile = null;
      localStorage.removeItem("bp_admin_token");
    },
    clearError(state) {
      state.error = null;
    },
    setTokenFromStorage(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.profile = action.payload.profile;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(rotateApiKeyThunk.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.apiKey = action.payload.newApiKey;
        }
      });
  },
});

export const { logout, clearError, setTokenFromStorage } = authSlice.actions;
export default authSlice.reducer;
