import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Send, FileText, ArrowRight, Upload, BookOpen, List, Library, ToggleLeft, ToggleRight, MessageSquare, Zap, X, CheckCircle, Shield, UserCheck, Database, Users, Building2, FileSearch, ChevronRight } from "lucide-react";
import { api } from "@/services/mockApi";
import { toast } from "sonner";
import type { DraftContract, ContractDraftDocument, CoAuthorMessage, StandardClause } from "@/types";
import { generateOptumStandardContractDoc } from "@/services/contractDocGenerator";
import { ContractDocumentPreview } from "@/components/ContractDocumentPreview";
import { DraftChecklistPanel } from "@/components/DraftChecklistPanel";
import { CitationChips } from "@/components/CitationChips";
import { SuggestionDiffCard } from "@/components/SuggestionDiffCard";
import { ClauseInsertDialog } from "@/components/ClauseInsertDialog";
import { OutlineDrawer } from "@/components/OutlineDrawer";
import { processCoAuthorMessage, computeChecklist, guidedSteps } from "@/services/coAuthorAgent";
import { ProgressStepper } from "@/components/ProgressStepper";
import { seedContract } from "@/data/seed";
import type { ContractDocumentProcessing } from "@/types";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
function set(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

type TabId = "create" | "upload" | "bulk" | "intake" | "coauthor";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "create", label: "Contract Creation", icon: FileText },
  { id: "upload", label: "Upload Contract", icon: Upload },
  { id: "bulk", label: "Bulk Upload", icon: List },
  { id: "intake", label: "Start from Provider Intake", icon: ArrowRight },
  { id: "coauthor", label: "Talk to Contract Agent – Your CoAuthor", icon: Bot },
];

interface ContractCreationProps {
  embedded?: boolean;
  initialTab?: TabId;
}

const quickPrompts = [
  "Draft full contract from inputs",
  "Generate Payment & Rate section",
  "Add Termination clause",
  "Add Compliance (HIPAA/Regulatory) clause",
  "Add Exhibit A – Fee Schedule reference",
  "Summarize draft for Legal",
  "Highlight missing info",
];

type BulkFileStatus = "pending" | "uploading" | "processing" | "completed" | "error";
interface BulkFile { name: string; size: string; status: BulkFileStatus; progress: number; }

const docPipelineStages = [
  "Contract Type Identification", "OCR Detection", "Layout Extraction",
  "Entity Extraction", "Clause Extraction", "Standard Matching",
];

/* ─── Intake → Credentialing Pipeline ─── */
const credentialingPipeline = [
  { name: "Credentialing Checks", icon: Shield, desc: "Verify licensure, board certifications, DEA, malpractice history, and sanctions", stages: ["License Verification", "Board Certification", "DEA Registration", "Malpractice History", "OIG/SAM Exclusion Check"] },
  { name: "Credentialing Verification", icon: UserCheck, desc: "Primary source verification of all credentials with issuing bodies", stages: ["State Medical Board", "NPDB Query", "Education Verification", "Training Verification", "Work History Confirmation"] },
  { name: "Credentialing Data Extraction", icon: FileSearch, desc: "Extract structured credentialing data from submitted documents", stages: ["License Numbers & Expiry", "Certification Details", "Insurance Policy Data", "Sanction Records", "Accreditation Status"] },
  { name: "Demographic Data Extraction", icon: Users, desc: "Pull provider demographic details for contract population", stages: ["Provider Name & NPI", "Practice Addresses", "Contact Information", "Tax ID & SSN", "Specialties & Taxonomy Codes"] },
  { name: "Delegate Data Extraction", icon: Building2, desc: "Identify and extract delegate entity information for delegated contracts", stages: ["Delegate Entity Name", "Delegation Agreement Ref", "Delegated Functions Scope", "Oversight Requirements", "Reporting Obligations"] },
];

const sampleIntakeProviders = [
  { id: "INT-001", name: "Northwell Health Systems", specialty: "Multi-Specialty Hospital Network", tin: "11-2345678", status: "Ready for Drafting" as const, completeness: 96 },
  { id: "INT-002", name: "Dr. Maria Santos", specialty: "Cardiology", tin: "22-8765432", status: "Ready for Credentialing" as const, completeness: 88 },
  { id: "INT-003", name: "Summit Behavioral Health", specialty: "Behavioral Health", tin: "95-1234567", status: "Need more info" as const, completeness: 62 },
];

function IntakeCredentialingTab({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(sampleIntakeProviders[0].id);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<Record<string, "pending" | "running" | "done">>({});

  const runPipeline = async () => {
    setRunningPipeline(true);
    for (const step of credentialingPipeline) {
      setPipelineProgress(prev => ({ ...prev, [step.name]: "running" }));
      await new Promise(r => setTimeout(r, 1200));
      setPipelineProgress(prev => ({ ...prev, [step.name]: "done" }));
    }
    setRunningPipeline(false);
    toast.success("Credentialing pipeline complete — ready for contract creation!");
  };

  const selected = sampleIntakeProviders.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1">Start from Provider Intake</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Initiate contracts from provider intake data — linking upstream credentialing to contract creation.
        </p>

        {/* Provider selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {sampleIntakeProviders.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                selectedProvider === p.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-muted-foreground">{p.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  p.status === "Ready for Drafting" ? "bg-emerald-100 text-emerald-700" :
                  p.status === "Ready for Credentialing" ? "bg-blue-100 text-blue-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{p.status}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.specialty}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">TIN: {p.tin}</span>
                <span className="text-[10px] text-muted-foreground">Completeness: {p.completeness}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 mt-1">
                <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${p.completeness}%` }} />
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="flex gap-2">
            <button
              onClick={runPipeline}
              disabled={runningPipeline}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              {runningPipeline ? "Running Credentialing Pipeline..." : "Run Credentialing Pipeline"}
            </button>
            <button
              onClick={() => onNavigate("/intake")}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted"
            >
              <ArrowRight className="w-4 h-4" /> Go to Provider Intake
            </button>
            <button
              onClick={() => onNavigate("/credentialing")}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted"
            >
              <UserCheck className="w-4 h-4" /> Go to Credentialing
            </button>
          </div>
        )}
      </div>

      {/* Credentialing Pipeline Stages */}
      {selected && (
        <div className="bg-card border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Credentialing Pipeline — {selected.name}</h3>
          {credentialingPipeline.map((step, idx) => {
            const status = pipelineProgress[step.name] || "pending";
            return (
              <div key={step.name} className={`rounded-lg border p-4 transition-all ${
                status === "done" ? "border-emerald-200 bg-emerald-50/50" :
                status === "running" ? "border-amber-200 bg-amber-50/50" :
                "border-border bg-background"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    status === "done" ? "bg-emerald-100 text-emerald-700" :
                    status === "running" ? "bg-amber-100 text-amber-700 animate-pulse" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {status === "done" ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-foreground">{step.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        status === "done" ? "bg-emerald-100 text-emerald-700" :
                        status === "running" ? "bg-amber-100 text-amber-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {status === "done" ? "Complete" : status === "running" ? "Processing..." : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{step.desc}</p>
                    {status === "running" && (
                      <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                        <div className="h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ width: "65%" }} />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {step.stages.map(s => (
                        <span key={s} className={`text-[10px] px-2 py-0.5 rounded-md border ${
                          status === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                          status === "running" ? "border-amber-200 bg-amber-50 text-amber-700" :
                          "border-border bg-muted/50 text-muted-foreground"
                        }`}>
                          {status === "done" && "✓ "}{s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {Object.values(pipelineProgress).filter(v => v === "done").length === credentialingPipeline.length && (
            <div className="bg-accent border border-primary/20 rounded-lg p-4 flex items-center justify-between">
              <p className="text-sm font-medium text-accent-foreground">
                ✅ All credentialing checks passed for <strong>{selected.name}</strong> — ready for contract drafting!
              </p>
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90">
                <FileText className="w-3.5 h-3.5" /> Create Contract
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BulkUploadTab({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [files, setFiles] = useState<BulkFile[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles: BulkFile[] = Array.from(fileList).map(f => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      status: "pending" as const,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleBulkProcess = async () => {
    setProcessing(true);
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: "uploading", progress: 10 } : f));
      await new Promise(r => setTimeout(r, 400));
      setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: "processing", progress: 30 } : f));
      for (let p = 30; p <= 90; p += 15) {
        await new Promise(r => setTimeout(r, 300));
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, progress: p } : f));
      }
      await new Promise(r => setTimeout(r, 300));
      setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: "completed", progress: 100 } : f));
    }
    setProcessing(false);
    toast.success(`${files.length} contracts processed successfully!`);
  };

  const allDone = files.length > 0 && files.every(f => f.status === "completed");
  const hasFiles = files.length > 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={e => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed rounded-xl p-12 text-center hover:border-secondary transition-colors cursor-pointer bg-card"
      >
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium mb-1">Drag & drop multiple contracts here</p>
        <p className="text-sm text-muted-foreground mb-4">Supports PDF, DOCX files · Select multiple files at once</p>
        <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 font-medium text-sm">
          Select Multiple Files
          <input type="file" className="hidden" accept=".pdf,.docx" multiple onChange={e => handleFilesSelected(e.target.files)} />
        </label>
      </div>

      {/* Selected files list */}
      {hasFiles && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{files.length} File{files.length > 1 ? "s" : ""} Selected</h3>
            <div className="flex gap-2">
              {!processing && !allDone && (
                <button onClick={handleBulkProcess} className="flex items-center gap-2 px-4 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:opacity-90">
                  <ArrowRight className="w-3.5 h-3.5" /> Process All
                </button>
              )}
              {allDone && (
                <button onClick={() => onNavigate("/deviation")} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90">
                  <ArrowRight className="w-3.5 h-3.5" /> View Deviations
                </button>
              )}
            </div>
          </div>
          <div className="divide-y">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="p-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{f.size}</span>
                      <span className={`status-chip ${
                        f.status === "completed" ? "status-chip-success" :
                        f.status === "processing" || f.status === "uploading" ? "status-chip-running" :
                        f.status === "error" ? "status-chip-error" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {f.status === "completed" ? "DONE" : f.status === "processing" ? "PROCESSING" : f.status === "uploading" ? "UPLOADING" : f.status === "error" ? "ERROR" : "PENDING"}
                      </span>
                      {f.status === "pending" && !processing && (
                        <button onClick={() => removeFile(f.name)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {(f.status === "uploading" || f.status === "processing") && (
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-secondary transition-all duration-300" style={{ width: `${f.progress}%` }} />
                    </div>
                  )}
                  {f.status === "completed" && (
                    <div className="flex gap-1 mt-1">
                      {docPipelineStages.map(stage => (
                        <span key={stage} className="flex items-center gap-0.5 text-[10px] text-success">
                          <CheckCircle className="w-2.5 h-2.5" /> {stage.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allDone && (
        <div className="bg-accent border border-secondary/20 rounded-lg p-4">
          <p className="text-sm font-medium text-accent-foreground">
            ✅ All {files.length} contracts processed! Navigate to{" "}
            <button onClick={() => onNavigate("/deviation")} className="text-secondary underline font-semibold">Contract Deviation</button>,{" "}
            <button onClick={() => onNavigate("/integrity")} className="text-secondary underline font-semibold">Integrity Validation</button>, or{" "}
            <button onClick={() => onNavigate("/rates")} className="text-secondary underline font-semibold">Rate Tables</button>.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ContractCreation({ embedded = false, initialTab }: ContractCreationProps = {}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab || "create");
  const [form, setForm] = useState({ name: "", parties: "", effectiveDate: "", term: "", paymentRate: "", servicesScope: "" });
  const [generatedDoc, setGeneratedDoc] = useState<ContractDraftDocument | null>(null);
  const [showDocPreview, setShowDocPreview] = useState(true);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  // CoAuthor state
  const [coAuthorMode, setCoAuthorMode] = useState<"freeform" | "guided">("freeform");
  const [chatMessages, setChatMessages] = useState<CoAuthorMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [standardClauses, setStandardClauses] = useState<StandardClause[]>([]);
  const [guidedStepIndex, setGuidedStepIndex] = useState(0);
  const [guidedUserInput, setGuidedUserInput] = useState("");
  const [clauseDialogOpen, setClauseDialogOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  // Pending action for human-in-the-loop
  const [pendingUpdate, setPendingUpdate] = useState<{ sections?: any[]; exhibits?: any[]; message: CoAuthorMessage } | null>(null);
  const [pendingGuidedGeneration, setPendingGuidedGeneration] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Upload state
  const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "identifying" | "matching" | "completed">("idle");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const docs = get<ContractDraftDocument[]>("oci_generated_docs", []);
    if (docs.length > 0) setGeneratedDoc(docs[docs.length - 1]);
    const msgs = get<CoAuthorMessage[]>("oci_coauthor_messages", []);
    if (msgs.length > 0) setChatMessages(msgs);
    api.getStandardClauses().then(setStandardClauses);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  const checklist = computeChecklist(generatedDoc);

  const handleSave = async () => {
    const draftId = savedDraftId || `draft-${Date.now()}`;
    const draft: DraftContract = { id: draftId, ...form, clauses: [], createdAt: new Date().toISOString() };
    const doc = generateOptumStandardContractDoc({ contractId: draftId, name: form.name, parties: form.parties, effectiveDate: form.effectiveDate, term: form.term, paymentRate: form.paymentRate, servicesScope: form.servicesScope });
    draft.generatedDocument = doc;
    await api.saveDraft(draft);
    const docs = get<ContractDraftDocument[]>("oci_generated_docs", []);
    const idx = docs.findIndex(d => d.contractId === draftId);
    if (idx >= 0) docs[idx] = doc; else docs.push(doc);
    set("oci_generated_docs", docs);
    setGeneratedDoc(doc);
    setShowDocPreview(true);
    setSavedDraftId(draftId);
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Draft Created", detail: `Contract "${form.name}" drafted with generated document`, actor: "System" });
    toast.success("Contract draft saved with generated document!");
  };

  const handleRegenerate = () => {
    if (!savedDraftId) return;
    const doc = generateOptumStandardContractDoc({ contractId: savedDraftId, ...form });
    doc.version = (generatedDoc?.version || 0) + 1;
    setGeneratedDoc(doc);
    const docs = get<ContractDraftDocument[]>("oci_generated_docs", []);
    const idx = docs.findIndex(d => d.contractId === savedDraftId);
    if (idx >= 0) docs[idx] = doc; else docs.push(doc);
    set("oci_generated_docs", docs);
    toast.success("Document regenerated");
  };

  const handleSendToRedlining = () => {
    if (!generatedDoc) return;
    const versions = get<any[]>("oci_clause_versions", []);
    generatedDoc.sections.forEach(sec => {
      versions.push({ id: `cv-doc-${sec.id}-${Date.now()}`, clauseId: `doc-section-${sec.id}`, contractId: generatedDoc.contractId, originalText: sec.body, proposedText: sec.body, acceptedText: null, status: "pending", timestamp: new Date().toISOString() });
    });
    set("oci_clause_versions", versions);
    toast.success("Sent to Redlining");
    navigate("/redlining");
  };

  const handleUpdateSections = (sections: ContractDraftDocument["sections"]) => {
    if (!generatedDoc) return;
    const updated = { ...generatedDoc, sections };
    setGeneratedDoc(updated);
    const docs = get<ContractDraftDocument[]>("oci_generated_docs", []);
    const idx = docs.findIndex(d => d.id === generatedDoc.id);
    if (idx >= 0) docs[idx] = updated;
    set("oci_generated_docs", docs);
  };

  const applyDocumentUpdate = (sections?: any[], exhibits?: any[]) => {
    const draftId = savedDraftId || "draft-coauthor";
    if (sections) {
      const doc = generatedDoc ? {
        ...generatedDoc,
        sections,
        version: (generatedDoc.version || 0) + 1,
        lastGeneratedAt: new Date().toISOString(),
      } : {
        id: `doc-gen-${draftId}`, contractId: draftId, title: form.name || "Provider Services Agreement",
        parties: { partyA: form.parties.split(/[,&]/)[0]?.trim() || "Plan", partyB: form.parties.split(/[,&]/)[1]?.trim() || "Provider" },
        effectiveDate: form.effectiveDate || "01/01/2025", term: form.term || "3 years",
        servicesScope: form.servicesScope, paymentRateSection: form.paymentRate,
        sections,
        exhibits: exhibits || [],
        renderedText: "", format: "markdown" as const, lastGeneratedAt: new Date().toISOString(), version: 1,
      };
      setGeneratedDoc(doc);
      setShowDocPreview(true);
      const docs = get<ContractDraftDocument[]>("oci_generated_docs", []);
      const idx = docs.findIndex(d => d.contractId === draftId);
      if (idx >= 0) docs[idx] = doc; else docs.push(doc);
      set("oci_generated_docs", docs);
      if (!savedDraftId) setSavedDraftId(draftId);
    }
    if (exhibits && generatedDoc) {
      const doc = { ...generatedDoc, exhibits };
      setGeneratedDoc(doc);
    }
  };

  const handleCoAuthorSend = async (text?: string) => {
    const msg = text || chatInput;
    if (!msg.trim()) return;

    const draftId = savedDraftId || "draft-coauthor";
    const userMsg: CoAuthorMessage = { id: `ca-user-${Date.now()}`, draftId, role: "user", text: msg, time: new Date().toISOString() };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));

    const response = processCoAuthorMessage(msg, draftId, generatedDoc, standardClauses, form);
    const allMsgs = [...updated, response.message];
    setChatMessages(allMsgs);
    set("oci_coauthor_messages", allMsgs);

    // Human-in-the-loop: if there are document updates, ask permission first
    if (response.updatedSections || response.updatedExhibits) {
      const confirmMsg: CoAuthorMessage = {
        id: `ca-confirm-${Date.now()}`, draftId, role: "assistant",
        text: "📝 **Can I add this to the document?** I'd like to update the Generated Contract Document with the changes above. Reply **Yes** to apply or **No** to skip.",
        time: new Date().toISOString(),
      };
      const withConfirm = [...allMsgs, confirmMsg];
      setChatMessages(withConfirm);
      set("oci_coauthor_messages", withConfirm);
      setPendingUpdate({ sections: response.updatedSections, exhibits: response.updatedExhibits, message: response.message });
    }

    // Audit log
    if (response.message.actions && response.message.actions.length > 0) {
      await api.addAuditEntry({
        id: `a-${Date.now()}`, timestamp: new Date().toISOString(),
        action: `COAUTHOR_${response.message.actions[0].type.toUpperCase()}`,
        detail: `CoAuthor: ${response.message.actions[0].type} – ${response.message.actions[0].sectionRef || "general"}`,
        actor: "CoAuthor Agent",
      });
    }

    setLoading(false);
  };

  // Handle user confirmation for pending updates
  const handleUserConfirmation = async (confirmed: boolean) => {
    if (!pendingUpdate) return;
    const draftId = savedDraftId || "draft-coauthor";

    if (confirmed) {
      applyDocumentUpdate(pendingUpdate.sections, pendingUpdate.exhibits);
      const confirmMsg: CoAuthorMessage = {
        id: `ca-applied-${Date.now()}`, draftId, role: "assistant",
        text: "✅ **Done!** The document has been updated. You can see the changes in the Generated Provider Contract Document below.",
        time: new Date().toISOString(),
      };
      setChatMessages(prev => {
        const updated = [...prev, confirmMsg];
        set("oci_coauthor_messages", updated);
        return updated;
      });
      toast.success("Document updated successfully");
    } else {
      const skipMsg: CoAuthorMessage = {
        id: `ca-skipped-${Date.now()}`, draftId, role: "assistant",
        text: "⏭️ Understood — I've skipped updating the document. The suggested content is still available in our chat above if you need it later.",
        time: new Date().toISOString(),
      };
      setChatMessages(prev => {
        const updated = [...prev, skipMsg];
        set("oci_coauthor_messages", updated);
        return updated;
      });
    }
    setPendingUpdate(null);
  };

  const handleGuidedNext = async () => {
    if (guidedStepIndex < guidedSteps.length) {
      const step = guidedSteps[guidedStepIndex];
      const draftId = savedDraftId || "draft-coauthor";
      const agentMsg: CoAuthorMessage = {
        id: `guided-${Date.now()}`, draftId,
        role: "assistant", text: `**Step ${guidedStepIndex + 1} of ${guidedSteps.length}:** ${step.question}`,
        time: new Date().toISOString(),
      };
      const withAgent = [...chatMessages, agentMsg];
      setChatMessages(withAgent);

      if (step.sampleAnswer) {
        setGuidedUserInput(step.sampleAnswer);
        await new Promise(r => setTimeout(r, 600));
        const userMsg: CoAuthorMessage = {
          id: `guided-user-${Date.now()}`, draftId,
          role: "user", text: step.sampleAnswer,
          time: new Date().toISOString(),
        };
        const withUser = [...withAgent, userMsg];
        setChatMessages(withUser);

        await new Promise(r => setTimeout(r, 500));
        const isLastStep = guidedStepIndex + 1 >= guidedSteps.length;
        const confirmMsg: CoAuthorMessage = {
          id: `guided-confirm-${Date.now()}`, draftId,
          role: "assistant",
          text: isLastStep
            ? `✅ Got it — I've captured your input for **${step.field}**.\n\n🎉 **All ${guidedSteps.length} steps complete!** I have all the information needed to draft your contract.\n\n📝 **Shall I generate the full Provider Services Agreement now?** Reply **Yes** to generate or **No** to skip.`
            : `✅ Got it — I've captured your input for **${step.field}**. Click **Next Step** to continue or edit the answer above and **Submit** your own.`,
          time: new Date().toISOString(),
        };
        const finalMsgs = [...withUser, confirmMsg];
        setChatMessages(finalMsgs);
        set("oci_coauthor_messages", finalMsgs);

        // If last step, set pending generation for HITL
        if (isLastStep) {
          setPendingGuidedGeneration(true);
        }
      }

      setGuidedStepIndex(prev => prev + 1);
      setGuidedUserInput("");
    }
  };

  const handleGuidedUserSubmit = async () => {
    if (!guidedUserInput.trim()) return;
    const draftId = savedDraftId || "draft-coauthor";
    const stepIdx = Math.max(0, guidedStepIndex - 1);
    const step = guidedSteps[stepIdx];
    const userMsg: CoAuthorMessage = {
      id: `guided-human-${Date.now()}`, draftId,
      role: "user", text: guidedUserInput,
      time: new Date().toISOString(),
    };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);

    await new Promise(r => setTimeout(r, 400));
    const confirmMsg: CoAuthorMessage = {
      id: `guided-human-confirm-${Date.now()}`, draftId,
      role: "assistant",
      text: `✅ Got it — I've captured your custom input for **${step?.field || "this step"}**. ${guidedStepIndex < guidedSteps.length ? "Click **Next Step** to continue." : "🎉 All steps complete! Click **\"Draft full contract from inputs\"** to generate."}`,
      time: new Date().toISOString(),
    };
    const withConfirm = [...updated, confirmMsg];
    setChatMessages(withConfirm);
    set("oci_coauthor_messages", withConfirm);
    setGuidedUserInput("");
  };

  const handleApplyAction = (action: any) => {
    if (!generatedDoc || !action.newText || !action.sectionRef) return;
    const sections = generatedDoc.sections.map(s =>
      s.headingNumber === action.sectionRef ? { ...s, body: action.newText } : s
    );
    handleUpdateSections(sections);
    api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "COAUTHOR_APPLY_CHANGE", detail: `Applied change to ${action.sectionRef}`, actor: "User" });
    toast.success("Change applied");
  };

  const handleInsertFromLibrary = (clause: StandardClause) => {
    setClauseDialogOpen(false);
    handleCoAuthorSend(`Insert standard clause: ${clause.clauseName}`);
  };

  const handleJumpToSection = (sectionRef: string) => {
    const el = document.querySelector(`[data-section="${sectionRef}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Upload handlers
  const docProcessingStages = [
    { stage: "Contract Type Identification", detail: "Identified as Provider Services Agreement – Standard" },
    { stage: "OCR Detection", detail: "Document is digitally native – OCR not required" },
    { stage: "Layout Extraction", detail: "Found 14 sections, 3 tables, 4 appendix references" },
    { stage: "Entity Extraction", detail: "Extracted TIN: 90-7000000, Effective: 2025-01-01, Term: 3 years" },
    { stage: "Clause Extraction", detail: "Extracted 22 clauses across 14 articles" },
    { stage: "Standard Matching", detail: "Matched: 8 aligned, 4 non-aligned, 10 missing" },
  ];

  const handleUpload = useCallback(async (name: string) => {
    setUploadFileName(name);
    setUploadPhase("uploading");
    setUploadProgress(0);
    for (let i = 0; i <= 100; i += 8) {
      await new Promise(r => setTimeout(r, 200));
      setUploadProgress(i);
      if (i === 32) setUploadPhase("identifying");
      if (i === 64) setUploadPhase("matching");
    }
    setUploadProgress(100);
    setUploadPhase("completed");
    const processing: ContractDocumentProcessing = {
      id: `proc-${Date.now()}`, contractId: seedContract.id, docType: "Provider Services Agreement",
      needsOcr: false, layoutSummary: "14 sections, 3 tables", extractedEntities: { TIN: "90-7000000" },
      hierarchyMap: [{ section: "Section 3.1", appendixRef: "Exhibit B" }],
      confidenceByStage: { "Contract Type": 98, Layout: 95 },
      stageLogs: docProcessingStages.map((s) => ({ stage: s.stage, status: "Done", detail: s.detail, timestamp: new Date().toISOString() })),
    };
    await api.saveContract({ ...seedContract, name, uploadDate: new Date().toISOString().split("T")[0], status: "completed", docProcessing: processing });
    toast.success("Contract uploaded and processed!");
  }, []);

  const field = (label: string, key: keyof typeof form, type = "text", multiline = false) => (
    <div>
      <label className="text-xs font-medium text-foreground block mb-1">{label}</label>
      {multiline ? (
        <textarea className="w-full border rounded-lg px-3 py-1.5 text-xs bg-background h-16 resize-none" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      ) : (
        <input type={type} className="w-full border rounded-lg px-3 py-1.5 text-xs bg-background" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      )}
    </div>
  );

  // Render chat panel (shared between create tab and coauthor tab)
  const renderChatPanel = (fullSize: boolean) => (
    <div className={`bg-card border rounded-xl flex flex-col ${fullSize ? "h-[600px]" : "h-[520px]"}`}>
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2" title="Your AI Contract CoAuthor to write contracts faster and smarter">
          <Bot className="w-4 h-4 text-secondary" />
          <span className={`font-semibold ${fullSize ? "text-sm" : "text-xs"}`}>Talk to Contract Agent – Your CoAuthor</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCoAuthorMode(coAuthorMode === "freeform" ? "guided" : "freeform")} className={`flex items-center gap-1 ${fullSize ? "text-xs" : "text-[10px]"} font-medium text-muted-foreground hover:text-foreground`} title="Toggle mode">
            {coAuthorMode === "guided" ? <ToggleRight className="w-3.5 h-3.5 text-secondary" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            {coAuthorMode === "guided" ? "Guided" : "Freeform"}
          </button>
          <button onClick={() => setOutlineOpen(true)} className="text-muted-foreground hover:text-foreground" title="Outline">
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-2 flex flex-wrap gap-1 border-b">
        {quickPrompts.map(p => (
          <button key={p} onClick={() => handleCoAuthorSend(p)} className={`${fullSize ? "text-xs px-2.5 py-1" : "text-[10px] px-2 py-0.5"} rounded-full bg-accent text-accent-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors`}>
            {p}
          </button>
        ))}
      </div>

      {coAuthorMode === "guided" && (
        <div className="px-3 py-2 bg-accent/50 border-b space-y-2">
          <div className="flex items-center justify-between">
            <span className={`${fullSize ? "text-xs" : "text-[10px]"} text-accent-foreground font-medium`}>
              <Zap className="w-3 h-3 inline mr-1" />
              Guided Interview — Step {Math.min(guidedStepIndex + 1, guidedSteps.length)} of {guidedSteps.length}
            </span>
            <button onClick={handleGuidedNext} className={`${fullSize ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5"} bg-secondary text-secondary-foreground rounded font-medium`}>
              {guidedStepIndex === 0 ? "Start" : "Next Step"}
            </button>
          </div>
          {guidedStepIndex > 0 && guidedStepIndex <= guidedSteps.length && (
            <div className="flex items-center gap-1.5">
              <input
                className={`flex-1 border rounded-lg px-2 py-1 ${fullSize ? "text-xs" : "text-[10px]"} bg-background`}
                placeholder="Type your own answer or edit the sample..."
                value={guidedUserInput}
                onChange={e => setGuidedUserInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && guidedUserInput.trim()) handleGuidedUserSubmit(); }}
              />
              <button
                onClick={handleGuidedUserSubmit}
                disabled={!guidedUserInput.trim()}
                className={`${fullSize ? "text-xs px-2 py-1" : "text-[10px] px-1.5 py-0.5"} bg-primary text-primary-foreground rounded font-medium disabled:opacity-50`}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {chatMessages.length === 0 && !loading && (
          <p className={`${fullSize ? "text-sm" : "text-[10px]"} text-muted-foreground text-center mt-6`}>Ask the CoAuthor to help draft your contract…</p>
        )}
        {chatMessages.map(m => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[${fullSize ? "85" : "90"}%]`}>
              <div className={`rounded-lg px-3 py-2 ${fullSize ? "text-sm" : "text-xs"} ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                <pre className={`whitespace-pre-wrap font-sans ${fullSize ? "text-sm" : "text-xs"}`}>{m.text}</pre>
              </div>
              {m.citations && <CitationChips citations={m.citations} onJumpToSection={handleJumpToSection} />}
              {m.actions?.filter(a => a.type === "update_section" && a.oldText).map((a, i) => (
                <SuggestionDiffCard key={i} action={a} onApply={() => handleApplyAction(a)} onReject={() => toast.info("Change rejected")} />
              ))}
            </div>
          </div>
        ))}
        {/* Human-in-the-loop buttons */}
        {pendingUpdate && (
          <div className="flex gap-2 justify-center py-2">
            <button onClick={() => handleUserConfirmation(true)} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90">
              ✅ Yes, update document
            </button>
            <button onClick={() => handleUserConfirmation(false)} className="px-4 py-1.5 border rounded-lg text-xs font-medium hover:bg-muted">
              ❌ No, skip
            </button>
          </div>
        )}
        {/* Guided generation HITL */}
        {pendingGuidedGeneration && !pendingUpdate && (
          <div className="flex gap-2 justify-center py-2">
            <button onClick={async () => {
              setPendingGuidedGeneration(false);
              await handleCoAuthorSend("Draft full contract from inputs");
            }} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90">
              ✅ Yes, generate contract
            </button>
            <button onClick={() => {
              setPendingGuidedGeneration(false);
              const draftId = savedDraftId || "draft-coauthor";
              const skipMsg: CoAuthorMessage = {
                id: `guided-skip-${Date.now()}`, draftId, role: "assistant",
                text: "⏭️ No problem — I'll skip generation for now. You can always click **\"Draft full contract from inputs\"** when you're ready.",
                time: new Date().toISOString(),
              };
              setChatMessages(prev => {
                const updated = [...prev, skipMsg];
                set("oci_coauthor_messages", updated);
                return updated;
              });
            }} className="px-4 py-1.5 border rounded-lg text-xs font-medium hover:bg-muted">
              ❌ No, skip
            </button>
          </div>
        )}
        {loading && <div className="flex justify-start"><div className={`bg-muted rounded-lg px-3 py-2 ${fullSize ? "text-sm" : "text-xs"} animate-pulse`}>Thinking...</div></div>}
        <div ref={chatBottomRef} />
      </div>

      <div className="p-2 border-t flex gap-1.5">
        <button onClick={() => setClauseDialogOpen(true)} className="p-1.5 border rounded-lg hover:bg-muted" title="Insert from Library">
          <Library className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <input
          className={`flex-1 border rounded-lg px-3 py-1.5 ${fullSize ? "text-sm" : "text-xs"} bg-background`}
          placeholder="Ask agent or use /commands…"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCoAuthorSend()}
        />
        <button onClick={() => handleCoAuthorSend()} className="bg-secondary text-secondary-foreground p-1.5 rounded-lg hover:opacity-90">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      <h1 className="page-header">Contract Creation</h1>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "border-secondary text-secondary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: Contract Creation ═══ */}
      {activeTab === "create" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Form */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold">Contract Details</h3>
              {field("Contract Name", "name")}
              {field("Parties", "parties")}
              <div className="grid grid-cols-2 gap-3">
                {field("Effective Date (mm/dd/yyyy)", "effectiveDate", "date")}
                {field("Term", "term")}
              </div>
              {field("Payment / Rate Section", "paymentRate", "text", true)}
              {field("Services Scope", "servicesScope", "text", true)}
              <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium text-xs hover:opacity-90">
                Save Draft & Generate Document
              </button>
            </div>

            {/* Right: Checklist */}
            <div className="space-y-4">
              <DraftChecklistPanel items={checklist} />
              {generatedDoc && (
                <div className="bg-card border rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Draft Outline</h4>
                  <div className="space-y-1">
                    {generatedDoc.sections.map((sec, i) => (
                      <button
                        key={sec.id}
                        onClick={() => handleJumpToSection(sec.headingNumber)}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-muted/50 flex justify-between"
                      >
                        <span className="text-foreground">{sec.headingNumber} {sec.title}</span>
                        <span className="text-muted-foreground">Pg {Math.max(1, Math.ceil((i + 1) * 1.8))}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generated Document Preview */}
          {generatedDoc && showDocPreview && (
            <ContractDocumentPreview
              document={generatedDoc}
              onRegenerate={handleRegenerate}
              onSendToRedlining={handleSendToRedlining}
              onUpdateSections={handleUpdateSections}
              onClose={() => setShowDocPreview(false)}
            />
          )}
        </>
      )}

      {/* ═══ TAB: Upload Contract ═══ */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          {uploadPhase === "idle" && (
            <div
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f.name); }}
              onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed rounded-xl p-16 text-center hover:border-secondary transition-colors cursor-pointer bg-card"
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Drag & drop your contract here</p>
              <p className="text-sm text-muted-foreground mb-4">Supports PDF, DOCX files</p>
              <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 font-medium text-sm">
                Browse Files
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f.name); }} />
              </label>
            </div>
          )}
          {uploadPhase !== "idle" && (
            <div className="bg-card border rounded-xl p-8 space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-secondary" />
                <span className="font-medium">{uploadFileName}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-secondary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
              {uploadPhase === "completed" && (
                <div className="bg-accent border border-secondary/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-accent-foreground">
                    ✅ Processing complete! Navigate to{" "}
                    <button onClick={() => navigate("/deviation")} className="text-secondary underline font-semibold">Contract Deviation</button>
                    {" "}for analysis.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: Bulk Upload ═══ */}
      {activeTab === "bulk" && (
        <BulkUploadTab onNavigate={navigate} />
      )}

      {/* ═══ TAB: Start from Provider Intake ═══ */}
      {activeTab === "intake" && (
        <IntakeCredentialingTab onNavigate={navigate} />
      )}

      {/* ═══ TAB: Full CoAuthor (standalone) ═══ */}
      {activeTab === "coauthor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {renderChatPanel(true)}
          </div>

          <div className="space-y-4">
            <DraftChecklistPanel items={checklist} />
            {generatedDoc && (
              <div className="bg-card border rounded-lg p-3">
                <h4 className="text-xs font-semibold text-foreground mb-2">Draft Outline</h4>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {generatedDoc.sections.map((sec, i) => (
                    <button key={sec.id} onClick={() => handleJumpToSection(sec.headingNumber)} className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-muted/50 flex justify-between">
                      <span className="text-foreground">{sec.headingNumber} {sec.title}</span>
                      <span className="text-muted-foreground">Pg {Math.max(1, Math.ceil((i + 1) * 1.8))}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Document preview below */}
          {generatedDoc && showDocPreview && (
            <div className="lg:col-span-3">
              <ContractDocumentPreview
                document={generatedDoc}
                onRegenerate={handleRegenerate}
                onSendToRedlining={handleSendToRedlining}
                onUpdateSections={handleUpdateSections}
                onClose={() => setShowDocPreview(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ClauseInsertDialog open={clauseDialogOpen} onClose={() => setClauseDialogOpen(false)} onInsert={handleInsertFromLibrary} />
      <OutlineDrawer open={outlineOpen} onClose={() => setOutlineOpen(false)} document={generatedDoc} onJumpToSection={handleJumpToSection} />
    </div>
  );
}
