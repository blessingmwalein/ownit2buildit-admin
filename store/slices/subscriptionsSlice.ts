import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { subscriptionsApi } from "@/lib/api";
import type { Subscription, PaginationMeta, SubscriptionStatus } from "@/types";

interface SubscriptionsState {
  items: Subscription[];
  meta: PaginationMeta;
  loading: boolean;
  actionLoading: string | null;
  error: string | null;
}

function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  const status = String(value ?? "TRIAL").toUpperCase();
  if (status === "ACTIVE" || status === "PAST_DUE" || status === "CANCELED") return status;
  return "TRIAL";
}

function normalizeSubscription(item: unknown): Subscription {
  const raw = (item ?? {}) as Record<string, unknown>;
  const company = (raw.company ?? {}) as Record<string, unknown>;
  const plan = ((raw.platformPlan as Record<string, unknown> | undefined) ??
    (raw.plan as Record<string, unknown> | undefined) ??
    {}) as Record<string, unknown>;

  const monthlyPriceRaw = plan.monthlyPrice;
  const monthlyPrice = typeof monthlyPriceRaw === "number"
    ? monthlyPriceRaw
    : Number(monthlyPriceRaw ?? 0) || 0;

  return {
    id: String(raw.id ?? ""),
    status: normalizeSubscriptionStatus(raw.status),
    billingCycle: String(raw.billingCycle ?? "MONTHLY"),
    currentPeriodFrom: String(raw.currentPeriodFrom ?? new Date().toISOString()),
    currentPeriodTo: String(raw.currentPeriodTo ?? new Date().toISOString()),
    trialEndsAt: (raw.trialEndsAt as string | null) ?? null,
    company: {
      id: String(company.id ?? raw.companyId ?? ""),
      name: String(company.name ?? "Unknown Company"),
      slug: String(company.slug ?? ""),
    },
    platformPlan: {
      code: String(plan.code ?? "CUSTOM"),
      name: String(plan.name ?? "Custom Plan"),
      monthlyPrice,
    },
  };
}

export const fetchSubscriptionsThunk = createAsyncThunk(
  "subscriptions/fetch",
  async (
    { page, limit, search }: { page?: number; limit?: number; search?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await subscriptionsApi.list(page, limit, search);
      const payload = (res.data ?? {}) as { items?: unknown[]; meta?: PaginationMeta };
      return {
        items: Array.isArray(payload.items) ? payload.items.map(normalizeSubscription) : [],
        meta: payload.meta ?? { page: 1, limit: limit ?? 20, total: 0 },
      } as { items: Subscription[]; meta: PaginationMeta };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to fetch subscriptions");
    }
  }
);

export const updateSubscriptionStatusThunk = createAsyncThunk(
  "subscriptions/updateStatus",
  async (
    { subscriptionId, status }: { subscriptionId: string; status: SubscriptionStatus },
    { rejectWithValue }
  ) => {
    try {
      const res = await subscriptionsApi.updateStatus(subscriptionId, status);
      return res.data as { id: string; status: SubscriptionStatus };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to update status");
    }
  }
);

const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState: {
    items: [],
    meta: { page: 1, limit: 20, total: 0 },
    loading: false,
    actionLoading: null,
    error: null,
  } as SubscriptionsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionsThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSubscriptionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchSubscriptionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSubscriptionStatusThunk.pending, (state, action) => {
        state.actionLoading = action.meta.arg.subscriptionId;
      })
      .addCase(updateSubscriptionStatusThunk.fulfilled, (state, action) => {
        state.actionLoading = null;
        const item = state.items.find((s) => s.id === action.payload.id);
        if (item) item.status = action.payload.status;
      })
      .addCase(updateSubscriptionStatusThunk.rejected, (state) => {
        state.actionLoading = null;
      });
  },
});

export default subscriptionsSlice.reducer;
