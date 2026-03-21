import { useEffect, useCallback, useRef } from "react";

/**
 * Global audit tracker that captures all meaningful user clicks and navigations.
 * Logs entries to the oci_audit_log in localStorage.
 */

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  actor: string;
}

function getActor(): string {
  try {
    const raw = localStorage.getItem("oci_current_user");
    if (raw) {
      const u = JSON.parse(raw);
      return u.name || u.id || "Unknown";
    }
  } catch { /* ignore */ }
  return "ChandravadhanaTK";
}

function pushAuditEntry(entry: AuditEntry) {
  try {
    const raw = localStorage.getItem("oci_audit_log");
    const log: AuditEntry[] = raw ? JSON.parse(raw) : [];
    log.push(entry);
    // Keep last 500 entries to avoid bloating localStorage
    if (log.length > 500) log.splice(0, log.length - 500);
    localStorage.setItem("oci_audit_log", JSON.stringify(log));
  } catch { /* ignore */ }
}

function getClickLabel(el: HTMLElement): string | null {
  // Walk up to find meaningful text
  const max = 6;
  let node: HTMLElement | null = el;
  for (let i = 0; i < max && node; i++) {
    // Check for aria-label
    const aria = node.getAttribute("aria-label");
    if (aria) return aria;

    // Check for title
    const title = node.getAttribute("title");
    if (title) return title;

    // Check innerText (short)
    const text = node.innerText?.trim();
    if (text && text.length > 0 && text.length < 80 && !text.includes("\n")) return text;

    node = node.parentElement;
  }
  return null;
}

function getClickContext(el: HTMLElement): string {
  const tag = el.tagName?.toLowerCase() || "unknown";
  const role = el.getAttribute("role") || "";
  const type = el.getAttribute("type") || "";
  const dataAction = el.getAttribute("data-action") || "";

  const parts: string[] = [];

  if (dataAction) parts.push(`action="${dataAction}"`);
  if (role) parts.push(`role=${role}`);
  if (tag === "input" || tag === "select" || tag === "textarea") parts.push(`${tag}[${type}]`);
  if (tag === "a") {
    const href = el.getAttribute("href") || "";
    parts.push(`link→${href}`);
  }

  return parts.join(" ");
}

function isInteractiveElement(el: HTMLElement): boolean {
  const tag = el.tagName?.toLowerCase();
  if (!tag) return false;

  // Direct interactive elements
  if (["button", "a", "select", "input", "textarea"].includes(tag)) return true;

  // Elements with interactive roles
  const role = el.getAttribute("role");
  if (role && ["button", "link", "tab", "menuitem", "checkbox", "radio", "switch", "option", "combobox"].includes(role)) return true;

  // Elements with click handlers (has cursor pointer or onclick)
  const style = window.getComputedStyle(el);
  if (style.cursor === "pointer") return true;

  return false;
}

function findInteractiveAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el;
  for (let i = 0; i < 8 && node; i++) {
    if (isInteractiveElement(node)) return node;
    node = node.parentElement;
  }
  return null;
}

export function useGlobalAuditTracker() {
  const lastLogRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    const interactive = findInteractiveAncestor(target);
    if (!interactive) return;

    const label = getClickLabel(interactive);
    if (!label) return;

    // Deduplicate rapid clicks on same element
    const now = Date.now();
    const key = label;
    if (key === lastLogRef.current && now - lastTimeRef.current < 1000) return;
    lastLogRef.current = key;
    lastTimeRef.current = now;

    const context = getClickContext(interactive);
    const tag = interactive.tagName?.toLowerCase() || "";

    let action = "Click";
    if (tag === "a" || interactive.getAttribute("role") === "link") action = "Navigation";
    else if (tag === "button" || interactive.getAttribute("role") === "button") action = "Button Click";
    else if (tag === "select") action = "Selection";
    else if (tag === "input" || tag === "textarea") action = "Input Focus";
    else if (interactive.getAttribute("role") === "tab") action = "Tab Switch";
    else if (interactive.getAttribute("role") === "menuitem") action = "Menu Action";
    else if (interactive.getAttribute("role") === "checkbox" || interactive.getAttribute("role") === "switch") action = "Toggle";

    const detail = context ? `${label} (${context})` : label;

    pushAuditEntry({
      id: `audit-click-${now}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      detail,
      actor: getActor(),
    });
  }, []);

  // Track route changes
  const handlePopState = useCallback(() => {
    const path = window.location.pathname + window.location.search;
    pushAuditEntry({
      id: `audit-nav-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Page Navigation",
      detail: `Navigated to ${path}`,
      actor: getActor(),
    });
  }, []);

  useEffect(() => {
    // Capture clicks in the capture phase to catch everything
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    // Patch pushState/replaceState to capture SPA navigation
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = function (...args) {
      origPush(...args);
      const path = args[2]?.toString() || window.location.pathname;
      pushAuditEntry({
        id: `audit-nav-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "Page Navigation",
        detail: `Navigated to ${path}`,
        actor: getActor(),
      });
    };

    history.replaceState = function (...args) {
      origReplace(...args);
    };

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, [handleClick, handlePopState]);
}
