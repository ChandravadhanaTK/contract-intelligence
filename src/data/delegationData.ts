// Delegation pipeline types and seed data
import type { IntakeRequest } from "@/types";

export type DelegationType = "Delegated" | "NonDelegated";

export interface DelegatedValidationResults {
  workBaskets: { name: "Dell Research vendor" | "Tax ID transaction" | "Demographic"; count: number; status: string }[];
  operaAI: { degree: boolean; gender: boolean; dob: boolean; ssn: boolean; effectiveDate: boolean; computedEffectiveDate: string };
  ndbLinkage: { delegateContractId: string; linked: boolean };
}

export interface NonDelegatedValidationResults {
  pegaCase: { caseId: string; status: string; owner: string };
  validationSources: { NDB: boolean; PRNotes: boolean; SOT: boolean; PICON: boolean };
  sop: { selectedSop: string; screensCompleted: number; totalScreens: 30 };
  effectiveDate: { requested: string; computed: string; validated: boolean };
  followUps: { required: boolean; notes?: string };
}

export interface PipelineDigitizationDoc {
  id: string;
  intakeId?: string;
  documentName: string;
  providerName: string;
  tin: string;
  mpin: string;
  contractType: string;
  delegationType: DelegationType;
  source: string;
  pages: number;
  status: "Queued" | "OCRScanning" | "AIExtraction" | "NeedsReview" | "Completed" | "Failed";
  pipelineStage: string;
  progressPct: number;
  ocrScore: number;
  createdAt: string;
  updatedAt: string;
  logs: { time: string; stage: string; message: string; level: "info" | "warn" | "error" }[];
  validationResults?: DelegatedValidationResults | NonDelegatedValidationResults;
}

export const DELEGATED_STAGES = [
  "D1: Delegate Credentialing Completed (External)",
  "D2: Contract Received from Delegate",
  "D3: NDB Work Basket Routing",
  "D4: Opera AI Validation (Tax ID Transactions)",
  "D5: Contract Linkage in NDB",
  "D6: Completed / Load Ready",
];

export const NON_DELEGATED_STAGES = [
  "N1: Intake & Case Creation (PEGA / Spiken)",
  "N2: Cross-System Validation (NDB + PR Notes + SOT + PICON)",
  "N3: SOP-Guided Processing (30 Screens)",
  "N4: Effective Date Determination (Effective Date Calculator)",
  "N5: Data Entry / Auto-Flow Steps",
  "N6: Follow-ups & Clarifications",
  "N7: Completed / Load Ready",
];

export const seedDelegatedDocs: PipelineDigitizationDoc[] = [
  {
    id: "ddoc-1", documentName: "Northwell_Delegate_Agreement_2025.pdf", providerName: "Northwell Health (Delegate)", tin: "11-2345678", mpin: "MPN100201",
    contractType: "Delegate Agreement", delegationType: "Delegated", source: "Delegate Portal", pages: 34, status: "Completed", pipelineStage: DELEGATED_STAGES[5],
    progressPct: 100, ocrScore: 96, createdAt: "2026-02-10T09:00:00Z", updatedAt: "2026-02-12T14:30:00Z",
    logs: [
      { time: "2026-02-10T09:00:00Z", stage: DELEGATED_STAGES[0], message: "Delegate credentialing verified externally", level: "info" },
      { time: "2026-02-10T10:00:00Z", stage: DELEGATED_STAGES[1], message: "Contract received and queued", level: "info" },
      { time: "2026-02-11T08:00:00Z", stage: DELEGATED_STAGES[2], message: "Routed to NDB work baskets", level: "info" },
      { time: "2026-02-11T14:00:00Z", stage: DELEGATED_STAGES[3], message: "Opera AI validation passed", level: "info" },
      { time: "2026-02-12T10:00:00Z", stage: DELEGATED_STAGES[4], message: "Linked to delegate umbrella contract", level: "info" },
      { time: "2026-02-12T14:30:00Z", stage: DELEGATED_STAGES[5], message: "Processing complete — load ready", level: "info" },
    ],
    validationResults: {
      workBaskets: [{ name: "Dell Research vendor", count: 3, status: "Complete" }, { name: "Tax ID transaction", count: 5, status: "Complete" }, { name: "Demographic", count: 2, status: "Complete" }],
      operaAI: { degree: true, gender: true, dob: true, ssn: true, effectiveDate: true, computedEffectiveDate: "2026-04-01" },
      ndbLinkage: { delegateContractId: "DLG-UMB-001", linked: true },
    } as DelegatedValidationResults,
  },
  {
    id: "ddoc-2", documentName: "Mercy_Delegate_Provider_List.pdf", providerName: "Mercy Health Delegates", tin: "55-6677889", mpin: "MPN200301",
    contractType: "Delegate Provider List", delegationType: "Delegated", source: "Delegate Upload", pages: 18, status: "NeedsReview", pipelineStage: DELEGATED_STAGES[3],
    progressPct: 65, ocrScore: 82, createdAt: "2026-03-01T11:00:00Z", updatedAt: "2026-03-03T09:00:00Z",
    logs: [
      { time: "2026-03-01T11:00:00Z", stage: DELEGATED_STAGES[0], message: "Delegate credentialing verified", level: "info" },
      { time: "2026-03-01T14:00:00Z", stage: DELEGATED_STAGES[1], message: "Contract received", level: "info" },
      { time: "2026-03-02T09:00:00Z", stage: DELEGATED_STAGES[2], message: "Routed to work baskets", level: "info" },
      { time: "2026-03-03T09:00:00Z", stage: DELEGATED_STAGES[3], message: "SSN validation failed — needs review", level: "warn" },
    ],
    validationResults: {
      workBaskets: [{ name: "Dell Research vendor", count: 1, status: "Complete" }, { name: "Tax ID transaction", count: 3, status: "In Progress" }, { name: "Demographic", count: 1, status: "Pending" }],
      operaAI: { degree: true, gender: true, dob: true, ssn: false, effectiveDate: true, computedEffectiveDate: "2026-05-01" },
      ndbLinkage: { delegateContractId: "", linked: false },
    } as DelegatedValidationResults,
  },
  {
    id: "ddoc-3", documentName: "Kaiser_Delegate_BH_Contract.pdf", providerName: "Kaiser Permanente BH", tin: "77-1234567", mpin: "MPN300401",
    contractType: "Behavioral Health Delegate", delegationType: "Delegated", source: "Delegate Portal", pages: 42, status: "OCRScanning", pipelineStage: DELEGATED_STAGES[1],
    progressPct: 25, ocrScore: 45, createdAt: "2026-03-15T08:00:00Z", updatedAt: "2026-03-15T10:00:00Z",
    logs: [
      { time: "2026-03-15T08:00:00Z", stage: DELEGATED_STAGES[0], message: "Delegate credentialing verified", level: "info" },
      { time: "2026-03-15T10:00:00Z", stage: DELEGATED_STAGES[1], message: "Contract being scanned", level: "info" },
    ],
  },
  {
    id: "ddoc-4", documentName: "Cleveland_Delegate_Amendment.pdf", providerName: "Cleveland Clinic Delegates", tin: "33-9876543", mpin: "MPN400501",
    contractType: "Amendment", delegationType: "Delegated", source: "Email", pages: 8, status: "Failed", pipelineStage: DELEGATED_STAGES[2],
    progressPct: 40, ocrScore: 32, createdAt: "2026-03-10T14:00:00Z", updatedAt: "2026-03-11T09:00:00Z",
    logs: [
      { time: "2026-03-10T14:00:00Z", stage: DELEGATED_STAGES[0], message: "Delegate credentialing verified", level: "info" },
      { time: "2026-03-10T16:00:00Z", stage: DELEGATED_STAGES[1], message: "Contract received", level: "info" },
      { time: "2026-03-11T09:00:00Z", stage: DELEGATED_STAGES[2], message: "Work basket routing failed — invalid TIN format", level: "error" },
    ],
  },
  {
    id: "ddoc-5", documentName: "Optum_Delegate_Network_2026.pdf", providerName: "Optum Delegate Network", tin: "44-5566778", mpin: "MPN500601",
    contractType: "Network Agreement", delegationType: "Delegated", source: "Delegate Portal", pages: 56, status: "AIExtraction", pipelineStage: DELEGATED_STAGES[2],
    progressPct: 45, ocrScore: 88, createdAt: "2026-03-12T07:00:00Z", updatedAt: "2026-03-14T11:00:00Z",
    logs: [
      { time: "2026-03-12T07:00:00Z", stage: DELEGATED_STAGES[0], message: "Credentialing verified", level: "info" },
      { time: "2026-03-12T10:00:00Z", stage: DELEGATED_STAGES[1], message: "Contract received", level: "info" },
      { time: "2026-03-14T11:00:00Z", stage: DELEGATED_STAGES[2], message: "Routing to NDB work baskets", level: "info" },
    ],
  },
  {
    id: "ddoc-6", documentName: "Aetna_Delegate_Specialty.pdf", providerName: "Aetna Specialty Delegate", tin: "66-1122334", mpin: "MPN600701",
    contractType: "Specialty Delegate", delegationType: "Delegated", source: "Delegate Upload", pages: 28, status: "Queued", pipelineStage: DELEGATED_STAGES[0],
    progressPct: 5, ocrScore: 0, createdAt: "2026-03-20T09:00:00Z", updatedAt: "2026-03-20T09:00:00Z",
    logs: [
      { time: "2026-03-20T09:00:00Z", stage: DELEGATED_STAGES[0], message: "Queued for processing", level: "info" },
    ],
  },
];

export const seedNonDelegatedDocs: PipelineDigitizationDoc[] = [
  {
    id: "nddoc-1", documentName: "UHC_Provider_Standard_2025.pdf", providerName: "Dr. James Wilson MD", tin: "22-9876543", mpin: "MPN700101",
    contractType: "Provider Agreement", delegationType: "NonDelegated", source: "PEGA Intake", pages: 38, status: "Completed", pipelineStage: NON_DELEGATED_STAGES[6],
    progressPct: 100, ocrScore: 94, createdAt: "2026-01-15T08:00:00Z", updatedAt: "2026-01-20T16:00:00Z",
    logs: [
      { time: "2026-01-15T08:00:00Z", stage: NON_DELEGATED_STAGES[0], message: "PEGA case PEG-20260115-001 created", level: "info" },
      { time: "2026-01-16T10:00:00Z", stage: NON_DELEGATED_STAGES[1], message: "Cross-system validation passed", level: "info" },
      { time: "2026-01-17T09:00:00Z", stage: NON_DELEGATED_STAGES[2], message: "SOP J4100 processing — 30/30 screens", level: "info" },
      { time: "2026-01-18T14:00:00Z", stage: NON_DELEGATED_STAGES[3], message: "Effective date computed: 2026-04-01", level: "info" },
      { time: "2026-01-19T11:00:00Z", stage: NON_DELEGATED_STAGES[4], message: "Data entry complete, auto-flow propagated", level: "info" },
      { time: "2026-01-20T09:00:00Z", stage: NON_DELEGATED_STAGES[5], message: "No follow-ups required", level: "info" },
      { time: "2026-01-20T16:00:00Z", stage: NON_DELEGATED_STAGES[6], message: "Completed — load ready", level: "info" },
    ],
    validationResults: {
      pegaCase: { caseId: "PEG-20260115-001", status: "Closed", owner: "Sarah Johnson" },
      validationSources: { NDB: true, PRNotes: true, SOT: true, PICON: true },
      sop: { selectedSop: "SOP J4100", screensCompleted: 30, totalScreens: 30 },
      effectiveDate: { requested: "2026-04-01", computed: "2026-04-01", validated: true },
      followUps: { required: false },
    } as NonDelegatedValidationResults,
  },
  {
    id: "nddoc-2", documentName: "Pacific_Coast_Ancillary.pdf", providerName: "Pacific Coast Imaging", tin: "44-1122334", mpin: "MPN800201",
    contractType: "Ancillary Services", delegationType: "NonDelegated", source: "Spiken Upload", pages: 22, status: "NeedsReview", pipelineStage: NON_DELEGATED_STAGES[2],
    progressPct: 42, ocrScore: 78, createdAt: "2026-03-05T10:00:00Z", updatedAt: "2026-03-08T14:00:00Z",
    logs: [
      { time: "2026-03-05T10:00:00Z", stage: NON_DELEGATED_STAGES[0], message: "PEGA case PEG-20260305-004 created", level: "info" },
      { time: "2026-03-06T09:00:00Z", stage: NON_DELEGATED_STAGES[1], message: "SOT validation failed — needs review", level: "warn" },
      { time: "2026-03-08T14:00:00Z", stage: NON_DELEGATED_STAGES[2], message: "SOP CSDSNT — 12/30 screens complete", level: "info" },
    ],
    validationResults: {
      pegaCase: { caseId: "PEG-20260305-004", status: "Open", owner: "Mark Thompson" },
      validationSources: { NDB: true, PRNotes: true, SOT: false, PICON: true },
      sop: { selectedSop: "CSDSNT", screensCompleted: 12, totalScreens: 30 },
      effectiveDate: { requested: "2026-06-01", computed: "", validated: false },
      followUps: { required: true, notes: "SOT validation needs provider clarification" },
    } as NonDelegatedValidationResults,
  },
  {
    id: "nddoc-3", documentName: "Summit_BH_Provider_Agreement.pdf", providerName: "Summit Behavioral Health", tin: "33-4567890", mpin: "MPN900301",
    contractType: "Standard Agreement", delegationType: "NonDelegated", source: "PEGA Intake", pages: 30, status: "AIExtraction", pipelineStage: NON_DELEGATED_STAGES[3],
    progressPct: 55, ocrScore: 85, createdAt: "2026-03-10T07:00:00Z", updatedAt: "2026-03-13T11:00:00Z",
    logs: [
      { time: "2026-03-10T07:00:00Z", stage: NON_DELEGATED_STAGES[0], message: "PEGA case created", level: "info" },
      { time: "2026-03-11T10:00:00Z", stage: NON_DELEGATED_STAGES[1], message: "Cross-system validation passed", level: "info" },
      { time: "2026-03-12T09:00:00Z", stage: NON_DELEGATED_STAGES[2], message: "SOP J4100 — 25/30 screens", level: "info" },
      { time: "2026-03-13T11:00:00Z", stage: NON_DELEGATED_STAGES[3], message: "Computing effective date...", level: "info" },
    ],
    validationResults: {
      pegaCase: { caseId: "PEG-20260310-007", status: "In Progress", owner: "Emily Chen" },
      validationSources: { NDB: true, PRNotes: true, SOT: true, PICON: true },
      sop: { selectedSop: "SOP J4100", screensCompleted: 25, totalScreens: 30 },
      effectiveDate: { requested: "2026-07-01", computed: "2026-07-01", validated: false },
      followUps: { required: false },
    } as NonDelegatedValidationResults,
  },
  {
    id: "nddoc-4", documentName: "Midwest_Provider_Renewal.pdf", providerName: "Midwest Medical Group", tin: "88-9988776", mpin: "MPN100401",
    contractType: "Renewal", delegationType: "NonDelegated", source: "PEGA Intake", pages: 15, status: "Failed", pipelineStage: NON_DELEGATED_STAGES[1],
    progressPct: 18, ocrScore: 42, createdAt: "2026-03-12T14:00:00Z", updatedAt: "2026-03-13T08:00:00Z",
    logs: [
      { time: "2026-03-12T14:00:00Z", stage: NON_DELEGATED_STAGES[0], message: "PEGA case created", level: "info" },
      { time: "2026-03-13T08:00:00Z", stage: NON_DELEGATED_STAGES[1], message: "NDB validation failed — TIN mismatch in system of record", level: "error" },
    ],
    validationResults: {
      pegaCase: { caseId: "PEG-20260312-009", status: "Failed", owner: "System" },
      validationSources: { NDB: false, PRNotes: false, SOT: false, PICON: false },
      sop: { selectedSop: "", screensCompleted: 0, totalScreens: 30 },
      effectiveDate: { requested: "2026-05-01", computed: "", validated: false },
      followUps: { required: true, notes: "TIN mismatch — escalation required" },
    } as NonDelegatedValidationResults,
  },
  {
    id: "nddoc-5", documentName: "Southeast_Specialty_Agreement.pdf", providerName: "Southeast Specialty Clinic", tin: "99-1234567", mpin: "MPN200501",
    contractType: "Specialty Agreement", delegationType: "NonDelegated", source: "Spiken Upload", pages: 48, status: "OCRScanning", pipelineStage: NON_DELEGATED_STAGES[0],
    progressPct: 10, ocrScore: 25, createdAt: "2026-03-18T09:00:00Z", updatedAt: "2026-03-18T11:00:00Z",
    logs: [
      { time: "2026-03-18T09:00:00Z", stage: NON_DELEGATED_STAGES[0], message: "PEGA case PEG-20260318-012 created — OCR scanning", level: "info" },
    ],
  },
  {
    id: "nddoc-6", documentName: "Mountain_West_Provider.pdf", providerName: "Mountain West Health", tin: "55-4433221", mpin: "MPN300601",
    contractType: "Provider Agreement", delegationType: "NonDelegated", source: "PEGA Intake", pages: 26, status: "Queued", pipelineStage: NON_DELEGATED_STAGES[0],
    progressPct: 0, ocrScore: 0, createdAt: "2026-03-20T10:00:00Z", updatedAt: "2026-03-20T10:00:00Z",
    logs: [
      { time: "2026-03-20T10:00:00Z", stage: NON_DELEGATED_STAGES[0], message: "Queued for PEGA case creation", level: "info" },
    ],
  },
];

// Extended intake requests with delegation type
export interface DelegatedIntakeRequest extends IntakeRequest {
  delegationType: DelegationType;
}

export const seedDelegatedIntakes: DelegatedIntakeRequest[] = [
  {
    id: "intake-del-1", providerName: "Northwell Health Delegates", specialty: "Multi-Specialty", tin: "11-2345678", mpin: "MPN100201",
    locations: ["New York, NY"], products: ["Commercial HMO"], requestedEffectiveDate: "2026-07-01", contractType: "Delegate",
    docs: ["W-9 Form", "State License", "DEA Certificate", "Malpractice Insurance", "CAQH Profile", "NPI Verification"],
    completenessScore: 100, triageStatus: "Ready for Drafting", notes: "Delegated provider group", createdAt: "2026-02-10T09:00:00Z", delegationType: "Delegated",
  },
  {
    id: "intake-del-2", providerName: "Mercy Health Delegate Group", specialty: "Primary Care", tin: "55-6677889", mpin: "MPN200301",
    locations: ["St. Louis, MO"], products: ["Medicare Advantage"], requestedEffectiveDate: "2026-06-01", contractType: "Delegate",
    docs: ["W-9 Form", "State License", "CAQH Profile", "NPI Verification"],
    completenessScore: 67, triageStatus: "Need more info", notes: "Missing DEA and malpractice docs", createdAt: "2026-03-01T11:00:00Z", delegationType: "Delegated",
  },
  {
    id: "intake-del-3", providerName: "Kaiser Permanente BH Delegate", specialty: "Behavioral Health", tin: "77-1234567", mpin: "MPN300401",
    locations: ["San Francisco, CA"], products: ["Commercial HMO", "Medicaid"], requestedEffectiveDate: "2026-08-01", contractType: "Delegate",
    docs: ["W-9 Form", "State License", "DEA Certificate", "Malpractice Insurance", "CAQH Profile", "NPI Verification"],
    completenessScore: 100, triageStatus: "Ready for Credentialing", notes: "BH delegate group", createdAt: "2026-03-10T08:00:00Z", delegationType: "Delegated",
  },
  {
    id: "intake-nd-1", providerName: "Dr. James Wilson MD", specialty: "Internal Medicine", tin: "22-9876543", mpin: "MPN700101",
    locations: ["Houston, TX"], products: ["Commercial PPO", "Medicare Advantage"], requestedEffectiveDate: "2026-04-01", contractType: "Standard",
    docs: ["W-9 Form", "State License", "DEA Certificate", "Malpractice Insurance", "CAQH Profile", "NPI Verification"],
    completenessScore: 100, triageStatus: "Ready for Drafting", notes: "Standard non-delegated onboarding", createdAt: "2026-01-15T08:00:00Z", delegationType: "NonDelegated",
  },
  {
    id: "intake-nd-2", providerName: "Pacific Coast Imaging Centers", specialty: "Radiology", tin: "44-1122334", mpin: "MPN800201",
    locations: ["San Diego, CA", "Los Angeles, CA"], products: ["Commercial PPO", "Commercial HMO"], requestedEffectiveDate: "2026-06-01", contractType: "Ancillary",
    docs: ["W-9 Form", "State License", "Malpractice Insurance"],
    completenessScore: 50, triageStatus: "Need more info", notes: "Missing DEA, CAQH, NPI docs", createdAt: "2026-03-05T10:00:00Z", delegationType: "NonDelegated",
  },
  {
    id: "intake-nd-3", providerName: "Summit Behavioral Health Associates", specialty: "Behavioral Health", tin: "33-4567890", mpin: "MPN900301",
    locations: ["Denver, CO", "Boulder, CO"], products: ["Commercial HMO", "Medicaid"], requestedEffectiveDate: "2026-07-01", contractType: "Standard",
    docs: ["W-9 Form", "State License", "DEA Certificate", "CAQH Profile", "NPI Verification"],
    completenessScore: 83, triageStatus: "Ready for Credentialing", notes: "Expanding into CO market", createdAt: "2026-03-10T07:00:00Z", delegationType: "NonDelegated",
  },
];

export function getDelegationDocs(): PipelineDigitizationDoc[] {
  try {
    const stored = localStorage.getItem("oci_delegation_docs");
    if (stored) return JSON.parse(stored);
  } catch {}
  const all = [...seedDelegatedDocs, ...seedNonDelegatedDocs];
  localStorage.setItem("oci_delegation_docs", JSON.stringify(all));
  return all;
}

export function saveDelegationDocs(docs: PipelineDigitizationDoc[]) {
  localStorage.setItem("oci_delegation_docs", JSON.stringify(docs));
}

export function getDelegatedIntakes(): DelegatedIntakeRequest[] {
  try {
    const stored = localStorage.getItem("oci_delegated_intakes");
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem("oci_delegated_intakes", JSON.stringify(seedDelegatedIntakes));
  return [...seedDelegatedIntakes];
}

export function saveDelegatedIntakes(intakes: DelegatedIntakeRequest[]) {
  localStorage.setItem("oci_delegated_intakes", JSON.stringify(intakes));
}
