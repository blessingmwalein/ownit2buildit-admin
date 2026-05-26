"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, CreditCard, ChevronLeft, ChevronRight, MoreHorizontal,
  PlayCircle, XCircle, AlertTriangle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchSubscriptionsThunk, updateSubscriptionStatusThunk } from "@/store/slices/subscriptionsSlice";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Subscription, SubscriptionStatus } from "@/types";

function SubStatusBadge({ status }: { status: SubscriptionStatus }) {
  const map = {
    ACTIVE: { label: "Active", variant: "success" as const },
    TRIAL: { label: "Trial", variant: "warning" as const },
    PAST_DUE: { label: "Past Due", variant: "destructive" as const },
    CANCELED: { label: "Canceled", variant: "secondary" as const },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={variant}>{label}</Badge>;
}

const STATUS_ACTIONS: { status: SubscriptionStatus; label: string; description: string; icon: React.ElementType; variant: "success" | "destructive" | "warning" | "outline" }[] = [
  { status: "ACTIVE", label: "Activate", description: "Manually activate this subscription (e.g., offline payment confirmed)", icon: PlayCircle, variant: "success" },
  { status: "TRIAL", label: "Grant Trial Extension", description: "Reset subscription back to trial status", icon: RefreshCw, variant: "warning" },
  { status: "PAST_DUE", label: "Mark as Past Due", description: "Flag this subscription as overdue for payment", icon: AlertTriangle, variant: "outline" },
  { status: "CANCELED", label: "Cancel", description: "Cancel this subscription permanently", icon: XCircle, variant: "destructive" },
];

interface StatusDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (status: SubscriptionStatus) => void;
  subscription: Subscription | null;
  loading: boolean;
}

function StatusDialog({ open, onClose, onConfirm, subscription, loading }: StatusDialogProps) {
  const [selected, setSelected] = useState<SubscriptionStatus | null>(null);

  useEffect(() => { if (!open) setSelected(null); }, [open]);

  const selectedAction = STATUS_ACTIONS.find((a) => a.status === selected);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Subscription Status</DialogTitle>
          <DialogDescription>
            Choose a new status for <strong>{subscription?.company?.name ?? "this company"}</strong>&apos;s subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-1">
          {STATUS_ACTIONS.map(({ status, label, description, icon: Icon }) => (
            <button
              key={status}
              onClick={() => setSelected(status)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                selected === status
                  ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                status === "ACTIVE" ? "text-emerald-500" :
                status === "TRIAL" ? "text-amber-500" :
                status === "PAST_DUE" ? "text-orange-500" : "text-red-500"
              }`} />
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
              {selected === status && (
                <div className="ml-auto shrink-0 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white fill-current">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={selectedAction?.variant === "outline" ? "warning" : selectedAction?.variant ?? "default"}
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            loading={loading}
          >
            {selectedAction ? `${selectedAction.label}` : "Select an action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SubscriptionsPage() {
  const dispatch = useAppDispatch();
  const { items, meta, loading, actionLoading } = useAppSelector((s) => s.subscriptions);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; subscription: Subscription | null }>({
    open: false, subscription: null,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    dispatch(fetchSubscriptionsThunk({ page, limit: 20, search: debouncedSearch }));
  }, [dispatch, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (status: SubscriptionStatus) => {
    if (!dialog.subscription) return;
    const result = await dispatch(
      updateSubscriptionStatusThunk({ subscriptionId: dialog.subscription.id, status })
    );
    if (updateSubscriptionStatusThunk.fulfilled.match(result)) {
      toast.success(`Subscription status updated to ${status}`);
      setDialog({ open: false, subscription: null });
    } else {
      toast.error("Failed to update subscription status");
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by company name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="h-7 px-3">
          {meta.total} subscription{meta.total !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Trial Ends</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                      <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                )
              : items.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{sub.company?.name ?? "Unknown Company"}</p>
                          <p className="text-xs text-slate-400">{sub.company?.slug ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{sub.platformPlan?.name ?? "Custom Plan"}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(sub.platformPlan?.monthlyPrice ?? 0)}/mo</p>
                      </div>
                    </TableCell>
                    <TableCell><SubStatusBadge status={sub.status} /></TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {sub.billingCycle}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(sub.currentPeriodFrom)} → {formatDate(sub.currentPeriodTo)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {sub.trialEndsAt ? formatDate(sub.trialEndsAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionLoading === sub.id}>
                            {actionLoading === sub.id ? (
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            ) : (
                              <MoreHorizontal className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDialog({ open: true, subscription: sub })}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Update Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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

      <StatusDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, subscription: null })}
        onConfirm={handleConfirm}
        subscription={dialog.subscription}
        loading={!!actionLoading}
      />
    </div>
  );
}
