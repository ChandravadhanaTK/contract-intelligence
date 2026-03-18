import { useState, useEffect, useRef } from "react";
import { Send, Bot } from "lucide-react";
import { api } from "@/services/mockApi";
import type { ChatMessage } from "@/types";

const quickPrompts = [
  "Provider name",
  "Rate escalator percentage",
  "Effective date",
  "Payment appendix type",
];

interface Props {
  requestId: string;
}

export function CoAuthorChatWidget({ requestId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChatMessages(requestId).then(setMessages);
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      requestId,
      role: "user",
      text,
      time: new Date().toISOString(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const response = await api.sendChatMessage(requestId, text);
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      requestId,
      role: "assistant",
      text: response,
      time: new Date().toISOString(),
    };
    const final = [...updated, assistantMsg];
    setMessages(final);
    await api.saveChatMessages(requestId, final);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
      <div className="p-3 border-b flex items-center gap-2 bg-muted/50">
        <Bot className="w-4 h-4 text-secondary" />
        <span className="font-semibold text-sm">Talk to Agent – Your CoAuthor</span>
      </div>

      {/* Quick prompts */}
      <div className="p-2 flex flex-wrap gap-1.5 border-b">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center mt-6">Ask questions about this contract…</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-xs animate-pulse">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-1.5 text-xs bg-background"
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
        />
        <button onClick={() => sendMessage(input)} className="bg-secondary text-secondary-foreground p-1.5 rounded-lg hover:opacity-90">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
