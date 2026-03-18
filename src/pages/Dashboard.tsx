import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { api } from "@/services/mockApi";
import type { ReviewRequest } from "@/types";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const monthlyTrendData = [
  { month: "Aug", requests: 42 },
  { month: "Sep", requests: 58 },
  { month: "Oct", requests: 35 },
  { month: "Nov", requests: 67 },
  { month: "Dec", requests: 52 },
  { month: "Jan", requests: 74 },
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
  const [requests, setRequests] = useState<ReviewRequest[]>([]);

  useEffect(() => {
    api.getReviewRequests().then(setRequests);
  }, []);

  const manualReviewCount = requests.filter((r) => r.status === "Manual review").length;
  const onHoldCount = requests.filter((r) => r.status === "On hold").length;
  const sentForApprovalCount = requests.filter((r) => r.status === "Sent for approval").length;
  const exceptionCount = requests.filter((r) => r.status === "Exception").length;
  const loadReadyCount = requests.filter((r) => r.loadReady).length;

  const highlights = [
    { label: "Manual review requests", count: manualReviewCount, filter: "Manual review" },
    { label: "Loading & audit pending", count: onHoldCount, filter: "On hold" },
    { label: "Sent for network manager approval", count: sentForApprovalCount, filter: "Sent for approval" },
    { label: "Exceptions requiring attention", count: exceptionCount, filter: "Exception" },
    { label: "Load ready items", count: loadReadyCount, filter: "loadReady" },
  ];

  const handleView = async (filter: string) => {
    await api.addAuditEntry({
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Dashboard View Click",
      detail: `Navigated to workflow with filter: ${filter}`,
      actor: "ChandravadhanaTK",
    });
    navigate(`/workflow?filter=${encodeURIComponent(filter)}`);
  };

  return (
    <div className="page-container">
      <div className="mb-2">
        <h1 className="page-header">Welcome ChandravadhanaTK</h1>
        <p className="text-sm text-muted-foreground mt-1">Here are your highlights for the day</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highlights */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Highlights</h2>
          {highlights.map((h) => (
            <div key={h.label} className="bg-card border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{h.label}</p>
                <p className="text-2xl font-bold text-primary mt-1">{h.count}</p>
              </div>
              <button
                onClick={() => handleView(h.filter)}
                className="flex items-center gap-1.5 text-sm text-secondary font-medium hover:underline"
              >
                <Eye className="w-4 h-4" /> View
              </button>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Line Chart */}
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

          {/* Bar Chart */}
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
      </div>
    </div>
  );
}
