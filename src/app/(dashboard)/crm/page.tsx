"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Phone, Mail, Building2 } from "lucide-react";

interface Contact {
  id: string; name: string; email?: string; phone?: string; company?: string;
  leadScore: number; status: string; updatedAt: string;
}

export default function CRMPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });

  const { data, isLoading } = useQuery<{ data: { data: Contact[]; total: number } }>({
    queryKey: ["contacts", search],
    queryFn: () => fetch(`/api/contacts?q=${encodeURIComponent(search)}`).then((r) => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: (body: typeof form) => fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts"] }); setShowAdd(false); setForm({ name: "", email: "", phone: "", company: "" }); },
  });

  const contacts = data?.data?.data ?? [];

  const scoreColor = (s: number) => s >= 80 ? "text-green-400" : s >= 50 ? "text-yellow-400" : "text-neutral-400";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-neutral-400 text-sm mt-1">{data?.data?.total ?? 0} total contacts</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          <Plus size={16} /> Add Contact
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or company..."
          className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-neutral-500" />
      </div>

      {showAdd && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="text-white font-medium mb-4">Add New Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            {(["name", "email", "phone", "company"] as const).map((field) => (
              <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={form[field]}
                onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-neutral-500" />
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => addMutation.mutate(form)} disabled={!form.name}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">Save</button>
            <button onClick={() => setShowAdd(false)} className="text-neutral-400 hover:text-white text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-neutral-900 animate-pulse" />)}</div>
      ) : (
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          {contacts.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">No contacts found. Add your first contact!</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-800">
                {["Name", "Company", "Contact", "Score", "Status"].map((h) => (
                  <th key={h} className="text-left text-neutral-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-neutral-400">
                      {c.company && <span className="flex items-center gap-1"><Building2 size={12} />{c.company}</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      <div className="space-y-0.5">
                        {c.email && <div className="flex items-center gap-1"><Mail size={12} />{c.email}</div>}
                        {c.phone && <div className="flex items-center gap-1"><Phone size={12} />{c.phone}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`font-bold ${scoreColor(c.leadScore)}`}>{c.leadScore}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-950 text-green-400" : "bg-neutral-800 text-neutral-400"}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
