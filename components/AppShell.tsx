"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { SessionGate } from "./SessionGate";
import { FloatingWidget } from "./FloatingWidget";
import { Header } from "./Header";

/**
 * Wraps every authenticated page with:
 *  - Sticky Header (brand + nav + user menu)
 *  - SessionGate: blocks until today's session is set
 *  - FloatingWidget: bottom-right bubble + report panel
 *
 * Does nothing on /login, /quick, /auth (public/guest routes).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserSupabase();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const isPublicRoute =
    pathname === "/login" ||
    pathname?.startsWith("/quick") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/embed");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, pathname]);

  const showShell = ready && !isPublicRoute && userId;

  return (
    <>
      {showShell && <Header />}
      {children}
      {showShell && (
        <>
          <SessionGate userId={userId!} onReady={() => setSessionReady(true)} />
          {sessionReady && <FloatingWidget userId={userId!} />}
        </>
      )}
    </>
  );
}
