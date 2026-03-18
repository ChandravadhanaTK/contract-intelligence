import { useState } from "react";
import { Shield } from "lucide-react";

const staticCredentials = [
  { username: "ChandravadhanaTK", password: "admin123", userId: "user-012" },
  { username: "Raj Srirangam", password: "admin123", userId: "user-013" },
  { username: "Sarah Johnson", password: "network123", userId: "user-001" },
  { username: "Mark Thompson", password: "legal123", userId: "user-002" },
  { username: "Emily Chen", password: "loader123", userId: "user-003" },
  { username: "Amanda Foster", password: "audit123", userId: "user-011" },
];

interface Props {
  onLogin: (userId: string) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const match = staticCredentials.find(
      (c) => c.username.toLowerCase() === username.toLowerCase() && c.password === password
    );
    if (match) {
      localStorage.setItem("oci_current_user_id", match.userId);
      localStorage.setItem("oci_logged_in", "true");
      onLogin(match.userId);
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Provider Contract Management Intelligence</h1>
            <p className="text-sm text-muted-foreground">Powered by Agentic AI</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Enter password"
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
