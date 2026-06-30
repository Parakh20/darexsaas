"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const STAGES = [
  { key: "LEAD", label: "Lead", color: "border-gray-600" },
  { key: "QUALIFIED", label: "Qualified", color: "border-blue-500" },
  { key: "PROPOSAL", label: "Proposal", color: "border-yellow-500" },
  { key: "NEGOTIATION", label: "Negotiation", color: "border-orange-500" },
  { key: "CLOSED_WON", label: "Won", color: "border-green-500" },
  { key: "CLOSED_LOST", label: "Lost", color: "border-red-500" },
] as const;

type Stage = typeof STAGES[number]["key"];

interface Contact { id: string; name: string; company?: string }
interface Opportunity {
  id: string; title: string; value: number; stage: Stage; probability: number;
  currency: string; expectedCloseDate?: string; notes?: string;
  contact: { id: string; name: string; company?: string };
}

const STAGE_TEXT: Record<Stage, string> = {
  LEAD: "text-gray-400", QUALIFIED: "text-blue-400", PROPOSAL: "text-yellow-400",
  NEGOTIATION: "text-orange-400", CLOSED_WON: "text-green-400", CLOSED_LOST: "text-red-400",
};

const defaultForm = { contactId: "", title: "", value: "", stage: "LEAD" as Stage, probability: "10", expectedCloseDate: "", notes: "" };

export default function OpportunitiesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const { data: oppsData, isLoading } = useQuery<{ data: { data: Opportunity[]; total: number } }>({
    queryKey: ["opportunities"],
    queryFn: () => fetch("/api/opportunities").then((r) => r.json()),
  });

  const { data: contactsData } = useQuery<{ data: { data: Contact[]; total: number } }>({
    queryKey: ["contacts", ""],
    queryFn: () => fetch("/api/contacts").then((r) => r.json()),
    enabled: showAdd,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opportunities"] }); setShowAdd(false); setForm(defaultForm); },
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: Stage }) =>
      fetch(`/api/opportunities/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
  });

  const opps = oppsData?.data?.data ?? [];
  const total = oppsData?.data?.total ?? 0;
  const activeOpps = opps.filter((o) => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST");
  const pipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0);

  const byStage = (stage: Stage) => opps.filter((o) => o.stage === stage);

  const handleCreate = () => {
    if (!form.contactId || !form.title) return;
    createMutation.mutate({
      contactId: form.contactId,
      title: form.title,
      value: form.value ? parseFloat(form.value) : 0,
      stage: form.stage,
      probability: form.probability ? parseInt(form.probability) : 10,
      expectedCloseDate: form.expectedCloseDate || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-neutral-400 text-sm mt-1">
            {total} opportunities · {formatCurrency(pipelineValue)} active pipeline
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Opportunity
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 relative">
          <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
          <h3 className="text-white font-medium mb-4">New Opportunity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <select
                value={form.contactId}
                onChange={(e) => setForm((p) => ({ ...p, contactId: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">Select contact…</option>
                {(contactsData?.data?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>
                ))}
              </select>
            </div>
            <input
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="col-span-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-neutral-500"
            />
            <input
              type="number"
              placeholder="Value (INR)"
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-neutral-500"
            />
            <select
              value={form.stage}
              onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value as Stage }))}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
            >
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <input
              type="number"
              placeholder="Probability %"
              value={form.probability}
              onChange={(e) => setForm((p) => ({ ...p, probability: e.target.value }))}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-neutral-500"
            />
            <input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm((p) => ({ ...p, expectedCloseDate: e.target.value }))}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
            />
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="col-span-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-neutral-500 resize-none"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={!form.contactId || !form.title || createMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-neutral-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex gap-4 flex-1">
          {STAGES.map((s) => (
            <div key={s.key} className="flex-1 rounded-xl bg-neutral-900 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
          {STAGES.map((stage) => {
            const cards = byStage(stage.key);
            const stageValue = cards.reduce((sum, o) => sum + o.value, 0);
            return (
              <div key={stage.key} className="flex-shrink-0 w-60 flex flex-col">
                <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${stage.color}`}>
                  <span className="text-sm font-medium text-white">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    {stageValue > 0 && (
                      <span className="text-xs text-neutral-500 flex items-center gap-0.5">
                        <DollarSign size={10} />{formatCurrency(stageValue).replace("₹", "")}
                      </span>
                    )}
                    <span className="text-xs bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">{cards.length}</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {cards.map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 hover:border-neutral-700 transition-colors group"
                    >
                      <p className="text-sm font-medium text-white line-clamp-2 mb-1">{opp.title}</p>
                      <p className="text-xs text-neutral-500 mb-2">
                        {opp.contact.name}{opp.contact.company ? ` · ${opp.contact.company}` : ""}
                      </p>
                      {opp.value > 0 && (
                        <p className={`text-xs font-bold mb-2 ${STAGE_TEXT[opp.stage]}`}>
                          {formatCurrency(opp.value, opp.currency)}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-600">{opp.probability}%</span>
                        <select
                          value={opp.stage}
                          onChange={(e) => stageMutation.mutate({ id: opp.id, stage: e.target.value as Stage })}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs bg-neutral-800 text-neutral-400 rounded px-1.5 py-0.5 outline-none opacity-0 group-hover:opacity-100 transition-opacity border border-neutral-700"
                        >
                          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                      {opp.expectedCloseDate && (
                        <p className="text-xs text-neutral-600 mt-1">
                          Close: {new Date(opp.expectedCloseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="text-xs text-neutral-700 text-center py-4">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
