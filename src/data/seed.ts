import type { Contract, StandardClause, Obligation, Clause, WorkflowInstance, DraftContract, AuditEntry, ClauseVersion, ReviewDocument, ReviewRequest, RateTableRow } from "@/types";
import { seedRoles, seedUsers } from "./roles";

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
  matchScore: 4 + (i % 2),
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

const makeWorkflow = (id: string, stage: "Draft" | "Internal Review" | "Redlining & Review"): WorkflowInstance => ({
  id,
  stage,
  tasks: [
    { id: `${id}-t1`, name: "Initial Document Review", assignee: "Sarah Johnson", status: "Done", dueDate: "2025-01-10" },
    { id: `${id}-t2`, name: "Clause Analysis & Categorization", assignee: "AI Agents", status: "Done", dueDate: "2025-01-12" },
    { id: `${id}-t3`, name: "Legal Review of Non-Aligned Clauses", assignee: "Mark Thompson", status: stage === "Draft" ? "Todo" : "Doing", dueDate: "2025-01-20" },
    { id: `${id}-t4`, name: "Stakeholder Review Meeting", assignee: "Contract Team", status: "Todo", dueDate: "2025-01-25" },
    { id: `${id}-t5`, name: "Redline Preparation", assignee: "Emily Chen", status: "Todo", dueDate: "2025-01-30" },
    { id: `${id}-t6`, name: "Final Approval", assignee: "Director", status: "Todo", dueDate: "2025-02-05" },
  ],
  history: [
    { time: "2025-01-08T09:00:00Z", stage: "Draft", actor: "System", note: "Contract uploaded and processing initiated" },
    { time: "2025-01-08T09:15:00Z", stage: "Draft", actor: "Intake Agent", note: "Metadata extracted and clauses identified" },
    { time: "2025-01-10T14:00:00Z", stage: "Internal Review", actor: "Sarah Johnson", note: "Moved to Internal Review after initial analysis" },
  ],
});

const rateTableData1: RateTableRow[] = [
  { category: "Primary Care Visit", currentRate: "$125.00", escalatedRate: "$131.25", rounded: "$131.00", method: "CPI-U", confidence: "High" },
  { category: "Specialist Visit", currentRate: "$185.00", escalatedRate: "$194.25", rounded: "$194.00", method: "CPI-U", confidence: "High" },
  { category: "Orthopedic Surgery", currentRate: "$4,500.00", escalatedRate: "$4,725.00", rounded: "$4,725.00", method: "Negotiated", confidence: "Medium" },
  { category: "Lab Work – Basic Panel", currentRate: "$45.00", escalatedRate: "$47.25", rounded: "$47.00", method: "CPI-U", confidence: "High" },
  { category: "Imaging – MRI", currentRate: "$850.00", escalatedRate: "$892.50", rounded: "$893.00", method: "CPI-U", confidence: "High" },
  { category: "Physical Therapy (per session)", currentRate: "$95.00", escalatedRate: "$99.75", rounded: "$100.00", method: "CPI-U", confidence: "High" },
  { category: "Emergency Room Visit", currentRate: "$1,200.00", escalatedRate: "$1,260.00", rounded: "$1,260.00", method: "Negotiated", confidence: "Low", exception: true },
  { category: "Inpatient – Per Diem", currentRate: "$2,800.00", escalatedRate: "$2,940.00", rounded: "$2,940.00", method: "CPI-U", confidence: "High" },
];

const rateTableData2: RateTableRow[] = [
  { category: "Behavioral Health – Individual", currentRate: "$110.00", escalatedRate: "$115.50", rounded: "$116.00", method: "CPI-U", confidence: "High" },
  { category: "Behavioral Health – Group", currentRate: "$55.00", escalatedRate: "$57.75", rounded: "$58.00", method: "CPI-U", confidence: "High" },
  { category: "Telehealth Visit", currentRate: "$75.00", escalatedRate: "$78.75", rounded: "$79.00", method: "Flat", confidence: "Medium", exception: true },
  { category: "Preventive Care", currentRate: "$0.00", escalatedRate: "$0.00", rounded: "$0.00", method: "N/A", confidence: "High" },
];

const reviewDocuments: ReviewDocument[] = [
  { id: "doc-001", contractId: "contract-001", name: "Base Agreement", type: "Agreement", status: "Under Review", lastModified: "2025-01-12", tableData: rateTableData1, pdfMockRef: "base-agreement-v2.pdf" },
  { id: "doc-002", contractId: "contract-001", name: "Rate Appendix – Table 1C", type: "Appendix", status: "Under Review", lastModified: "2025-01-11", tableData: rateTableData1, pdfMockRef: "rate-appendix-1c.pdf" },
  { id: "doc-003", contractId: "contract-001", name: "Fee Schedule Addendum", type: "Addendum", status: "Pending", lastModified: "2025-01-10", tableData: rateTableData2, pdfMockRef: "fee-schedule-addendum.pdf" },
  { id: "doc-004", contractId: "contract-002", name: "Base Agreement", type: "Agreement", status: "Under Review", lastModified: "2025-01-14", tableData: rateTableData1, pdfMockRef: "southeast-base.pdf" },
  { id: "doc-005", contractId: "contract-002", name: "Payment Appendix", type: "Appendix", status: "Pending", lastModified: "2025-01-13", tableData: rateTableData2, pdfMockRef: "southeast-payment.pdf" },
  { id: "doc-006", contractId: "contract-003", name: "Base Agreement", type: "Agreement", status: "Approved", lastModified: "2025-01-09", tableData: rateTableData1, pdfMockRef: "midwest-base.pdf" },
  { id: "doc-007", contractId: "contract-003", name: "Network Terms", type: "Addendum", status: "Under Review", lastModified: "2025-01-08", tableData: rateTableData2, pdfMockRef: "midwest-network.pdf" },
  { id: "doc-008", contractId: "contract-003", name: "Quality Measures Exhibit", type: "Exhibit", status: "Pending", lastModified: "2025-01-07", tableData: rateTableData2, pdfMockRef: "midwest-quality.pdf" },
];

function makeChecklist(): { id: string; label: string; section: "manual" | "auto"; checked: boolean }[] {
  return [
    { id: "ck1", label: "Check Rate Escalator Percentage", section: "manual", checked: false },
    { id: "ck2", label: "Check Provider Name", section: "manual", checked: false },
    { id: "ck3", label: "Check Payment Appendix Type", section: "manual", checked: false },
    { id: "ck4", label: "Verify Effective Date", section: "manual", checked: false },
    { id: "ck5", label: "Validate TIN against directory", section: "auto", checked: true },
    { id: "ck6", label: "Cross-reference MPIN with credentialing", section: "auto", checked: true },
    { id: "ck7", label: "Check for duplicate job submissions", section: "auto", checked: true },
    { id: "ck8", label: "Verify fee schedule alignment", section: "auto", checked: true },
  ];
}

const statuses: ("Manual review" | "On hold" | "Exception" | "Sent for approval")[] = ["Manual review", "On hold", "Exception", "Sent for approval"];
const eventTypes = ["Rate Load", "Contract Amendment", "New Provider", "Term Extension", "Fee Update", "Network Change", "Credentialing", "Compliance Audit"];

function makeRequests(contractId: string, docId: string, startIdx: number, count: number): ReviewRequest[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `req-${contractId}-${docId}-${i}`,
    contractId,
    documentId: docId,
    jobNo: `C${590127 + startIdx + i}`,
    eventType: eventTypes[(startIdx + i) % eventTypes.length],
    effectiveDate: `2025-0${1 + (i % 6)}-${String(10 + (i % 20)).padStart(2, "0")}`,
    mpin: `MPN${100000 + startIdx + i}`,
    tin: `${90 + (i % 10)}-${7000000 + startIdx + i}`,
    status: statuses[(startIdx + i) % 4],
    loadReady: (startIdx + i) % 3 === 0,
    checklist: makeChecklist(),
    createdAt: `2025-01-${String(8 + (i % 5)).padStart(2, "0")}T${String(9 + (i % 8)).padStart(2, "0")}:00:00Z`,
  }));
}

const seedReviewRequests: ReviewRequest[] = [
  ...makeRequests("contract-001", "doc-001", 0, 10),
  ...makeRequests("contract-001", "doc-002", 10, 8),
  ...makeRequests("contract-001", "doc-003", 18, 5),
  ...makeRequests("contract-002", "doc-004", 23, 9),
  ...makeRequests("contract-002", "doc-005", 32, 6),
  ...makeRequests("contract-003", "doc-006", 38, 8),
  ...makeRequests("contract-003", "doc-007", 43, 7),
  ...makeRequests("contract-003", "doc-008", 50, 5),
];

export const chatAnswerMap: Record<string, string> = {
  "rate escalator": "The rate escalator percentage is 5% annually, applied using CPI-U methodology. See Section 3.10 • Page 43 of the Rate Appendix.",
  "effective date": "The effective date for this contract is January 1, 2025 with a three-year initial term through December 31, 2027. Reference: Section 1.1 • Page 2.",
  "provider name": "The provider listed is Northeast Regional Medical Center (MPIN: MPN100000). This is confirmed on Section 1.0 • Page 1 and Exhibit A • Page 15.",
  "payment appendix": "The payment appendix type is 'Table 1C – Fee Schedule' which uses a tiered rate structure based on Medicare Fee Schedule multiplied by 110%. See Section 4.1 • Page 38.",
  "orthopedic": "Orthopedic services are covered under Category 3 – Surgical Specialties. The negotiated rate for orthopedic surgery is $4,725.00 (escalated from $4,500.00). Note: This rate was negotiated outside the standard CPI-U methodology. Reference: Section 4.3 • Page 45.",
  "termination": "Termination requires 180 days written notice by either party. Termination for cause requires 60 days with a cure period. See Section 7.1 • Page 22.",
  "compliance": "Compliance requirements include annual HEDIS data submission, quarterly claims audits, and monthly provider directory updates. See Section 12.1 • Page 50.",
  "summarize": "This is a Provider Services Agreement between Optum and Northeast Regional Medical Center, effective January 1, 2025 through December 31, 2027. Key terms include 120% Medicare Fee Schedule reimbursement (Section 4.1 • Page 8), 180-day termination notice (Section 7.1 • Page 22), and comprehensive HIPAA compliance requirements (Section 8.1 • Page 30). The contract covers commercial and Medicare Advantage lines of business.",
  "notice": "The termination notice period is 180 days written notice for either party. For termination with cause (e.g., loss of license, fraud), 60 days notice with a 30-day cure period is required. See Section 7.1 • Page 22 and Section 7.2 • Page 23.",
  "obligation": "Key obligations include: 1) Annual HEDIS data submission (due March 31), 2) Monthly provider directory updates, 3) Quarterly claims processing audits, 4) Annual CAHPS surveys, 5) Credentialing verification, 6) FWA training completion. See Section 12.1 • Page 50.",
  "redlining": "Suggested redlining changes: 1) Claims Processing Timeline — align to 30 calendar days (Section 3.1 • Page 15), 2) Reimbursement Rates — increase from 95% to 110% Medicare (Section 5.1 • Page 18), 3) Termination Notice — equalize to 180 days (Section 7.1 • Page 22), 4) Dispute Resolution — add progressive escalation (Section 9.1 • Page 28).",
  "default": "I can help you with details about this contract. Try asking about: rate escalator percentage, effective date, provider name, payment appendix type, termination notice, compliance requirements, or obligations.",
};

// ─── Dashboard seed data ───
export const seedPayers = [
  { id: "payer-1", name: "BlueCross BlueShield", contracts: 12, cleanClaimPct: 96.1, denialPct: 6.2, value: "$24.5M", renewal: "2026-03-15", status: "active" as const },
  { id: "payer-2", name: "Aetna", contracts: 8, cleanClaimPct: 93.4, denialPct: 9.1, value: "$18.2M", renewal: "2025-11-30", status: "active" as const },
  { id: "payer-3", name: "UnitedHealth Group", contracts: 15, cleanClaimPct: 94.8, denialPct: 7.5, value: "$32.1M", renewal: "2026-06-01", status: "active" as const },
  { id: "payer-4", name: "Cigna", contracts: 6, cleanClaimPct: 91.2, denialPct: 11.3, value: "$12.8M", renewal: "2025-09-15", status: "review" as const },
  { id: "payer-5", name: "Humana", contracts: 9, cleanClaimPct: 95.0, denialPct: 7.8, value: "$15.6M", renewal: "2026-01-01", status: "active" as const },
  { id: "payer-6", name: "Medicare", contracts: 4, cleanClaimPct: 97.2, denialPct: 4.1, value: "$8.9M", renewal: "2025-12-31", status: "expired" as const },
];

export const seedProviderFamilies = [
  { id: "pf-1", name: "Northeast Regional Health System", tags: ["Facility", "NY", "Medicare Advantage"], contracts: 4 },
  { id: "pf-2", name: "Heartland Medical Associates", tags: ["Professional", "OH", "Commercial"], contracts: 3 },
  { id: "pf-3", name: "Summit Behavioral Health Group", tags: ["Specialty", "CA", "Medicaid"], contracts: 2 },
  { id: "pf-4", name: "Pacific Coast Imaging Partners", tags: ["Ancillary", "FL", "Medicare Advantage"], contracts: 2 },
];

export const seedDenialReasons = [
  { reason: "Missing Prior Authorization", pct: 28 },
  { reason: "Non-Covered Service", pct: 22 },
  { reason: "Timely Filing", pct: 18 },
  { reason: "Duplicate Claim", pct: 15 },
  { reason: "Invalid Diagnosis Code", pct: 10 },
  { reason: "Coordination of Benefits", pct: 7 },
];

export const seedRecentActivity = [
  { id: "ra-1", text: "BAA extraction complete — BlueCross BlueShield", time: "10 min ago", type: "success" as const },
  { id: "ra-2", text: "SLA review requested — Aetna Provider Agreement", time: "25 min ago", type: "warning" as const },
  { id: "ra-3", text: "Digitization completed — Legacy Cigna contract (2019)", time: "1 hour ago", type: "success" as const },
  { id: "ra-4", text: "Obligation overdue — FWA Training Completion", time: "2 hours ago", type: "error" as const },
  { id: "ra-5", text: "Rate table extracted — UnitedHealth Fee Schedule", time: "3 hours ago", type: "success" as const },
  { id: "ra-6", text: "New contract uploaded — Humana Provider Agreement", time: "4 hours ago", type: "info" as const },
];

export const seedComplianceItems = [
  { id: "ci-1", title: "HEDIS Data Submission", status: "overdue" as const, dueDate: "2025-03-31", contract: "BCBS Northeast" },
  { id: "ci-2", title: "Provider Directory Update", status: "overdue" as const, dueDate: "2025-01-15", contract: "Aetna Southeast" },
  { id: "ci-3", title: "Claims Processing Audit", status: "in-progress" as const, dueDate: "2025-04-15", contract: "UHG Midwest" },
  { id: "ci-4", title: "BAA Compliance Certification", status: "pending" as const, dueDate: "2025-06-01", contract: "Cigna Pacific" },
  { id: "ci-5", title: "Credentialing Verification", status: "compliant" as const, dueDate: "2025-02-28", contract: "Humana South" },
  { id: "ci-6", title: "FWA Training Completion", status: "overdue" as const, dueDate: "2025-01-31", contract: "Medicare National" },
];

// ─── Digitization seed data ───
export interface DigitizationDocument {
  id: string;
  name: string;
  payer: string;
  type: string;
  source: string;
  pages: number;
  status: "Queued" | "OCR Scanning" | "AI Extraction" | "Needs Review" | "Completed" | "Failed";
  ocrScore: number;
  progress: number;
}

export const seedDigitizationDocs: DigitizationDocument[] = [
  { id: "dig-1", name: "BCBS_Provider_Agreement_2019.pdf", payer: "BlueCross BlueShield", type: "Provider Agreement", source: "Physical Scanner", pages: 42, status: "Completed", ocrScore: 94, progress: 100 },
  { id: "dig-2", name: "Aetna_Reimbursement_Schedule_2020.pdf", payer: "Aetna", type: "Reimbursement Schedule", source: "Email Attachment", pages: 28, status: "Completed", ocrScore: 91, progress: 100 },
  { id: "dig-3", name: "UHG_Capitation_Agreement_2018.tiff", payer: "UnitedHealth Group", type: "Capitation Agreement", source: "Physical Scanner", pages: 56, status: "Completed", ocrScore: 82, progress: 100 },
  { id: "dig-4", name: "Cigna_BAA_HIPAA_2021.pdf", payer: "Cigna", type: "BAA / HIPAA", source: "Fax", pages: 15, status: "AI Extraction", ocrScore: 88, progress: 65 },
  { id: "dig-5", name: "Humana_Fee_Schedule_2020.pdf", payer: "Humana", type: "Fee Schedule", source: "Manual Upload", pages: 34, status: "OCR Scanning", ocrScore: 0, progress: 35 },
  { id: "dig-6", name: "Medicare_Credentialing_2019.pdf", payer: "Medicare", type: "Credentialing", source: "Email Attachment", pages: 22, status: "Needs Review", ocrScore: 76, progress: 85 },
  { id: "dig-7", name: "Medicaid_State_Agreement_2017.tiff", payer: "Medicaid (State)", type: "Provider Agreement", source: "Physical Scanner", pages: 68, status: "Queued", ocrScore: 0, progress: 0 },
  { id: "dig-8", name: "TRICARE_Provider_Contract_2020.pdf", payer: "TRICARE", type: "Provider Agreement", source: "Fax", pages: 31, status: "Failed", ocrScore: 45, progress: 22 },
];

export const seedPayerOptions = [
  "BlueCross BlueShield",
  "Aetna",
  "UnitedHealth Group",
  "Cigna",
  "Humana",
  "Medicare",
  "Medicaid (State)",
  "TRICARE",
];

export const seedContractTypeOptions = [
  "Auto-detect",
  "Provider Agreement",
  "Reimbursement Schedule",
  "Capitation Agreement",
  "BAA / HIPAA",
  "Credentialing",
  "Fee Schedule",
];

export const seedSourceOptions = [
  "Physical Scanner",
  "Email Attachment",
  "Fax",
  "Manual Upload",
];

// ─── Enhanced Obligation Tracker data ───
export interface TrackerObligation {
  id: string;
  title: string;
  contract: string;
  category: "Compliance" | "Financial" | "Operational" | "Reporting" | "Insurance";
  owner: string;
  dueDate: string;
  risk: "High" | "Medium" | "Low";
  status: "Overdue" | "At Risk" | "Compliant" | "Upcoming";
  evidence: "Missing" | "Pending" | "Submitted";
}

export const seedTrackerObligations: TrackerObligation[] = [
  { id: "to-1", title: "Q1 2026 Payment — EHR Analytics SOW", contract: "BCBS Northeast MSA", category: "Financial", owner: "Jennifer Brown", dueDate: "2026-01-15", risk: "High", status: "Overdue", evidence: "Missing" },
  { id: "to-2", title: "Post-Termination Data Return", contract: "Aetna Provider Agreement", category: "Compliance", owner: "Michael Rivera", dueDate: "2026-02-28", risk: "High", status: "Overdue", evidence: "Missing" },
  { id: "to-3", title: "Final Settlement Payment", contract: "Cigna Capitation Agreement", category: "Financial", owner: "Jennifer Brown", dueDate: "2026-03-01", risk: "High", status: "Overdue", evidence: "Missing" },
  { id: "to-4", title: "BAA Compliance Certification", contract: "UHG BAA Agreement", category: "Compliance", owner: "Michael Rivera", dueDate: "2026-04-15", risk: "Medium", status: "At Risk", evidence: "Pending" },
  { id: "to-5", title: "Annual Insurance Certificate Renewal", contract: "BCBS Northeast MSA", category: "Insurance", owner: "Sarah Johnson", dueDate: "2026-04-30", risk: "Medium", status: "At Risk", evidence: "Pending" },
  { id: "to-6", title: "Network Adequacy Report", contract: "Humana Provider Agreement", category: "Operational", owner: "David Martinez", dueDate: "2026-05-15", risk: "Medium", status: "At Risk", evidence: "Missing" },
  { id: "to-7", title: "HEDIS Quality Metrics Submission", contract: "Medicare National", category: "Reporting", owner: "Lisa Patel", dueDate: "2026-05-31", risk: "Low", status: "Compliant", evidence: "Submitted" },
  { id: "to-8", title: "Provider Directory Attestation", contract: "Aetna Provider Agreement", category: "Compliance", owner: "James Wilson", dueDate: "2026-06-15", risk: "Low", status: "Compliant", evidence: "Submitted" },
  { id: "to-9", title: "Claims Audit Completion", contract: "BCBS Northeast MSA", category: "Financial", owner: "Karen Davis", dueDate: "2026-06-30", risk: "Low", status: "Compliant", evidence: "Submitted" },
  { id: "to-10", title: "Credentialing Re-verification", contract: "Cigna Capitation Agreement", category: "Operational", owner: "Lisa Patel", dueDate: "2026-07-01", risk: "Low", status: "Compliant", evidence: "Submitted" },
  { id: "to-11", title: "FWA Training Completion", contract: "UHG BAA Agreement", category: "Compliance", owner: "Michael Rivera", dueDate: "2026-07-15", risk: "Low", status: "Upcoming", evidence: "Missing" },
  { id: "to-12", title: "SLA Performance Report", contract: "Humana Provider Agreement", category: "Reporting", owner: "Robert Kim", dueDate: "2026-08-01", risk: "Low", status: "Upcoming", evidence: "Missing" },
  { id: "to-13", title: "Rate Escalator Application", contract: "BCBS Northeast MSA", category: "Financial", owner: "Jennifer Brown", dueDate: "2026-08-15", risk: "Low", status: "Upcoming", evidence: "Missing" },
  { id: "to-14", title: "Emergency Services Coverage Review", contract: "Medicare National", category: "Operational", owner: "David Martinez", dueDate: "2026-09-01", risk: "Low", status: "Upcoming", evidence: "Missing" },
];

// ─── Contract families for accordion list ───
export interface ContractFamily {
  id: string;
  name: string;
  payer: string;
  documents: ContractFamilyDoc[];
  status: "Active" | "Expired" | "Pending Review" | "Draft";
  jurisdiction: string;
  lastActivity: string;
}

export interface ContractFamilyDoc {
  id: string;
  name: string;
  type: "MSA" | "BAA" | "SOW" | "Amendment";
  tags: string[];
  lastActivity: string;
  status: "Active" | "Expired" | "Under Review" | "Draft";
}

export const seedContractFamilies: ContractFamily[] = [
  {
    id: "fam-1", name: "BlueCross BlueShield — Northeast Region", payer: "BCBS", status: "Active", jurisdiction: "NY", lastActivity: "2026-03-20",
    documents: [
      { id: "fd-1", name: "Master Services Agreement", type: "MSA", tags: ["Medicare Advantage", "Commercial"], lastActivity: "2026-03-20", status: "Active" },
      { id: "fd-2", name: "Business Associate Agreement", type: "BAA", tags: ["HIPAA", "PHI"], lastActivity: "2026-03-18", status: "Active" },
      { id: "fd-3", name: "EHR Analytics Statement of Work", type: "SOW", tags: ["Analytics", "Data"], lastActivity: "2026-03-15", status: "Under Review" },
      { id: "fd-4", name: "Amendment #3 — Rate Adjustment", type: "Amendment", tags: ["Rates", "CPI-U"], lastActivity: "2026-03-10", status: "Active" },
    ],
  },
  {
    id: "fam-2", name: "Aetna — Southeast Region", payer: "Aetna", status: "Active", jurisdiction: "FL", lastActivity: "2026-03-19",
    documents: [
      { id: "fd-5", name: "Provider Services Agreement", type: "MSA", tags: ["Professional", "Specialist"], lastActivity: "2026-03-19", status: "Active" },
      { id: "fd-6", name: "BAA — Data Protection", type: "BAA", tags: ["HIPAA", "Encryption"], lastActivity: "2026-03-17", status: "Active" },
      { id: "fd-7", name: "Telehealth Services SOW", type: "SOW", tags: ["Telehealth", "Virtual"], lastActivity: "2026-03-12", status: "Draft" },
    ],
  },
  {
    id: "fam-3", name: "UnitedHealth Group — National", payer: "UHG", status: "Pending Review", jurisdiction: "Multi-State", lastActivity: "2026-03-18",
    documents: [
      { id: "fd-8", name: "National Provider Agreement", type: "MSA", tags: ["National", "All LOBs"], lastActivity: "2026-03-18", status: "Under Review" },
      { id: "fd-9", name: "HIPAA BAA", type: "BAA", tags: ["HIPAA"], lastActivity: "2026-03-14", status: "Active" },
      { id: "fd-10", name: "Capitation Amendment", type: "Amendment", tags: ["Capitation", "Risk"], lastActivity: "2026-03-08", status: "Under Review" },
    ],
  },
  {
    id: "fam-4", name: "Cigna — Pacific Coast", payer: "Cigna", status: "Expired", jurisdiction: "CA", lastActivity: "2026-02-28",
    documents: [
      { id: "fd-11", name: "Behavioral Health Agreement", type: "MSA", tags: ["Behavioral", "Medicaid"], lastActivity: "2026-02-28", status: "Expired" },
      { id: "fd-12", name: "Privacy & Security BAA", type: "BAA", tags: ["HIPAA", "Cyber"], lastActivity: "2026-02-20", status: "Expired" },
    ],
  },
  {
    id: "fam-5", name: "Humana — Midwest Region", payer: "Humana", status: "Draft", jurisdiction: "OH", lastActivity: "2026-03-16",
    documents: [
      { id: "fd-13", name: "Primary Care Group Agreement", type: "MSA", tags: ["Primary Care", "Value-Based"], lastActivity: "2026-03-16", status: "Draft" },
      { id: "fd-14", name: "Quality Incentive SOW", type: "SOW", tags: ["Quality", "HEDIS"], lastActivity: "2026-03-14", status: "Draft" },
    ],
  },
];

// ─── Redlining clause groups ───
export interface RedlineClauseGroup {
  id: string;
  name: string;
  added: number;
  removed: number;
  modified: number;
  changes: RedlineChange[];
}

export interface RedlineChange {
  id: string;
  originalText: string;
  proposedText: string;
  type: "added" | "removed" | "modified";
  status: "pending" | "accepted" | "rejected";
}

export const seedRedlineGroups: RedlineClauseGroup[] = [
  {
    id: "rg-1", name: "Termination", added: 1, removed: 0, modified: 2,
    changes: [
      { id: "rc-1", originalText: "Plan may terminate with 90 days notice.", proposedText: "Either party may terminate with 180 days written notice.", type: "modified", status: "pending" },
      { id: "rc-2", originalText: "", proposedText: "Upon termination, Provider shall ensure continuity of care for all enrolled members for 90 days post-termination.", type: "added", status: "pending" },
      { id: "rc-3", originalText: "Provider requires 180 days notice to terminate.", proposedText: "Either party may terminate with 180 days written notice, with 30-day cure period for cause.", type: "modified", status: "pending" },
    ],
  },
  {
    id: "rg-2", name: "Payment Terms", added: 2, removed: 1, modified: 1,
    changes: [
      { id: "rc-4", originalText: "Claims will be processed within 45 business days.", proposedText: "All clean claims shall be processed within 30 calendar days of receipt.", type: "modified", status: "pending" },
      { id: "rc-5", originalText: "Contested claims timeline is not specified.", proposedText: "", type: "removed", status: "pending" },
      { id: "rc-6", originalText: "", proposedText: "Contested claims shall be resolved within 60 calendar days.", type: "added", status: "pending" },
      { id: "rc-7", originalText: "", proposedText: "Interest at 1.5% per month shall accrue on claims not paid within the specified timeline.", type: "added", status: "pending" },
    ],
  },
  {
    id: "rg-3", name: "Liability", added: 0, removed: 0, modified: 2,
    changes: [
      { id: "rc-8", originalText: "Provider's total liability shall not exceed the fees paid in the prior 12 months.", proposedText: "Each party's total liability shall not exceed the greater of $5M or fees paid in the prior 12 months.", type: "modified", status: "pending" },
      { id: "rc-9", originalText: "Consequential damages are excluded.", proposedText: "Consequential damages are excluded except in cases of willful misconduct, gross negligence, or breach of confidentiality.", type: "modified", status: "pending" },
    ],
  },
  {
    id: "rg-4", name: "Confidentiality", added: 1, removed: 0, modified: 1,
    changes: [
      { id: "rc-10", originalText: "Confidential information shall be protected for 2 years after termination.", proposedText: "Confidential information shall be protected for 5 years after termination.", type: "modified", status: "pending" },
      { id: "rc-11", originalText: "", proposedText: "All confidential information must be returned or destroyed within 30 days of written request.", type: "added", status: "pending" },
    ],
  },
  {
    id: "rg-5", name: "HIPAA Compliance", added: 1, removed: 0, modified: 1,
    changes: [
      { id: "rc-12", originalText: "Provider shall comply with HIPAA regulations.", proposedText: "Provider shall comply with all HIPAA Privacy and Security Rules. PHI shall be encrypted at rest (AES-256) and in transit (TLS 1.2+).", type: "modified", status: "pending" },
      { id: "rc-13", originalText: "", proposedText: "Any breach of PHI must be reported within 24 hours of discovery. Provider shall maintain cyber liability insurance of no less than $5M.", type: "added", status: "pending" },
    ],
  },
  {
    id: "rg-6", name: "Data Protection", added: 0, removed: 1, modified: 2,
    changes: [
      { id: "rc-14", originalText: "Data may be retained indefinitely by Provider.", proposedText: "Data shall be retained per applicable regulatory requirements and destroyed upon contract termination.", type: "modified", status: "pending" },
      { id: "rc-15", originalText: "Provider may share data with affiliates without notice.", proposedText: "", type: "removed", status: "pending" },
      { id: "rc-16", originalText: "Data access controls shall be maintained.", proposedText: "Role-based access controls with quarterly access reviews and audit logging shall be maintained.", type: "modified", status: "pending" },
    ],
  },
];

// ─── Global search notification items ───
export const seedNotifications = [
  { id: "n-1", text: "FWA Training deadline passed — action required", time: "30 min ago", read: false },
  { id: "n-2", text: "New contract uploaded by Sarah Johnson", time: "1 hour ago", read: false },
  { id: "n-3", text: "Digitization complete for BCBS Legacy 2019", time: "2 hours ago", read: true },
  { id: "n-4", text: "Obligation due in 7 days: HEDIS Data Submission", time: "3 hours ago", read: true },
];

export const seedContract: Contract = {
  id: "contract-001",
  name: "UHC_Provider_Agreement_2025_Northeast_Region.pdf",
  uploadDate: "2025-01-08",
  status: "completed",
  rawText: "",
  clauses: [...missingClauses, ...nonAlignedClauses, ...alignedClauses],
  obligations,
  workflow: makeWorkflow("wf1", "Internal Review"),
  documents: reviewDocuments.filter((d) => d.contractId === "contract-001"),
};

export const seedContract2: Contract = {
  id: "contract-002",
  name: "UHC_Provider_Agreement_2025_Southeast_Region.pdf",
  uploadDate: "2025-01-12",
  status: "completed",
  rawText: "",
  clauses: [...missingClauses.slice(0, 5), ...nonAlignedClauses.slice(0, 2), ...alignedClauses],
  obligations: obligations.slice(0, 4),
  workflow: makeWorkflow("wf2", "Draft"),
  documents: reviewDocuments.filter((d) => d.contractId === "contract-002"),
};

export const seedContract3: Contract = {
  id: "contract-003",
  name: "UHC_Provider_Agreement_2025_Midwest_Region.pdf",
  uploadDate: "2025-01-06",
  status: "completed",
  rawText: "",
  clauses: [...missingClauses.slice(0, 3), ...nonAlignedClauses, ...alignedClauses],
  obligations: obligations.slice(2, 7),
  workflow: makeWorkflow("wf3", "Redlining & Review"),
  documents: reviewDocuments.filter((d) => d.contractId === "contract-003"),
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
    localStorage.setItem("oci_contracts", JSON.stringify([seedContract, seedContract2, seedContract3]));
    localStorage.setItem("oci_standard_clauses", JSON.stringify(seedStandardClauses));
    localStorage.setItem("oci_audit_log", JSON.stringify(seedAuditLog));
    localStorage.setItem("oci_drafts", JSON.stringify(seedDrafts));
    localStorage.setItem("oci_clause_versions", JSON.stringify(seedClauseVersions));
    localStorage.setItem("oci_review_documents", JSON.stringify(reviewDocuments));
    localStorage.setItem("oci_review_requests", JSON.stringify(seedReviewRequests));
    localStorage.setItem("oci_roles", JSON.stringify(seedRoles));
    localStorage.setItem("oci_users", JSON.stringify(seedUsers));
    localStorage.setItem("oci_current_user_id", "user-012");
    localStorage.setItem("oci_digitization_docs", JSON.stringify(seedDigitizationDocs));
    localStorage.setItem("oci_contract_families", JSON.stringify(seedContractFamilies));
    localStorage.setItem("oci_tracker_obligations", JSON.stringify(seedTrackerObligations));
    localStorage.setItem("oci_redline_groups", JSON.stringify(seedRedlineGroups));
    localStorage.setItem("oci_notifications", JSON.stringify(seedNotifications));
    localStorage.setItem("oci_initialized", "true");
  }
  // Backfills
  if (!localStorage.getItem("oci_roles")) {
    localStorage.setItem("oci_roles", JSON.stringify(seedRoles));
  }
  if (!localStorage.getItem("oci_users")) {
    localStorage.setItem("oci_users", JSON.stringify(seedUsers));
    localStorage.setItem("oci_current_user_id", "user-012");
  }
  if (!localStorage.getItem("oci_digitization_docs")) {
    localStorage.setItem("oci_digitization_docs", JSON.stringify(seedDigitizationDocs));
  }
  if (!localStorage.getItem("oci_contract_families")) {
    localStorage.setItem("oci_contract_families", JSON.stringify(seedContractFamilies));
  }
  if (!localStorage.getItem("oci_tracker_obligations")) {
    localStorage.setItem("oci_tracker_obligations", JSON.stringify(seedTrackerObligations));
  }
  if (!localStorage.getItem("oci_redline_groups")) {
    localStorage.setItem("oci_redline_groups", JSON.stringify(seedRedlineGroups));
  }
  if (!localStorage.getItem("oci_notifications")) {
    localStorage.setItem("oci_notifications", JSON.stringify(seedNotifications));
  }
  // Backfill Raj
  const existingUsers = JSON.parse(localStorage.getItem("oci_users") || "[]");
  if (!existingUsers.find((u: any) => u.id === "user-013")) {
    existingUsers.push({ id: "user-013", name: "Raj Srirangam", email: "raj.srirangam@optum.com", roleId: "role-platform-admin", status: "Active", createdAt: "2024-05-15T09:00:00Z" });
    localStorage.setItem("oci_users", JSON.stringify(existingUsers));
  }
}
