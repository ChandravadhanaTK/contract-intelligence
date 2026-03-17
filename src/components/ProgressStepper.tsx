import { Check } from "lucide-react";

interface Step {
  label: string;
  done: boolean;
  active: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold transition-colors ${
              step.done
                ? "bg-success text-success-foreground"
                : step.active
                ? "bg-secondary text-secondary-foreground animate-pulse-slow"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.done ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <span
            className={`text-sm ${
              step.done ? "text-success font-medium" : step.active ? "text-secondary font-medium" : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 ${step.done ? "bg-success" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
