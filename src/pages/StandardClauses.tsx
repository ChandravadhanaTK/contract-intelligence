import { useState, useEffect } from "react";
import { Plus, X, Search } from "lucide-react";
import { api } from "@/services/mockApi";
import type { StandardClause } from "@/types";
import { toast } from "sonner";

export default function StandardClauses() {
  const [clauses, setClauses] = useState<StandardClause[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ articleName: "", clauseName: "", text: "", tags: "" });

  useEffect(() => {
    api.getStandardClauses().then(setClauses);
  }, []);

  const handleAdd = async () => {
    const newClause: StandardClause = {
      id: `sc-${Date.now()}`,
      articleName: form.articleName,
      clauseName: form.clauseName,
      text: form.text,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const updated = [...clauses, newClause];
    await api.saveStandardClauses(updated);
    setClauses(updated);
    setShowAdd(false);
    setForm({ articleName: "", clauseName: "", text: "", tags: "" });
    toast.success("Standard clause added");
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Standard Clauses</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clauses.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelected(selected === c.id ? null : c.id)}
            className={`border rounded-lg p-4 cursor-pointer transition-all bg-card hover:shadow-md ${
              selected === c.id ? "ring-2 ring-secondary border-secondary" : ""
            }`}
          >
            <p className="text-xs text-muted-foreground mb-1">Article Name: {c.articleName}</p>
            <p className="text-sm font-semibold mb-2">Clause Name: {c.clauseName}</p>
            {selected === c.id && (
              <p className="text-xs text-muted-foreground mt-2 border-t pt-2">{c.text}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {c.tags.map((t) => (
                <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        ))}

        {/* Add Card */}
        <button
          onClick={() => setShowAdd(true)}
          className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-secondary hover:text-secondary transition-colors min-h-[140px]"
        >
          <Plus className="w-8 h-8" />
          <span className="text-sm font-medium">Add New Clause</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setShowAdd(false)} />
          <div className="relative bg-card border rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Add Standard Clause</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4" /></button>
            </div>
            <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Article Name" value={form.articleName} onChange={(e) => setForm({ ...form, articleName: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Clause Name" value={form.clauseName} onChange={(e) => setForm({ ...form, clauseName: e.target.value })} />
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background h-24 resize-none" placeholder="Clause Text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            <input className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <button onClick={handleAdd} className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">Add Clause</button>
          </div>
        </div>
      )}
    </div>
  );
}
