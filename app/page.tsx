"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

const C = {
  navy:"#0f2044", navyMid:"#1a3360",
  blue:"#1d4ed8", indigo:"#4f46e5",
  cyan:"#0891b2",
  green:"#059669",
  recGreen:"#047857",
};

const T = {
  en: {
    tagline:"Find & Apply for Scholarships",
    studentIncome:"Family Income",
    totalScholarships:"Total Scholarships",
    recommended:"Recommended",
    studentProfile:"Student Profile",
    incomeField:"Annual Family Income (₹)",
    categoryField:"Category",
    courseField:"Level of Study",
    stateField:"State / UT",
    genderField:"Gender",
    updateProfile:"Find My Scholarships",
    scholarshipsRecommended:"scholarships match your profile",
    searchPlaceholder:"Search scholarships...",
    allCategories:"All Categories",
    allCourses:"All Courses",
    school:"School", engineering:"Engineering", medical:"Medical",
    arts:"Arts", commerce:"Commerce", science:"Science",
    allLevels:"All Types", central:"Central Govt",
    stateLvl:"State Govt", trust:"Trust / NGO",
    scholarships:"Scholarships", showing:"results",
    name:"Scholarship", level:"Type", courseCol:"Course",
    stateCol:"State", amount:"Amount", details:"Details", apply:"Apply",
    noResults:"No scholarships match your filters.",
    recommended_badge:"Recommended",
    description:"About this Scholarship",
    eligibility:"Eligibility Criteria",
    documents:"Documents Required",
    applyNow:"Apply on Official Site →",
    howToFill:"▶ Watch Tutorial",
    lastDate:"Last Date",
    applyModal:"Apply for",
    lastDateLabel:"Application Deadline",
    stepsTitle:"Steps to Apply",
    steps:["Gather all required documents","Click Apply on Official Site below","Register / Login on portal","Fill personal & academic details","Upload scanned documents","Submit and save your application number"],
    applyOnSite:"Apply on Official Site →",
    watchVideo:"▶ Watch Tutorial",
    docWallet:"My Documents",
    docWalletDesc:"Your documents are saved securely in your browser.",
    docName:"Document Name",
    docFile:"Upload File",
    addDocument:"Add Document",
    noDocuments:"No documents yet. Upload Aadhaar, marksheets, caste certificate etc.",
    remove:"Remove",
    docAdded:"Document saved!",
    anyOpt:"Any",
    profile:"My Profile",
    logout:"Logout",
    genderAny:"Any", genderMale:"Male", genderFemale:"Female",
    navHome:"Home", navScholarships:"Scholarships", navContact:"Contact Us",
    profileModal:"Student Profile",
    contactTitle:"Contact Us",
    contactSub:"We're here to help you find the right scholarship.",
    contactName:"Your Name", contactEmail:"Your Email",
    contactMsg:"Your Message", contactSend:"Send Message",
    contactSent:"✅ Message sent! We'll get back to you within 24 hours.",
    secureNote:"🔒 Your documents are stored locally in your browser. They are never uploaded to any server.",
    savedScholarships:"Saved Scholarships",
    savedScholarshipsDesc:"All scholarships you have bookmarked.",
    noSaved:"No saved scholarships yet. Click the bookmark icon on any scholarship to save it.",
    backToHome:"← Back to Home",
    editProfile:"Edit Profile",
  },
};

type Lang = "en";
type PageView = "home" | "scholarships" | "contact" | "studentProfile" | "documents" | "savedScholarships";

const CATEGORY_OPTIONS = ["All Categories","SC","ST","OBC","General","Minority"];
const CAST_OPTIONS     = ["SC","ST","OBC","General","Minority"];
const LEVEL_OPTIONS    = ["All Levels","Central","State","Trust"];
const STATES = ["Any","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry"];

function toCourseKey(c:string):string {
  if(c==="Any") return "Any";
  if(c==="School") return "School";
  return "College";
}

interface Scholarship {
  _id?: string; id?: number; name?: string; title?: string; titleHi?: string; titleGu?: string;
  gender: string; category: string | string[]; course: string; state: string; level: string;
  income: number; amount: string | number; lastDate?: string; deadline?: string;
  applyLink?: string; youtubeLink?: string; description: string; eligibility: string;
  documents?: string; isActive?: boolean;
}
interface Profile { income: string; category: string; course: string; state: string; gender: string; }
interface DocEntry { id: string; name: string; fileName: string; dataUrl: string; }

function isRecommended(s: Scholarship, p: Profile | null): boolean {
  if (!p) return false;
  const inc = parseInt(p.income) || 0;
  const gm = s.gender === "Any" || p.gender === "Any" || s.gender === p.gender;
  const ck = toCourseKey(p.course);
  const cat = Array.isArray(s.category) ? s.category : [s.category];
  return gm && (inc === 0 || s.income >= inc) &&
    (cat.includes("General") || cat.includes(p.category) || p.category === "General") &&
    (ck === "Any" || s.course === "Any" || s.course === ck) &&
    (!p.state || p.state === "Any" || s.state === "Any" || s.state === p.state);
}

function catBadge(c: string | string[]) {
  const cat = Array.isArray(c) ? c[0] : c;
  const m: Record<string, string> = {
    SC: "bg-sky-50 text-sky-700 border border-sky-200",
    ST: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    OBC: "bg-amber-50 text-amber-700 border border-amber-200",
    Minority: "bg-pink-50 text-pink-700 border border-pink-200",
    General: "bg-slate-50 text-slate-600 border border-slate-200",
  };
  return m[cat] || "bg-gray-50 text-gray-600 border border-gray-200";
}

function lvlBadge(l: string) {
  if (l === "Central") return "bg-blue-50 text-blue-700 border border-blue-200";
  if (l === "State") return "bg-teal-50 text-teal-700 border border-teal-200";
  return "bg-violet-50 text-violet-700 border border-violet-200";
}

export default function ScholarshipPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lang] = useState<Lang>("en");
  const t = T[lang];
  const [SCHOLARSHIPS, setScholarships] = useState<Scholarship[]>([]);
  const [scholarshipsLoading, setScholarshipsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<PageView>("home");
  const [profile, setProfile] = useState<Profile>({ income: "", category: "SC", course: "Any", state: "Any", gender: "Any" });
  const [savedProfile, setSavedProfile] = useState<Profile | null>(null);
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchCategory, setSearchCategory] = useState("All Categories");
  const [searchCourse, setSearchCourse] = useState("Any");
  const [searchLevel, setSearchLevel] = useState("All Levels");
  const [searchGender, setSearchGender] = useState("Any");
  const [searchState, setSearchState] = useState("Any");
  const [detailS, setDetailS] = useState<Scholarship | null>(null);
  const [applyS, setApplyS] = useState<Scholarship | null>(null);
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [docName, setDocName] = useState("");
  const [docToast, setDocToast] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", msg: "" });
  const [contactSent, setContactSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [savedScholarships, setSavedScholarships] = useState<string[]>([]);
  const [notifiedScholarships, setNotifiedScholarships] = useState<string[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifPanel, setShowNotifPanel]     = useState(false);
  const [studentNotifs, setStudentNotifs]       = useState<{_id:string;title:string;message:string;type:string;isRead:boolean;createdAt:string}[]>([]);
  const [unreadCount, setUnreadCount]           = useState(0);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // ── ALL useEffects must be before any early return ──────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/scholarships").then(r => r.json())
      .then(d => { setScholarships(d.scholarships || []); setScholarshipsLoading(false); })
      .catch(() => setScholarshipsLoading(false));
  }, []);

  useEffect(() => {
    try {
      const sp = localStorage.getItem("sh_profile"); if (sp) setSavedProfile(JSON.parse(sp));
      const pf = localStorage.getItem("sh_profileForm"); if (pf) setProfile(JSON.parse(pf));
      const dc = localStorage.getItem("sh_docs"); if (dc) setDocs(JSON.parse(dc));
      const ss = localStorage.getItem("sh_saved_scholarships"); if (ss) setSavedScholarships(JSON.parse(ss));
      const nt = localStorage.getItem("sh_notified_scholarships"); if (nt) setNotifiedScholarships(JSON.parse(nt));
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem("sh_profileForm", JSON.stringify(profile)); } catch {} }, [profile]);
  useEffect(() => { try { if (savedProfile) localStorage.setItem("sh_profile", JSON.stringify(savedProfile)); } catch {} }, [savedProfile]);
  useEffect(() => { try { localStorage.setItem("sh_docs", JSON.stringify(docs)); } catch {} }, [docs]);
  useEffect(() => { try { localStorage.setItem("sh_saved_scholarships", JSON.stringify(savedScholarships)); } catch {} }, [savedScholarships]);
  useEffect(() => { try { localStorage.setItem("sh_notified_scholarships", JSON.stringify(notifiedScholarships)); } catch {} }, [notifiedScholarships]);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) setShowProfileDropdown(false);
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) setShowNotifPanel(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch student notifications from DB
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/student/notifications")
      .then(r => r.json())
      .then(d => { setStudentNotifs(d.notifications || []); setUnreadCount(d.unreadCount || 0); })
      .catch(() => {});
  }, [status]);

  // ── Early return AFTER all hooks ────────────────────────────
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4" style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>🎓</div>
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const sName = (s: Scholarship) => s.title || s.name || "";
  const sAmount = (s: Scholarship) => typeof s.amount === "number" ? `₹${s.amount.toLocaleString("en-IN")}` : s.amount;
  const sLastDate = (s: Scholarship) => s.lastDate || (s.deadline ? new Date(s.deadline).toLocaleDateString("en-IN") : "—");
  const sCategory = (s: Scholarship) => Array.isArray(s.category) ? s.category[0] : s.category;
  const recCount = SCHOLARSHIPS.filter(s => isRecommended(s, savedProfile)).length;
  const hasFilters = searchCategory !== "All Categories" || searchCourse !== "Any" || searchGender !== "Any" || searchLevel !== "All Levels" || searchState !== "Any" || !!searchName;
  const clearFilters = () => { setSearchCategory("All Categories"); setSearchCourse("Any"); setSearchGender("Any"); setSearchLevel("All Levels"); setSearchState("Any"); setSearchName(""); };
  const courseLabel = (c: string) => c === "Any" ? t.anyOpt : c === "School" ? t.school : c === "Engineering" ? t.engineering : c === "Medical" ? t.medical : c === "Arts" ? t.arts : c === "Commerce" ? t.commerce : c === "Science" ? t.science : c;

  const displayed = SCHOLARSHIPS.filter(s => {
    const nm = sName(s).toLowerCase().includes(searchName.toLowerCase());
    const cat = searchCategory === "All Categories" || (Array.isArray(s.category) ? s.category.includes(searchCategory) : s.category === searchCategory);
    const ck = toCourseKey(searchCourse);
    const crs = ck === "Any" || s.course === "Any" || s.course === ck;
    const lvl = searchLevel === "All Levels" || s.level === searchLevel;
    const gdr = searchGender === "Any" || s.gender === "Any" || s.gender === searchGender;
    const st = searchState === "Any" || s.state === "Any" || s.state === searchState;
    return nm && cat && crs && lvl && gdr && st;
  }).sort((a, b) => (isRecommended(b, savedProfile) ? 1 : 0) - (isRecommended(a, savedProfile) ? 1 : 0));

  // Saved scholarships filtered list
  const savedList = SCHOLARSHIPS.filter(s => savedScholarships.includes(String(s._id || s.id)));

  function handleDocAdd() {
    const file = fileRef.current?.files?.[0];
    if (!file || !docName.trim()) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setDocs(prev => [...prev, { id: Date.now().toString(), name: docName.trim(), fileName: file.name, dataUrl: e.target?.result as string }]);
      setDocName(""); if (fileRef.current) fileRef.current.value = "";
      setDocToast(true); setTimeout(() => setDocToast(false), 2500);
    };
    reader.readAsDataURL(file);
  }

  function handleSaveProfile() {
    setSavedProfile({ ...profile });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 2500);
  }

  const sl = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all";
  const il = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Playfair Display', serif; }
        .hero-bg {
          background: linear-gradient(135deg, #0f2044 0%, #1a3360 40%, #1d4ed8 100%);
        }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
        .shine-btn { position: relative; overflow: hidden; }
        .shine-btn::after { content:''; position:absolute; top:-50%; left:-75%; width:50%; height:200%; background:rgba(255,255,255,0.15); transform:skewX(-20deg); transition:left 0.4s; }
        .shine-btn:hover::after { left:125%; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f1f5f9; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        tr.rec-row { border-left: 3px solid #1d4ed8 !important; }
        tr.norm-row { border-left: 3px solid transparent; }
      `}</style>

      <div className="min-h-screen" style={{ background: "#f8fafc" }}>

        {/* ── NAVBAR ── */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100" style={{ boxShadow: "0 1px 8px rgba(15,32,68,0.08)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center h-16 gap-4">

              {/* Logo */}
              <div className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer" onClick={() => setActiveNav("home")}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg" style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)" }}>🎓</div>
                <p className="font-display font-bold text-slate-900 text-[17px] leading-none">ScholarHub</p>
              </div>

              {/* Nav tabs */}
              <nav className="hidden md:flex items-center gap-1 ml-3">
                {(["home","scholarships","contact"] as const).map(k => {
                  const labels: Record<string,string> = { home: t.navHome, scholarships: t.navScholarships, contact: t.navContact };
                  const active = activeNav === k;
                  return (
                    <button key={k} onClick={() => setActiveNav(k)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${active ? "text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                      style={active ? { background: "linear-gradient(135deg,#0f2044,#1d4ed8)" } : {}}>
                      {labels[k]}
                    </button>
                  );
                })}
              </nav>

              {/* Search */}
              <div className="flex-1 mx-2 hidden lg:flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder={t.searchPlaceholder} className="bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 w-full" />
                {searchName && <button onClick={() => setSearchName("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>}
              </div>

              {/* Right section */}
              <div className="flex items-center gap-2 ml-auto">

                {/* Notification bell */}
                <div className="relative flex-shrink-0" ref={notifPanelRef}>
                  <button
                    onClick={() => {
                      setShowNotifPanel(v => !v);
                      if (!showNotifPanel && unreadCount > 0) {
                        // Mark all as read when opening
                        fetch("/api/student/notifications", { method: "PATCH" })
                          .then(() => { setUnreadCount(0); setStudentNotifs(prev => prev.map(n => ({ ...n, isRead: true }))); })
                          .catch(() => {});
                      }
                    }}
                    className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all flex-shrink-0">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {showNotifPanel && (
                    <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100" style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
                        <p className="text-white font-bold text-sm">🔔 Notifications</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {studentNotifs.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-2xl mb-2">🔔</p>
                            <p className="text-slate-400 text-sm">No notifications yet</p>
                          </div>
                        ) : studentNotifs.map(n => (
                          <div key={n._id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-blue-50" : ""}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-base mt-0.5">{n.type === "reply" ? "💬" : "🎓"}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative flex-shrink-0" ref={profileDropdownRef}>
                  <button onClick={() => setShowProfileDropdown(v => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-white px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: "linear-gradient(135deg,#1d4ed8,#0f2044)" }}>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {(session?.user?.name || "U")[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:inline">{session?.user?.name?.split(" ")[0] || "Profile"}</span>
                    <svg className={`w-3 h-3 text-white/70 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      {/* User info header */}
                      <div className="px-4 pt-4 pb-3 border-b border-slate-100" style={{ background: "linear-gradient(135deg,#0f2044,#1a3360)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "rgba(255,255,255,0.15)" }}>
                            {(session?.user?.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{session?.user?.name || "Student"}</p>
                            <p className="text-white/60 text-[11px]">{session?.user?.email || "student@example.com"}</p>
                            <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-full">◎ STUDENT</span>
                          </div>
                        </div>
                      </div>
                      {/* Menu items */}
                      <div className="p-2">
                        {[
                          { icon: "👤", label: t.studentProfile, color: "bg-blue-100", action: () => { setActiveNav("studentProfile"); setShowProfileDropdown(false); } },
                          { icon: "📁", label: t.docWallet, color: "bg-teal-100", action: () => { setActiveNav("documents"); setShowProfileDropdown(false); } },
                          { icon: "🔖", label: t.savedScholarships, color: "bg-amber-100", action: () => { setActiveNav("savedScholarships"); setShowProfileDropdown(false); } },
                          { icon: "💬", label: t.navContact, color: "bg-purple-100", action: () => { setActiveNav("contact"); setShowProfileDropdown(false); } },
                        ].map(({ icon, label, color, action }) => (
                          <button key={label} onClick={action}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${color}`}>{icon}</div>
                            {label}
                          </button>
                        ))}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100">
  <Image src="/logout.png" alt="logout" width={16} height={16} />
</div>
                            {t.logout}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile search */}
            <div className="lg:hidden pb-3">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-200 focus-within:bg-white focus-within:border-blue-400 transition-all">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder={t.searchPlaceholder} className="bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 w-full" />
              </div>
            </div>
          </div>
        </header>

        {/* ── STUDENT PROFILE PAGE ── */}
        {activeNav === "studentProfile" && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <button onClick={() => setActiveNav("home")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors">{t.backToHome}</button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>
              <div className="px-6 py-6" style={{ background: "linear-gradient(135deg,#0f2044,#1a3360)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "rgba(255,255,255,0.15)" }}>👤</div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-bold text-white">{session?.user?.name || t.studentProfile}</h2>
                    <p className="text-white/70 text-sm">{session?.user?.email || "Update your profile to find scholarships"}</p>
                  </div>
                  {savedProfile && (
                    <div className="text-center bg-white/10 rounded-xl px-4 py-2.5">
                      <p className="text-white/60 text-[10px] uppercase tracking-wide font-bold">Matched</p>
                      <p className="text-white font-bold text-2xl">{recCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{t.editProfile}</h3>
              <p className="text-xs text-slate-400 mb-5">Fill your details to get personalized scholarship recommendations</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.incomeField}</label>
                  <input type="number" placeholder="e.g. 250000" value={profile.income} onChange={e => setProfile({ ...profile, income: e.target.value })} className={il} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.categoryField}</label>
                  <select value={profile.category} onChange={e => setProfile({ ...profile, category: e.target.value })} className={sl}>{CAST_OPTIONS.map(c => <option key={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.courseField}</label>
                  <select value={profile.course} onChange={e => setProfile({ ...profile, course: e.target.value })} className={sl}>
                    <option value="Any">{t.anyOpt}</option><option value="School">{t.school}</option><option value="Engineering">{t.engineering}</option><option value="Medical">{t.medical}</option><option value="Arts">{t.arts}</option><option value="Commerce">{t.commerce}</option><option value="Science">{t.science}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.genderField}</label>
                  <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })} className={sl}>
                    <option value="Any">{t.genderAny}</option><option value="Male">{t.genderMale}</option><option value="Female">{t.genderFemale}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.stateField}</label>
                  <select value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} className={sl}>{STATES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
              </div>

              {profileSavedToast && <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl px-4 py-2.5">✅ Profile saved! {recCount} scholarships matched.</div>}

              <div className="flex gap-3 mt-5">
                <button onClick={handleSaveProfile}
                  className="shine-btn flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)", boxShadow: "0 2px 8px rgba(29,78,216,0.25)" }}>
                  {t.updateProfile}
                </button>
                {savedProfile && (
                  <button onClick={() => { setSavedProfile(null); setProfile({ income:"", category:"SC", course:"Any", state:"Any", gender:"Any" }); }}
                    className="px-5 py-3 rounded-xl text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all">
                    Clear ✕
                  </button>
                )}
              </div>
            </div>

            {/* Saved profile preview */}
            {savedProfile && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>
                <h3 className="font-bold text-slate-800 text-lg mb-4">Your Saved Profile</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[[`💰 ${t.incomeField}`,`₹${parseInt(savedProfile.income||"0").toLocaleString("en-IN")}`],[`🏷️ ${t.categoryField}`,savedProfile.category],[`📚 ${t.courseField}`,courseLabel(savedProfile.course)],[`🗺️ ${t.stateField}`,savedProfile.state],[`👤 ${t.genderField}`,savedProfile.gender==="Male"?t.genderMale:savedProfile.gender==="Female"?t.genderFemale:t.genderAny]].map(([l,v]) => (
                    <div key={l} className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{l}</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveNav("scholarships")}
                  className="shine-btn w-full mt-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg,${C.green},${C.recGreen})` }}>
                  View {recCount} Matched Scholarships →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS PAGE ── */}
        {activeNav === "documents" && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <button onClick={() => setActiveNav("home")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors">{t.backToHome}</button>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>
              <div className="px-6 py-6" style={{ background: "linear-gradient(135deg,#0f2044,#1a3360)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "rgba(255,255,255,0.15)" }}>📁</div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-bold text-white">{t.docWallet}</h2>
                    <p className="text-white/70 text-sm">{t.docWalletDesc}</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl px-4 py-2.5">
                    <p className="text-white/60 text-[10px] uppercase tracking-wide font-bold">Total</p>
                    <p className="text-white font-bold text-2xl">{docs.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-xs text-blue-700 font-medium flex items-start gap-2">
              <span>{t.secureNote}</span>
            </div>

            {/* Add Document */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>
              <h3 className="font-bold text-slate-800 text-lg mb-4">{t.addDocument}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{t.docName}</label>
                  <input type="text" placeholder="e.g. Aadhaar Card" value={docName} onChange={e => setDocName(e.target.value)} className={il} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{t.docFile}</label>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs bg-white text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 file:font-bold" />
                </div>
              </div>
              <button onClick={handleDocAdd}
                className="shine-btn w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)" }}>
                + {t.addDocument}
              </button>
              {docToast && <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl px-4 py-2.5">✅ {t.docAdded}</div>}
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>
              <h3 className="font-bold text-slate-800 text-lg mb-4">All Documents ({docs.length})</h3>
              {docs.length === 0
                ? <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">📂 {t.noDocuments}</div>
                : <div className="space-y-2">
                  {docs.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl flex-shrink-0">{d.fileName.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{d.name}</p>
                          <p className="text-xs text-slate-400 truncate">{d.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <a href={d.dataUrl} download={d.fileName} className="text-xs text-blue-600 hover:underline font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50">↓ Download</a>
                        <button onClick={() => setDocs(prev => prev.filter(x => x.id !== d.id))} className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50">{t.remove}</button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        )}

        {/* ── SAVED SCHOLARSHIPS PAGE ── */}
        {activeNav === "savedScholarships" && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <button onClick={() => setActiveNav("home")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors">{t.backToHome}</button>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>
              <div className="px-6 py-6" style={{ background: "linear-gradient(135deg,#b45309,#d97706)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "rgba(255,255,255,0.15)" }}>🔖</div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-bold text-white">{t.savedScholarships}</h2>
                    <p className="text-white/80 text-sm">{t.savedScholarshipsDesc}</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-xl px-4 py-2.5">
                    <p className="text-white/70 text-[10px] uppercase tracking-wide font-bold">Saved</p>
                    <p className="text-white font-bold text-2xl">{savedList.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {savedList.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="text-5xl mb-4">🔖</div>
                <p className="text-slate-500 font-semibold text-base mb-2">{t.noSaved}</p>
                <button onClick={() => setActiveNav("scholarships")}
                  className="mt-4 shine-btn px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)" }}>
                  Browse Scholarships →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedList.map(s => (
                  <div key={s._id || s.id} className="bg-white rounded-2xl border border-slate-200 p-5 card-hover" style={{ boxShadow: "0 2px 12px rgba(15,32,68,0.06)" }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-bold text-slate-800 text-sm leading-snug flex-1">{sName(s)}</h3>
                      <button
                        onClick={() => {
                          const id = String(s._id || s.id);
                          setSavedScholarships(prev => prev.filter(x => x !== id));
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-400 text-white hover:bg-red-500 transition-all flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catBadge(s.category)}`}>{sCategory(s)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lvlBadge(s.level)}`}>{s.level === "Central" ? t.central : s.level === "State" ? t.stateLvl : t.trust}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{sAmount(s)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{s.description}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDetailS(s)}
                        className="flex-1 text-xs font-bold px-3 py-2 rounded-lg text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)" }}>
                        {t.details}
                      </button>
                      <button onClick={() => setApplyS(s)}
                        className="flex-1 shine-btn text-xs font-bold px-3 py-2 rounded-lg text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                        {t.apply}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CONTACT PAGE ── */}
        {activeNav === "contact" && (
          <div className="max-w-2xl mx-auto px-4 py-12">
            <button onClick={() => setActiveNav("home")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-8 transition-colors">{t.backToHome}</button>
            <div className="bg-white rounded-2xl border border-slate-200 p-8" style={{ boxShadow: "0 4px 32px rgba(15,32,68,0.08)" }}>
              <h2 className="font-display text-3xl font-bold text-slate-900 mb-1">{t.contactTitle}</h2>
              <p className="text-sm text-slate-400 mb-8">{t.contactSub}</p>
              {contactSent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-emerald-600 font-semibold text-lg">{t.contactSent}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.contactName}</label><input value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} className={il} placeholder="Your name" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.contactEmail}</label><input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className={il} placeholder="your@email.com" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.contactMsg}</label><textarea value={contactForm.msg} onChange={e => setContactForm({ ...contactForm, msg: e.target.value })} rows={5} className={`${il} resize-none`} placeholder="How can we help you?" /></div>
                  <button onClick={() => setContactSent(true)} className="shine-btn w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)" }}>{t.contactSend}</button>
                </div>
              )}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-center text-xs text-slate-500">
                {[["📧","Email","support@scholarhub.in"],["📞","Phone","1800-XXX-XXXX"],["⏰","Hours","Mon–Sat 9am–6pm"]].map(([e,l,v]) => (
                  <div key={l}><div className="text-2xl mb-2">{e}</div><div className="font-bold text-slate-700 text-sm">{l}</div><div>{v}</div></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT (HOME / SCHOLARSHIPS) ── */}
        {(activeNav === "home" || activeNav === "scholarships") && (<>

          {/* Hero Banner */}
          <section className="hero-bg px-4 sm:px-6 py-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-2">{t.tagline}</h1>
                  <p className="text-blue-200 text-sm font-medium">Central & Gujarat Government · Trusts · NGOs</p>
                </div>
                {/* Stat pills */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { emoji:"🎓", label: t.totalScholarships, value: SCHOLARSHIPS.length },
                    { emoji:"⭐", label: t.recommended, value: recCount },
                  ].map(({ emoji, label, value }) => (
                    <div key={label} className="bg-white/10 border border-white/20 rounded-2xl px-7 py-4 text-center backdrop-blur-sm">
                      <p className="text-3xl font-bold text-white">{emoji} {value}</p>
                      <p className="text-blue-200 text-xs font-semibold mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Quick Profile Form */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 mb-4 relative z-10">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-hover" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{ background: "linear-gradient(to right,#f8fafc,#f0f4ff)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)" }}>👤</div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">{t.studentProfile}</h2>
                  {session?.user?.name && <p className="text-xs text-blue-600 font-medium">Welcome, {session.user.name}!</p>}
                </div>
                {savedProfile && (
                  <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    ✅ {recCount} {t.scholarshipsRecommended}
                  </span>
                )}
                <button onClick={() => setActiveNav("studentProfile")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 ${savedProfile ? '' : 'ml-auto'}`}
                  style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)" }}>
                  {t.editProfile} →
                </button>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="lg:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.incomeField}</label>
                    <input type="number" placeholder="e.g. 250000" value={profile.income} onChange={e => setProfile({ ...profile, income: e.target.value })} className={il} />
                  </div>
                  {[
                    { lbl: t.categoryField, el: <select value={profile.category} onChange={e => setProfile({ ...profile, category: e.target.value })} className={sl}>{CAST_OPTIONS.map(c => <option key={c}>{c}</option>)}</select> },
                    { lbl: t.courseField, el: <select value={profile.course} onChange={e => setProfile({ ...profile, course: e.target.value })} className={sl}><option value="Any">{t.anyOpt}</option><option value="School">{t.school}</option><option value="Engineering">{t.engineering}</option><option value="Medical">{t.medical}</option><option value="Arts">{t.arts}</option><option value="Commerce">{t.commerce}</option><option value="Science">{t.science}</option></select> },
                    { lbl: t.genderField, el: <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })} className={sl}><option value="Any">{t.genderAny}</option><option value="Male">{t.genderMale}</option><option value="Female">{t.genderFemale}</option></select> },
                    { lbl: t.stateField, el: <select value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} className={sl}>{STATES.map(s => <option key={s}>{s}</option>)}</select> },
                  ].map(({ lbl, el }) => (
                    <div key={lbl}><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{lbl}</label>{el}</div>
                  ))}
                  <div className="flex flex-col gap-2 items-stretch">
                    <button onClick={handleSaveProfile}
                      className="shine-btn w-full py-2 px-3 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)", boxShadow: "0 2px 8px rgba(29,78,216,0.25)" }}>
                      {t.updateProfile}
                    </button>
                    {savedProfile && (
                      <button onClick={() => { setSavedProfile(null); setProfile({ income:"", category:"SC", course:"Any", state:"Any", gender:"Any" }); }}
                        className="w-full py-2 px-3 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all">
                        Clear ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4" style={{ boxShadow: "0 1px 8px rgba(15,32,68,0.06)" }}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)} className={sl}>{CATEGORY_OPTIONS.map(c => <option key={c}>{c === "All Categories" ? t.allCategories : c}</option>)}</select>
                <select value={searchCourse} onChange={e => setSearchCourse(e.target.value)} className={sl}><option value="Any">{t.allCourses}</option><option value="School">{t.school}</option><option value="Engineering">{t.engineering}</option><option value="Medical">{t.medical}</option><option value="Arts">{t.arts}</option><option value="Commerce">{t.commerce}</option><option value="Science">{t.science}</option></select>
                <select value={searchGender} onChange={e => setSearchGender(e.target.value)} className={sl}><option value="Any">{t.genderField}: {t.genderAny}</option><option value="Male">👨 {t.genderMale}</option><option value="Female">👩 {t.genderFemale}</option></select>
                <select value={searchLevel} onChange={e => setSearchLevel(e.target.value)} className={sl}>{LEVEL_OPTIONS.map(l => <option key={l}>{l === "All Levels" ? t.allLevels : l === "State" ? t.stateLvl : l === "Central" ? t.central : t.trust}</option>)}</select>
                <select value={searchState} onChange={e => setSearchState(e.target.value)} className={sl}><option value="Any">{t.stateField}: {t.anyOpt}</option>{STATES.filter(s => s !== "Any").map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-semibold">{displayed.length} {t.showing}</span>
                {hasFilters && (
                  <button onClick={clearFilters}
                    className="shine-btn text-xs font-bold text-white px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)" }}>
                    Clear all ✕
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Scholarship Table */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(15,32,68,0.08)" }}>

              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#0f2044,#1a3360)" }}>
                <span className="text-xl">🏆</span>
                <h2 className="font-display font-bold text-white text-lg">{t.scholarships}</h2>
                <span className="ml-auto text-xs font-bold text-white/70 bg-white/10 border border-white/20 px-3 py-1 rounded-full">{displayed.length} {t.showing}</span>
              </div>

              <div className="overflow-x-auto">
                {scholarshipsLoading ? (
                  <div className="text-center py-20">
                    <div className="inline-block w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 text-sm font-medium">Loading scholarships...</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th className="text-left px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.name}</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.level}</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.courseCol}</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.stateCol}</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.amount}</th>
                        <th className="px-4 py-3.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((s, i) => {
                        const rec = isRecommended(s, savedProfile);
                        const id = String(s._id || s.id);
                        return (
                          <tr key={id}
                            className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${rec ? "rec-row" : "norm-row"}`}
                            style={{ background: i % 2 === 0 ? "#ffffff" : "#fafbff" }}>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1.5">
                                {rec && (
                                  <span className="inline-flex items-center self-start text-[10px] font-bold text-white px-2.5 py-0.5 rounded-md" style={{ background: C.green }}>
                                    ⭐ {t.recommended_badge}
                                  </span>
                                )}
                                <span className="font-semibold text-slate-800 text-sm leading-snug">{sName(s)}</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catBadge(s.category)}`}>{sCategory(s)}</span>
                                  {s.gender !== "Any" && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.gender === "Female" ? "bg-pink-50 text-pink-700 border border-pink-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                                      {s.gender === "Female" ? "👩 "+t.genderFemale : "👨 "+t.genderMale}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${lvlBadge(s.level)}`}>
                                {s.level === "Central" ? t.central : s.level === "State" ? t.stateLvl : t.trust}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.course === "School" ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-violet-50 text-violet-700 border border-violet-200"}`}>
                                {s.course === "School" ? t.school : "College"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-500 text-xs font-medium">{s.state}</td>
                            <td className="px-4 py-4">
                              <span className="font-bold text-emerald-700 text-sm">{sAmount(s)}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2 items-center">
                                <button onClick={() => setDetailS(s)}
                                  className="text-xs font-bold px-3.5 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                                  style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)" }}>
                                  {t.details}
                                </button>
                                <button onClick={() => setApplyS(s)}
                                  className="shine-btn text-xs font-bold px-3.5 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                                  style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                                  {t.apply}
                                </button>
                                <button
                                  onClick={() => {
                                    setNotifiedScholarships(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                                  }}
                                  title="Set deadline reminder"
                                  className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${notifiedScholarships.includes(id) ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500"}`}>
                                  <svg className="w-3.5 h-3.5" fill={notifiedScholarships.includes(id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                </button>
                                <button
                                  onClick={() => {
                                    setSavedScholarships(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                                  }}
                                  title="Save scholarship"
                                  className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${savedScholarships.includes(id) ? "bg-amber-400 border-amber-400 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-amber-400 hover:text-amber-500"}`}>
                                  <svg className="w-3.5 h-3.5" fill={savedScholarships.includes(id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {displayed.length === 0 && !scholarshipsLoading && (
                        <tr><td colSpan={6} className="text-center py-20">
                          <div className="text-5xl mb-4">🔍</div>
                          <p className="text-slate-500 font-semibold text-base">{t.noResults}</p>
                          {hasFilters && <button onClick={clearFilters} className="mt-3 text-sm text-blue-600 font-bold hover:underline">Clear all filters</button>}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </>)}

        {/* ── DETAILS MODAL ── */}
        {detailS && (
          <Modal onClose={() => setDetailS(null)}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "linear-gradient(135deg,#0f2044,#1d4ed8)" }}>🎓</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-xl font-bold text-slate-900 leading-snug">{sName(detailS)}</h3>
                <div className="flex gap-2 flex-wrap mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catBadge(detailS.category)}`}>{sCategory(detailS)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lvlBadge(detailS.level)}`}>{detailS.level === "Central" ? t.central : detailS.level === "State" ? t.stateLvl : t.trust}</span>
                  {isRecommended(detailS, savedProfile) && <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: C.green }}>⭐ {t.recommended_badge}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[["💰 Amount", sAmount(detailS)],[`📅 ${t.lastDate}`, sLastDate(detailS)],["📚 Course", detailS.course === "School" ? t.school : "College"],["🗺️ State", detailS.state]].map(([l,v]) => (
                <div key={l} className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{l}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {[{ title: t.description, content: detailS.description },{ title: t.eligibility, content: detailS.eligibility },{ title: t.documents, content: detailS.documents || "—" }].map(({ title, content }) => (
              <div key={title} className="mb-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">{title}</p>
                <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 leading-relaxed">{content}</p>
              </div>
            ))}
            <div className="flex gap-3 mt-5 flex-wrap">
              {detailS.applyLink && <a href={detailS.applyLink} target="_blank" rel="noopener noreferrer" className="shine-btn flex-1 text-center text-sm font-bold text-white py-2.5 rounded-xl transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg,${C.green},${C.recGreen})` }}>{t.applyNow}</a>}
              {detailS.youtubeLink && <a href={detailS.youtubeLink} target="_blank" rel="noopener noreferrer" className="shine-btn flex items-center gap-2 text-sm font-bold text-white py-2.5 px-5 rounded-xl transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>{t.howToFill}</a>}
            </div>
          </Modal>
        )}

        {/* ── APPLY MODAL ── */}
        {applyS && (
          <Modal onClose={() => setApplyS(null)}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `linear-gradient(135deg,${C.green},${C.recGreen})` }}>📋</div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{t.applyModal}</p>
                <h3 className="font-display text-lg font-bold text-slate-900 leading-snug">{sName(applyS)}</h3>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">⏰</span>
              <div><p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">{t.lastDateLabel}</p><p className="font-bold text-red-700 text-base">{sLastDate(applyS)}</p></div>
            </div>
            {applyS.documents && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">{t.documents}</p>
                <div className="space-y-1.5">
                  {applyS.documents.split(",").map((doc, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      <span className="text-blue-500 text-xs">📄</span>
                      <span className="text-sm text-slate-600">{doc.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">{t.stepsTitle}</p>
              <ol className="space-y-2">
                {t.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    <span className="text-sm text-amber-900">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex gap-3 flex-wrap">
              {applyS.applyLink && <a href={applyS.applyLink} target="_blank" rel="noopener noreferrer" className="shine-btn flex-1 text-center text-sm font-bold text-white py-2.5 rounded-xl hover:opacity-90 transition-all" style={{ background: `linear-gradient(135deg,${C.green},${C.recGreen})` }}>{t.applyOnSite}</a>}
              {applyS.youtubeLink && <a href={applyS.youtubeLink} target="_blank" rel="noopener noreferrer" className="shine-btn flex items-center gap-2 text-sm font-bold text-white py-2.5 px-5 rounded-xl hover:opacity-90 transition-all" style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>{t.watchVideo}</a>}
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl ${wide ? "max-w-xl" : "max-w-lg"} w-full max-h-[90vh] overflow-y-auto p-6 relative`}
        style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.25)", animation: "modalIn 0.2s ease-out" }}
        onClick={e => e.stopPropagation()}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold transition-colors">✕</button>
        {children}
      </div>
    </div>
  );
}