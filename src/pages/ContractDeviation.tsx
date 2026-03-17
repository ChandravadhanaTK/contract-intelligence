import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Target, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { KPIStatCard } from "@/components/KPIStatCard";
import { ClauseAccordionList } from "@/components/ClauseAccordionList";
import { TwoColumnCompare } from "@/components/TwoColumnCompare";
import { api } from "@/services/mockApi";
import type { Contract, Clause } from "@/types";

export default function ContractDeviation() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getContract().then(setContract);
  }, []);

  if (!contract) {
    return (
      <div className="page-container">
        <h1 className="page-header">Contract Deviation & Recommendations</h1>
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No contract uploaded yet. Please <button onClick={() => navigate("/upload")} className="text-secondary underline">upload a contract</button> first.</p>
        </div>
      </div>
    );
  }

  const aligned = contract.clauses.filter((c) => c.category === "aligned");
  const nonAligned = contract.clauses.filter((c) => c.category === "nonAligned");
  const missing = contract.clauses.filter((c) => c.category === "missing");
  const total = contract.clauses.length;
  const avgScore = (contract.clauses.reduce((s, c) => s + c.matchScore, 0) / total).toFixed(2);

  if (selectedClause) {
    return (
      <div className="page-container">
        <button onClick={() => setSelectedClause(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Deviations
        </button>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="page-header">{selectedClause.clauseName}</h1>
          <span className="status-chip status-chip-info">{selectedClause.articleName}</span>
          <span className={`status-chip ${selectedClause.category === "nonAligned" ? "status-chip-error" : selectedClause.category === "missing" ? "status-chip-warning" : "status-chip-success"}`}>
            Match Score: {selectedClause.matchScore}/5
          </span>
        </div>

        <TwoColumnCompare
          leftTitle="Standard Clause"
          rightTitle="Current Clause"
          leftText={selectedClause.standardText}
          rightText={selectedClause.currentText}
        />

        {selectedClause.deviationNotes.length > 0 && (
          <div className="bg-card border rounded-lg p-5 mt-4">
            <h3 className="font-semibold text-sm mb-3 text-destructive">Deviation</h3>
            <ul className="space-y-2">
              {selectedClause.deviationNotes.map((n, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedClause.recommendations.length > 0 && (
          <div className="bg-card border rounded-lg p-5 mt-4">
            <h3 className="font-semibold text-sm mb-3 text-success">Recommendation</h3>
            <ul className="space-y-2">
              {selectedClause.recommendations.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-header">Contract Deviation & Recommendations</h1>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span>Contract File Name: <strong className="text-foreground">{contract.name}</strong></span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard title="Overall Score" value={`${avgScore}/5`} icon={<Target className="w-5 h-5" />} />
        <KPIStatCard title="Total Aligned Clauses" value={`${aligned.length}/${total}`} variant="success" icon={<CheckCircle className="w-5 h-5" />} />
        <KPIStatCard title="Total Non-Aligned Clauses" value={`${nonAligned.length}/${total}`} variant="error" icon={<XCircle className="w-5 h-5" />} />
        <KPIStatCard title="Total Missing Clauses" value={`${missing.length}/${total}`} variant="warning" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      <div className="space-y-4">
        <ClauseAccordionList title="Missing Clauses" clauses={missing} color="red" onClauseClick={setSelectedClause} />
        <ClauseAccordionList title="Non-Aligned Clauses" clauses={nonAligned} color="yellow" onClauseClick={setSelectedClause} />
        <ClauseAccordionList title="Aligned Clauses" clauses={aligned} color="green" onClauseClick={setSelectedClause} />
      </div>
    </div>
  );
}
