"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export function EmbedClient() {
  const [origin, setOrigin] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Read the current origin client-side so the snippet auto-fills with
  // whatever the app is deployed at.
  if (typeof window !== "undefined" && !origin) {
    setOrigin(window.location.origin);
  }
  const src = origin
    ? `${origin}/embed/widget`
    : "https://YOUR-DEPLOYED-URL/embed/widget";

  const snippet = `<!-- Morey's Daily Report bubble -->
<script>
(function () {
  var SRC = "${src}";
  var i = document.createElement("iframe");
  i.src = SRC;
  i.title = "Morey's Daily Report";
  i.allow = "clipboard-write";
  i.setAttribute("allowtransparency", "true");
  i.style.cssText =
    "position:fixed;bottom:0;right:0;width:88px;height:88px;border:0;" +
    "z-index:99999;background:transparent;color-scheme:normal;";
  document.body.appendChild(i);
  window.addEventListener("message", function (e) {
    try {
      var u = new URL(SRC);
      if (e.origin !== u.origin) return;
    } catch (_) { return; }
    if (e.data && e.data.type === "morey-widget-resize") {
      i.style.width = e.data.width + "px";
      i.style.height = e.data.height + "px";
    }
  });
})();
</script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-morey-deep">
            Copy the embed snippet
          </h2>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-beacon-navy text-white text-xs font-semibold hover:bg-beacon-charcoal transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="text-[11px] leading-snug bg-slate-50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-morey-deep border border-slate-100">
{snippet}
        </pre>
      </section>

      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5">
        <h2 className="text-sm font-semibold text-morey-deep mb-3">
          How it works
        </h2>
        <ol className="text-sm text-morey-mid space-y-2 list-decimal list-inside">
          <li>
            The snippet adds a 1-line script that drops an{" "}
            <code className="text-xs text-morey-deep bg-slate-100 px-1 rounded">
              &lt;iframe&gt;
            </code>{" "}
            into the host page&apos;s body.
          </li>
          <li>
            The iframe loads{" "}
            <code className="text-xs text-morey-deep bg-slate-100 px-1 rounded">
              /embed/widget
            </code>{" "}
            from the Daily Report app — a bare, transparent page with just
            the beAcon bubble.
          </li>
          <li>
            A user on the host site clicks the bubble → the iframe expands →
            they punch in their PIN, type a report, hit Submit. The report is
            attributed to their account.
          </li>
          <li>
            The widget also includes &quot;Open in app&quot; deep-links
            (Dashboard, My reports, Supervisor, Admin) that open the full app
            in a new tab.
          </li>
          <li>
            The iframe resizes itself between collapsed (88×88) and expanded
            (460×740) via{" "}
            <code className="text-xs text-morey-deep bg-slate-100 px-1 rounded">
              postMessage
            </code>{" "}
            — handled by the snippet.
          </li>
        </ol>
      </section>

      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5">
        <h2 className="text-sm font-semibold text-morey-deep mb-3">
          Test it locally
        </h2>
        <p className="text-sm text-morey-mid mb-3">
          Before pasting into a real internal site, you can open the raw
          embed page directly to see how the bubble looks against a
          transparent background.
        </p>
        <a
          href={`/embed/widget`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-slate-200 hover:border-morey-yellow hover:bg-morey-yellowSoft text-sm text-morey-deep transition"
        >
          Open <code className="text-xs">/embed/widget</code>{" "}
          <ExternalLink className="w-3.5 h-3.5 text-morey-mid" />
        </a>
      </section>

      <section className="bg-amber-50/60 border border-amber-200 rounded-bubble p-4 text-xs text-amber-900">
        <strong>Note:</strong> the embed runs in PIN-only mode (no app login
        needed on the host site). Each staff member should have set their PIN
        in the main app under <em>Account → PIN</em>. Quick-PIN reports are
        attributed to whichever account owns that PIN.
      </section>
    </div>
  );
}
