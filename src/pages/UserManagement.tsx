import { useState, useEffect } from "react";
import { Users, Shield, Plus, Pencil, ToggleLeft, ToggleRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/mockApi";
import type { AppUser, Role, Permission } from "@/types";

function get<T>(key: string, fb: T): T {
  const r = localStorage.getItem(key);
  return r ? JSON.parse(r) : fb;
}
function set(key: string, v: unknown) { localStorage.setItem(key, JSON.stringify(v)); }

const ALL_MODULES = [
  "ContractCreation", "Upload", "Deviation", "Redlining", "Workflow",
  "Intake", "Credentialing", "Rates", "Downstream", "Compliance",
  "Monitoring", "Renewals", "UserManagement",
];

const ACCESS_LEVELS: Permission["accessLevel"][] = ["View", "Edit", "Approve", "Admin"];

export default function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", roleId: "", status: "Active" as "Active" | "Inactive" });

  useEffect(() => {
    setUsers(get<AppUser[]>("oci_users", []));
    setRoles(get<Role[]>("oci_roles", []));
  }, []);

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) setSelectedRoleId(roles[0].id);
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || "Unknown";

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", roleId: roles[0]?.id || "", status: "Active" });
    setModalOpen(true);
  };

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, roleId: user.roleId, status: user.status });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.roleId) { toast.error("Fill all fields"); return; }
    const updated = [...users];
    if (editingUser) {
      const idx = updated.findIndex(u => u.id === editingUser.id);
      const oldRole = updated[idx].roleId;
      updated[idx] = { ...updated[idx], ...form };
      set("oci_users", updated);
      if (oldRole !== form.roleId) {
        await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Role Changed", detail: `${form.name}: ${getRoleName(oldRole)} → ${getRoleName(form.roleId)}`, actor: "Platform Admin" });
      }
      toast.success("User updated");
    } else {
      const newUser: AppUser = { id: `user-${Date.now()}`, ...form, createdAt: new Date().toISOString() };
      updated.push(newUser);
      set("oci_users", updated);
      await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "User Created", detail: `${form.name} created with role ${getRoleName(form.roleId)}`, actor: "Platform Admin" });
      toast.success("User created");
    }
    setUsers(updated);
    setModalOpen(false);
  };

  const toggleStatus = async (user: AppUser) => {
    const updated = users.map(u => u.id === user.id ? { ...u, status: u.status === "Active" ? "Inactive" as const : "Active" as const } : u);
    set("oci_users", updated);
    setUsers(updated);
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "User Status Changed", detail: `${user.name} set to ${newStatus}`, actor: "Platform Admin" });
    toast.success(`${user.name} set to ${newStatus}`);
  };

  const getPermLevel = (role: Role, module: string): string => {
    const p = role.permissions.find(p => p.module === module);
    return p ? p.accessLevel : "—";
  };

  const levelColor = (level: string) => {
    switch (level) {
      case "Admin": return "bg-destructive/10 text-destructive";
      case "Approve": return "bg-chart-4/20 text-chart-4";
      case "Edit": return "bg-primary/10 text-primary";
      case "View": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <h1 className="page-header flex items-center gap-2"><Users className="w-6 h-6" /> User Management</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card border rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm text-foreground">Users ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary-foreground">{getRoleName(u.roleId)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === "Active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-muted" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleStatus(u)} className="p-1.5 rounded hover:bg-muted" title="Toggle Status">
                      {u.status === "Active" ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles & Permissions */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm text-foreground">Roles & Permissions</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm font-medium text-foreground">Select Role:</label>
            <div className="relative">
              <select
                value={selectedRoleId}
                onChange={e => setSelectedRoleId(e.target.value)}
                className="appearance-none border rounded-lg px-3 py-2 pr-8 text-sm bg-background text-foreground"
              >
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
            {selectedRole && <span className="text-xs text-muted-foreground ml-2">— {selectedRole.description}</span>}
          </div>

          {selectedRole && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Module</th>
                    {ACCESS_LEVELS.map(l => (
                      <th key={l} className="text-center px-4 py-3 font-medium text-muted-foreground">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map(mod => {
                    const level = getPermLevel(selectedRole, mod);
                    return (
                      <tr key={mod} className="border-b last:border-b-0">
                        <td className="px-4 py-2.5 font-medium text-foreground">{mod}</td>
                        {ACCESS_LEVELS.map(al => (
                          <td key={al} className="text-center px-4 py-2.5">
                            <span className={`inline-block w-5 h-5 rounded-md text-xs leading-5 ${
                              ACCESS_LEVELS.indexOf(al) <= ACCESS_LEVELS.indexOf(level as any)
                                ? levelColor(level)
                                : "bg-muted/30 text-muted-foreground/30"
                            }`}>
                              {ACCESS_LEVELS.indexOf(al) <= ACCESS_LEVELS.indexOf(level as any) ? "✓" : ""}
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-card border rounded-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground">{editingUser ? "Edit User" : "Create User"}</h3>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Name</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Role</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium text-sm hover:opacity-90">Save</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 border py-2 rounded-lg text-sm font-medium hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
