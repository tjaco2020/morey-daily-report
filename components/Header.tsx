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
import { BeaconIcon } from "./BeaconLogo";

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
    <header className="sticky top-0 z-20 bg-beacon-offwhite/85 backdrop-blur-md border-b border-beacon-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* beAcon brand */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 shrink-0 group"
        >
          <BeaconIcon className="w-7 h-7 text-beacon-navy" />
          <span className="hidden sm:inline font-semibold tracking-tight text-beacon-navy text-[15px]">
            be<span className="text-beacon-teal">A</span>con
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 flex items-center justify-center sm:justify-start sm:ml-4 gap-0.5 overflow-x-auto text-sm scrollbar-none">
          <NavItem href="/dashboard" pathname={pathname} icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem href="/reports/today" pathname={pathname} icon={FileText}>
            My reports
          </NavItem>
          {isSup && (
            <NavItem href="/supervisor" pathname={pathname} icon={ShieldCheck}>
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

        {/* Avatar dropdown */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-beacon-line/60 transition"
            aria-label="Account menu"
          >
            <div className="w-7 h-7 rounded-full bg-beacon-navy text-beacon-teal flex items-center justify-center text-xs font-semibold border border-beacon-charcoal">
              {initial}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-beacon-mid hidden sm:inline" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-60 bg-white rounded-soft shadow-panel border border-beacon-line py-1.5 animate-fade-in">
              <div className="px-3 py-2 border-b border-beacon-line">
                <div className="text-sm font-semibold text-beacon-navy truncate">
                  {display}
                </div>
                <div className="text-xs text-beacon-mid capitalize">
                  {profile.role}
                </div>
              </div>
              <Link
                href="/account/pin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-beacon-navy hover:bg-beacon-line/40"
              >
                <KeyRound className="w-4 h-4 text-beacon-mid" />
                Set / change PIN
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-beacon-navy hover:bg-beacon-line/40"
                >
                  <LogOut className="w-4 h-4 text-beacon-mid" />
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
      className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md transition whitespace-nowrap min-h-[36px] ${
        active
          ? "bg-beacon-navy text-white font-medium"
          : "text-beacon-mid hover:text-beacon-navy hover:bg-beacon-line/60 active:bg-beacon-line"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </Link>
  );
}
