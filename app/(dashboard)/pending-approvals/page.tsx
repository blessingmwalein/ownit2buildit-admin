"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClockIcon, CheckCircle2, XCircle, Building2,
  Users, FolderOpen, ChevronLeft, ChevronRight, PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchPendingApprovalsThunk, setCompanyApprovalThunk } from "@/store/slices/companiesSlice";
import { fetchOverviewThunk } from "@/store/slices/overviewSlice";
import { formatDate } from "@/lib/utils";
import type { Company } from "@/types";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  company: Company | null;
  action: "approve" | "reject";
  loading: boolean;
}

function ConfirmDialog({ open, onClose, onConfirm, company, action, loading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={action === "approve" ? "text-emerald-700" : "text-red-700"}>
            {action === "approve" ? "✓ Approve Company" : "✗ Reject Company"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? `Approve "${company?.name}"? The company and all its users will gain immediate access.`
              : `Reject "${company?.name}"? The company will remain inactive and users cannot log in.`}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1.5 my-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Company</span>
            <span className="font-medium text-slate-800">{company?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Owner</span>
            <span className="font-medium text-slate-800">{company?.ownerEmail ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Country</span>
            <span className="font-medium text-slate-800">{company?.countryCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Plan</span>
            <span className="font-medium text-slate-800">{company?.subscription?.planCode}</span>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={action === "approve" ? "success" : "destructive"}
            onClick={onConfirm}
            loading={loading}
          >
            {action === "approve" ? "Approve Company" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PendingApprovalsPage() {
  const dispatch = useAppDispatch();
  const { pendingItems, pendingMeta, loading, actionLoading } = useAppSelector((s) => s.companies);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; company: Company | null; action: "approve" | "reject" }>({
    open: false, company: null, action: "approve",
  });

  const load = useCallback(() => {
    dispatch(fetchPendingApprovalsThunk({ page, limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => { load(); }, [load]);

  const openDialog = (company: Company, action: "approve" | "reject") =>
    setDialog({ open: true, company, action });

  const closeDialog = () => setDialog({ open: false, company: null, action: "approve" });

  const handleConfirm = async () => {
    if (!dialog.company) return;
    const isActive = dialog.action === "approve";
    const result = await dispatch(
      setCompanyApprovalThunk({ companyId: dialog.company.id, isActive })
    );
    if (setCompanyApprovalThunk.fulfilled.match(result)) {
      toast.success(isActive ? "Company approved successfully" : "Company rejected");
      dispatch(fetchOverviewThunk()); // refresh badge count
      closeDialog();
      load();
    } else {
      toast.error("Action failed. Please try again.");
    }
  };

  const totalPages = Math.ceil(pendingMeta.total / pendingMeta.limit);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Summary */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <ClockIcon className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            {loading ? "Loading..." : `${pendingMeta.total} compan${pendingMeta.total !== 1 ? "ies" : "y"} awaiting approval`}
          </p>
          <p className="text-xs text-amber-600">Review each registration and approve or reject access.</p>
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
              <TableHead>Users / Projects</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : pendingItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <PartyPopper className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                      <p className="text-slate-600 font-medium">All clear!</p>
                      <p className="text-slate-400 text-sm">No companies pending approval.</p>
                    </TableCell>
                  </TableRow>
                )
              : pendingItems.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-amber-500" />
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          className="h-7 text-xs"
                          loading={actionLoading === company.id}
                          onClick={() => openDialog(company, "approve")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          disabled={!!actionLoading}
                          onClick={() => openDialog(company, "reject")}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
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
