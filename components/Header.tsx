"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  KeyRound,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

type Profile = {
  full_name: string | null;
  email: string;
  role: "user" | "supervisor" | "manager";
};

export function Header() {
  const supabase = createBrowserSupabase();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single();
      if (!cancelled && data) setProfile(data as Profile);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, pathname]);

  // Close the avatar menu on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (!profile) return null;

  const isSup = profile.role === "supervisor" || profile.role === "manager";
  const isMgr = profile.role === "manager";
  const display = profile.full_name?.trim() || profile.email;
  const initial = display.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-morey-yellow to-morey-orange text-morey-deep flex items-center justify-center text-sm font-extrabold shadow-sm">
            M
          </div>
          <span className="font-semibold tracking-tight text-morey-deep hidden sm:inline">
            Daily Report
          </span>
        </Link>

        {/* Nav (scrolls horizontally on mobile if needed) */}
        <nav className="flex-1 flex items-center justify-center sm:justify-start sm:ml-4 gap-0.5 overflow-x-auto text-sm scrollbar-none">
          <NavItem href="/dashboard" pathname={pathname} icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem
            href="/reports/today"
            pathname={pathname}
            icon={FileText}
          >
            My reports
          </NavItem>
          {isSup && (
            <NavItem
              href="/supervisor"
              pathname={pathname}
              icon={ShieldCheck}
            >
              Supervisor
            </NavItem>
          )}
          {isMgr && (
            <NavItem href="/admin" pathname={pathname} icon={Settings}>
              Admin
            </NavItem>
          )}
          <NavItem href="/help" pathname={pathname} icon={HelpCircle}>
            Help
          </NavItem>
        </nav>

        {/* Avatar / user menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 transition"
            aria-label="Account menu"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-morey-ocean to-[#0EA5E9] text-white flex items-center justify-center text-xs font-semibold">
              {initial}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-morey-mid hidden sm:inline" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-60 bg-white rounded-soft shadow-panel border border-slate-100 py-1.5 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-sm font-semibold text-morey-deep truncate">
                  {display}
                </div>
                <div className="text-xs text-morey-mid capitalize">
                  {profile.role}
                </div>
              </div>
              <Link
                href="/account/pin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-morey-deep hover:bg-slate-50"
              >
                <KeyRound className="w-4 h-4 text-morey-mid" />
                Set / change PIN
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-morey-deep hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4 text-morey-mid" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({
  href,
  pathname,
  icon: Icon,
  children,
}: {
  href: string;
  pathname: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  children: React.ReactNode;
}) {
  const active = pathname === href || pathname?.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition whitespace-nowrap ${
        active
          ? "bg-slate-100 text-morey-deep font-medium"
          : "text-morey-mid hover:text-morey-deep hover:bg-slate-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </Link>
  );
}
