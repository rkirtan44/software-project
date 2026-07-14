"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Scholarship {
  _id: string; title: string; titleHi?: string; titleGu?: string;
  amount: number; deadline: string; isActive: boolean; category: string[]; applicants: string[];
}
interface Notification {
  _id: string; title: string; message: string; type: "info" | "warning" | "success" | "monitor_alert";
  isActive: boolean; createdAt: string; scholarshipId?: string;
  targetCategory?: string; personalEmail?: string;
}

interface ContactQuery {
  _id: string; name: string; email: string; message: string;
  isRead: boolean; createdAt: string;
}

const EMPTY_FORM = {
  title: "", titleHi: "", titleGu: "", description: "", amount: "", eligibility: "",
  deadline: "", applyLink: "", youtubeLink: "", category: "",
  level: "Central", course: "College", state: "Any", gender: "Any", income: "999999999", documents: "",
};
const EMPTY_NOTIF = { title: "", message: "", type: "info" as const, scholarshipId: "", targetCategory: "all", personalEmail: "" };
const NOTIF_CATEGORIES = ["General", "OBC", "SC", "ST", "Minority", "EWS", "Girls"];
const ALL_CATEGORIES = ["Any", "General", "OBC", "SC", "ST", "Minority", "EWS", "Girls"];

const notifTypeConfig: Record<string, { bg: string; color: string; border: string; label: string; emoji: string; gradFrom: string; gradTo: string }> = {
  info:          { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Info",          emoji: "ℹ️", gradFrom: "#3b82f6", gradTo: "#2563eb" },
  warning:       { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Warning",       emoji: "⚠️", gradFrom: "#f59e0b", gradTo: "#d97706" },
  success:       { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Success",       emoji: "✅", gradFrom: "#22c55e", gradTo: "#16a34a" },
  monitor_alert: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", label: "Monitor Alert", emoji: "🔍", gradFrom: "#8b5cf6", gradTo: "#7c3aed" },
};

export default function AdminClient() {
  const [scholarships, setScholarships]     = useState<Scholarship[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [togglingId, setTogglingId]         = useState<string | null>(null);
  const [search, setSearch]                 = useState("");
  const [showForm, setShowForm]             = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab]           = useState<"active" | "inactive">("active");
  const [mainTab, setMainTab]               = useState<"scholarships" | "notifications" | "monitor" | "contacts">("scholarships");
  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [notifForm, setNotifForm]           = useState(EMPTY_NOTIF);
  const [notifSaving, setNotifSaving]       = useState(false);
  const [notifEditingId, setNotifEditingId] = useState<string | null>(null);
  const [notifDeletingId, setNotifDeletingId] = useState<string | null>(null);
  const [showNotifForm, setShowNotifForm]   = useState(false);
  const [sendingMail, setSendingMail]       = useState(false);
  const [mailResult, setMailResult]         = useState<{ success: boolean; message: string } | null>(null);

  // ── Contact Queries state ──────────────────────────────────────────────────
  const [contacts, setContacts]             = useState<ContactQuery[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [contactFilter, setContactFilter]   = useState<"all" | "unread" | "read">("all");
  const [replyingTo, setReplyingTo]         = useState<ContactQuery | null>(null);
  const [replyMessage, setReplyMessage]     = useState("");
  const [replySending, setReplySending]     = useState(false);
  const [replyResult, setReplyResult]       = useState<{ success: boolean; message: string } | null>(null);

  // ── Monitor tab state ──────────────────────────────────────────────────────
  interface MonitorChange { field: string; oldValue: string; newValue: string; suggestedAction: string; }
  interface MonitorLog {
    _id: string; scholarshipId: string; scholarshipTitle: string; sourceUrl: string;
    status: "changed" | "unreachable" | "ok" | "error";
    changes: MonitorChange[]; severity: "urgent" | "high" | "medium" | "low";
    resolved: boolean; checkedAt: string; errorMessage?: string;
  }
  const [monitorLogs, setMonitorLogs]           = useState<MonitorLog[]>([]);
  const [monitorHistory, setMonitorHistory]     = useState<MonitorLog[]>([]);
  const [monitorScanning, setMonitorScanning]   = useState(false);
  const [monitorResult, setMonitorResult]       = useState<{ scanned: number; alerts: number; warnings: number; message: string } | null>(null);
  const [monitorError, setMonitorError]         = useState("");
  const [monitorHistoryTab, setMonitorHistoryTab] = useState<"alerts" | "history">("alerts");
  const [resolvingId, setResolvingId]           = useState<string | null>(null);
  const [applyingFixId, setApplyingFixId]       = useState<string | null>(null);
  const [monitorSearch, setMonitorSearch]       = useState("");
  const [monitorSeverityFilter, setMonitorSeverityFilter] = useState<"all" | "urgent" | "high" | "medium" | "low">("all");

  const loadScholarships = () => {
    setLoading(true); setError("");
    fetch("/api/scholarships").then(r => r.json()).then(d => { setScholarships(d.scholarships || []); setLoading(false); }).catch(() => { setError("Failed to load scholarships"); setLoading(false); });
  };
  const loadNotifications = () => {
    fetch("/api/notifications").then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {});
  };

  const loadMonitorAlerts = () => {
    fetch("/api/admin/monitor-scholarships")
      .then(r => r.json())
      .then(d => setMonitorLogs(d.logs || []))
      .catch(() => {});
  };

  const loadMonitorHistory = () => {
    // History = all logs except active unresolved "changed" ones
    fetch("/api/admin/monitor-logs?all=1")
      .then(r => r.json())
      .then(d => setMonitorHistory(d.logs || []))
      .catch(() => {});
  };

  const loadContacts = () => {
    setContactsLoading(true);
    fetch("/api/contact")
      .then(r => r.json())
      .then(d => {
        if (d.error) console.error("Contact API error:", d.error);
        setContacts(d.contacts || []);
        setContactsLoading(false);
      })
      .catch(e => { console.error("Contact fetch error:", e); setContactsLoading(false); });
  };

  async function handleMarkContactRead(id: string, isRead: boolean) {
    try {
      await fetch("/api/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isRead }) });
      setContacts(prev => prev.map(c => c._id === id ? { ...c, isRead } : c));
    } catch {}
  }

  async function handleDeleteContact(id: string) {
    if (!confirm("Delete this query?")) return;
    setDeletingContactId(id);
    try {
      await fetch("/api/contact", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setContacts(prev => prev.filter(c => c._id !== id));
    } catch {}
    setDeletingContactId(null);
  }

  async function handleSendReply() {
    if (!replyingTo || !replyMessage.trim()) return;
    setReplySending(true);
    try {
      const res = await fetch("/api/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyingTo.email,
          name: replyingTo.name,
          originalMessage: replyingTo.message,
          reply: replyMessage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplyResult({ success: true, message: "Reply sent successfully!" });
        // Mark as read
        handleMarkContactRead(replyingTo._id, true);
        setTimeout(() => { setReplyingTo(null); setReplyMessage(""); setReplyResult(null); }, 2000);
      } else {
        setReplyResult({ success: false, message: data.error || "Failed to send reply" });
      }
    } catch {
      setReplyResult({ success: false, message: "Network error" });
    }
    setReplySending(false);
  }

  async function handleRunScan() {
    setMonitorScanning(true); setMonitorError(""); setMonitorResult(null);
    try {
      // Scan in batches of 5 to stay within Vercel's 10s function limit
      let offset = 0;
      let totalScanned = 0, totalAlerts = 0, totalWarnings = 0;

      while (true) {
        const res = await fetch(`/api/admin/monitor-scholarships?offset=${offset}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) { setMonitorError(data.error || "Scan failed"); break; }

        totalScanned += data.scanned || 0;
        totalAlerts  += data.alerts  || 0;
        totalWarnings += data.warnings || 0;

        if (!data.nextOffset) break; // all batches done
        offset = data.nextOffset;
      }

      setMonitorResult({
        scanned: totalScanned,
        alerts: totalAlerts,
        warnings: totalWarnings,
        message: `Scan complete. ${totalAlerts} alert(s), ${totalWarnings} warning(s).`,
      });
      loadMonitorAlerts();
      loadMonitorHistory();
    } catch { setMonitorError("Network error during scan"); }
    setMonitorScanning(false);
  }

  async function handleResolveAlert(logId: string) {
    setResolvingId(logId);
    try {
      const res = await fetch("/api/admin/monitor-logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, resolved: true }),
      });
      if (res.ok) {
        setMonitorLogs(prev => prev.filter(l => l._id !== logId));
        loadMonitorHistory();
      }
    } catch {}
    setResolvingId(null);
  }

  // Apply all suggested fixes from a monitor alert automatically
  async function handleApplyMonitorFix(log: MonitorLog) {
    if (!log.scholarshipId || log.changes.length === 0) return;
    setApplyingFixId(log._id);

    try {
      // Build update payload from detected changes
      const payload: Record<string, any> = {};
      for (const change of log.changes) {
        switch (change.field) {
          case "deadline": {
            // Parse the new date value
            const d = new Date(change.newValue);
            if (!isNaN(d.getTime())) payload.deadline = d.toISOString();
            break;
          }
          case "amount": {
            const num = parseInt(change.newValue.replace(/[^\d]/g, ""), 10);
            if (!isNaN(num)) payload.amount = num;
            break;
          }
          case "status":
          case "isActive":
            payload.isActive = change.newValue.toLowerCase() === "active";
            break;
          case "eligibility":
            payload.eligibility = change.newValue;
            break;
          default:
            break;
        }
      }

      if (Object.keys(payload).length === 0) {
        setApplyingFixId(null);
        return;
      }

      const res = await fetch(`/api/scholarships/${log.scholarshipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Mark alert as resolved
        await fetch("/api/admin/monitor-logs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logId: log._id, resolved: true }),
        });
        setMonitorLogs(prev => prev.filter(l => l._id !== log._id));
        loadScholarships();
        loadMonitorHistory();
      } else {
        const data = await res.json();
        setMonitorError(data.error || "Failed to apply fix");
      }
    } catch {
      setMonitorError("Network error while applying fix");
    }
    setApplyingFixId(null);
  }

  useEffect(() => { loadScholarships(); loadNotifications(); loadMonitorAlerts(); loadMonitorHistory(); loadContacts(); }, []);

  function toggleCategoryFilter(cat: string) {
    if (cat === "Any") { setSelectedCategories([]); return; }
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const payload = { title: form.title, titleHi: form.titleHi, titleGu: form.titleGu, description: form.description, amount: Number(form.amount), income: Number(form.income), eligibility: form.eligibility, category: form.category.split(",").map(c => c.trim()).filter(Boolean), deadline: new Date(form.deadline).toISOString(), applyLink: form.applyLink, youtubeLink: form.youtubeLink, level: form.level, course: form.course, state: form.state, gender: form.gender, documents: form.documents };
    const url = editingId ? `/api/scholarships/${editingId}` : "/api/scholarships";
    try {
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json(); setSaving(false);
      if (res.ok) { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); loadScholarships(); }
      else setError(data.error || "Save failed");
    } catch { setSaving(false); setError("Network error"); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Do you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try { const res = await fetch(`/api/scholarships/${id}`, { method: "DELETE" }); if (res.ok) setScholarships(prev => prev.filter(s => s._id !== id)); else setError("Delete failed"); } catch { setError("Network error"); }
    setDeletingId(null);
  }

  async function handleToggleActive(s: Scholarship) {
    setTogglingId(s._id);
    try { const res = await fetch(`/api/scholarships/${s._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !s.isActive }) }); if (res.ok) setScholarships(prev => prev.map(sc => sc._id === s._id ? { ...sc, isActive: !sc.isActive } : sc)); else setError("Toggle failed"); } catch { setError("Network error"); }
    setTogglingId(null);
  }

  function handleEdit(s: any) {
    setForm({ title: s.title || "", titleHi: s.titleHi || "", titleGu: s.titleGu || "", description: s.description || "", amount: s.amount?.toString() || "", eligibility: s.eligibility || "", deadline: s.deadline ? new Date(s.deadline).toISOString().split("T")[0] : "", applyLink: s.applyLink || "", youtubeLink: s.youtubeLink || "", category: Array.isArray(s.category) ? s.category.join(", ") : s.category || "", level: s.level || "Central", course: s.course || "College", state: s.state || "Any", gender: s.gender || "Any", income: s.income?.toString() || "999999999", documents: s.documents || "" });
    setEditingId(s._id); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleNotifSubmit(e: React.FormEvent) {
    e.preventDefault(); setNotifSaving(true);
    const url = notifEditingId ? `/api/notifications/${notifEditingId}` : "/api/notifications";
    try { const res = await fetch(url, { method: notifEditingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notifForm) }); setNotifSaving(false); if (res.ok) { setNotifForm(EMPTY_NOTIF); setNotifEditingId(null); setShowNotifForm(false); loadNotifications(); } } catch { setNotifSaving(false); }
  }

  async function handleNotifDelete(id: string) {
    if (!confirm("Do you want to delete this notification?")) return;
    setNotifDeletingId(id);
    try { const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" }); if (res.ok) setNotifications(prev => prev.filter(n => n._id !== id)); } catch {}
    setNotifDeletingId(null);
  }

  async function handleNotifToggle(n: Notification) {
    try { const res = await fetch(`/api/notifications/${n._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !n.isActive }) }); if (res.ok) setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isActive: !x.isActive } : x)); } catch {}
  }

  function handleNotifEdit(n: Notification) {
    setNotifForm({ title: n.title, message: n.message, type: n.type, scholarshipId: n.scholarshipId || "", targetCategory: n.targetCategory || "all", personalEmail: n.personalEmail || "" });
    setNotifEditingId(n._id); setShowNotifForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSendEmail(n: Notification) {
    setSendingMail(true); setMailResult(null);
    try { const res = await fetch("/api/notifications/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: n._id, scholarshipId: n.scholarshipId, targetCategory: n.targetCategory, personalEmail: n.personalEmail }) }); const data = await res.json(); setMailResult({ success: res.ok, message: data.message || (res.ok ? "Email sent!" : "Failed") }); } catch { setMailResult({ success: false, message: "Network error" }); }
    setSendingMail(false); setTimeout(() => setMailResult(null), 5000);
  }

  const activeScholarships   = scholarships.filter(s => s.isActive);
  const inactiveScholarships = scholarships.filter(s => !s.isActive);
  const filterList = (list: Scholarship[]) => list.filter(s => { const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()); const matchCat = selectedCategories.length === 0 || selectedCategories.some(c => s.category?.includes(c)); return matchSearch && matchCat; });
  const filteredActive   = filterList(activeScholarships);
  const filteredInactive = filterList(inactiveScholarships);
  const selectedScholarshipForNotif = notifForm.scholarshipId ? scholarships.find(s => s._id === notifForm.scholarshipId) : null;

  const inp = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 transition-all bg-white box-border font-[inherit]";
  const lbl = "block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5";


  /* ── ScholarshipCard ── */
  const ScholarshipCard = ({ s }: { s: Scholarship }) => (
    <div className={`group flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${s.isActive ? "bg-white border-slate-200 hover:border-yellow-300 hover:shadow-sm" : "bg-slate-50 border-slate-200 opacity-70"}`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm mb-1 truncate">{s.title}</p>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">₹{s.amount.toLocaleString("en-IN")}</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{Array.isArray(s.category) ? s.category.join(", ") : s.category}</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s.applicants?.length || 0} applicants</span>
          <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-medium">Due: {new Date(s.deadline).toLocaleDateString("en-IN")}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => handleToggleActive(s)} disabled={togglingId === s._id}
          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${s.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"} disabled:opacity-50`}>
          {togglingId === s._id ? "..." : s.isActive ? "Active" : "Inactive"}
        </button>
        <button onClick={() => handleEdit(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all">Edit</button>
        <button onClick={() => handleDelete(s._id, s.title)} disabled={deletingId === s._id}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50">
          {deletingId === s._id ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Playfair Display', serif; }
        .admin-nav-btn { position: relative; overflow: hidden; }
        .admin-nav-btn::after { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.08); opacity:0; transition:opacity 0.2s; }
        .admin-nav-btn:hover::after { opacity:1; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:#f1f5f9; } ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }
      `}</style>

      <div className="min-h-screen" style={{ background: "#f7f8fa" }}>

        {/* ── NAVBAR ── */}
        <nav className="sticky top-0 z-50" style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#2563eb 100%)", boxShadow: "0 2px 20px rgba(15,32,68,0.5)" }}>
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>🎓</div>
              <div>
                <p className="font-display text-white font-bold text-lg leading-none">ScholarPath</p>
                <p className="text-yellow-200 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Admin Panel</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { loadScholarships(); loadNotifications(); loadMonitorAlerts(); loadMonitorHistory(); loadContacts(); }}
                className="admin-nav-btn flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 transition-all hover:border-white/40">
                ↻ Refresh
              </button>
              <Link href="/login"
                className="admin-nav-btn flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/20 transition-all hover:border-white/40">
                Logout
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Scholarships", value: scholarships.length,                    icon: "🎓", from: "#1e3a8a", to: "#1d4ed8" },
              { label: "Active",             value: activeScholarships.length,              icon: "✅", from: "#059669", to: "#047857" },
              { label: "Inactive",           value: inactiveScholarships.length,            icon: "⏸️", from: "#dc2626", to: "#b91c1c" },
              { label: "Queries",            value: contacts.length,                        icon: "💬", from: "#0891b2", to: "#0e7490" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-slate-200" style={{ boxShadow: "0 2px 12px rgba(15,32,68,0.06)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `linear-gradient(135deg,${stat.from},${stat.to})` }}>
                  <span className="text-white font-bold text-lg">{stat.value}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-xl">{stat.icon}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── ERROR ── */}
          {error && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
              <span>⚠️ {error}</span>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 text-lg font-bold ml-4">×</button>
            </div>
          )}

          {/* ── MAIN TABS ── */}
          <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-slate-200" style={{ boxShadow: "0 1px 6px rgba(15,32,68,0.06)" }}>
            {[
              { key: "scholarships",  label: "Scholarships",       icon: "🎓", count: scholarships.length },
              { key: "monitor",       label: "Monitor",             icon: "🔍", count: monitorLogs.length },
              { key: "notifications", label: "Notifications",       icon: "🔔", count: notifications.length },
              { key: "contacts",      label: "Queries",             icon: "💬", count: contacts.filter(c => !c.isRead).length },
            ].map(tab => (
              <button key={tab.key} onClick={() => setMainTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === tab.key ? "text-white shadow-md" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                style={mainTab === tab.key ? { background: tab.key === "monitor" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : tab.key === "contacts" ? "linear-gradient(135deg,#0891b2,#0e7490)" : "linear-gradient(135deg,#1e3a8a,#1d4ed8)", boxShadow: "0 2px 12px rgba(15,32,68,0.3)" } : {}}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${mainTab === tab.key ? "bg-white/20 text-white" : tab.key === "monitor" && monitorLogs.length > 0 ? "bg-red-100 text-red-600" : tab.key === "contacts" && contacts.filter(c => !c.isRead).length > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* ════════════════ INDIA SCHOLARSHIPS ════════════════ */}
          {mainTab === "scholarships" && (
            <div className="space-y-6">
              {/* Add / Edit Form */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(15,32,68,0.06)" }}>
                <div className={`flex items-center justify-between px-6 py-4 ${editingId ? "bg-amber-50 border-b border-amber-100" : "bg-slate-50 border-b border-slate-100"}`}>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg">{editingId ? "Edit Scholarship" : "Add New Scholarship"}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{editingId ? "Update the scholarship details below" : "Fill in the details to add a new scholarship"}</p>
                  </div>
                  <button onClick={() => { setShowForm(!showForm); if (showForm) { setEditingId(null); setForm(EMPTY_FORM); } }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${showForm ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "text-white shadow-sm hover:opacity-90"}`}
                    style={!showForm ? { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#1e3a8a" } : {}}>
                    {showForm ? "✕ Close" : "+ Add Scholarship"}
                  </button>
                </div>
                {showForm && (
                  <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className={lbl}>Scholarship Title (English) *</label>
                        <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. PM Scholarship 2025" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Amount (₹) *</label>
                        <input required type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="50000" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Deadline *</label>
                        <input required type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className={inp} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={lbl + " mb-2"}>Category *</label>
                        <div className="flex flex-wrap gap-2">
                          {["General", "OBC", "SC", "ST", "Minority", "EWS", "Girls"].map(cat => {
                            const selected = form.category.split(",").map(c => c.trim()).includes(cat);
                            return (
                              <button key={cat} type="button"
                                onClick={() => { const cur = form.category.split(",").map(c => c.trim()).filter(Boolean); const upd = selected ? cur.filter(c => c !== cat) : [...cur, cat]; setForm({ ...form, category: upd.join(", ") }); }}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${selected ? "text-white border-transparent shadow-sm" : "text-slate-600 border-slate-200 bg-white hover:border-yellow-300"}`}
                                style={selected ? { background: "linear-gradient(135deg,#f59e0b,#fbbf24)" } : {}}>
                                {selected ? "✓ " : ""}{cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Max Family Income (₹/year)</label>
                        <input type="number" value={form.income} onChange={e => setForm({ ...form, income: e.target.value })} placeholder="250000" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Level</label>
                        <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className={inp}>
                          {["Central", "State", "Private", "NGO"].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Course</label>
                        <select value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} className={inp}>
                          {["College", "School", "Both"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Gender</label>
                        <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className={inp}>
                          {["Any", "Male", "Female"].map(g => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>State</label>
                        <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Apply Link</label>
                        <input type="url" value={form.applyLink} onChange={e => setForm({ ...form, applyLink: e.target.value })} placeholder="https://..." className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>YouTube Link</label>
                        <input value={form.youtubeLink} onChange={e => setForm({ ...form, youtubeLink: e.target.value })} placeholder="https://youtube.com/..." className={inp} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={lbl}>Eligibility *</label>
                        <input required value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} placeholder="e.g. 12th pass, income under 2.5 lakh" className={inp} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={lbl}>Description *</label>
                        <textarea required rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inp + " resize-y"} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={lbl}>Documents Required</label>
                        <textarea rows={2} value={form.documents} onChange={e => setForm({ ...form, documents: e.target.value })} placeholder="e.g. Aadhar Card, Income Certificate" className={inp + " resize-y"} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
                      <button type="submit" disabled={saving}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)" }}>
                        {saving ? "Saving..." : editingId ? "✓ Update Scholarship" : "✓ Add Scholarship"}
                      </button>
                      {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(false); }}
                          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Scholarship List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(15,32,68,0.06)" }}>
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-b border-slate-100" style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)" }}>
                  <h3 className="font-display font-bold text-white text-lg">
                    All Scholarships
                    <span className="ml-2 text-sm font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full">{scholarships.length}</span>
                  </h3>
                  <div className="flex gap-3">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                      className="border border-white/20 rounded-lg px-3 py-1.5 text-sm bg-white/10 text-white placeholder-white/50 outline-none focus:bg-white/20 transition-all w-44" />
                    <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="px-4 py-1.5 rounded-lg text-sm font-bold bg-white/15 border border-white/30 text-white hover:bg-white/25 transition-all">
                      + Add
                    </button>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
                  {ALL_CATEGORIES.map(cat => {
                    const isSelected = cat === "Any" ? selectedCategories.length === 0 : selectedCategories.includes(cat);
                    return (
                      <button key={cat} onClick={() => toggleCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${isSelected ? "text-white border-transparent" : "text-slate-500 border-slate-200 bg-white hover:border-yellow-300"}`}
                        style={isSelected ? { background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", border: "1px solid #f59e0b" } : {}}>
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Active / Inactive — 2 separate column cards */}
                <div className="p-5">
                  {loading ? (
                    <div className="text-center py-16">
                      <div className="inline-block w-8 h-8 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin mb-3"></div>
                      <p className="text-slate-400 text-sm">Loading...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                      {/* Active Column */}
                      <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(5,150,105,0.08)" }}>
                        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                          <h4 className="font-bold text-emerald-700 text-sm uppercase tracking-wide flex-1">Active</h4>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">{filteredActive.length}</span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                          {filteredActive.length === 0 ? (
                            <div className="text-center py-10">
                              <p className="text-slate-400 text-sm">No active scholarships</p>
                            </div>
                          ) : filteredActive.map(s => <ScholarshipCard key={s._id} s={s} />)}
                        </div>
                      </div>

                      {/* Inactive Column */}
                      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(220,38,38,0.08)" }}>
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
                          <h4 className="font-bold text-red-600 text-sm uppercase tracking-wide flex-1">Inactive</h4>
                          <span className="text-xs font-bold bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full">{filteredInactive.length}</span>
                        </div>
                        <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                          {filteredInactive.length === 0 ? (
                            <div className="text-center py-10">
                              <p className="text-slate-400 text-sm">No inactive scholarships</p>
                            </div>
                          ) : filteredInactive.map(s => <ScholarshipCard key={s._id} s={s} />)}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ NOTIFICATIONS ════════════════ */}
          {mainTab === "notifications" && (
            <div className="space-y-6">
              {mailResult && (
                <div className={`flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-semibold border ${mailResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  <span>{mailResult.success ? "✅" : "❌"}</span> {mailResult.message}
                </div>
              )}

              {/* Notification Form */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(15,32,68,0.06)" }}>
                <div className={`flex items-center justify-between px-6 py-4 ${notifEditingId ? "bg-amber-50 border-b border-amber-100" : "bg-yellow-50 border-b border-yellow-100"}`}>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg">{notifEditingId ? "Edit Notification" : "New Notification"}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Send email notifications to students</p>
                  </div>
                  <button onClick={() => { setShowNotifForm(!showNotifForm); if (showNotifForm) { setNotifEditingId(null); setNotifForm(EMPTY_NOTIF); } }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${showNotifForm ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "text-slate-900 shadow-sm hover:opacity-90"}`}
                    style={!showNotifForm ? { background: "linear-gradient(135deg,#f59e0b,#d97706)" } : {}}>
                    {showNotifForm ? "✕ Close" : "🔔 New Notification"}
                  </button>
                </div>
                {showNotifForm && (
                  <form onSubmit={handleNotifSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className={lbl}>Select Scholarship <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                        <select value={notifForm.scholarshipId} onChange={e => setNotifForm({ ...notifForm, scholarshipId: e.target.value })} className={inp}>
                          <option value="">All Registered Students</option>
                          {scholarships.map(s => <option key={s._id} value={s._id}>{s.isActive ? "🟢" : "🔴"} {s.title} — ₹{s.amount.toLocaleString("en-IN")}</option>)}
                        </select>
                        <div className="mt-3">
                          {selectedScholarshipForNotif ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3">
                              <span className="text-lg">🎓</span>
                              <div>
                                <p className="font-bold text-yellow-900 text-sm">{selectedScholarshipForNotif.title}</p>
                                <p className="text-xs text-yellow-700 mt-0.5 font-semibold">The email will only go to applicants for this scholarship</p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl px-4 py-3 flex items-center gap-3">
                              <span>📢</span>
                              <p className="text-sm text-slate-500">The email will go to all registered students</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Category / Personal Target ── */}
                      <div className="md:col-span-2">
                        <label className={lbl}>Send To <span className="text-slate-400 font-normal normal-case">(category filter or personal)</span></label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {/* Personal button */}
                          <button
                            type="button"
                            onClick={() => setNotifForm({ ...notifForm, targetCategory: "personal", personalEmail: notifForm.targetCategory === "personal" ? notifForm.personalEmail : "" })}
                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${notifForm.targetCategory === "personal" ? "text-white border-transparent shadow-sm" : "text-slate-600 border-slate-200 bg-white hover:border-yellow-300"}`}
                            style={notifForm.targetCategory === "personal" ? { background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" } : {}}>
                            ✉️ Personal
                          </button>
                          {/* All button */}
                          <button
                            type="button"
                            onClick={() => setNotifForm({ ...notifForm, targetCategory: "all", personalEmail: "" })}
                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${notifForm.targetCategory === "all" ? "text-white border-transparent shadow-sm" : "text-slate-600 border-slate-200 bg-white hover:border-yellow-300"}`}
                            style={notifForm.targetCategory === "all" ? { background: "linear-gradient(135deg,#f59e0b,#d97706)" } : {}}>
                            📢 All
                          </button>
                          {/* Category buttons */}
                          {NOTIF_CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setNotifForm({ ...notifForm, targetCategory: cat, personalEmail: "" })}
                              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${notifForm.targetCategory === cat ? "text-white border-transparent shadow-sm" : "text-slate-600 border-slate-200 bg-white hover:border-yellow-300"}`}
                              style={notifForm.targetCategory === cat ? { background: "linear-gradient(135deg,#f59e0b,#d97706)" } : {}}>
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Personal Email Input */}
                        {notifForm.targetCategory === "personal" && (
                          <div className="mt-3">
                            <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">Personal Email ID</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">✉️</span>
                              <input
                                type="email"
                                required={notifForm.targetCategory === "personal"}
                                value={notifForm.personalEmail}
                                onChange={e => setNotifForm({ ...notifForm, personalEmail: e.target.value })}
                                placeholder="student@example.com"
                                className={inp + " pl-9"}
                                style={{ borderColor: "#6366f1", boxShadow: "0 0 0 3px rgba(99,102,241,0.1)" }}
                              />
                            </div>
                            {notifForm.personalEmail && (
                              <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                                <span className="text-indigo-500">✉️</span>
                                <div>
                                  <p className="text-xs font-bold text-indigo-700">Personal email</p>
                                  <p className="text-sm font-semibold text-indigo-900">{notifForm.personalEmail}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Category preview */}
                        {notifForm.targetCategory !== "personal" && notifForm.targetCategory !== "all" && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                            <span>🏷️</span>
                            <p className="text-sm text-amber-800 font-semibold">Only <strong>{notifForm.targetCategory}</strong> category students will receive this email</p>
                          </div>
                        )}
                        {notifForm.targetCategory === "all" && (
                          <div className="mt-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                            <span>📢</span>
                            <p className="text-sm text-slate-500">All registered students will receive this email</p>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className={lbl}>Title *</label>
                        <input required value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} placeholder="e.g. New Scholarship Available!" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Type</label>
                        <div className="flex gap-2">
                          {(["info", "warning", "success"] as const).map(t => (
                            <button key={t} type="button" onClick={() => setNotifForm({ ...notifForm, type: t })}
                              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${notifForm.type === t ? "text-white border-transparent shadow-sm" : "text-slate-600 border-slate-200 bg-white hover:border-slate-300"}`}
                              style={notifForm.type === t ? { background: `linear-gradient(135deg,${notifTypeConfig[t].gradFrom},${notifTypeConfig[t].gradTo})` } : {}}>
                              {notifTypeConfig[t].emoji} {notifTypeConfig[t].label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className={lbl}>Message *</label>
                        <textarea required rows={4} value={notifForm.message} onChange={e => setNotifForm({ ...notifForm, message: e.target.value })} placeholder="This message will appear in the student email..." className={inp + " resize-y"} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
                      <button type="submit" disabled={notifSaving}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-900 transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)" }}>
                        {notifSaving ? "Saving..." : notifEditingId ? "✓ Update" : "✓ Create Notification"}
                      </button>
                      {notifEditingId && (
                        <button type="button" onClick={() => { setNotifEditingId(null); setNotifForm(EMPTY_NOTIF); setShowNotifForm(false); }}
                          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Notifications List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(15,32,68,0.06)" }}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ background: "linear-gradient(135deg,#78350f,#b45309)" }}>
                  <h3 className="font-display font-bold text-white text-lg">
                    All Notifications
                    <span className="ml-2 text-sm font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full">{notifications.length}</span>
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={async () => {
                        if (!confirm("Delete all notifications?")) return;
                        await Promise.all(notifications.map(n =>
                          fetch(`/api/notifications/${n._id}`, { method: "DELETE" })
                        ));
                        setNotifications([]);
                      }}
                      className="text-xs text-white/80 font-semibold hover:text-white border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">
                      🗑 Clear All
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {notifications.length === 0 ? (
                    <div className="text-center py-16"><p className="text-4xl mb-3">🔔</p><p className="text-slate-400 text-sm">No notifications found</p></div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map(n => {
                        const cfg = notifTypeConfig[n.type] ?? notifTypeConfig["info"];
                        const linked = n.scholarshipId ? scholarships.find(s => s._id === n.scholarshipId) : null;
                        return (
                          <div key={n._id} className={`rounded-xl border p-4 transition-all ${n.isActive ? "" : "opacity-60"}`} style={{ background: n.isActive ? cfg.bg : "#f8fafc", borderColor: n.isActive ? cfg.border : "#e2e8f0" }}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>{cfg.emoji} {cfg.label}</span>
                                  {linked ? (
                                    <span className="text-[11px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200 px-2.5 py-0.5 rounded-full">🎓 {linked.title}</span>
                                  ) : null}
                                  {n.personalEmail ? (
                                    <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">✉️ {n.personalEmail}</span>
                                  ) : n.targetCategory && n.targetCategory !== "all" ? (
                                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">🏷️ {n.targetCategory}</span>
                                  ) : !linked ? (
                                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full">📢 All Students</span>
                                  ) : null}
                                  <span className="text-[11px] text-slate-400">{new Date(n.createdAt).toLocaleDateString("en-IN")}</span>
                                </div>
                                <p className="font-bold text-slate-900 text-sm mb-1">{n.title}</p>
                                <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                              </div>
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                <button onClick={() => handleSendEmail(n)} disabled={sendingMail}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 transition-all hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                                  style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)" }}>
                                  📧 {sendingMail ? "Sending..." : "Send Email"}
                                </button>
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleNotifToggle(n)}
                                    className={`flex-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${n.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                                    {n.isActive ? "Active" : "Inactive"}
                                  </button>
                                  <button onClick={() => handleNotifEdit(n)} className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-yellow-50 text-yellow-800 hover:bg-yellow-100 transition-all">Edit</button>
                                  <button onClick={() => handleNotifDelete(n._id)} disabled={notifDeletingId === n._id} className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50">
                                    {notifDeletingId === n._id ? "..." : "Del"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ MONITOR ════════════════ */}
          {mainTab === "monitor" && (
            <div className="space-y-6">

              {/* ── Header card ── */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(15,32,68,0.06)" }}>
                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "linear-gradient(135deg,#4c1d95,#6d28d9)" }}>
                  <div>
                    <h3 className="font-display font-bold text-white text-xl">🔍 Scholarship Monitor</h3>
                    <p className="text-violet-200 text-sm mt-1">Automatically checks official sources for deadline, amount, eligibility and status changes.</p>
                  </div>
                  <button
                    onClick={handleRunScan}
                    disabled={monitorScanning}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white border border-white/30 transition-all hover:bg-white/10 disabled:opacity-60 whitespace-nowrap"
                    style={{ background: monitorScanning ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.15)" }}>
                    {monitorScanning ? (
                      <><span className="animate-spin">⟳</span> Scanning…</>
                    ) : (
                      <><span>▶</span> Run Scan Now</>
                    )}
                  </button>
                </div>

                {/* Scan result banner */}
                {monitorResult && (
                  <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex flex-wrap gap-4 items-center">
                    <span className="text-emerald-700 font-semibold text-sm">✅ {monitorResult.message}</span>
                    <div className="flex gap-3 text-xs font-bold">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">Scanned: {monitorResult.scanned}</span>
                      <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-full">Alerts: {monitorResult.alerts}</span>
                      <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Warnings: {monitorResult.warnings}</span>
                    </div>
                  </div>
                )}
                {monitorError && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                    <span className="text-red-600 text-sm font-semibold">⚠️ {monitorError}</span>
                    <button onClick={() => setMonitorError("")} className="text-red-400 hover:text-red-600 font-bold text-lg">×</button>
                  </div>
                )}

                {/* Sub-tabs */}
                <div className="flex gap-1 px-6 pt-4 pb-0 border-b border-slate-100">
                  {[
                    { key: "alerts",  label: "Active Alerts",  count: monitorLogs.length },
                    { key: "history", label: "History Log",    count: monitorHistory.length },
                  ].map(t => (
                    <button key={t.key} onClick={() => setMonitorHistoryTab(t.key as any)}
                      className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${monitorHistoryTab === t.key ? "border-violet-600 text-violet-700 bg-violet-50" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                      {t.label}
                      <span className={`ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full ${monitorHistoryTab === t.key ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>{t.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Active Alerts ── */}
              {monitorHistoryTab === "alerts" && (
                <div className="space-y-3">
                  {/* Search + Filter bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
                    <input
                      value={monitorSearch}
                      onChange={e => setMonitorSearch(e.target.value)}
                      placeholder="Search scholarship name..."
                      className="flex-1 min-w-[180px] border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-slate-50"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {/* severity filter removed */}
                    </div>
                  </div>

                  {(() => {
                    const filtered = monitorLogs.filter(log => {
                      const matchSearch = !monitorSearch || log.scholarshipTitle.toLowerCase().includes(monitorSearch.toLowerCase());
                      const matchSeverity = monitorSeverityFilter === "all" || log.severity === monitorSeverityFilter;
                      return matchSearch && matchSeverity;
                    });
                    return filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                      <p className="text-5xl mb-3">✅</p>
                      <p className="text-slate-700 font-semibold text-lg">No active alerts</p>
                      <p className="text-slate-400 text-sm mt-1">All scholarships match their official sources, or no scan has been run yet.</p>
                    </div>
                  ) : (
                    filtered.map(log => {
                      const severityConfig: Record<string, { bg: string; border: string; badge: string; text: string; icon: string }> = {
                        urgent: { bg: "#fff1f2", border: "#fecdd3", badge: "bg-red-100 text-red-700",    text: "text-red-800",    icon: "🚨" },
                        high:   { bg: "#fffbeb", border: "#fde68a", badge: "bg-amber-100 text-amber-700", text: "text-amber-800",  icon: "⚠️" },
                        medium: { bg: "#eff6ff", border: "#bfdbfe", badge: "bg-blue-100 text-blue-700",   text: "text-blue-800",   icon: "ℹ️" },
                        low:    { bg: "#f0fdf4", border: "#bbf7d0", badge: "bg-green-100 text-green-700", text: "text-green-800",  icon: "🔎" },
                      };
                      const sc = severityConfig[log.severity] || severityConfig.medium;

                      return (
                        <div key={log._id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: sc.border, boxShadow: "0 2px 12px rgba(15,32,68,0.06)" }}>
                          {/* Alert header */}
                          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3" style={{ background: sc.bg }}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg">{sc.icon}</span>
                              <span className="font-bold text-slate-900 text-sm">{log.scholarshipTitle}</span>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${sc.badge}`}>{log.severity}</span>
                              {log.status === "unreachable" && (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">⚡ Source Unreachable</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">{new Date(log.checkedAt).toLocaleString("en-IN")}</span>
                              {log.changes.length > 0 && (
                                <button
                                  onClick={() => handleApplyMonitorFix(log)}
                                  disabled={applyingFixId === log._id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50">
                                  {applyingFixId === log._id ? "Applying…" : "Apply Fix"}
                                </button>
                              )}
                              <button
                                onClick={() => handleResolveAlert(log._id)}
                                disabled={resolvingId === log._id}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-50">
                                {resolvingId === log._id ? "…" : "✓ Resolve"}
                              </button>
                            </div>
                          </div>

                          {/* Source URL */}
                          <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">Source:</span>
                            <a href={log.sourceUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] text-violet-600 hover:underline truncate max-w-xs">{log.sourceUrl}</a>
                          </div>

                          {/* Unreachable warning */}
                          {log.status === "unreachable" && (
                            <div className="px-5 py-4">
                              <p className="text-sm text-slate-600">⚡ The official source URL could not be reached. This may be a temporary outage. No data changes were detected.</p>
                              {log.errorMessage && <p className="text-xs text-slate-400 mt-1">{log.errorMessage}</p>}
                            </div>
                          )}

                          {/* Change rows */}
                          {log.changes.length > 0 && (
                            <div className="p-5 space-y-3">
                              {log.changes.map((change, i) => (
                                <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
                                  <div className="px-4 py-2 bg-slate-50 flex items-center gap-2 border-b border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                      {change.field === "deadline" ? "📅" : change.field === "amount" ? "💰" : change.field === "eligibility" ? "✅" : change.field === "status" || change.field === "isActive" ? "🔄" : "📝"}
                                      {" "}{change.field.charAt(0).toUpperCase() + change.field.slice(1)} Changed
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                    <div className="px-4 py-3">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stored Value</p>
                                      <p className="text-sm text-slate-700 font-medium">{change.oldValue}</p>
                                    </div>
                                    <div className="px-4 py-3 bg-amber-50">
                                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Live Source Value</p>
                                      <p className="text-sm text-amber-900 font-semibold">{change.newValue}</p>
                                    </div>
                                  </div>
                                  <div className="px-4 py-2.5 bg-violet-50 border-t border-violet-100 flex items-start gap-2">
                                    <span className="text-violet-500 text-sm mt-0.5">💡</span>
                                    <p className="text-xs text-violet-800 font-semibold">{change.suggestedAction}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  );
                  })()}
                </div>
              )}

              {/* ── History Log ── */}
              {monitorHistoryTab === "history" && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(15,32,68,0.06)" }}>
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-base">Full History Log</h3>
                    <div className="flex items-center gap-3">
                      <button onClick={loadMonitorHistory} className="text-xs text-violet-600 font-semibold hover:underline">↻ Refresh</button>
                      {monitorHistory.length > 0 && (
                        <button
                          onClick={async () => {
                            if (!confirm("Delete all history logs?")) return;
                            await fetch("/api/admin/cleanup-monitor");
                            setMonitorHistory([]);
                          }}
                          className="text-xs text-red-500 font-semibold hover:underline">
                          🗑 Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  {monitorHistory.length === 0 ? (
                    <div className="p-16 text-center">
                      <p className="text-4xl mb-3">📋</p>
                      <p className="text-slate-400 text-sm">No history yet. Run a scan to start logging.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {monitorHistory.map(log => {
                        const statusConfig: Record<string, { icon: string; color: string; bg: string }> = {
                          changed:     { icon: "⚠️", color: "text-amber-700", bg: "bg-amber-50" },
                          unreachable: { icon: "⚡", color: "text-slate-600", bg: "bg-slate-50" },
                          ok:          { icon: "✅", color: "text-emerald-700", bg: "bg-emerald-50" },
                          error:       { icon: "❌", color: "text-red-600", bg: "bg-red-50" },
                        };
                        const sc = statusConfig[log.status] || statusConfig.ok;
                        return (
                          <div key={log._id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                            <span className="text-base mt-0.5">{sc.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className="font-semibold text-slate-800 text-sm truncate">{log.scholarshipTitle}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{log.status.toUpperCase()}</span>
                                {log.resolved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">RESOLVED</span>}
                                {log.severity !== "low" && log.status === "changed" && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">{log.severity.toUpperCase()}</span>
                                )}
                              </div>
                              {log.changes.length > 0 && (
                                <p className="text-xs text-slate-500">
                                  Changed: {log.changes.map(c => c.field).join(", ")}
                                </p>
                              )}
                              {log.errorMessage && <p className="text-xs text-slate-400">{log.errorMessage}</p>}
                            </div>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">
                              {new Date(log.checkedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ════════════════ CONTACT QUERIES ════════════════ */}
          {mainTab === "contacts" && (
            <div className="space-y-4">

              {/* ── Reply Modal ── */}
              {replyingTo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 text-lg">📧 Reply to {replyingTo.name}</h3>
                      <button onClick={() => { setReplyingTo(null); setReplyMessage(""); setReplyResult(null); }}
                        className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
                    </div>

                    {/* Original message */}
                    <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Original Message</p>
                      <p className="text-sm text-slate-600">{replyingTo.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">From: {replyingTo.email}</p>
                    </div>

                    {/* Reply input */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Reply</label>
                      <textarea
                        rows={5}
                        value={replyMessage}
                        onChange={e => setReplyMessage(e.target.value)}
                        placeholder="Type your reply here..."
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>

                    {replyResult && (
                      <div className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${replyResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                        {replyResult.success ? "✅" : "❌"} {replyResult.message}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={handleSendReply} disabled={replySending || !replyMessage.trim()}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
                        {replySending ? "Sending..." : "Send Reply"}
                      </button>
                      <button onClick={() => { setReplyingTo(null); setReplyMessage(""); setReplyResult(null); }}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(15,32,68,0.06)" }}>
                <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3" style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)" }}>
                  <div>
                    <h3 className="font-display font-bold text-white text-xl">💬 Contact Queries</h3>
                    <p className="text-cyan-100 text-sm mt-0.5">Messages submitted by students via the Contact page</p>
                  </div>
                  <div className="flex gap-2">
                    {(["all", "unread", "read"] as const).map(f => (
                      <button key={f} onClick={() => setContactFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${contactFilter === f ? "bg-white text-cyan-700 border-white" : "text-white border-white/30 hover:bg-white/10"}`}>
                        {f === "all" ? `All (${contacts.length})` : f === "unread" ? `Unread (${contacts.filter(c => !c.isRead).length})` : `Read (${contacts.filter(c => c.isRead).length})`}
                      </button>
                    ))}
                    <button onClick={loadContacts} className="px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/30 hover:bg-white/10">↻</button>
                  </div>
                </div>

                <div className="p-5">
                  {contactsLoading ? (
                    <div className="text-center py-16">
                      <div className="inline-block w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mb-3"></div>
                      <p className="text-slate-400 text-sm">Loading queries...</p>
                    </div>
                  ) : (() => {
                    const filtered = contacts.filter(c =>
                      contactFilter === "all" ? true : contactFilter === "unread" ? !c.isRead : c.isRead
                    );
                    return filtered.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-5xl mb-3">💬</p>
                        <p className="text-slate-500 font-semibold">No queries found</p>
                        <p className="text-slate-400 text-sm mt-1">Student messages will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filtered.map(c => (
                          <div key={c._id} className={`rounded-2xl border p-5 transition-all ${!c.isRead ? "bg-cyan-50 border-cyan-200" : "bg-white border-slate-200"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                                  <a href={`mailto:${c.email}`} className="text-xs text-cyan-600 hover:underline font-medium">{c.email}</a>
                                  {!c.isRead && <span className="text-[10px] font-bold bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">NEW</span>}
                                  <span className="text-[11px] text-slate-400">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.message}</p>
                              </div>
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                <button onClick={() => handleMarkContactRead(c._id, !c.isRead)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${c.isRead ? "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100" : "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"}`}>
                                  {c.isRead ? "Mark Unread" : "✓ Mark Read"}
                                </button>
                                <button onClick={() => { setReplyingTo(c); setReplyMessage(""); setReplyResult(null); }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all text-center">
                                  📧 Reply
                                </button>
                                <button onClick={() => handleDeleteContact(c._id)} disabled={deletingContactId === c._id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50">
                                  {deletingContactId === c._id ? "..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}