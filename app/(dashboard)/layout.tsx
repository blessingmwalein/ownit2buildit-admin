"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchProfileThunk, setTokenFromStorage } from "@/store/slices/authSlice";
import { fetchOverviewThunk } from "@/store/slices/overviewSlice";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, profile } = useAppSelector((s) => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("bp_admin_token");
    if (!stored) {
      router.replace("/login");
      return;
    }
    if (!token) dispatch(setTokenFromStorage(stored));
  }, []);

  // Fetch profile and overview after token is available
  useEffect(() => {
    if (token && !profile) dispatch(fetchProfileThunk());
    if (token) dispatch(fetchOverviewThunk());
  }, [token]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full w-64">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn("flex-1 overflow-y-auto p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}
