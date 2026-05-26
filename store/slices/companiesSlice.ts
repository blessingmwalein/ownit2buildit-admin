import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { companiesApi } from "@/lib/api";
import type { Company, PaginationMeta, SubscriptionStatus } from "@/types";

interface CompaniesState {
  items: Company[];
  meta: PaginationMeta;
  pendingItems: Company[];
  pendingMeta: PaginationMeta;
  loading: boolean;
  actionLoading: string | null; // companyId being acted on
  error: string | null;
}

function normalizeCompany(item: unknown): Company {
  const raw = (item ?? {}) as Record<string, unknown>;
  const sub = (raw.subscription ?? null) as Record<string, unknown> | null;
  const counts = ((raw._count as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const status = String(sub?.status ?? "TRIAL").toUpperCase() as SubscriptionStatus;

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Unnamed Company"),
    slug: String(raw.slug ?? ""),
    industry: (raw.industry as string | null) ?? null,
    accountType: String(raw.accountType ?? "COMPANY"),
    countryCode: String(raw.countryCode ?? "—"),
    defaultCurrency: String(raw.defaultCurrency ?? "USD"),
    isActive: Boolean(raw.isActive),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    ownerEmail: raw.ownerEmail ? String(raw.ownerEmail) : undefined,
    subscription: sub
      ? {
          status: status,
          planCode: String(sub.planCode ?? "—"),
          trialEndsAt: (sub.trialEndsAt as string | null) ?? null,
        }
      : null,
    _count: {
      users: typeof counts.users === "number" ? counts.users : Number(counts.users ?? 0) || 0,
      projects: typeof counts.projects === "number" ? counts.projects : Number(counts.projects ?? 0) || 0,
    },
  };
}

const defaultMeta: PaginationMeta = { page: 1, limit: 20, total: 0 };

export const fetchCompaniesThunk = createAsyncThunk(
  "companies/fetch",
  async (
    { page, limit, search }: { page?: number; limit?: number; search?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await companiesApi.list(page, limit, search);
      const payload = (res.data ?? {}) as { items?: unknown[]; meta?: PaginationMeta };
      return {
        items: Array.isArray(payload.items) ? payload.items.map(normalizeCompany) : [],
        meta: payload.meta ?? defaultMeta,
      } as { items: Company[]; meta: PaginationMeta };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to fetch companies");
    }
  }
);

export const fetchPendingApprovalsThunk = createAsyncThunk(
  "companies/fetchPending",
  async ({ page, limit }: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const res = await companiesApi.pendingApprovals(page, limit);
      const payload = (res.data ?? {}) as { items?: unknown[]; meta?: PaginationMeta };
      return {
        items: Array.isArray(payload.items) ? payload.items.map(normalizeCompany) : [],
        meta: payload.meta ?? defaultMeta,
      } as { items: Company[]; meta: PaginationMeta };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to fetch pending approvals");
    }
  }
);

export const setCompanyApprovalThunk = createAsyncThunk(
  "companies/setApproval",
  async (
    { companyId, isActive }: { companyId: string; isActive: boolean },
    { rejectWithValue }
  ) => {
    try {
      const res = await companiesApi.setApproval(companyId, isActive);
      return res.data as { id: string; isActive: boolean };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Action failed");
    }
  }
);

const companiesSlice = createSlice({
  name: "companies",
  initialState: {
    items: [],
    meta: defaultMeta,
    pendingItems: [],
    pendingMeta: defaultMeta,
    loading: false,
    actionLoading: null,
    error: null,
  } as CompaniesState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompaniesThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCompaniesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchCompaniesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPendingApprovalsThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPendingApprovalsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingItems = action.payload.items;
        state.pendingMeta = action.payload.meta;
      })
      .addCase(fetchPendingApprovalsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(setCompanyApprovalThunk.pending, (state, action) => {
        state.actionLoading = action.meta.arg.companyId;
      })
      .addCase(setCompanyApprovalThunk.fulfilled, (state, action) => {
        state.actionLoading = null;
        const { id, isActive } = action.payload;
        const item = state.items.find((c) => c.id === id);
        if (item) item.isActive = isActive;
        state.pendingItems = state.pendingItems.filter((c) => c.id !== id);
      })
      .addCase(setCompanyApprovalThunk.rejected, (state) => {
        state.actionLoading = null;
      });
  },
});

export default companiesSlice.reducer;
