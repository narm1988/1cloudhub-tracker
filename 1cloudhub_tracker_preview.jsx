import React, { useState } from "react";
import {
  LayoutGrid, Users, Settings, Search, Plus, Flag, BookOpen,
  ChevronDown, ChevronRight, X, Mail, Lock, Eye, EyeOff,
  MoreHorizontal, ArrowLeft, Shield, Bell, Filter, Cloud
} from "lucide-react";

/* ---------------------------------------------------------------
   1CLOUDHUB TRACKER — design tokens
---------------------------------------------------------------- */
const C = {
  ink: "#14171F",
  inkSoft: "#1C2030",
  inkFaint: "#2A2F42",
  paper: "#F5F6F8",
  card: "#FFFFFF",
  brand: "#5B5FEF",
  brandDeep: "#4548C9",
  brandSoft: "#EEF0FE",
  success: "#1E9E6B",
  successSoft: "#E7F6EF",
  warning: "#C6820F",
  warningSoft: "#FBF0DD",
  danger: "#E5484D",
  dangerSoft: "#FDECEC",
  info: "#3B82F6",
  infoSoft: "#EAF1FE",
  slate: "#6B7280",
  slateSoft: "#F0F1F3",
  textPrimary: "#14171F",
  textSecondary: "#6B7280",
  textFaint: "#9CA3AF",
  border: "#E6E7EB",
  borderSoft: "#F0F1F3",
};

const fontDisplay = "'Space Grotesk', sans-serif";
const fontBody = "'Inter', sans-serif";
const fontMono = "'IBM Plex Mono', monospace";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; }
    ::selection { background: ${C.brandSoft}; }
  `}</style>
);

/* Status pipeline requested: Created -> Draft -> Submitted -> Resolved
   (kept extensible — more statuses can slot in later, e.g. In Review) */
const STATUS_META = {
  Created: { color: C.slate, soft: C.slateSoft },
  Draft: { color: C.warning, soft: C.warningSoft },
  Submitted: { color: C.info, soft: C.infoSoft },
  Resolved: { color: C.success, soft: C.successSoft },
};
const STATUSES = Object.keys(STATUS_META);

/* ---------------------------------------------------------------
   Shared bits
---------------------------------------------------------------- */
const Avatar = ({ name, size = 26 }) => {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const hues = ["#5B5FEF", "#1E9E6B", "#C6820F", "#E5484D", "#3B82F6", "#8B5CF6"];
  const hue = hues[name.length % hues.length];
  return (
    <div
      title={name}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: hue, color: "#fff", fontFamily: fontBody,
        fontWeight: 600, fontSize: size * 0.4,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

const Perforation = ({ color = C.border }) => (
  <div
    style={{
      height: 1,
      backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1.4px)`,
      backgroundSize: "7px 1px",
      backgroundRepeat: "repeat-x",
      margin: "10px 0",
    }}
  />
);

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status];
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 600, color: m.color, background: m.soft,
        padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
};

/* ---------------------------------------------------------------
   LOGIN SCREEN — 1CloudHub branded
---------------------------------------------------------------- */
function LoginScreen({ onSignIn }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", fontFamily: fontBody, background: C.paper }}>
      {/* Left — brand panel */}
      <div
        style={{
          flex: "0 0 44%", background: C.ink, color: "#fff",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "48px 56px", position: "relative", overflow: "hidden",
        }}
        className="hidden md:flex"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Cloud size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1 }}>1CloudHub</div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "#8B90A6", marginTop: 2 }}>TRACKER</div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 360 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 32, fontWeight: 600, lineHeight: 1.25, marginBottom: 14 }}>
            Where 1CloudHub tracks the work.
          </div>
          <p style={{ color: "#A3A8BD", fontSize: 15, lineHeight: 1.6 }}>
            Epics and user stories for our internal delivery — created, assigned
            and resolved in one place.
          </p>
        </div>

        {/* Ticket stub illustration */}
        <div style={{ position: "relative", height: 150 }}>
          {[
            { rot: -6, top: 30, bg: C.inkFaint, accent: C.brand, id: "1CH-101" },
            { rot: 3, top: 14, bg: C.inkFaint, accent: C.success, id: "1CH-102" },
            { rot: -1, top: 0, bg: C.inkSoft, accent: C.warning, id: "1CH-103" },
          ].map((t, i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: 0, top: t.top, width: 300, height: 56,
                background: t.bg, borderRadius: 8, transform: `rotate(${t.rot}deg)`,
                display: "flex", alignItems: "center", padding: "0 16px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                borderLeft: `4px solid ${t.accent}`,
              }}
            >
              <span style={{ fontFamily: fontMono, fontSize: 11, color: "#8B90A6", letterSpacing: "0.02em" }}>
                {t.id}
              </span>
              <div
                style={{
                  flex: 1, height: 1, margin: "0 10px",
                  backgroundImage: "radial-gradient(circle, #3A3F55 1px, transparent 1.4px)",
                  backgroundSize: "6px 1px",
                }}
              />
              <span style={{ width: 60, height: 8, borderRadius: 4, background: "#3A3F55" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 6 }} className="md:hidden">
            1CloudHub Tracker
          </div>
          <h1 style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: C.textPrimary, margin: "0 0 4px" }}>
            Sign in
          </h1>
          <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 28 }}>
            Use the workspace email your admin invited you with.
          </p>

          <label style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 6 }}>
            Email address
          </label>
          <div style={{ position: "relative", marginBottom: 18 }}>
            <Mail size={16} color={C.textFaint} style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@1cloudhub.com"
              style={{
                width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 14, fontFamily: fontBody,
                outline: "none", color: C.textPrimary,
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Password</label>
            <a href="#" style={{ fontSize: 13, color: C.brand, textDecoration: "none" }}>Forgot?</a>
          </div>
          <div style={{ position: "relative", marginBottom: 24 }}>
            <Lock size={16} color={C.textFaint} style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••••"
              style={{
                width: "100%", padding: "10px 36px 10px 36px", borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 14, fontFamily: fontBody,
                outline: "none", color: C.textPrimary,
              }}
            />
            <button
              onClick={() => setShowPw((s) => !s)}
              style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", cursor: "pointer" }}
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff size={16} color={C.textFaint} /> : <Eye size={16} color={C.textFaint} />}
            </button>
          </div>

          <button
            onClick={onSignIn}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
              background: C.brand, color: "#fff", fontFamily: fontBody, fontWeight: 600,
              fontSize: 14, cursor: "pointer",
            }}
          >
            Sign in
          </button>

          <Perforation />

          <p style={{ fontSize: 13, color: C.textSecondary, textAlign: "center" }}>
            No account? Ask your workspace admin to send you an invite.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   MOCK DATA
---------------------------------------------------------------- */
const CURRENT_USER = "Maya Reyes";

const PEOPLE = [
  { name: "Maya Reyes", email: "maya@1cloudhub.com", role: "Admin", projects: ["Client Onboarding", "Cloud Migration"] },
  { name: "Kunal Shah", email: "kunal@1cloudhub.com", role: "Member", projects: ["Client Onboarding"] },
  { name: "Priya Nair", email: "priya@1cloudhub.com", role: "Member", projects: ["Managed Services"] },
  { name: "Tom Becker", email: "tom@1cloudhub.com", role: "Member", projects: ["Cloud Migration"] },
];

const EPICS = [
  { id: "1CH-E1", title: "Client Onboarding Automation", owner: "Maya Reyes", description: "Self-serve setup flow for new managed-services clients." },
  { id: "1CH-E2", title: "Cloud Migration Dashboard", owner: "Kunal Shah", description: "Live tracker for AWS/Azure migration workstreams." },
  { id: "1CH-E3", title: "Managed Services Reporting", owner: "Priya Nair", description: "Monthly SLA and uptime reporting for clients." },
];

const initialStories = [
  { id: "1CH-101", epicId: "1CH-E1", title: "Design self-serve onboarding checklist", status: "In Progress" in STATUS_META ? "Submitted" : "Submitted", assignee: "Kunal Shah", createdBy: "Maya Reyes" },
  { id: "1CH-102", epicId: "1CH-E1", title: "Draft welcome-email template for new clients", status: "Draft", assignee: "Priya Nair", createdBy: "Maya Reyes" },
  { id: "1CH-103", epicId: "1CH-E1", title: "Set up admin invite workflow", status: "Resolved", assignee: "Maya Reyes", createdBy: "Maya Reyes" },
  { id: "1CH-104", epicId: "1CH-E2", title: "Pull migration status from Nimbus API", status: "Submitted", assignee: "Tom Becker", createdBy: "Kunal Shah" },
  { id: "1CH-105", epicId: "1CH-E2", title: "Build workload-by-region chart", status: "Created", assignee: "Kunal Shah", createdBy: "Kunal Shah" },
  { id: "1CH-106", epicId: "1CH-E3", title: "Define SLA breach notification rules", status: "Draft", assignee: "Priya Nair", createdBy: "Priya Nair" },
  { id: "1CH-107", epicId: "1CH-E3", title: "Monthly uptime PDF export", status: "Resolved", assignee: "Priya Nair", createdBy: "Maya Reyes" },
];

const NOTIFICATIONS = [
  { id: 1, text: "Kunal Shah tagged you to resolve 1CH-103", time: "10m ago", unread: true },
  { id: 2, text: "Priya Nair submitted 1CH-106 for review", time: "1h ago", unread: true },
  { id: 3, text: "Tom Becker moved 1CH-104 to Submitted", time: "3h ago", unread: false },
  { id: 4, text: "Epic “Cloud Migration Dashboard” has 2 open stories", time: "Yesterday", unread: false },
];

/* ---------------------------------------------------------------
   STORY CARD — ticket-stub signature element
---------------------------------------------------------------- */
function StoryCard({ story, onOpen }) {
  return (
    <div
      onClick={() => onOpen(story)}
      style={{
        background: C.card, borderRadius: 10, border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${STATUS_META[story.status].color}`,
        padding: "12px 14px", marginBottom: 10, cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ background: C.successSoft, borderRadius: 5, padding: 3, display: "flex" }}>
            <BookOpen size={12} color={C.success} />
          </div>
          <span style={{ fontFamily: fontMono, fontSize: 11.5, color: C.textFaint }}>{story.id}</span>
        </div>
        <MoreHorizontal size={14} color={C.textFaint} />
      </div>

      <div
        style={{
          height: 1, margin: "9px 0",
          backgroundImage: `radial-gradient(circle, ${C.borderSoft} 1.1px, transparent 1.6px)`,
          backgroundSize: "6px 1px", backgroundRepeat: "repeat-x",
        }}
      />

      <div style={{ fontSize: 13.5, color: C.textPrimary, fontWeight: 500, lineHeight: 1.4, marginBottom: 10 }}>
        {story.title}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10.5, color: C.textFaint }}>Resolver</span>
          <Avatar name={story.assignee} size={20} />
        </div>
        <StatusBadge status={story.status} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   MODALS
---------------------------------------------------------------- */
function Modal({ title, onClose, children, width = 440 }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(20,23,31,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, width, maxWidth: "92vw", padding: 24, fontFamily: fontBody }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 600, margin: 0, color: C.textPrimary }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} color={C.textFaint} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${C.border}`,
  fontSize: 13.5, fontFamily: fontBody, outline: "none", color: C.textPrimary, marginBottom: 14,
};
const labelStyle = { fontSize: 12.5, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 6 };

function NewEpicModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState(PEOPLE[0].name);
  const [description, setDescription] = useState("");
  return (
    <Modal title="New epic" onClose={onClose}>
      <label style={labelStyle}>Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Partner Portal Revamp" />

      <label style={labelStyle}>Owner</label>
      <select style={inputStyle} value={owner} onChange={(e) => setOwner(e.target.value)}>
        {PEOPLE.map((p) => <option key={p.email}>{p.name}</option>)}
      </select>

      <label style={labelStyle}>Description</label>
      <textarea
        style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What does this epic cover?"
      />

      <button
        onClick={() => { onCreate({ title, owner, description }); onClose(); }}
        style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: C.brand, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
      >
        Create epic
      </button>
    </Modal>
  );
}

function NewStoryModal({ epic, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(PEOPLE[0].name);
  const [status, setStatus] = useState("Created");
  const [description, setDescription] = useState("");
  return (
    <Modal title={`New user story — ${epic.title}`} onClose={onClose}>
      <label style={labelStyle}>Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="As a client, I can track my migration status" />

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Tag person to resolve</label>
          <select style={inputStyle} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {PEOPLE.map((p) => <option key={p.email}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <label style={labelStyle}>Description</label>
      <textarea
        style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add details…"
      />

      <button
        onClick={() => { onCreate({ title, assignee, status, epicId: epic.id }); onClose(); }}
        style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: C.brand, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
      >
        Create story
      </button>
    </Modal>
  );
}

function StoryDetailModal({ story, onClose, onUpdate }) {
  const [status, setStatus] = useState(story.status);
  const [assignee, setAssignee] = useState(story.assignee);
  return (
    <Modal title={story.id} onClose={onClose}>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>{story.title}</div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Tagged to resolve</label>
          <select style={inputStyle} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {PEOPLE.map((p) => <option key={p.email}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 14 }}>Created by {story.createdBy}</div>

      <button
        onClick={() => { onUpdate({ ...story, status, assignee }); onClose(); }}
        style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: C.brand, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
      >
        Save changes
      </button>
    </Modal>
  );
}

function InviteModal({ onClose }) {
  return (
    <Modal title="Invite a teammate" onClose={onClose}>
      <label style={labelStyle}>Email address</label>
      <input style={inputStyle} placeholder="name@1cloudhub.com" />

      <label style={labelStyle}>Role</label>
      <select style={inputStyle}>
        <option>Member</option>
        <option>Admin</option>
      </select>

      <label style={labelStyle}>Add to projects</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {["Client Onboarding", "Cloud Migration", "Managed Services"].map((p) => (
          <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textPrimary }}>
            <input type="checkbox" /> {p}
          </label>
        ))}
      </div>

      <button
        onClick={onClose}
        style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: C.brand, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
      >
        Send invite
      </button>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   TOP BAR — welcome message + notifications bell
---------------------------------------------------------------- */
function TopBar({ user, page }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div style={{ height: 60, background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 14, flexShrink: 0, position: "relative" }}>
      <div style={{ position: "relative", width: 280 }}>
        <Search size={14} color={C.textFaint} style={{ position: "absolute", left: 10, top: 9 }} />
        <input
          placeholder="Search 1CH-104, “migration”…"
          style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", background: C.paper }}
        />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifs((s) => !s)}
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer", display: "flex" }}
            aria-label="Notifications"
          >
            <Bell size={18} color={C.textSecondary} />
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: -3, right: -3, width: 15, height: 15, borderRadius: "50%", background: C.danger, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{ position: "absolute", top: 30, right: 0, width: 300, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 60, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                Notifications
              </div>
              {NOTIFICATIONS.map((n) => (
                <div key={n.id} style={{ display: "flex", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${C.borderSoft}`, background: n.unread ? C.brandSoft : "#fff" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: n.unread ? C.brand : "transparent", marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, color: C.textPrimary, lineHeight: 1.4 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <span style={{ fontSize: 13.5, color: C.textSecondary }}>
          Welcome, <strong style={{ color: C.textPrimary, fontWeight: 600 }}>{user}</strong>
        </span>
        <Avatar name={user} size={30} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   DASHBOARD SCREEN
---------------------------------------------------------------- */
function Dashboard({ onSignOut }) {
  const [page, setPage] = useState("epics");
  const [epics, setEpics] = useState(EPICS);
  const [stories, setStories] = useState(initialStories);
  const [activeEpicId, setActiveEpicId] = useState(null);
  const [showNewEpic, setShowNewEpic] = useState(false);
  const [showNewStory, setShowNewStory] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [openStory, setOpenStory] = useState(null);

  const NAV = [
    { key: "epics", label: "Epics", icon: LayoutGrid },
    { key: "people", label: "People", icon: Users, admin: true },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  const activeEpic = epics.find((e) => e.id === activeEpicId);
  const storiesForEpic = (epicId) => stories.filter((s) => s.epicId === epicId);

  const createEpic = ({ title, owner, description }) => {
    const id = `1CH-E${epics.length + 1}`;
    setEpics([...epics, { id, title: title || "Untitled epic", owner, description }]);
  };

  const createStory = ({ title, assignee, status, epicId }) => {
    const id = `1CH-${100 + stories.length + 1}`;
    setStories([...stories, { id, epicId, title: title || "Untitled story", assignee, status, createdBy: CURRENT_USER }]);
  };

  const updateStory = (updated) => {
    setStories(stories.map((s) => (s.id === updated.id ? updated : s)));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.paper, fontFamily: fontBody }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: C.ink, color: "#fff", display: "flex", flexDirection: "column", padding: "20px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px 20px" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Cloud size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 15, lineHeight: 1 }}>1CloudHub</div>
            <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "#7B8098", marginTop: 2 }}>TRACKER</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = page === n.key;
            return (
              <button
                key={n.key}
                onClick={() => { setPage(n.key); setActiveEpicId(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left",
                  background: active ? C.inkFaint : "transparent", color: active ? "#fff" : "#A3A8BD",
                  fontSize: 13.5, fontFamily: fontBody, fontWeight: 500,
                }}
              >
                <Icon size={15} />
                {n.label}
                {n.admin && (
                  <span style={{ marginLeft: "auto", fontSize: 9.5, background: "#3A3F55", padding: "1px 5px", borderRadius: 4, color: "#C6CAD9" }}>
                    ADMIN
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "auto" }}>
          <Perforation color="#2A2F42" />
          <button
            onClick={onSignOut}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#7B8098", fontSize: 13, cursor: "pointer", padding: "6px 8px" }}
          >
            <ArrowLeft size={14} /> Back to sign in
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar user={CURRENT_USER} page={page} />

        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* EPICS LIST */}
          {page === "epics" && !activeEpic && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <h1 style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, margin: 0, color: C.textPrimary }}>Epics</h1>
                  <p style={{ fontSize: 13, color: C.textSecondary, margin: "4px 0 0" }}>{epics.length} epics · {stories.length} user stories</p>
                </div>
                <button
                  onClick={() => setShowNewEpic(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: C.brand, color: "#fff", border: "none", padding: "8px 13px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  <Plus size={14} /> New epic
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {epics.map((epic) => {
                  const epicStories = storiesForEpic(epic.id);
                  const resolved = epicStories.filter((s) => s.status === "Resolved").length;
                  return (
                    <div
                      key={epic.id}
                      onClick={() => setActiveEpicId(epic.id)}
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <div style={{ background: "#F2EEFD", borderRadius: 5, padding: 3, display: "flex" }}>
                          <Flag size={12} color="#8B5CF6" />
                        </div>
                        <span style={{ fontFamily: fontMono, fontSize: 11.5, color: C.textFaint }}>{epic.id}</span>
                        <ChevronRight size={13} color={C.textFaint} style={{ marginLeft: "auto" }} />
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{epic.title}</div>
                      <div style={{ fontSize: 12.5, color: C.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>{epic.description}</div>
                      <Perforation />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={epic.owner} size={20} />
                          <span style={{ fontSize: 11.5, color: C.textSecondary }}>{epic.owner}</span>
                        </div>
                        <span style={{ fontSize: 11.5, color: C.textFaint }}>{resolved}/{epicStories.length} resolved</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* EPIC DETAIL — stories board */}
          {page === "epics" && activeEpic && (
            <>
              <button
                onClick={() => setActiveEpicId(null)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.textSecondary, fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}
              >
                <ArrowLeft size={14} /> All epics
              </button>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: fontMono, fontSize: 12, color: C.textFaint }}>{activeEpic.id}</span>
                  </div>
                  <h1 style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, margin: "2px 0 0", color: C.textPrimary }}>{activeEpic.title}</h1>
                  <p style={{ fontSize: 13, color: C.textSecondary, margin: "4px 0 0" }}>Owner: {activeEpic.owner} · {storiesForEpic(activeEpic.id).length} user stories</p>
                </div>
                <button
                  onClick={() => setShowNewStory(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: C.brand, color: "#fff", border: "none", padding: "8px 13px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  <Plus size={14} /> New user story
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`, gap: 16 }}>
                {STATUSES.map((status) => {
                  const items = storiesForEpic(activeEpic.id).filter((s) => s.status === status);
                  return (
                    <div key={status}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>{status}</span>
                        <span style={{ fontSize: 11.5, color: C.textFaint, background: C.borderSoft, borderRadius: 10, padding: "1px 7px" }}>{items.length}</span>
                      </div>
                      {items.map((story) => <StoryCard key={story.id} story={story} onOpen={setOpenStory} />)}
                      {items.length === 0 && (
                        <div style={{ fontSize: 12, color: C.textFaint, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "14px 10px", textAlign: "center" }}>
                          No stories
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* PEOPLE */}
          {page === "people" && (
            <>
              <div style={{ marginBottom: 18 }}>
                <h1 style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, margin: 0, color: C.textPrimary }}>People</h1>
                <p style={{ fontSize: 13, color: C.textSecondary, margin: "4px 0 0" }}>Admins can invite teammates and tag them to projects.</p>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                {PEOPLE.map((p, i) => (
                  <div key={p.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < PEOPLE.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                    <Avatar name={p.name} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.textPrimary }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.textFaint, fontFamily: fontMono }}>{p.email}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {p.projects.map((proj) => (
                        <span key={proj} style={{ fontSize: 11, background: C.paper, color: C.textSecondary, padding: "3px 8px", borderRadius: 5 }}>{proj}</span>
                      ))}
                    </div>
                    <span
                      style={{
                        display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600,
                        color: p.role === "Admin" ? C.brand : C.textSecondary,
                        background: p.role === "Admin" ? C.brandSoft : C.paper,
                        padding: "3px 9px", borderRadius: 6,
                      }}
                    >
                      {p.role === "Admin" && <Shield size={11} />} {p.role}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowInvite(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: C.brand, color: "#fff", border: "none", padding: "8px 13px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 16 }}
              >
                <Plus size={14} /> Invite person
              </button>
            </>
          )}

          {page === "settings" && (
            <div style={{ color: C.textSecondary, fontSize: 14 }}>Settings — coming once epics and stories are signed off.</div>
          )}
        </div>
      </div>

      {showNewEpic && <NewEpicModal onClose={() => setShowNewEpic(false)} onCreate={createEpic} />}
      {showNewStory && activeEpic && <NewStoryModal epic={activeEpic} onClose={() => setShowNewStory(false)} onCreate={createStory} />}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {openStory && <StoryDetailModal story={openStory} onClose={() => setOpenStory(null)} onUpdate={updateStory} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   ROOT — preview switcher (remove once embedded in real routing)
---------------------------------------------------------------- */
export default function TrackerPreview() {
  const [screen, setScreen] = useState("login");

  return (
    <div>
      <FontLoader />
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 100, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, display: "flex", padding: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
        {["login", "dashboard"].map((s) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            style={{
              padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
              fontFamily: fontBody, fontSize: 12.5, fontWeight: 600,
              background: screen === s ? C.ink : "transparent",
              color: screen === s ? "#fff" : C.textSecondary,
            }}
          >
            {s === "login" ? "Login" : "Dashboard"}
          </button>
        ))}
      </div>

      {screen === "login" ? (
        <LoginScreen onSignIn={() => setScreen("dashboard")} />
      ) : (
        <Dashboard onSignOut={() => setScreen("login")} />
      )}
    </div>
  );
}
