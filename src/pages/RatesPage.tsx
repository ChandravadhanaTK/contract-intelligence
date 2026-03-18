import { useState, useEffect } from "react";
import { Filter, Download, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { RateTable, RateRow, Contract } from "@/types";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
function set(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

const seedRateTables: RateTable[] = [
  {
    id: "rt-001", contractId: "contract-001", documentId: "doc-002", tableName: "Table 1C – Professional Services", effectiveDate: "2025-01-01", method: "Medicare + CPI-U", confidence: 92,
    rows: [
      { id: "rr1", codeType: "CPT", code: "99213", description: "Office Visit – Level 3", baseRate: 125, multiplier: 1.1, escalator: 0.05, finalRate: 144.38, confidence: "High", flags: [] },
      { id: "rr2", codeType: "CPT", code: "99214", description: "Office Visit – Level 4", baseRate: 185, multiplier: 1.1, escalator: 0.05, finalRate: 213.68, confidence: "High", flags: [] },
      { id: "rr3", codeType: "CPT", code: "27447", description: "Total Knee Replacement", baseRate: 4500, multiplier: 1.0, escalator: 0.05, finalRate: 4725, confidence: "Medium", flags: ["Negotiated rate – outside standard methodology"] },
      { id: "rr4", codeType: "CPT", code: "80053", description: "Comprehensive Metabolic Panel", baseRate: 45, multiplier: 1.1, escalator: 0.05, finalRate: 51.98, confidence: "High", flags: [] },
      { id: "rr5", codeType: "CPT", code: "70553", description: "MRI Brain w/ & w/o Contrast", baseRate: 850, multiplier: 1.1, escalator: 0.05, finalRate: 981.75, confidence: "High", flags: [] },
      { id: "rr6", codeType: "CPT", code: "97110", description: "Physical Therapy – Therapeutic Exercise", baseRate: 95, multiplier: 1.1, escalator: 0.05, finalRate: 109.73, confidence: "High", flags: [] },
      { id: "rr7", codeType: "CPT", code: "99281", description: "Emergency Dept Visit – Level 1", baseRate: 1200, multiplier: 1.0, escalator: 0.05, finalRate: 1260, confidence: "Low", flags: ["Below market average", "Review recommended"] },
      { id: "rr8", codeType: "DRG", code: "470", description: "Major Hip/Knee Joint – w/o MCC", baseRate: 12500, multiplier: 1.0, escalator: 0.03, finalRate: 12875, confidence: "Medium", flags: ["DRG bundled rate"] },
    ],
  },
  {
    id: "rt-002", contractId: "contract-002", documentId: "doc-005", tableName: "Table 2A – Behavioral Health", effectiveDate: "2025-01-01", method: "Flat Rate + Annual", confidence: 88,
    rows: [
      { id: "rr9", codeType: "CPT", code: "90834", description: "Psychotherapy – 45 min", baseRate: 110, multiplier: 1.0, escalator: 0.03, finalRate: 113.30, confidence: "High", flags: [] },
      { id: "rr10", codeType: "CPT", code: "90837", description: "Psychotherapy – 60 min", baseRate: 150, multiplier: 1.0, escalator: 0.03, finalRate: 154.50, confidence: "High", flags: [] },
      { id: "rr11", codeType: "CPT", code: "90853", description: "Group Psychotherapy", baseRate: 55, multiplier: 1.0, escalator: 0.03, finalRate: 56.65, confidence: "High", flags: [] },
      { id: "rr12", codeType: "HCPCS", code: "H0004", description: "Behavioral Health Counseling", baseRate: 75, multiplier: 1.0, escalator: 0.0, finalRate: 75, confidence: "Medium", flags: ["No escalator applied"] },
    ],
  },
];

export default function RatesPage() {
  const [rateTables, setRateTables] = useState<RateTable[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [showModeling, setShowModeling] = useState(false);
  const [modelInputs, setModelInputs] = useState({ escalator: 5, years: 3, utilization: 100 });

  useEffect(() => {
    let stored = get<RateTable[]>("oci_rate_tables", []);
    if (stored.length === 0) { stored = seedRateTables; set("oci_rate_tables", stored); }
    setRateTables(stored);
    const c = get<Contract[]>("oci_contracts", []);
    setContracts(c);
    setSelectedContract(c[0]?.id || "");
  }, []);

  useEffect(() => {
    const tables = rateTables.filter(t => t.contractId === selectedContract);
    setSelectedTable(tables[0]?.id || "");
  }, [selectedContract, rateTables]);

  const table = rateTables.find(t => t.id === selectedTable);
  const contractTables = rateTables.filter(t => t.contractId === selectedContract);
  const filteredRows = table?.rows.filter(r => confidenceFilter === "all" || r.confidence === confidenceFilter) || [];

  const generatePayload = () => {
    if (!table) return;
    const payload = JSON.stringify(table.rows.map(r => ({ code: r.code, codeType: r.codeType, rate: r.finalRate, method: table.method })), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `load-ready-${table.tableName.replace(/\s/g, "_")}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // Rate modeling
  const escalator = modelInputs.escalator / 100;
  const totalBase = table?.rows.reduce((s, r) => s + r.finalRate, 0) || 0;
  const modelingData = Array.from({ length: modelInputs.years }, (_, i) => ({
    year: `Year ${i + 1}`,
    cost: Math.round(totalBase * Math.pow(1 + escalator, i + 1) * (modelInputs.utilization / 100)),
    baseline: Math.round(totalBase * (modelInputs.utilization / 100)),
  }));

  return (
    <div className="page-container">
      <h1 className="page-header">Rate / Fee Table Extraction</h1>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Contract</label>
          <select className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[300px]" value={selectedContract} onChange={e => setSelectedContract(e.target.value)}>
            {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Rate Table</label>
          <select className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[250px]" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
            {contractTables.map(t => <option key={t.id} value={t.id}>{t.tableName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Confidence</label>
          <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={confidenceFilter} onChange={e => setConfidenceFilter(e.target.value)}>
            <option value="all">All</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
        </div>
      </div>

      {table && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Confidence: {table.confidence}%</span>
              <span className="text-xs text-muted-foreground">Method: {table.method}</span>
              <span className="text-xs text-muted-foreground">Effective: {table.effectiveDate}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={generatePayload} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium">
                <Download className="w-3 h-3" /> Generate Load-Ready Payload
              </button>
              <button onClick={() => setShowModeling(!showModeling)} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-medium hover:bg-muted">
                <TrendingUp className="w-3 h-3" /> Rate Modeling
              </button>
            </div>
          </div>

          {/* Rate Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Base Rate</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Multiplier</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Escalator</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Final Rate</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Confidence</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(r => (
                    <tr key={r.id} className={`border-b ${r.flags.length > 0 ? "bg-destructive/5" : ""}`}>
                      <td className="px-4 py-2.5">{r.codeType}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.code}</td>
                      <td className="px-4 py-2.5">{r.description}</td>
                      <td className="px-4 py-2.5 text-right">${r.baseRate.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">{r.multiplier}x</td>
                      <td className="px-4 py-2.5 text-right">{(r.escalator * 100).toFixed(0)}%</td>
                      <td className="px-4 py-2.5 text-right font-semibold">${r.finalRate.toLocaleString()}</td>
                      <td className="px-4 py-2.5"><span className={`status-chip ${r.confidence === "High" ? "status-chip-success" : r.confidence === "Medium" ? "status-chip-warning" : "status-chip-error"}`}>{r.confidence}</span></td>
                      <td className="px-4 py-2.5">{r.flags.map((f, i) => <span key={i} className="status-chip status-chip-error text-[10px] mr-1">{f}</span>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rate Modeling */}
          {showModeling && (
            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-secondary" /> Rate Modeling</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Escalator (%)</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={modelInputs.escalator} onChange={e => setModelInputs({ ...modelInputs, escalator: +e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Projection Years</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={modelInputs.years} onChange={e => setModelInputs({ ...modelInputs, years: +e.target.value })} min={1} max={10} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Utilization (%)</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={modelInputs.utilization} onChange={e => setModelInputs({ ...modelInputs, utilization: +e.target.value })} />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={modelingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 88%)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="cost" name="Projected Cost" stroke="hsl(15 100% 58%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="baseline" name="Baseline" stroke="hsl(217 100% 23%)" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2">Total base cost per table: ${totalBase.toLocaleString()} · At {modelInputs.escalator}% annual escalation over {modelInputs.years} year(s), projected cost increases by ${(modelingData[modelingData.length - 1]?.cost - modelingData[0]?.baseline || 0).toLocaleString()}.</p>
            </div>
          )}
        </>
      )}
      {!table && <p className="text-sm text-muted-foreground text-center py-8">No rate tables found for this contract.</p>}
    </div>
  );
}
