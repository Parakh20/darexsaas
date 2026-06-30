"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Circle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string; title: string; description?: string; status: string; priority: string;
  dueDate?: string; aiGenerated: boolean;
  contact?: { name: string };
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-neutral-400", MEDIUM: "text-blue-400", HIGH: "text-yellow-400", URGENT: "text-red-400",
};

export default function TasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"PENDING" | "DONE">("PENDING");

  const { data, isLoading } = useQuery<{ data: Task[] }>({
    queryKey: ["tasks", filter],
    queryFn: () => fetch(`/api/tasks?status=${filter}`).then((r) => r.json().then((d) => d)),
    initialData: { data: [] },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const tasks = data?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-neutral-400 text-sm mt-1">{tasks.length} {filter.toLowerCase()} tasks</p>
        </div>
        <div className="flex gap-2">
          {(["PENDING", "DONE"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", filter === s ? "bg-violet-600 text-white" : "text-neutral-400 hover:text-white")}>
              {s === "PENDING" ? "Pending" : "Done"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-neutral-900 animate-pulse" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center text-neutral-500">No {filter.toLowerCase()} tasks.</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 flex items-start gap-3 hover:border-neutral-700 transition-colors">
              <button onClick={() => toggleMutation.mutate({ id: t.id, status: t.status === "PENDING" ? "DONE" : "PENDING" })} className="mt-0.5 flex-shrink-0 text-neutral-500 hover:text-violet-400 transition-colors">
                {t.status === "DONE" ? <CheckCircle2 size={18} className="text-green-400" /> : <Circle size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", t.status === "DONE" ? "line-through text-neutral-500" : "text-white")}>{t.title}</span>
                  {t.aiGenerated && <Bot size={12} className="text-violet-400 flex-shrink-0" />}
                </div>
                {t.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{t.description}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-medium ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  {t.dueDate && <span className="text-xs text-neutral-500">Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                  {t.contact && <span className="text-xs text-neutral-500">· {t.contact.name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
