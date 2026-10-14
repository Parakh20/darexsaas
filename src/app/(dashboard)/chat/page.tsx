"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Plus, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatConv { id: string; title: string; updatedAt: string; _count: { messages: number } }
interface ChatMsg { id: string; role: "USER" | "ASSISTANT" | "TOOL"; content: string; createdAt: string }

export default function ChatPage() {
  const qc = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: convsData } = useQuery<{ data: ChatConv[] }>({
    queryKey: ["chat-convs"],
    queryFn: () => fetch("/api/chat").then((r) => r.json().then((d) => d.data)),
    initialData: { data: [] },
  });

  const { data: messagesData } = useQuery<ChatMsg[]>({
    queryKey: ["chat-messages", activeConvId],
    queryFn: () => activeConvId ? fetch(`/api/chat/${activeConvId}/messages`).then((r) => r.json().then((d) => d.data)) : [],
    enabled: !!activeConvId,
  });

  const createConvMutation = useMutation({
    mutationFn: () => fetch("/api/chat", { method: "POST" }).then((r) => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["chat-convs"] });
      setActiveConvId(data.data.id);
    },
  });

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || streaming) return;
    const msg = input;
    setInput("");
    setStreaming(true);
    setStreamText("");

    try {
      const res = await fetch(`/api/chat/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter(Boolean);
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6);
            if (payload === "[DONE]") break;
            try {
              const { text } = JSON.parse(payload);
              if (text) { accumulated += text; setStreamText(accumulated); }
            } catch {}
          }
        }
      }
    } finally {
      setStreaming(false);
      setStreamText("");
      qc.invalidateQueries({ queryKey: ["chat-messages", activeConvId] });
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messagesData, streamText]);

  const messages = messagesData ?? [];

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <button onClick={() => createConvMutation.mutate()} className="w-full flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {convsData.data?.map((c) => (
            <button key={c.id} onClick={() => setActiveConvId(c.id)}
              className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", activeConvId === c.id ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white")}>
              <div className="truncate">{c.title}</div>
              <div className="text-xs text-neutral-600">{c._count.messages} messages</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {!activeConvId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot size={48} className="text-violet-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white">AI Business Agent</h2>
              <p className="text-neutral-400 mt-2 text-sm">Start a conversation or try: &quot;Follow up with Rahul tomorrow&quot;</p>
              <button onClick={() => createConvMutation.mutate()} className="mt-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                Start Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.filter((m) => m.role !== "TOOL").map((m) => (
                <div key={m.id} className={cn("flex gap-3", m.role === "USER" ? "justify-end" : "justify-start")}>
                  {m.role === "ASSISTANT" && <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0"><Bot size={16} /></div>}
                  <div className={cn("max-w-[70%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap", m.role === "USER" ? "bg-violet-600 text-white" : "bg-neutral-800 text-neutral-100")}>
                    {m.content}
                  </div>
                  {m.role === "USER" && <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0"><User size={16} /></div>}
                </div>
              ))}
              {streaming && streamText && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0"><Bot size={16} /></div>
                  <div className="max-w-[70%] rounded-xl px-4 py-3 text-sm bg-neutral-800 text-neutral-100 whitespace-pre-wrap">{streamText}<span className="animate-pulse">▋</span></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-neutral-800 p-4">
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Message the AI agent... (e.g., Follow up with Rahul tomorrow)"
                  className="flex-1 bg-neutral-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-neutral-500"
                  disabled={streaming}
                />
                <button onClick={sendMessage} disabled={streaming || !input.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-lg px-4 py-3 transition-colors">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
