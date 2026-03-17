import type { Contract, StandardClause, AuditEntry, DraftContract, ClauseVersion, AgentLog } from "@/types";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function get<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
function set(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const api = {
  getContract: async (): Promise<Contract | null> => {
    await delay(100);
    return get<Contract | null>("oci_contract", null);
  },
  saveContract: async (c: Contract) => {
    await delay(50);
    set("oci_contract", c);
  },
  getStandardClauses: async (): Promise<StandardClause[]> => {
    await delay(100);
    return get("oci_standard_clauses", []);
  },
  saveStandardClauses: async (c: StandardClause[]) => {
    await delay(50);
    set("oci_standard_clauses", c);
  },
  getAuditLog: async (): Promise<AuditEntry[]> => {
    await delay(50);
    return get("oci_audit_log", []);
  },
  addAuditEntry: async (entry: AuditEntry) => {
    const log = get<AuditEntry[]>("oci_audit_log", []);
    log.push(entry);
    set("oci_audit_log", log);
  },
  getDrafts: async (): Promise<DraftContract[]> => {
    await delay(100);
    return get("oci_drafts", []);
  },
  saveDraft: async (d: DraftContract) => {
    const drafts = get<DraftContract[]>("oci_drafts", []);
    const idx = drafts.findIndex((x) => x.id === d.id);
    if (idx >= 0) drafts[idx] = d; else drafts.push(d);
    set("oci_drafts", drafts);
  },
  getClauseVersions: async (): Promise<ClauseVersion[]> => {
    await delay(50);
    return get("oci_clause_versions", []);
  },
  saveClauseVersion: async (v: ClauseVersion) => {
    const versions = get<ClauseVersion[]>("oci_clause_versions", []);
    const idx = versions.findIndex((x) => x.id === v.id);
    if (idx >= 0) versions[idx] = v; else versions.push(v);
    set("oci_clause_versions", versions);
  },
  simulateAgents: async (onLog: (log: AgentLog) => void): Promise<void> => {
    const agents = [
      { name: "Intake Agent", messages: ["Extracting contract metadata...", "Identifying 53 clauses from document...", "Metadata extraction complete."] },
      { name: "Clause Matching Agent", messages: ["Loading standard clauses library (12 standards)...", "Matching clauses against standards...", "Categorized: 8 aligned, 4 non-aligned, 10 missing."] },
      { name: "Redlining Agent", messages: ["Analyzing non-aligned clauses...", "Generating proposed edits for 4 clauses...", "Redline proposals generated."] },
      { name: "Workflow Agent", messages: ["Creating workflow tasks based on deviations...", "Assigned 6 tasks across 3 team members.", "Workflow instance created."] },
      { name: "Compliance Agent", messages: ["Extracting obligations from contract...", "Identified 8 obligations with due dates.", "Compliance tracking initialized."] },
    ];
    for (const agent of agents) {
      for (let i = 0; i < agent.messages.length; i++) {
        const isLast = i === agent.messages.length - 1;
        onLog({
          id: `${agent.name}-${i}`,
          agentName: agent.name,
          timestamp: new Date().toISOString(),
          message: agent.messages[i],
          status: isLast ? "DONE" : "RUNNING",
        });
        await delay(800 + Math.random() * 400);
      }
    }
  },
  simulateDraftAgent: async (prompt: string): Promise<string> => {
    await delay(1500);
    const responses: Record<string, string> = {
      default: `Based on your requirements, here is a draft clause:\n\n"The Provider shall deliver all medically necessary services as outlined in Exhibit A, maintaining compliance with applicable federal and state regulations. Services shall be rendered within the designated service area and meet quality standards as defined in the Quality Improvement Program."\n\nThis clause covers the key elements of scope, compliance, and quality. Shall I refine any specific aspect?`,
    };
    return responses.default;
  },
};
