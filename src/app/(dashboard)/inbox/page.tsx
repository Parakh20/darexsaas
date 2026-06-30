"use client";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Mail, Phone } from "lucide-react";

interface Conversation {
  id: string; channel: "WHATSAPP" | "EMAIL" | "CALL_LOG"; status: string;
  contact?: { name: string; company?: string };
  messages: Array<{ body: string; direction: string; sentAt: string }>;
  aiSummary?: string; aiSentiment?: string; updatedAt: string;
}

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  WHATSAPP: <MessageSquare size={14} className="text-green-400" />,
  EMAIL: <Mail size={14} className="text-blue-400" />,
  CALL_LOG: <Phone size={14} className="text-yellow-400" />,
};

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: "bg-green-950 text-green-400",
  NEUTRAL: "bg-neutral-800 text-neutral-400",
  NEGATIVE: "bg-red-950 text-red-400",
};

export default function InboxPage() {
  const { data, isLoading } = useQuery<{ data: Conversation[] }>({
    queryKey: ["inbox"],
    queryFn: () => fetch("/api/inbox").then((r) => r.json().then((d) => d)),
    initialData: { data: [] },
  });

  const conversations = data?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Unified Inbox</h1>
        <p className="text-neutral-400 text-sm mt-1">WhatsApp, Email, and Call logs in one place</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-neutral-900 animate-pulse" />)}</div>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center text-neutral-500">
          No conversations yet. Incoming messages will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => {
            const lastMsg = c.messages[0];
            return (
              <div key={c.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {CHANNEL_ICON[c.channel]}
                    <span className="text-white font-medium">{c.contact?.name ?? "Unknown"}</span>
                    {c.contact?.company && <span className="text-neutral-500 text-xs">· {c.contact.company}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.aiSentiment && <span className={`text-xs px-2 py-0.5 rounded font-medium ${SENTIMENT_COLORS[c.aiSentiment] ?? ""}`}>{c.aiSentiment}</span>}
                    <span className="text-xs text-neutral-500">{new Date(c.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {lastMsg && (
                  <p className="text-sm text-neutral-400 mt-2 line-clamp-2">
                    {lastMsg.direction === "OUTBOUND" && <span className="text-neutral-600">You: </span>}{lastMsg.body}
                  </p>
                )}
                {c.aiSummary && (
                  <div className="mt-2 text-xs text-violet-400 bg-violet-950/30 px-3 py-1.5 rounded-lg">
                    AI Summary: {c.aiSummary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
