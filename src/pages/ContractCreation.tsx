import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { api } from "@/services/mockApi";
import { toast } from "sonner";
import type { DraftContract } from "@/types";

export default function ContractCreation() {
  const [form, setForm] = useState({
    name: "", parties: "", effectiveDate: "", term: "", paymentRate: "", servicesScope: "",
  });
  const [agentOpen, setAgentOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const draft: DraftContract = {
      id: `draft-${Date.now()}`,
      ...form,
      clauses: [],
      createdAt: new Date().toISOString(),
    };
    await api.saveDraft(draft);
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Draft Created", detail: `Contract "${form.name}" drafted`, actor: "Current User" });
    toast.success("Contract draft saved!");
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((m) => [...m, { role: "user", text: userMsg }]);
    setChatInput("");
    setLoading(true);
    const response = await api.simulateDraftAgent(userMsg);
    setChatMessages((m) => [...m, { role: "agent", text: response }]);
    setLoading(false);
  };

  const field = (label: string, key: keyof typeof form, type = "text", multiline = false) => (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      {multiline ? (
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background h-20 resize-none" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      ) : (
        <input type={type} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      )}
    </div>
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="page-header">Contract Creation</h1>
        <button onClick={() => setAgentOpen(!agentOpen)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Bot className="w-4 h-4" /> Talk to Agent – Your CoAuthor
        </button>
      </div>

      <div className={`grid gap-6 ${agentOpen ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Form */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          {field("Contract Name", "name")}
          {field("Parties", "parties")}
          <div className="grid grid-cols-2 gap-4">
            {field("Effective Date", "effectiveDate", "date")}
            {field("Term", "term")}
          </div>
          {field("Payment / Rate Section", "paymentRate", "text", true)}
          {field("Services Scope", "servicesScope", "text", true)}
          <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90">
            Save Draft
          </button>
        </div>

        {/* Agent Chat */}
        {agentOpen && (
          <div className="bg-card border rounded-xl flex flex-col h-[500px]">
            <div className="p-4 border-b flex items-center gap-2">
              <Bot className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-sm">Talk to Agent – Your CoAuthor</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-8">Ask the agent to help draft contract clauses...</p>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-3 py-2 text-sm animate-pulse">Thinking...</div></div>}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="Ask agent to draft a clause..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
              />
              <button onClick={handleChat} className="bg-secondary text-secondary-foreground p-2 rounded-lg hover:opacity-90">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
