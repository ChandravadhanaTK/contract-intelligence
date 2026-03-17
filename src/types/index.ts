export interface Contract {
  id: string;
  name: string;
  uploadDate: string;
  status: "uploading" | "processing" | "completed";
  rawText: string;
  clauses: Clause[];
  obligations: Obligation[];
  workflow: WorkflowInstance;
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

export type WorkflowStage = "Draft" | "Review" | "Redline" | "Approval" | "Signature" | "Published";

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
