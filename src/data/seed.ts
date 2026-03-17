import type { Contract, StandardClause, Obligation, Clause, WorkflowInstance, DraftContract, AuditEntry, ClauseVersion } from "@/types";

const missingClauses: Clause[] = [
  { id: "c1", articleName: "Article 12", clauseName: "Network Adequacy Requirements", category: "missing", matchScore: 0, standardText: "Provider shall maintain a network of healthcare professionals sufficient to meet the needs of all enrolled members within the service area, including specialists within 30 miles.", currentText: "", deviationNotes: ["Clause entirely absent from current contract"], recommendations: ["Add network adequacy requirements per CMS guidelines"] },
  { id: "c2", articleName: "Article 14", clauseName: "Member Grievance Procedures", category: "missing", matchScore: 0, standardText: "Plan shall establish and maintain a grievance system that allows members to file complaints regarding service quality, access, and claim disputes within 60 days.", currentText: "", deviationNotes: ["No grievance procedure defined"], recommendations: ["Insert standard grievance procedures section"] },
  { id: "c3", articleName: "Article 16", clauseName: "Quality Improvement Program", category: "missing", matchScore: 0, standardText: "Provider shall implement a Quality Improvement Program including HEDIS measures, CAHPS surveys, and annual quality reporting.", currentText: "", deviationNotes: ["Missing quality improvement requirements"], recommendations: ["Add QIP section with specific HEDIS measures"] },
  { id: "c4", articleName: "Article 18", clauseName: "Data Privacy & PHI Protection", category: "missing", matchScore: 0, standardText: "All parties shall comply with HIPAA Privacy and Security Rules. PHI shall be encrypted at rest and in transit using AES-256.", currentText: "", deviationNotes: ["No HIPAA compliance clause found"], recommendations: ["Critical: Add comprehensive PHI protection clause"] },
  { id: "c5", articleName: "Article 20", clauseName: "Subcontractor Oversight", category: "missing", matchScore: 0, standardText: "Provider shall maintain oversight of all subcontractors performing delegated functions and shall remain responsible for compliance.", currentText: "", deviationNotes: ["No subcontractor management clause"], recommendations: ["Add subcontractor delegation and oversight requirements"] },
  { id: "c6", articleName: "Article 22", clauseName: "Emergency Services Coverage", category: "missing", matchScore: 0, standardText: "Plan shall cover emergency services without prior authorization at in-network cost-sharing levels regardless of provider network status.", currentText: "", deviationNotes: ["Emergency services clause absent"], recommendations: ["Add prudent layperson standard for emergency coverage"] },
  { id: "c7", articleName: "Article 24", clauseName: "Credentialing Requirements", category: "missing", matchScore: 0, standardText: "Provider shall credential and recredential all practitioners per NCQA standards within 180 days of initial application.", currentText: "", deviationNotes: ["No credentialing standards defined"], recommendations: ["Include NCQA credentialing timeline and process"] },
  { id: "c8", articleName: "Article 26", clauseName: "Fraud, Waste & Abuse Program", category: "missing", matchScore: 0, standardText: "Provider shall maintain a compliance program to detect, prevent, and report fraud, waste, and abuse in accordance with federal and state regulations.", currentText: "", deviationNotes: ["FWA program clause missing"], recommendations: ["Add FWA compliance program requirements"] },
  { id: "c9", articleName: "Article 28", clauseName: "Cultural Competency Standards", category: "missing", matchScore: 0, standardText: "Provider shall ensure culturally and linguistically appropriate services consistent with CLAS standards.", currentText: "", deviationNotes: ["No cultural competency requirements"], recommendations: ["Add CLAS standards requirements"] },
  { id: "c10", articleName: "Article 30", clauseName: "Continuity of Care Provisions", category: "missing", matchScore: 0, standardText: "Upon contract termination, Provider shall ensure continuity of care for members with ongoing treatment for up to 90 days.", currentText: "", deviationNotes: ["No continuity of care provision"], recommendations: ["Add 90-day transition period for ongoing treatments"] },
];

const nonAlignedClauses: Clause[] = [
  { id: "c11", articleName: "Article 3", clauseName: "Claims Processing Timeline", category: "nonAligned", matchScore: 1, standardText: "All clean claims shall be processed and paid within 30 calendar days of receipt. Contested claims shall be resolved within 60 calendar days.", currentText: "Claims will be processed within 45 business days. Contested claims timeline is not specified.", deviationNotes: ["Timeline exceeds standard by 15+ days", "Business days vs calendar days discrepancy", "Missing contested claims timeline"], recommendations: ["Align to 30 calendar days for clean claims", "Add 60-day contested claims resolution", "Convert business days to calendar days"] },
  { id: "c12", articleName: "Article 5", clauseName: "Provider Reimbursement Rates", category: "nonAligned", matchScore: 2, standardText: "Reimbursement rates shall be based on 110% of current Medicare Fee Schedule with annual CPI adjustments effective January 1st.", currentText: "Rates based on 95% of Medicare Fee Schedule. Rate adjustments at Plan's discretion.", deviationNotes: ["Rate 15% below standard", "No CPI adjustment guarantee", "Unilateral rate adjustment clause"], recommendations: ["Negotiate to minimum 105% Medicare", "Add annual CPI adjustment language", "Require mutual agreement for rate changes"] },
  { id: "c13", articleName: "Article 7", clauseName: "Termination Notice Period", category: "nonAligned", matchScore: 2, standardText: "Either party may terminate this agreement with 180 days written notice. Termination for cause requires 60 days notice with cure period.", currentText: "Plan may terminate with 90 days notice. Provider requires 180 days notice to terminate.", deviationNotes: ["Asymmetric termination rights", "No cure period for termination with cause", "90-day notice insufficient for member transition"], recommendations: ["Equalize termination notice to 180 days for both parties", "Add 30-day cure period for cause termination"] },
  { id: "c14", articleName: "Article 9", clauseName: "Dispute Resolution", category: "nonAligned", matchScore: 3, standardText: "Disputes shall be resolved through progressive escalation: negotiation (30 days), mediation (60 days), then binding arbitration under AAA rules.", currentText: "All disputes shall be resolved through binding arbitration. Arbitration costs borne by Provider.", deviationNotes: ["Missing progressive escalation steps", "Unfair cost allocation"], recommendations: ["Add negotiation and mediation steps before arbitration", "Split arbitration costs equally"] },
];

const alignedClauses: Clause[] = Array.from({ length: 8 }, (_, i) => ({
  id: `c${15 + i}`,
  articleName: `Article ${i * 2 + 1}`,
  clauseName: ["Scope of Agreement", "Effective Date & Term", "Covered Services", "Provider Obligations", "Plan Obligations", "Compensation Terms", "Insurance Requirements", "Regulatory Compliance"][i],
  category: "aligned" as const,
  matchScore: 4 + Math.round(Math.random()),
  standardText: `Standard clause text for ${["Scope of Agreement", "Effective Date & Term", "Covered Services", "Provider Obligations", "Plan Obligations", "Compensation Terms", "Insurance Requirements", "Regulatory Compliance"][i]}. This clause aligns with organizational standards and regulatory requirements.`,
  currentText: `Current clause text for ${["Scope of Agreement", "Effective Date & Term", "Covered Services", "Provider Obligations", "Plan Obligations", "Compensation Terms", "Insurance Requirements", "Regulatory Compliance"][i]}. Implementation matches standard guidelines.`,
  deviationNotes: [],
  recommendations: [],
}));

const obligations: Obligation[] = [
  { id: "o1", title: "Submit HEDIS Data", description: "Annual HEDIS quality measure data submission to CMS", owner: "Quality Team", dueDate: "2025-03-31", frequency: "Annually", status: "Open", evidenceLinks: [] },
  { id: "o2", title: "Provider Directory Update", description: "Update provider directory for accuracy per CMS requirements", owner: "Network Operations", dueDate: "2025-01-15", frequency: "Monthly", status: "Overdue", evidenceLinks: [] },
  { id: "o3", title: "Claims Processing Audit", description: "Quarterly audit of claims processing accuracy and timeliness", owner: "Claims Department", dueDate: "2025-04-15", frequency: "Quarterly", status: "InProgress", evidenceLinks: ["https://audit-portal.example.com/Q1-2025"] },
  { id: "o4", title: "Member Satisfaction Survey", description: "Annual CAHPS survey administration and reporting", owner: "Member Services", dueDate: "2025-06-30", frequency: "Annually", status: "Open", evidenceLinks: [] },
  { id: "o5", title: "Credentialing Verification", description: "Verify all provider credentials are current and compliant", owner: "Credentialing Team", dueDate: "2025-02-28", frequency: "Quarterly", status: "Compliant", evidenceLinks: ["https://cred-system.example.com/report"] },
  { id: "o6", title: "FWA Training Completion", description: "Annual fraud, waste, and abuse training for all staff", owner: "Compliance Officer", dueDate: "2025-01-31", frequency: "Annually", status: "Overdue", evidenceLinks: [] },
  { id: "o7", title: "Network Adequacy Report", description: "Demonstrate network adequacy per state requirements", owner: "Network Operations", dueDate: "2025-05-15", frequency: "Annually", status: "Open", evidenceLinks: [] },
  { id: "o8", title: "PHI Breach Response Plan Review", description: "Review and update breach notification procedures", owner: "Privacy Officer", dueDate: "2025-03-01", frequency: "Annually", status: "InProgress", evidenceLinks: [] },
];

const workflow: WorkflowInstance = {
  id: "wf1",
  stage: "Review",
  tasks: [
    { id: "t1", name: "Initial Document Review", assignee: "Sarah Johnson", status: "Done", dueDate: "2025-01-10" },
    { id: "t2", name: "Clause Analysis & Categorization", assignee: "AI Agents", status: "Done", dueDate: "2025-01-12" },
    { id: "t3", name: "Legal Review of Non-Aligned Clauses", assignee: "Mark Thompson", status: "Doing", dueDate: "2025-01-20" },
    { id: "t4", name: "Stakeholder Review Meeting", assignee: "Contract Team", status: "Todo", dueDate: "2025-01-25" },
    { id: "t5", name: "Redline Preparation", assignee: "Emily Chen", status: "Todo", dueDate: "2025-01-30" },
    { id: "t6", name: "Final Approval", assignee: "Director", status: "Todo", dueDate: "2025-02-05" },
  ],
  history: [
    { time: "2025-01-08T09:00:00Z", stage: "Draft", actor: "System", note: "Contract uploaded and processing initiated" },
    { time: "2025-01-08T09:15:00Z", stage: "Draft", actor: "Intake Agent", note: "Metadata extracted and clauses identified" },
    { time: "2025-01-08T09:30:00Z", stage: "Draft", actor: "Clause Matching Agent", note: "53 clauses matched against standard library" },
    { time: "2025-01-10T14:00:00Z", stage: "Review", actor: "Sarah Johnson", note: "Moved to Review after initial analysis complete" },
    { time: "2025-01-12T11:00:00Z", stage: "Review", actor: "Mark Thompson", note: "Legal review in progress for 4 non-aligned clauses" },
  ],
};

export const seedContract: Contract = {
  id: "contract-001",
  name: "UHC_Provider_Agreement_2025_Northeast_Region.pdf",
  uploadDate: "2025-01-08",
  status: "completed",
  rawText: "",
  clauses: [...missingClauses, ...nonAlignedClauses, ...alignedClauses],
  obligations,
  workflow,
};

export const seedStandardClauses: StandardClause[] = [
  { id: "sc1", articleName: "Scope of Agreement", clauseName: "General Scope Definition", text: "This Agreement defines the terms under which Provider shall deliver Covered Services to Plan Members within the designated Service Area.", tags: ["scope", "general"] },
  { id: "sc2", articleName: "Term & Termination", clauseName: "Agreement Duration", text: "This Agreement shall be effective for an initial term of three (3) years, with automatic one-year renewals unless terminated per Section 7.", tags: ["term", "duration"] },
  { id: "sc3", articleName: "Covered Services", clauseName: "Services Definition", text: "Provider shall deliver all medically necessary Covered Services as defined in the Member's Evidence of Coverage.", tags: ["services", "coverage"] },
  { id: "sc4", articleName: "Claims Processing", clauseName: "Clean Claims Timeline", text: "All clean claims shall be processed and paid within 30 calendar days of receipt.", tags: ["claims", "payment", "timeline"] },
  { id: "sc5", articleName: "Reimbursement", clauseName: "Rate Schedule", text: "Reimbursement rates shall be based on 110% of current Medicare Fee Schedule with annual CPI adjustments.", tags: ["payment", "rates"] },
  { id: "sc6", articleName: "Quality", clauseName: "Quality Improvement Program", text: "Provider shall implement a Quality Improvement Program including HEDIS measures and annual quality reporting.", tags: ["quality", "HEDIS"] },
  { id: "sc7", articleName: "Compliance", clauseName: "Regulatory Compliance", text: "Both parties shall comply with all applicable federal and state healthcare regulations.", tags: ["compliance", "regulatory"] },
  { id: "sc8", articleName: "Privacy", clauseName: "PHI Protection", text: "All parties shall comply with HIPAA Privacy and Security Rules. PHI shall be encrypted at rest and in transit.", tags: ["HIPAA", "privacy", "security"] },
  { id: "sc9", articleName: "Network", clauseName: "Network Adequacy", text: "Provider shall maintain a network sufficient to meet the needs of all enrolled members within the service area.", tags: ["network", "adequacy"] },
  { id: "sc10", articleName: "Grievance", clauseName: "Member Grievance Procedures", text: "Plan shall establish a grievance system allowing members to file complaints within 60 days.", tags: ["grievance", "member rights"] },
  { id: "sc11", articleName: "Dispute Resolution", clauseName: "Progressive Escalation", text: "Disputes shall be resolved through negotiation (30 days), mediation (60 days), then binding arbitration.", tags: ["dispute", "arbitration"] },
  { id: "sc12", articleName: "Termination", clauseName: "Notice Requirements", text: "Either party may terminate with 180 days written notice. Termination for cause requires 60 days with cure period.", tags: ["termination", "notice"] },
];

export const seedAuditLog: AuditEntry[] = [
  { id: "a1", timestamp: "2025-01-08T09:00:00Z", action: "Contract Uploaded", detail: "UHC_Provider_Agreement_2025_Northeast_Region.pdf uploaded", actor: "Sarah Johnson" },
  { id: "a2", timestamp: "2025-01-08T09:15:00Z", action: "Agents Executed", detail: "All 5 agents completed processing", actor: "System" },
  { id: "a3", timestamp: "2025-01-10T14:00:00Z", action: "Workflow Advanced", detail: "Contract moved from Draft to Review", actor: "Sarah Johnson" },
];

export const seedDrafts: DraftContract[] = [];
export const seedClauseVersions: ClauseVersion[] = [];

export function initializeSeedData() {
  if (!localStorage.getItem("oci_initialized")) {
    localStorage.setItem("oci_contract", JSON.stringify(seedContract));
    localStorage.setItem("oci_standard_clauses", JSON.stringify(seedStandardClauses));
    localStorage.setItem("oci_audit_log", JSON.stringify(seedAuditLog));
    localStorage.setItem("oci_drafts", JSON.stringify(seedDrafts));
    localStorage.setItem("oci_clause_versions", JSON.stringify(seedClauseVersions));
    localStorage.setItem("oci_initialized", "true");
  }
}
