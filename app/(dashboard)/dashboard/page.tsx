"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Building2, Users, Clock, TrendingUp, DollarSign,
  CreditCard, ArrowRight, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchOverviewThunk } from "@/store/slices/overviewSlice";
import { fetchCompaniesThunk } from "@/store/slices/companiesSlice";
import { fetchPaymentsThunk } from "@/store/slices/paymentsSlice";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentStatus, SubscriptionStatus } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SubStatusBadge({ status }: { status: SubscriptionStatus }) {
  const map: Record<SubscriptionStatus, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
    ACTIVE: { label: "Active", variant: "success" },
    TRIAL: { label: "Trial", variant: "warning" },
    PAST_DUE: { label: "Past Due", variant: "destructive" },
    CANCELED: { label: "Canceled", variant: "secondary" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}

function getCompanyLabelFromPayment(pay: { company?: { name: string }; companyId?: string }) {
  if (pay.company?.name) return pay.company.name;
  if (pay.companyId) return `Company ${pay.companyId.slice(0, 8)}`;
  return "Unknown Company";
}

function PayStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
    COMPLETED: { label: "Completed", variant: "success" },
    PENDING: { label: "Pending", variant: "warning" },
    FAILED: { label: "Failed", variant: "destructive" },
    REFUNDED: { label: "Refunded", variant: "secondary" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, subtitle, loading }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1.5" />
            ) : (
              <p className="text-2xl font-bold text-slate-900 mt-1 leading-none">{value}</p>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ml-3`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { stats, loading: statsLoading } = useAppSelector((s) => s.overview);
  const { items: companies, loading: companiesLoading } = useAppSelector((s) => s.companies);
  const { items: payments, loading: paymentsLoading } = useAppSelector((s) => s.payments);

  useEffect(() => {
    dispatch(fetchOverviewThunk());
    dispatch(fetchCompaniesThunk({ page: 1, limit: 5 }));
    dispatch(fetchPaymentsThunk({ page: 1, limit: 5 }));
  }, [dispatch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Stat cards row 1 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Companies"
          value={stats?.totalCompanies ?? "—"}
          icon={Building2}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          loading={statsLoading}
        />
        <StatCard
          title="Active Companies"
          value={stats?.activeCompanies ?? "—"}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subtitle={stats ? `${stats.suspendedCompanies} suspended` : undefined}
          loading={statsLoading}
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals ?? "—"}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={statsLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={stats ? formatCurrency(stats.monthlyRecurringRevenue) : "—"}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subtitle={stats ? `${formatCurrency(stats.totalRevenue)} total` : undefined}
          loading={statsLoading}
        />
      </div>

      {/* ── Stat cards row 2 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Subscriptions"
          value={stats?.totalSubscriptions ?? "—"}
          icon={CreditCard}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          loading={statsLoading}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions ?? "—"}
          icon={Users}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          subtitle={stats ? `${stats.trialSubscriptions} on trial` : undefined}
          loading={statsLoading}
        />
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : "—"}
          icon={DollarSign}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          subtitle={stats ? `${stats.canceledSubscriptions} canceled subs` : undefined}
          loading={statsLoading}
        />
      </div>

      {/* ── Alert banner: pending approvals ── */}
      {stats && stats.pendingApprovals > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {stats.pendingApprovals} compan{stats.pendingApprovals > 1 ? "ies" : "y"} awaiting approval
            </p>
            <p className="text-xs text-amber-600">Review and approve new registrations to grant access.</p>
          </div>
          <Button asChild variant="warning" size="sm">
            <Link href="/pending-approvals">
              Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* ── Tables row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Companies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Companies</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
              <Link href="/companies">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companiesLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  : companies.slice(0, 5).map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{company.name}</p>
                            <p className="text-xs text-slate-400">{company.ownerEmail ?? company.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-600">{company.subscription?.planCode ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          <SubStatusBadge status={company.subscription?.status ?? "TRIAL"} />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Payments</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
              <Link href="/billing">View all <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  : payments.slice(0, 5).map((pay) => (
                      <TableRow key={pay.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{getCompanyLabelFromPayment(pay)}</p>
                            <p className="text-xs text-slate-400">{formatDate(pay.createdAt)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {formatCurrency(pay.amount, pay.currency ?? "USD")}
                        </TableCell>
                        <TableCell>
                          <PayStatusBadge status={pay.status} />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
