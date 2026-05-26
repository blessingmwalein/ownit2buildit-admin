import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { overviewApi } from "@/lib/api";
import type { OverviewStats } from "@/types";

interface OverviewState {
  stats: OverviewStats | null;
  loading: boolean;
  error: string | null;
}

function normalizeOverview(payload: unknown): OverviewStats {
  const raw = (payload ?? {}) as Record<string, unknown>;
  const companies = (raw.companies ?? {}) as Record<string, unknown>;
  const subscriptions = (raw.subscriptions ?? {}) as Record<string, unknown>;
  const payments = (raw.payments ?? {}) as Record<string, unknown>;

  const toNumber = (value: unknown, fallback = 0) =>
    typeof value === "number" ? value : Number(value ?? fallback) || fallback;

  const totalCompanies = toNumber(raw.totalCompanies ?? companies.total);
  const pendingApprovals = toNumber(raw.pendingApprovals ?? companies.pendingApprovals);
  const activeSubscriptions = toNumber(raw.activeSubscriptions ?? subscriptions.active);
  const totalSubscriptions = toNumber(raw.totalSubscriptions ?? activeSubscriptions);
  const trialSubscriptions = toNumber(raw.trialSubscriptions);
  const canceledSubscriptions = toNumber(raw.canceledSubscriptions);
  const suspendedCompanies = toNumber(raw.suspendedCompanies);
  const activeCompanies = toNumber(raw.activeCompanies, Math.max(totalCompanies - suspendedCompanies, 0));
  const monthlyRecurringRevenue = toNumber(raw.monthlyRecurringRevenue);
  const totalRevenue = toNumber(raw.totalRevenue);

  return {
    totalCompanies,
    activeCompanies,
    suspendedCompanies,
    pendingApprovals,
    totalSubscriptions,
    trialSubscriptions,
    activeSubscriptions,
    canceledSubscriptions,
    totalRevenue,
    monthlyRecurringRevenue,
  };
}

export const fetchOverviewThunk = createAsyncThunk(
  "overview/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await overviewApi.getStats();
      return normalizeOverview(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to fetch overview");
    }
  }
);

const overviewSlice = createSlice({
  name: "overview",
  initialState: { stats: null, loading: false, error: null } as OverviewState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverviewThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverviewThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchOverviewThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default overviewSlice.reducer;
