import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { IntakeRequest } from "@/types";

const requiredDocs = ["W-9 Form", "State License", "DEA Certificate", "Malpractice Insurance", "CAQH Profile", "NPI Verification"];

const sampleIntakes: IntakeRequest[] = [
  {
    id: "intake-sample-1",
    providerName: "Northwell Health Medical Group",
    specialty: "Multi-Specialty",
    tin: "11-2345678",
    mpin: "MPN100201",
    locations: ["New York, NY", "Long Island, NY", "Westchester, NY"],
    products: ["Commercial HMO", "Medicare Advantage", "Medicaid Managed Care"],
    requestedEffectiveDate: "2026-07-01",
    contractType: "Facility",
    docs: ["W-9 Form", "State License", "DEA Certificate", "Malpractice Insurance", "CAQH Profile", "NPI Verification"],
    completenessScore: 100,
    triageStatus: "Ready for Credentialing",
    notes: "Large multi-site health system. Priority onboarding requested by regional VP.",
    createdAt: "2026-03-10T09:15:00Z",
  },
  {
    id: "intake-sample-2",
    providerName: "Dr. Maria Santos, MD – Cardiology",
    specialty: "Cardiology",
    tin: "22-9876543",
    mpin: "MPN100302",
    locations: ["Houston, TX"],
    products: ["Commercial PPO", "Medicare Advantage"],
    requestedEffectiveDate: "2026-06-01",
    contractType: "Specialty",
    docs: ["W-9 Form", "State License", "Malpractice Insurance", "NPI Verification"],
    completenessScore: 67,
    triageStatus: "Need more info",
    notes: "Missing DEA Certificate and CAQH Profile. Follow-up email sent 3/12.",
    createdAt: "2026-03-08T14:30:00Z",
  },
  {
    id: "intake-sample-3",
    providerName: "Summit Behavioral Health Associates",
    specialty: "Behavioral Health",
    tin: "33-4567890",
    mpin: "MPN100403",
    locations: ["Denver, CO", "Boulder, CO"],
    products: ["Commercial HMO", "Medicaid Managed Care"],
    requestedEffectiveDate: "2026-08-01",
    contractType: "Standard",
    docs: ["W-9 Form", "State License", "DEA Certificate"],
    completenessScore: 50,
    triageStatus: "New",
    notes: "New behavioral health group expanding into CO market. Requires parity compliance review.",
    createdAt: "2026-03-15T11:00:00Z",
  },
  {
    id: "intake-sample-4",
    providerName: "Pacific Coast Imaging Centers",
    specialty: "Radiology",
    tin: "44-1122334",
    mpin: "MPN100504",
    locations: ["San Diego, CA", "Los Angeles, CA", "San Francisco, CA"],
    products: ["Commercial PPO", "Commercial HMO", "Medicare Advantage"],
    requestedEffectiveDate: "2026-05-15",
    contractType: "Ancillary",
    docs: ["W-9 Form", "State License", "DEA Certificate", "Malpractice Insurance", "CAQH Profile"],
    completenessScore: 83,
    triageStatus: "Ready for Drafting",
    notes: "Multi-location imaging network. Fee schedule negotiation pending for advanced imaging (MRI/CT).",
    createdAt: "2026-03-05T08:45:00Z",
  },
];

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
function set(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

export default function IntakePage() {
  const navigate = useNavigate();
  const [intakes, setIntakes] = useState<IntakeRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ providerName: "", specialty: "", tin: "", mpin: "", locations: "", products: "", requestedEffectiveDate: "", contractType: "Standard", docs: "" as string, notes: "" });

  useEffect(() => { setIntakes(get("oci_intakes", sampleIntakes)); }, []);

  const handleCreate = () => {
    const docsList = form.docs ? form.docs.split(",").map(s => s.trim()) : [];
    const missing = requiredDocs.filter(d => !docsList.some(ud => ud.toLowerCase().includes(d.toLowerCase())));
    const score = Math.round(((requiredDocs.length - missing.length) / requiredDocs.length) * 100);

    const req: IntakeRequest = {
      id: `intake-${Date.now()}`,
      providerName: form.providerName,
      specialty: form.specialty,
      tin: form.tin,
      mpin: form.mpin || `MPN${100000 + Math.floor(Date.now() % 10000)}`,
      locations: form.locations.split(",").map(s => s.trim()).filter(Boolean),
      products: form.products.split(",").map(s => s.trim()).filter(Boolean),
      requestedEffectiveDate: form.requestedEffectiveDate,
      contractType: form.contractType,
      docs: docsList,
      completenessScore: score,
      triageStatus: "New",
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    const updated = [...intakes, req];
    setIntakes(updated);
    set("oci_intakes", updated);
    setShowForm(false);
    setForm({ providerName: "", specialty: "", tin: "", mpin: "", locations: "", products: "", requestedEffectiveDate: "", contractType: "Standard", docs: "", notes: "" });
    toast.success("Intake request created");
  };

  const updateTriage = (id: string, status: IntakeRequest["triageStatus"]) => {
    const updated = intakes.map(i => i.id === id ? { ...i, triageStatus: status } : i);
    setIntakes(updated);
    set("oci_intakes", updated);
    if (status === "Ready for Credentialing") {
      toast.success("Sent to Credentialing");
    } else {
      toast.info(`Status updated to ${status}`);
    }
  };

  const deleteIntake = (id: string) => {
    const updated = intakes.filter(i => i.id !== id);
    setIntakes(updated);
    set("oci_intakes", updated);
  };

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <input type={type} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Provider Intake & Triage</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> New Intake Request
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm">New Provider Intake</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {field("Provider Name", "providerName")}
            {field("Specialty", "specialty")}
            {field("TIN", "tin")}
            {field("MPIN", "mpin")}
            {field("Locations (comma-separated)", "locations")}
            {field("Products (comma-separated)", "products")}
            {field("Requested Effective Date", "requestedEffectiveDate", "date")}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Contract Type</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })}>
                <option>Standard</option><option>Specialty</option><option>Ancillary</option><option>Facility</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Uploaded Documents (comma-separated names)</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="W-9 Form, State License, ..." value={form.docs} onChange={e => setForm({ ...form, docs: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background h-16 resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleCreate} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Create Intake Request</button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {intakes.length === 0 && <p className="text-sm text-muted-foreground">No intake requests yet.</p>}
        {intakes.map(intake => {
          const missingDocs = requiredDocs.filter(d => !intake.docs.some(ud => ud.toLowerCase().includes(d.toLowerCase())));
          return (
            <div key={intake.id} className="bg-card border rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{intake.providerName}</span>
                    <span className="status-chip status-chip-info">{intake.specialty}</span>
                    <span className={`status-chip ${intake.triageStatus === "Ready for Credentialing" ? "status-chip-success" : intake.triageStatus === "Need more info" ? "status-chip-warning" : intake.triageStatus === "Ready for Drafting" ? "status-chip-info" : "bg-muted text-muted-foreground"}`}>
                      {intake.triageStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mb-3">
                    <span>TIN: {intake.tin}</span>
                    <span>MPIN: {intake.mpin}</span>
                    <span>Type: {intake.contractType}</span>
                    <span>Eff: {intake.requestedEffectiveDate}</span>
                  </div>

                  {/* Completeness */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="font-medium">Completeness: {intake.completenessScore}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full ${intake.completenessScore >= 80 ? "bg-success" : intake.completenessScore >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${intake.completenessScore}%` }} />
                    </div>
                  </div>

                  {missingDocs.length > 0 && (
                    <div className="bg-accent/50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-destructive mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Missing Documents:</p>
                      <div className="flex flex-wrap gap-1">
                        {missingDocs.map(d => <span key={d} className="status-chip status-chip-error text-[10px]">{d}</span>)}
                      </div>
                    </div>
                  )}

                  {missingDocs.length === 0 && (
                    <p className="text-xs text-success flex items-center gap-1 mb-3"><CheckCircle className="w-3 h-3" /> All required documents uploaded</p>
                  )}
                </div>
                <button onClick={() => deleteIntake(intake.id)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => updateTriage(intake.id, "Need more info")} className="px-3 py-1.5 border rounded-md text-xs font-medium hover:bg-muted">Need More Info</button>
                <button onClick={() => updateTriage(intake.id, "Ready for Credentialing")} className="px-3 py-1.5 bg-success text-success-foreground rounded-md text-xs font-medium hover:opacity-90 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Send to Credentialing
                </button>
                <button onClick={() => { updateTriage(intake.id, "Ready for Credentialing"); navigate("/credentialing"); }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90">
                  Open Credentialing
                </button>
                <button onClick={() => updateTriage(intake.id, "Ready for Drafting")} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:opacity-90">Ready for Drafting</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
