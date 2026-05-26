"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Building2, CheckCircle2, XCircle, MoreHorizontal,
  ChevronLeft, ChevronRight, Users, FolderOpen,
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
import { fetchCompaniesThunk, setCompanyApprovalThunk } from "@/store/slices/companiesSlice";
import { formatDate } from "@/lib/utils";
import type { Company, SubscriptionStatus } from "@/types";

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

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  company: Company | null;
  action: "approve" | "suspend";
  loading: boolean;
}

function ConfirmDialog({ open, onClose, onConfirm, company, action, loading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={action === "approve" ? "text-emerald-700" : "text-red-700"}>
            {action === "approve" ? "Approve Company" : "Suspend Company"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? `Approve "${company?.name}"? All users will gain access to the platform.`
              : `Suspend "${company?.name}"? All users will be blocked immediately.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={action === "approve" ? "success" : "destructive"}
            onClick={onConfirm}
            loading={loading}
          >
            {action === "approve" ? "Approve" : "Suspend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CompaniesPage() {
  const dispatch = useAppDispatch();
  const { items, meta, loading, actionLoading } = useAppSelector((s) => s.companies);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; company: Company | null; action: "approve" | "suspend" }>({
    open: false, company: null, action: "approve",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    dispatch(fetchCompaniesThunk({ page, limit: 20, search: debouncedSearch }));
  }, [dispatch, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const openDialog = (company: Company, action: "approve" | "suspend") =>
    setDialog({ open: true, company, action });

  const closeDialog = () => setDialog({ open: false, company: null, action: "approve" });

  const handleConfirm = async () => {
    if (!dialog.company) return;
    const isActive = dialog.action === "approve";
    const result = await dispatch(
      setCompanyApprovalThunk({ companyId: dialog.company.id, isActive })
    );
    if (setCompanyApprovalThunk.fulfilled.match(result)) {
      toast.success(`Company ${isActive ? "approved" : "suspended"} successfully`);
      closeDialog();
      load();
    } else {
      toast.error("Action failed. Please try again.");
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-7 px-3">
            {meta.total} compan{meta.total !== 1 ? "ies" : "y"}
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Users / Projects</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No companies found
                    </TableCell>
                  </TableRow>
                )
              : items.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{company.name}</p>
                          <p className="text-xs text-slate-400">{company.ownerEmail ?? company.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{company.countryCode}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {company.subscription?.planCode ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <SubStatusBadge status={company.subscription?.status ?? "TRIAL"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {company._count?.users ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" /> {company._count?.projects ?? 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(company.createdAt)}</TableCell>
                    <TableCell>
                      {company.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actionLoading === company.id}
                          >
                            {actionLoading === company.id ? (
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {!company.isActive ? (
                            <DropdownMenuItem
                              className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                              onClick={() => openDialog(company, "approve")}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Approve / Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-700 focus:bg-red-50"
                              onClick={() => openDialog(company, "suspend")}
                            >
                              <XCircle className="w-4 h-4 mr-2" /> Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {meta.page} of {totalPages} &bull; {meta.total} total
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={dialog.open}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        company={dialog.company}
        action={dialog.action}
        loading={!!actionLoading}
      />
    </div>
  );
}
