"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ClockIcon,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/pending-approvals", label: "Pending Approvals", icon: ClockIcon, badge: true },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/billing", label: "Billing & Payments", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pendingApprovals = useAppSelector((s) => s.overview.stats?.pendingApprovals ?? 0);
  const profile = useAppSelector((s) => s.auth.profile);

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/login");
  };

  return (
    <aside className="flex flex-col h-full bg-[#1e1b4b] text-white w-64 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <HardHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-base leading-tight">ownit2buildit</p>
          <p className="text-[11px] text-indigo-300 leading-tight">Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-500/20 text-white"
                  : "text-indigo-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 shrink-0 transition-colors",
                  isActive ? "text-indigo-300" : "text-indigo-400 group-hover:text-indigo-300"
                )}
                size={18}
              />
              <span className="flex-1">{label}</span>
              {badge && pendingApprovals > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-red-500 text-white">
                  {pendingApprovals}
                </Badge>
              )}
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0">
            {profile?.name?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.name ?? "Admin"}</p>
            <p className="text-xs text-indigo-300 truncate">{profile?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-indigo-200 hover:bg-white/5 hover:text-white transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
