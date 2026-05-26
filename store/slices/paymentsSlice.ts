import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { paymentsApi } from "@/lib/api";
import type { Payment, PaginationMeta } from "@/types";

interface PaymentsState {
  items: Payment[];
  meta: PaginationMeta;
  loading: boolean;
  error: string | null;
}

function normalizePaymentStatus(status: unknown): Payment["status"] {
  const value = String(status ?? "").toUpperCase();
  if (value === "SUCCESS") return "COMPLETED";
  if (value === "PENDING") return "PENDING";
  if (value === "FAILED") return "FAILED";
  if (value === "REFUNDED") return "REFUNDED";
  return "PENDING";
}

function normalizePayment(item: unknown): Payment {
  const raw = (item ?? {}) as Record<string, unknown>;
  const amountValue = raw.amount;

  return {
    id: String(raw.id ?? ""),
    transactionRef: String(raw.transactionRef ?? "—"),
    method: String(raw.method ?? "MANUAL"),
    status: normalizePaymentStatus(raw.status),
    amount: typeof amountValue === "number" ? amountValue : Number(amountValue ?? 0) || 0,
    currency: String(raw.currency ?? "USD"),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    companyId: raw.companyId ? String(raw.companyId) : undefined,
    company: raw.company && typeof raw.company === "object"
      ? {
          id: String((raw.company as Record<string, unknown>).id ?? raw.companyId ?? ""),
          name: String((raw.company as Record<string, unknown>).name ?? "Unknown Company"),
        }
      : undefined,
    subscriptionId: raw.subscriptionId ? String(raw.subscriptionId) : undefined,
    subscription: raw.subscription && typeof raw.subscription === "object"
      ? {
          id: String((raw.subscription as Record<string, unknown>).id ?? raw.subscriptionId ?? ""),
          planCode: String((raw.subscription as Record<string, unknown>).planCode ?? "—"),
        }
      : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
  };
}

export const fetchPaymentsThunk = createAsyncThunk(
  "payments/fetch",
  async (
    { page, limit, search }: { page?: number; limit?: number; search?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await paymentsApi.list(page, limit, search);
      const payload = (res.data ?? {}) as { items?: unknown[]; meta?: PaginationMeta };
      return {
        items: Array.isArray(payload.items) ? payload.items.map(normalizePayment) : [],
        meta: payload.meta ?? { page: 1, limit: limit ?? 20, total: 0 },
      } as { items: Payment[]; meta: PaginationMeta };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to fetch payments");
    }
  }
);

const paymentsSlice = createSlice({
  name: "payments",
  initialState: {
    items: [],
    meta: { page: 1, limit: 20, total: 0 },
    loading: false,
    error: null,
  } as PaymentsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentsThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPaymentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchPaymentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default paymentsSlice.reducer;
