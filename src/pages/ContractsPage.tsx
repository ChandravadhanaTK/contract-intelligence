import { useState } from "react";
import {
  FileText, Search, ChevronRight, Calendar, Building2, User,
  CheckCircle2, Clock, AlertTriangle, Eye, Shield, Scale,
  Hash, MapPin, Tag, Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─── seed data ─── */
type ContractPhase =
  | "Intake"
  | "Credentialing"
  | "Drafting"
  | "Review"
  | "Negotiation"
  | "Executed"
  | "Monitoring";

interface ExtractedClause {
  id: string;
  name: string;
  article: string;
  risk: "low" | "medium" | "high";
  text: string;
  startLine: number;
  endLine: number;
}

interface Obligation {
  id: string;
  title: string;
  clause: string;
  dueDate: string;
  status: "pending" | "compliant" | "overdue";
  description: string;
}

interface Contract {
  id: string;
  name: string;
  provider: string;
  type: string;
  phase: ContractPhase;
  effectiveDate: string;
  expirationDate: string;
  state: string;
  tin: string;
  lob: string;
  totalValue: string;
  clauses: ExtractedClause[];
  obligations: Obligation[];
  documentSections: { title: string; content: string }[];
}

const CONTRACTS: Contract[] = [
  {
    id: "CTR-2024-0012",
    name: "Northeast Regional Hospital Network Agreement",
    provider: "Northwell Health Systems",
    type: "Facility",
    phase: "Executed",
    effectiveDate: "2024-01-01",
    expirationDate: "2026-12-31",
    state: "NY",
    tin: "11-2345678",
    lob: "Medicare Advantage",
    totalValue: "$14.2M",
    clauses: [
      { id: "cl1", name: "Payment Terms", article: "Article IV", risk: "low", text: "Provider shall be reimbursed at 120% of the applicable Medicare Fee Schedule for all covered services rendered to Members. Payment shall be made within thirty (30) calendar days of receipt of a clean claim.", startLine: 1, endLine: 3 },
      { id: "cl2", name: "Termination Without Cause", article: "Article XII", risk: "high", text: "Either party may terminate this Agreement without cause upon ninety (90) days prior written notice to the other party. Upon termination, Provider shall continue to render services to Members who are hospitalized at the time of termination until discharge.", startLine: 4, endLine: 6 },
      { id: "cl3", name: "Medical Records Access", article: "Article VII", risk: "medium", text: "Provider shall maintain medical records for each Member in accordance with applicable state and federal laws. Health Plan shall have the right to access and audit such records upon reasonable notice.", startLine: 7, endLine: 9 },
      { id: "cl4", name: "Credentialing Requirements", article: "Article III", risk: "low", text: "Provider shall maintain all required licenses, certifications and accreditations throughout the term of this Agreement. Provider shall notify Health Plan within ten (10) business days of any adverse action.", startLine: 10, endLine: 12 },
      { id: "cl5", name: "Hold Harmless", article: "Article IX", risk: "high", text: "Provider agrees to hold Members harmless for covered services in the event of Health Plan insolvency or non-payment. Provider shall not bill, charge, or collect from Members for covered services.", startLine: 13, endLine: 15 },
    ],
    obligations: [
      { id: "ob1", title: "Submit quarterly quality metrics", clause: "Article VI §3", dueDate: "2025-03-31", status: "pending", description: "Provider must submit HEDIS quality metrics including readmission rates and patient satisfaction scores." },
      { id: "ob2", title: "Annual credentialing renewal", clause: "Article III §2", dueDate: "2025-01-15", status: "compliant", description: "All practitioners must complete re-credentialing per NCQA standards." },
      { id: "ob3", title: "Claims submission within 90 days", clause: "Article IV §5", dueDate: "Ongoing", status: "compliant", description: "Provider must submit claims within 90 days of date of service." },
      { id: "ob4", title: "Update fee schedule acknowledgement", clause: "Article IV §1", dueDate: "2025-02-01", status: "overdue", description: "Provider must sign updated fee schedule addendum reflecting CY2025 rates." },
    ],
    documentSections: [
      { title: "RECITALS", content: "WHEREAS, Health Plan is a managed care organization licensed to operate in the State of New York; and WHEREAS, Provider is a licensed healthcare facility duly organized and operating under the laws of the State of New York; and WHEREAS, the parties desire to enter into this Agreement for Provider to render Covered Services to Members..." },
      { title: "ARTICLE I — DEFINITIONS", content: "1.1 \"Clean Claim\" means a claim submitted with all required data elements.\n1.2 \"Covered Services\" means medically necessary services.\n1.3 \"Member\" means an individual enrolled in Health Plan.\n1.4 \"Medical Record\" means the complete medical documentation.\n1.5 \"Fee Schedule\" means Exhibit A attached hereto." },
      { title: "ARTICLE II — TERM", content: "2.1 This Agreement shall be effective January 1, 2024 through December 31, 2026.\n2.2 This Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least ninety (90) days prior to expiration." },
      { title: "ARTICLE III — CREDENTIALING", content: "3.1 Provider shall ensure all practitioners are credentialed per NCQA standards.\n3.2 Provider shall notify Health Plan within ten (10) business days of any adverse action against any practitioner.\n3.3 Provider shall maintain all required state and federal licenses." },
      { title: "ARTICLE IV — COMPENSATION", content: "4.1 Health Plan shall reimburse Provider at 120% of Medicare Fee Schedule (Exhibit A).\n4.2 DRG-based payments apply to inpatient services.\n4.3 OPPS methodology applies to outpatient services.\n4.4 Payment within thirty (30) calendar days of clean claim receipt.\n4.5 Claims must be submitted within ninety (90) days of date of service." },
      { title: "ARTICLE VII — MEDICAL RECORDS", content: "7.1 Provider shall maintain records per applicable law.\n7.2 Health Plan has right to access and audit records upon reasonable notice.\n7.3 Records shall be retained for a minimum of ten (10) years." },
      { title: "ARTICLE IX — HOLD HARMLESS", content: "9.1 Provider shall hold Members harmless for covered services.\n9.2 Provider shall not balance-bill Members.\n9.3 This provision survives termination of this Agreement." },
      { title: "ARTICLE XII — TERMINATION", content: "12.1 Either party may terminate without cause upon ninety (90) days written notice.\n12.2 Health Plan may terminate immediately for cause including loss of license or exclusion from federal programs.\n12.3 Provider shall continue treating hospitalized Members through discharge upon termination." },
    ],
  },
  {
    id: "CTR-2024-0034",
    name: "Midwest Primary Care Physician Group",
    provider: "Heartland Medical Associates",
    type: "Professional",
    phase: "Review",
    effectiveDate: "2024-06-01",
    expirationDate: "2027-05-31",
    state: "OH",
    tin: "34-9876543",
    lob: "Commercial",
    totalValue: "$3.8M",
    clauses: [
      { id: "cl6", name: "Fee Schedule", article: "Article IV", risk: "medium", text: "Provider shall be compensated in accordance with the fee schedule attached as Exhibit A. Rates are subject to annual adjustment based on CPI-Medical index.", startLine: 1, endLine: 2 },
      { id: "cl7", name: "Non-Compete", article: "Article XI", risk: "high", text: "During the term and for twelve (12) months thereafter, Provider shall not directly contract with any entity to provide services that would undermine the network adequacy of Health Plan in the designated service area.", startLine: 3, endLine: 5 },
      { id: "cl8", name: "Quality Metrics", article: "Article VI", risk: "low", text: "Provider shall participate in Health Plan quality improvement programs and report HEDIS measures as required.", startLine: 6, endLine: 7 },
    ],
    obligations: [
      { id: "ob5", title: "Complete peer review participation", clause: "Article VI §4", dueDate: "2025-04-15", status: "pending", description: "Provider must participate in annual peer review and quality committee meetings." },
      { id: "ob6", title: "Submit encounter data monthly", clause: "Article V §2", dueDate: "Ongoing", status: "compliant", description: "All encounter data must be submitted electronically by the 15th of each month." },
    ],
    documentSections: [
      { title: "RECITALS", content: "WHEREAS, Health Plan operates a managed care network in the State of Ohio; and WHEREAS, Provider is a physician group practice organized under Ohio law..." },
      { title: "ARTICLE I — DEFINITIONS", content: "1.1 \"Provider\" means Heartland Medical Associates and its employed physicians.\n1.2 \"Service Area\" means the six-county region defined in Exhibit B." },
      { title: "ARTICLE IV — COMPENSATION", content: "4.1 Compensation per Exhibit A fee schedule.\n4.2 Annual CPI-Medical adjustment.\n4.3 Value-based incentive bonus up to 10% for quality targets." },
      { title: "ARTICLE VI — QUALITY", content: "6.1 Provider participates in QI programs.\n6.2 HEDIS reporting required.\n6.3 Patient satisfaction surveys quarterly.\n6.4 Peer review participation required." },
      { title: "ARTICLE XI — RESTRICTIVE COVENANTS", content: "11.1 Non-compete applies during term plus twelve (12) months.\n11.2 Geographic restriction: designated service area.\n11.3 Remedies include injunctive relief." },
    ],
  },
  {
    id: "CTR-2025-0003",
    name: "Pacific Coast Behavioral Health Services",
    provider: "Summit Behavioral Health Group",
    type: "Specialty",
    phase: "Negotiation",
    effectiveDate: "2025-04-01",
    expirationDate: "2028-03-31",
    state: "CA",
    tin: "95-1234567",
    lob: "Medicaid",
    totalValue: "$6.1M",
    clauses: [
      { id: "cl9", name: "Telehealth Provisions", article: "Article V", risk: "low", text: "Provider may render covered behavioral health services via telehealth modalities in accordance with California state regulations and Health Plan telehealth policies.", startLine: 1, endLine: 2 },
      { id: "cl10", name: "Rate Escalator", article: "Article IV", risk: "medium", text: "Rates shall increase by 3% annually on each contract anniversary date, subject to Health Plan's annual rate review and state regulatory approval.", startLine: 3, endLine: 4 },
      { id: "cl11", name: "Data Privacy & HIPAA", article: "Article VIII", risk: "high", text: "Provider shall comply with all HIPAA Privacy and Security Rules. Any breach of PHI must be reported to Health Plan within twenty-four (24) hours of discovery. Provider shall maintain cyber liability insurance of no less than $5M.", startLine: 5, endLine: 7 },
    ],
    obligations: [
      { id: "ob7", title: "HIPAA compliance attestation", clause: "Article VIII §1", dueDate: "2025-06-01", status: "pending", description: "Annual attestation of HIPAA compliance with evidence of staff training." },
      { id: "ob8", title: "Telehealth platform certification", clause: "Article V §3", dueDate: "2025-04-01", status: "pending", description: "Platform must meet state certification requirements before go-live." },
    ],
    documentSections: [
      { title: "RECITALS", content: "WHEREAS, Health Plan administers Medicaid managed care in California; and WHEREAS, Provider specializes in behavioral health services including substance abuse treatment..." },
      { title: "ARTICLE IV — COMPENSATION", content: "4.1 Base rates per Exhibit A.\n4.2 3% annual escalator on anniversary date.\n4.3 Subject to state regulatory approval.\n4.4 Separate rates for intensive outpatient programs." },
      { title: "ARTICLE V — TELEHEALTH", content: "5.1 Telehealth services permitted per CA regulations.\n5.2 Same reimbursement as in-person visits.\n5.3 Platform must meet state certification.\n5.4 Patient consent required for telehealth visits." },
      { title: "ARTICLE VIII — PRIVACY & SECURITY", content: "8.1 Full HIPAA compliance required.\n8.2 Breach notification within 24 hours.\n8.3 Cyber liability insurance ≥ $5M.\n8.4 Annual security risk assessment.\n8.5 Business Associate Agreement incorporated by reference." },
    ],
  },
  {
    id: "CTR-2024-0051",
    name: "Southeast Imaging & Diagnostics Network",
    provider: "Pacific Coast Imaging Partners",
    type: "Ancillary",
    phase: "Drafting",
    effectiveDate: "2025-01-01",
    expirationDate: "2027-12-31",
    state: "FL",
    tin: "59-8765432",
    lob: "Medicare Advantage",
    totalValue: "$2.4M",
    clauses: [
      { id: "cl12", name: "Prior Authorization", article: "Article V", risk: "medium", text: "All advanced imaging services (MRI, CT, PET) require prior authorization from Health Plan. Emergency imaging is exempt from prior authorization requirements.", startLine: 1, endLine: 2 },
      { id: "cl13", name: "Equipment Standards", article: "Article III", risk: "low", text: "Provider shall maintain ACR accreditation for all imaging modalities. Equipment must meet manufacturer specifications and undergo annual calibration.", startLine: 3, endLine: 4 },
    ],
    obligations: [
      { id: "ob9", title: "ACR accreditation renewal", clause: "Article III §2", dueDate: "2025-09-01", status: "pending", description: "Submit proof of renewed ACR accreditation for all imaging equipment." },
      { id: "ob10", title: "Turnaround time reporting", clause: "Article VI §1", dueDate: "Ongoing", status: "compliant", description: "Report read turnaround times monthly — target < 24 hours for routine, < 2 hours for STAT." },
    ],
    documentSections: [
      { title: "RECITALS", content: "WHEREAS, Health Plan seeks to contract with qualified imaging providers in the State of Florida..." },
      { title: "ARTICLE III — STANDARDS", content: "3.1 ACR accreditation required.\n3.2 Annual equipment calibration.\n3.3 Radiologist board certification required.\n3.4 Quality assurance program maintained." },
      { title: "ARTICLE V — UTILIZATION", content: "5.1 Prior authorization for advanced imaging.\n5.2 Emergency imaging exempt.\n5.3 Peer-to-peer review available for denials.\n5.4 Retrospective review for emergency cases within 5 business days." },
    ],
  },
];

const phaseConfig: Record<ContractPhase, { color: string; icon: typeof Clock }> = {
  Intake: { color: "bg-muted text-muted-foreground", icon: Clock },
  Credentialing: { color: "bg-blue-100 text-blue-700", icon: Shield },
  Drafting: { color: "bg-amber-100 text-amber-700", icon: FileText },
  Review: { color: "bg-purple-100 text-purple-700", icon: Eye },
  Negotiation: { color: "bg-orange-100 text-orange-700", icon: Scale },
  Executed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  Monitoring: { color: "bg-cyan-100 text-cyan-700", icon: AlertTriangle },
};

const riskColors = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

const obligationStatusColors = {
  compliant: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

export default function ContractsPage() {
  const [selectedId, setSelectedId] = useState(CONTRACTS[0].id);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("document");
  const [highlightClause, setHighlightClause] = useState<string | null>(null);

  const filtered = CONTRACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.provider.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );
  const selected = CONTRACTS.find((c) => c.id === selectedId) ?? CONTRACTS[0];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Left Pane: Contract List ── */}
      <div className="w-[340px] flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Contracts
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filtered.map((c) => {
              const phase = phaseConfig[c.phase];
              const isActive = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setHighlightClause(null); }}
                  className={`w-full text-left rounded-lg p-3 transition-all group ${
                    isActive
                      ? "bg-primary/10 border border-primary/30 shadow-sm"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${phase.color} border-0`}>
                      {c.phase}
                    </Badge>
                  </div>
                  <p className={`text-sm font-semibold leading-tight mb-1 ${isActive ? "text-primary" : "text-foreground"}`}>
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{c.provider}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{c.type}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.state}</span>
                    <span className="ml-auto font-medium">{c.totalValue}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
          {filtered.length} of {CONTRACTS.length} contracts
        </div>
      </div>

      {/* ── Right Pane: Contract Detail ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header */}
        <div className="p-5 border-b border-border bg-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{selected.id}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <Badge variant="outline" className={`${phaseConfig[selected.phase].color} border-0 text-xs`}>
                  {selected.phase}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-foreground">{selected.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{selected.provider}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-primary">{selected.totalValue}</p>
              <p className="text-xs text-muted-foreground">Total Contract Value</p>
            </div>
          </div>

          {/* Metadata chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { icon: Building2, label: selected.type },
              { icon: MapPin, label: selected.state },
              { icon: Hash, label: `TIN: ${selected.tin}` },
              { icon: Layers, label: selected.lob },
              { icon: Calendar, label: `${selected.effectiveDate} → ${selected.expirationDate}` },
            ].map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md text-xs text-muted-foreground">
                <m.icon className="w-3 h-3" />
                {m.label}
              </span>
            ))}
          </div>

          {/* Summary pills */}
          <div className="flex gap-4 mt-4">
            <button onClick={() => setActiveTab("clauses")} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              {selected.clauses.length} Clauses Extracted
            </button>
            <button onClick={() => setActiveTab("obligations")} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors">
              <Shield className="w-3.5 h-3.5" />
              {selected.obligations.length} Obligations
            </button>
            {selected.obligations.some(o => o.status === "overdue") && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {selected.obligations.filter(o => o.status === "overdue").length} Overdue
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 border-b border-border bg-card">
            <TabsList className="bg-transparent p-0 h-auto gap-0">
              {[
                { value: "document", label: "Contract Document", icon: FileText },
                { value: "clauses", label: "Clause Extraction", icon: Scale },
                { value: "obligations", label: "Obligation Extraction", icon: Shield },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-sm gap-1.5"
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            {/* ── Document Tab ── */}
            <TabsContent value="document" className="p-5 m-0 space-y-4">
              {selected.documentSections.map((section, idx) => {
                const isHighlighted = highlightClause && selected.clauses.some(
                  (cl) => section.title.toLowerCase().includes(cl.article.split("—")[0].trim().toLowerCase().replace("article ", "")) && cl.id === highlightClause
                );
                return (
                  <div
                    key={idx}
                    id={`section-${idx}`}
                    className={`rounded-lg border p-4 transition-all ${
                      isHighlighted
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card"
                    }`}
                  >
                    <h3 className="text-sm font-bold text-foreground mb-2">{section.title}</h3>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {section.content}
                    </pre>
                  </div>
                );
              })}
            </TabsContent>

            {/* ── Clauses Tab ── */}
            <TabsContent value="clauses" className="p-5 m-0 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-bold text-foreground">Extracted Clauses</h3>
                <div className="flex gap-2 ml-auto">
                  {(["low", "medium", "high"] as const).map((r) => (
                    <span key={r} className={`text-[10px] px-2 py-0.5 rounded-full border ${riskColors[r]}`}>
                      {r}: {selected.clauses.filter((c) => c.risk === r).length}
                    </span>
                  ))}
                </div>
              </div>
              {selected.clauses.map((clause) => (
                <button
                  key={clause.id}
                  onClick={() => { setHighlightClause(clause.id); setActiveTab("document"); }}
                  className={`w-full text-left rounded-lg border p-4 transition-all hover:shadow-md group ${
                    highlightClause === clause.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs text-muted-foreground">{clause.article}</span>
                      <p className="text-sm font-semibold text-foreground">{clause.name}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] border ${riskColors[clause.risk]}`}>
                      {clause.risk} risk
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{clause.text}</p>
                  <p className="text-[11px] text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View in document
                  </p>
                </button>
              ))}
            </TabsContent>

            {/* ── Obligations Tab ── */}
            <TabsContent value="obligations" className="p-5 m-0 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-bold text-foreground">Extracted Obligations</h3>
                <div className="flex gap-2 ml-auto">
                  {(["compliant", "pending", "overdue"] as const).map((s) => (
                    <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full ${obligationStatusColors[s]}`}>
                      {s}: {selected.obligations.filter((o) => o.status === s).length}
                    </span>
                  ))}
                </div>
              </div>
              {selected.obligations.map((ob) => (
                <div key={ob.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ob.title}</p>
                      <span className="text-xs text-muted-foreground">{ob.clause}</span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] border-0 ${obligationStatusColors[ob.status]}`}>
                      {ob.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ob.description}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Due: {ob.dueDate}
                  </div>
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
