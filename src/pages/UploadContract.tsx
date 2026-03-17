import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { ProgressStepper } from "@/components/ProgressStepper";
import { api } from "@/services/mockApi";
import { seedContract } from "@/data/seed";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Phase = "idle" | "uploading" | "identifying" | "matching" | "completed";

export default function UploadContract() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const steps = [
    { label: "Identifying Clauses", done: phase === "matching" || phase === "completed", active: phase === "identifying" },
    { label: "Matching with Standard Clauses", done: phase === "completed", active: phase === "matching" },
    { label: "Completed", done: phase === "completed", active: false },
  ];

  const handleUpload = useCallback(async (name: string) => {
    setFileName(name);
    setPhase("uploading");
    setProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 30; i += 5) {
      await new Promise((r) => setTimeout(r, 150));
      setProgress(i);
    }

    setPhase("identifying");
    for (let i = 30; i <= 60; i += 3) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress(i);
    }

    setPhase("matching");
    for (let i = 60; i <= 95; i += 3) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress(i);
    }

    setProgress(100);
    setPhase("completed");

    // Save contract
    await api.saveContract({ ...seedContract, name, uploadDate: new Date().toISOString().split("T")[0], status: "completed" });
    await api.addAuditEntry({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Contract Uploaded",
      detail: `${name} uploaded and processed`,
      actor: "Current User",
    });
    toast.success("Contract uploaded and processed successfully!");
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file.name);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file.name);
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Upload Contract</h1>

      {phase === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed rounded-xl p-16 text-center hover:border-secondary transition-colors cursor-pointer bg-card"
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Drag & drop your contract here</p>
          <p className="text-sm text-muted-foreground mb-4">Supports PDF, DOCX files</p>
          <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 transition-opacity font-medium text-sm">
            Browse Files
            <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileSelect} />
          </label>
        </div>
      )}

      {phase !== "idle" && (
        <div className="bg-card border rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-secondary" />
            <span className="font-medium">{fileName}</span>
            {phase === "completed" && <CheckCircle className="w-5 h-5 text-success" />}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <ProgressStepper steps={steps} />

          {phase === "completed" && (
            <div className="bg-accent border border-secondary/20 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-accent-foreground">
                ✅ Processing complete! Please navigate to the{" "}
                <button onClick={() => navigate("/deviation")} className="text-secondary underline font-semibold">
                  Contract Deviation Section
                </button>{" "}
                for Deviation & Recommendations.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
