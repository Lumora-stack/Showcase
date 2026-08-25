"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Code, BookOpen, Settings, LogOut, ArrowLeft, Menu, X } from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { name: "Overview", href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "Projects", href: "/admin/projects", icon: <Code className="w-4 h-4" /> },
    { name: "Products", href: "/admin/products", icon: <BookOpen className="w-4 h-4" /> },
    { name: "Profile Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row text-zinc-100">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-sm text-white">ADMIN BOARD</span>
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar navigation */}
      <aside
        className={`fixed md:sticky top-0 z-40 w-64 h-full bg-zinc-900 border-r border-zinc-850 flex flex-col justify-between p-6 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-8">
          <div className="hidden md:flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-sm text-white uppercase">Showcase Console</span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Management</p>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]"
                    : "text-zinc-400 hover:bg-zinc-850 hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-zinc-800 pt-6 mt-6">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Showcase Website
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Workspace content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
