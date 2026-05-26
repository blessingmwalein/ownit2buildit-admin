"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchPaymentsThunk } from "@/store/slices/paymentsSlice";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { PaymentStatus } from "@/types";

function PayStatusBadge({ status }: { status: PaymentStatus }) {
  const map = {
    COMPLETED: { label: "Completed", variant: "success" as const },
    PENDING: { label: "Pending", variant: "warning" as const },
    FAILED: { label: "Failed", variant: "destructive" as const },
    REFUNDED: { label: "Refunded", variant: "secondary" as const },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={variant}>{label}</Badge>;
}

function getCompanyLabelFromPayment(pay: { company?: { name: string }; companyId?: string }) {
  if (pay.company?.name) return pay.company.name;
  if (pay.companyId) return `Company ${pay.companyId.slice(0, 8)}`;
  return "Unknown Company";
}

const METHOD_COLORS: Record<string, string> = {
  PAYNOW: "bg-green-50 text-green-700",
  STRIPE: "bg-indigo-50 text-indigo-700",
  PAYPAL: "bg-blue-50 text-blue-700",
  MANUAL: "bg-slate-100 text-slate-600",
};

export default function BillingPage() {
  const dispatch = useAppDispatch();
  const { items, meta, loading } = useAppSelector((s) => s.payments);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    dispatch(fetchPaymentsThunk({ page, limit: 20, search: debouncedSearch }));
  }, [dispatch, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  // Derive summary stats from visible items (full stats would need a dedicated API)
  const completedTotal = items.filter((p) => p.status === "COMPLETED").reduce((a, p) => a + p.amount, 0);
  const pendingCount = items.filter((p) => p.status === "PENDING").length;
  const failedCount = items.filter((p) => p.status === "FAILED").length;

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Completed (this page)</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(completedTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending payments</p>
              <p className="text-lg font-bold text-slate-900">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Failed payments</p>
              <p className="text-lg font-bold text-slate-900">{failedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by company, ref..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="h-7 px-3">
          {meta.total} transaction{meta.total !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : items.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No payments found
                    </TableCell>
                  </TableRow>
                )
              : items.map((pay) => (
                  <TableRow key={pay.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-medium text-slate-700">{pay.transactionRef}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900 text-sm">{getCompanyLabelFromPayment(pay)}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {pay.subscription?.planCode ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${METHOD_COLORS[pay.method] ?? "bg-slate-100 text-slate-600"}`}>
                        {pay.method}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {formatCurrency(pay.amount, pay.currency ?? "USD")}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(pay.createdAt)}
                    </TableCell>
                    <TableCell><PayStatusBadge status={pay.status} /></TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {totalPages} &bull; {meta.total} total</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
