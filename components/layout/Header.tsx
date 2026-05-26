"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/store";
import { fetchOverviewThunk } from "@/store/slices/overviewSlice";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Dashboard", description: "Platform overview and key metrics" },
  "/companies": { title: "Companies", description: "Manage all registered companies" },
  "/pending-approvals": { title: "Pending Approvals", description: "Review and approve new company registrations" },
  "/subscriptions": { title: "Subscriptions", description: "Manage subscription plans and statuses" },
  "/billing": { title: "Billing & Payments", description: "View all payment transactions" },
  "/settings": { title: "Settings", description: "Manage your profile and API keys" },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const pendingApprovals = useAppSelector((s) => s.overview.stats?.pendingApprovals ?? 0);
  const page = pageTitles[pathname] ?? { title: "ownit2buildit Admin", description: "" };

  const handleRefresh = () => {
    dispatch(fetchOverviewThunk());
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6 shrink-0">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 leading-tight">{page.title}</h1>
        {page.description && (
          <p className="text-xs text-slate-500 leading-tight hidden sm:block">{page.description}</p>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh stats">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </Button>

        {/* Notification bell */}
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="w-4 h-4 text-slate-500" />
          </Button>
          {pendingApprovals > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full"
            >
              {pendingApprovals}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
