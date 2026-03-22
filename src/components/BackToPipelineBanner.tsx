import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function BackToPipelineBanner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromPipeline = searchParams.get("from") === "pipeline";

  if (!fromPipeline) return null;

  return (
    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-accent/50 border border-primary/20">
      <button
        onClick={() => navigate("/contracts/newgen")}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to NewGen Contract Digitization Pipeline
      </button>
    </div>
  );
}
