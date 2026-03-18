import { useState, useEffect, useCallback } from "react";
import type { AppUser, Role, Permission } from "@/types";

function get<T>(key: string, fb: T): T {
  const r = localStorage.getItem(key);
  return r ? JSON.parse(r) : fb;
}

export function useCurrentUser() {
  const [currentUserId, setCurrentUserId] = useState<string>(() =>
    localStorage.getItem("oci_current_user_id") || "user-012"
  );

  const users = get<AppUser[]>("oci_users", []);
  const roles = get<Role[]>("oci_roles", []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || null;
  const currentRole = currentUser ? roles.find(r => r.id === currentUser.roleId) || null : null;

  const switchUser = useCallback((userId: string) => {
    localStorage.setItem("oci_current_user_id", userId);
    setCurrentUserId(userId);
    window.dispatchEvent(new Event("oci_user_changed"));
  }, []);

  useEffect(() => {
    const handler = () => {
      const id = localStorage.getItem("oci_current_user_id") || "user-012";
      setCurrentUserId(id);
    };
    window.addEventListener("oci_user_changed", handler);
    return () => window.removeEventListener("oci_user_changed", handler);
  }, []);

  const hasPermission = useCallback((module: string, minLevel: Permission["accessLevel"]): boolean => {
    if (!currentRole) return false;
    const levels: Permission["accessLevel"][] = ["View", "Edit", "Approve", "Admin"];
    const minIdx = levels.indexOf(minLevel);
    const perm = currentRole.permissions.find(p => p.module === module);
    if (!perm) return false;
    return levels.indexOf(perm.accessLevel) >= minIdx;
  }, [currentRole]);

  return { currentUser, currentRole, users, roles, switchUser, hasPermission };
}
