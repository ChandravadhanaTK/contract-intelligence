export interface Contract {
  id: string;
  name: string;
  uploadDate: string;
  status: "uploading" | "processing" | "completed";
  rawText: string;
  clauses: Clause[];
  obligations: Obligation[];
  workflow: WorkflowInstance;
  documents?: ReviewDocument[];
  docProcessing?: ContractDocumentProcessing;
  renewalDate?: string;
}

export interface Clause {
  id: string;
  articleName: string;
  clauseName: string;
  category: "aligned" | "nonAligned" | "missing";
  matchScore: number;
  standardText: string;
  currentText: string;
  deviationNotes: string[];
  recommendations: string[];
}

export interface StandardClause {
  id: string;
  articleName: string;
  clauseName: string;
  text: string;
  tags: string[];
}

export interface Obligation {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  frequency: "One-time" | "Monthly" | "Quarterly" | "Annually";
  status: "Open" | "InProgress" | "Compliant" | "Overdue";
  evidenceLinks: string[];
}

export interface WorkflowInstance {
  id: string;
  stage: WorkflowStage;
  tasks: Task[];
  history: StatusEvent[];
}

export type WorkflowStage = "Draft" | "Collaborative Drafting" | "Redlining & Review" | "Internal Review" | "Credentialing Validation" | "Contract Pricing Analysis" | "Provider Review" | "Pricing Team Review" | "Legal Team Review" | "Negotiation & Review" | "Signature" | "Published" | "Data Loading";

export interface Task {
  id: string;
  name: string;
  assignee: string;
  status: "Todo" | "Doing" | "Done";
  dueDate: string;
}

export interface StatusEvent {
  time: string;
  stage: string;
  actor: string;
  note: string;
}

export interface AgentLog {
  id: string;
  agentName: string;
  timestamp: string;
  message: string;
  status: "RUNNING" | "DONE" | "PENDING";
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  actor: string;
}

export interface DraftContract {
  id: string;
  name: string;
  parties: string;
  effectiveDate: string;
  term: string;
  paymentRate: string;
  servicesScope: string;
  clauses: { name: string; text: string }[];
  createdAt: string;
  generatedDocument?: ContractDraftDocument;
}

export interface ClauseVersion {
  id: string;
  clauseId: string;
  contractId: string;
  originalText: string;
  proposedText: string;
  acceptedText: string | null;
  status: "pending" | "accepted" | "rejected";
  timestamp: string;
}

// Review Dashboard
export interface ReviewDocument {
  id: string;
  contractId: string;
  name: string;
  type: string;
  status: "Under Review" | "Approved" | "Pending";
  lastModified: string;
  tableData: RateTableRow[];
  pdfMockRef: string;
}

export interface RateTableRow {
  category: string;
  currentRate: string;
  escalatedRate: string;
  rounded: string;
  method: string;
  confidence: "High" | "Medium" | "Low";
  exception?: boolean;
}

export interface ReviewRequest {
  id: string;
  contractId: string;
  documentId: string;
  jobNo: string;
  eventType: string;
  effectiveDate: string;
  mpin: string;
  tin: string;
  status: "Manual review" | "On hold" | "Exception" | "Sent for approval";
  loadReady: boolean;
  checklist: ChecklistItem[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  section: "manual" | "auto";
  checked: boolean;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  role: "user" | "assistant";
  text: string;
  time: string;
}

// Provider Intake & Triage
export interface IntakeRequest {
  id: string;
  providerName: string;
  specialty: string;
  tin: string;
  mpin: string;
  locations: string[];
  products: string[];
  requestedEffectiveDate: string;
  contractType: string;
  docs: string[];
  completenessScore: number;
  triageStatus: "New" | "Need more info" | "Ready for Credentialing" | "Ready for Drafting";
  notes: string;
  createdAt: string;
}

// Credentialing
export interface CredentialingCheck {
  id: string;
  intakeId: string;
  checkType: string;
  status: "Pass" | "Fail" | "Pending" | "Overridden";
  evidenceLink: string;
  lastCheckedAt: string;
  notes: string;
  overriddenBy?: string;
  overrideReason?: string;
}

// Document Intelligence Pipeline
export interface ContractDocumentProcessing {
  id: string;
  contractId: string;
  docType: string;
  needsOcr: boolean;
  layoutSummary: string;
  extractedEntities: Record<string, string>;
  hierarchyMap: { section: string; appendixRef: string }[];
  confidenceByStage: Record<string, number>;
  stageLogs: { stage: string; status: string; detail: string; timestamp: string }[];
}

// Rate/Fee Table Extraction
export interface RateTable {
  id: string;
  contractId: string;
  documentId: string;
  tableName: string;
  effectiveDate: string;
  method: string;
  confidence: number;
  rows: RateRow[];
}

export interface RateRow {
  id: string;
  codeType: string;
  code: string;
  description: string;
  baseRate: number;
  multiplier: number;
  escalator: number;
  finalRate: number;
  confidence: "High" | "Medium" | "Low";
  flags: string[];
}

// Integrity
export interface IntegrityFinding {
  id: string;
  contractId: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  category: string;
  title: string;
  description: string;
  sectionRef: string;
  pageRef: string;
  remediation: string;
  status: "Open" | "Resolved" | "Deferred";
}

// Monitoring
export interface ClaimsSample {
  id: string;
  contractId: string;
  codeType: string;
  code: string;
  expected: number;
  paid: number;
  variance: number;
  reason: string;
}

export interface UMSample {
  id: string;
  contractId: string;
  service: string;
  contractRule: string;
  systemRule: string;
  mismatchFlag: boolean;
}

export interface DisputeTicket {
  id: string;
  contractId: string;
  category: string;
  count: number;
  codes: string[];
  createdAt: string;
  status: "Open" | "In Review" | "Resolved";
}

// Contract Draft Document
export interface ContractDraftDocument {
  id: string;
  contractId: string;
  title: string;
  parties: { partyA: string; partyB: string };
  effectiveDate: string;
  term: string;
  servicesScope: string;
  paymentRateSection: string;
  sections: ContractDocSection[];
  exhibits: ExhibitRef[];
  renderedText: string;
  format: "markdown" | "html";
  lastGeneratedAt: string;
  version: number;
}

export interface ContractDocSection {
  id: string;
  order: number;
  headingNumber: string;
  title: string;
  body: string;
}

export interface ExhibitRef {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

// HITL Override
export interface HITLOverride {
  id: string;
  sourceType: "extraction" | "integrity" | "mapping";
  sourceId: string;
  field: string;
  oldValue: string;
  newValue: string;
  actor: string;
  time: string;
  reason: string;
}

// User & Role Management
export interface Permission {
  module: string;
  accessLevel: "View" | "Edit" | "Approve" | "Admin";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

// CoAuthor types
export interface DefinitionTerm {
  id: string;
  term: string;
  definition: string;
  usedInSections: string[];
}

export interface MissingField {
  id: string;
  fieldKey: string;
  reason: string;
  suggestedPrompt: string;
}

export interface Citation {
  refType: "ContractDraft" | "UploadedDoc";
  sectionRef: string;
  pageRef: string;
}

export interface CoAuthorAction {
  type: "add_section" | "update_section" | "insert_clause" | "replace_text" | "add_exhibit" | "add_definition" | "mark_missing_field";
  sectionRef?: string;
  title?: string;
  body?: string;
  oldText?: string;
  newText?: string;
  exhibitName?: string;
  exhibitDescription?: string;
  term?: string;
  definition?: string;
  fieldKey?: string;
  reason?: string;
}

export interface CoAuthorMessage {
  id: string;
  draftId: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  actions?: CoAuthorAction[];
  citations?: Citation[];
}

export interface DraftVersion {
  id: string;
  draftId: string;
  version: number;
  sections: ContractDocSection[];
  exhibits: ExhibitRef[];
  definitions: DefinitionTerm[];
  placeholdersMissing: MissingField[];
  createdAt: string;
  changeNote: string;
}

// Downstream mapping
export interface DownstreamMapping {
  targetId: string;
  fields: { field: string; value: string; confidence: "High" | "Medium" | "Low" }[];
  loadReadyScore: number;
  exceptions: { field: string; issue: string }[];
}
