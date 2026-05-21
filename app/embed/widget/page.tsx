"use client";

import { useEffect } from "react";
import { EmbeddedWidget } from "@/components/EmbeddedWidget";

/**
 * Bare embed widget — intended to be loaded inside an iframe from other
 * internal Morey's sites. Forces transparent body so the host page is
 * visible around the bubble.
 */
export default function EmbedWidgetPage() {
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.classList.add("embed-mode");
    return () => {
      document.documentElement.style.background = "";
      document.body.classList.remove("embed-mode");
    };
  }, []);

  return <EmbeddedWidget />;
}
