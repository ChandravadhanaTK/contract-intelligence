import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, ArrowRight, MessageSquare, Calendar, Shield, AlertTriangle } from "lucide-react";
import { api } from "@/services/mockApi";
import type { ReviewRequest, Contract } from "@/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function get<T>(key: string, fb: T): T { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }

const monthlyTrendData = [
  { month: "Aug", requests: 42 }, { month: "Sep", requests: 58 }, { month: "Oct", requests: 35 },
  { month: "Nov", requests: 67 }, { month: "Dec", requests: 52 }, { month: "Jan", requests: 74 },
];
const requestsByType = [
  { month: "Aug", rateLoad: 15, amendment: 10, newProvider: 8, other: 9 },
  { month: "Sep", rateLoad: 22, amendment: 12, newProvider: 14, other: 10 },
  { month: "Oct", rateLoad: 12, amendment: 8, newProvider: 6, other: 9 },
  { month: "Nov", rateLoad: 25, amendment: 18, newProvider: 12, other: 12 },
  { month: "Dec", rateLoad: 18, amendment: 14, newProvider: 10, other: 10 },
  { month: "Jan", rateLoad: 28, amendment: 20, newProvider: 15, other: 11 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [talkToContract, setTalkToContract] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    api.getReviewRequests().then(setRequests);
    api.getContracts().then(setContracts);
  }, []);

  const manualReviewCount = requests.filter((r) => r.status === "Manual review").length;
  const onHoldCount = requests.filter((r) => r.status === "On hold").length;
  const sentForApprovalCount = requests.filter((r) => r.status === "Sent for approval").length;
  const exceptionCount = requests.filter((r) => r.status === "Exception").length;
  const loadReadyCount = requests.filter((r) => r.loadReady).length;

  const renewals = get<any[]>("oci_renewals", []);
  const renewalsDue30 = renewals.filter((r: any) => r.daysUntil <= 30).length;
  const disputes = get<any[]>("oci_disputes", []);
  const openDisputes = disputes.filter((d: any) => d.status === "Open").length;

  const highlights = [
    { label: "Manual review requests", count: manualReviewCount, filter: "Manual review", route: "/workflow" },
    { label: "Loading & audit pending", count: onHoldCount, filter: "On hold", route: "/workflow" },
    { label: "Sent for network manager approval", count: sentForApprovalCount, filter: "Sent for approval", route: "/workflow" },
    { label: "Exceptions requiring attention", count: exceptionCount, filter: "Exception", route: "/workflow" },
    { label: "Load ready items", count: loadReadyCount, filter: "loadReady", route: "/workflow" },
    { label: "Upcoming Renewals (≤30 days)", count: renewalsDue30, filter: "", route: "/renewals" },
    { label: "Open Dispute Tickets", count: openDisputes, filter: "", route: "/monitoring" },
  ];

  const handleView = async (h: typeof highlights[0]) => {
    await api.addAuditEntry({ id: `a-${Date.now()}`, timestamp: new Date().toISOString(), action: "Dashboard View Click", detail: `Navigated to ${h.route} with filter: ${h.filter}`, actor: currentUser?.name || "System" });
    if (h.filter) navigate(`${h.route}?filter=${encodeURIComponent(h.filter)}`);
    else navigate(h.route);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatMessages(m => [...m, { role: "user", text: msg }]);
    setChatInput("");
    setChatLoading(true);
    const response = await api.sendChatMessage("dashboard-chat", msg);
    setChatMessages(m => [...m, { role: "assistant", text: response }]);
    setChatLoading(false);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div>
          <h1 className="page-header">Welcome {currentUser?.name || "User"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Here are your highlights for the day</p>
        </div>
        <button onClick={() => setTalkToContract(!talkToContract)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90" title="Your AI Contract CoAuthor to write contracts faster and smarter">
          <MessageSquare className="w-4 h-4" /> Talk to Contract Agent – Your CoAuthor
        </button>
      </div>

      <div className={`grid gap-6 ${talkToContract ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Highlights</h2>
          {highlights.map((h) => (
            <div key={h.label} className="bg-card border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{h.label}</p>
                <p className="text-2xl font-bold text-primary mt-1">{h.count}</p>
              </div>
              <button onClick={() => handleView(h)} className="flex items-center gap-1.5 text-sm text-secondary font-medium hover:underline">
                <Eye className="w-4 h-4" /> View
              </button>
            </div>
          ))}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Contract Lineage</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
              {["Document Upload", "Entity Extraction", "Clause Matching", "Rate Tables", "Mapping Payload", "Publish Events"].map((step, i) => (
                <span key={step} className="flex items-center gap-1">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-medium">{step}</span>
                  {i < 5 && <ArrowRight className="w-3 h-3" />}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-4">Manual Review Requests – Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(217 20% 45%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(217 20% 45%)" />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="hsl(217 100% 23%)" strokeWidth={2} dot={{ fill: "hsl(15 100% 58%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-4">Requests by Type – Monthly</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={requestsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(217 20% 45%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(217 20% 45%)" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rateLoad" name="Rate Load" fill="hsl(217 100% 23%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="amendment" name="Amendment" fill="hsl(15 100% 58%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="newProvider" name="New Provider" fill="hsl(145 63% 42%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="other" name="Other" fill="hsl(38 92% 50%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {talkToContract && (
          <div className="bg-card border rounded-xl flex flex-col h-[600px]">
            <div className="p-3 border-b flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-xs">Talk to Contract</span>
            </div>
            <div className="p-3 border-b">
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Select Contract(s)</label>
              <select className="w-full border rounded px-2 py-1.5 text-xs bg-background">
                {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && <p className="text-xs text-muted-foreground text-center mt-4">Ask questions about your contracts. Answers include clause and page citations.</p>}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{m.text}</div>
                </div>
              ))}
              {chatLoading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-2.5 py-1.5 text-xs animate-pulse">Thinking...</div></div>}
            </div>
            <div className="p-2 border-t flex gap-1.5">
              <input className="flex-1 border rounded px-2 py-1.5 text-xs bg-background" placeholder="Ask about your contracts..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleChat()} />
              <button onClick={handleChat} className="bg-secondary text-secondary-foreground p-1.5 rounded hover:opacity-90"><MessageSquare className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
