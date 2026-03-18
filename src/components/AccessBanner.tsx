import { ShieldAlert } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Props {
  module: string;
  requiredLevel?: "Edit" | "Approve" | "Admin";
}

export function AccessBanner({ module, requiredLevel = "Edit" }: Props) {
  const { hasPermission, currentRole } = useCurrentUser();

  if (hasPermission(module, requiredLevel)) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 mb-4 rounded-lg bg-muted border text-sm text-muted-foreground">
      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
      <span>Read-only access — your role ({currentRole?.name}) does not have {requiredLevel} permissions for this module.</span>
    </div>
  );
}
