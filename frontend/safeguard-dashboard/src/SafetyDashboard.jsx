import { io } from "socket.io-client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── API Config ───────────────────────────────────────────────────────────────
const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("sg_token");

const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

// ─── Google Fonts ────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";
document.head.appendChild(fontLink);

// ─── Theme ───────────────────────────────────────────────────────────────────
const THEME = {
  bg: "#F7F8FA",
  sidebar: "#111827",
  sidebarHover: "#1F2A3C",
  accent: "#F97316",
  accentLight: "#FFF7ED",
  card: "#FFFFFF",
  border: "#E5E7EB",
  safe: "#10B981",
  warn: "#F59E0B",
  danger: "#EF4444",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
};

// ─── Constants ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "workers",    label: "Workers",         icon: "👷" },
  { id: "livemap",    label: "Live Map",         icon: "🗺" },
  { id: "monitoring", label: "Live Monitoring",  icon: "📡" },
  { id: "jobs", label: "Job Dispatch", icon: "📋" },
  { id: "alerts", label: "Alerts", icon: "🔔" },
  { id: "logs", label: "Safety Logs", icon: "📜" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

const WORKERS_DATA = [
  {
    id: "W001",
    name: "Rajan Mehta",
    employeeId: "EMP-101",
    site: "Site A – Sector 4",
    status: "Active",
    hr: 78,
    spo2: 98,
    lat: 19.076,
    lng: 72.877,
    task: "Manhole inspection",
  },
  {
    id: "W002",
    name: "Suresh Kumar",
    employeeId: "EMP-102",
    site: "Site B – Block 7",
    status: "Active",
    hr: 82,
    spo2: 97,
    lat: 19.082,
    lng: 72.881,
    task: "Pipe cleaning",
  },
  {
    id: "W003",
    name: "Anil Patil",
    employeeId: "EMP-103",
    site: "Site A – Sector 4",
    status: "Emergency",
    hr: 142,
    spo2: 88,
    lat: 19.076,
    lng: 72.878,
    task: "Gas leak check",
  },
  {
    id: "W004",
    name: "Deepak Sharma",
    employeeId: "EMP-104",
    site: "Site C – Zone 2",
    status: "Idle",
    hr: 72,
    spo2: 99,
    lat: 19.071,
    lng: 72.869,
    task: "Standby",
  },
  {
    id: "W005",
    name: "Vijay Nair",
    employeeId: "EMP-105",
    site: "Site B – Block 7",
    status: "Active",
    hr: 88,
    spo2: 96,
    lat: 19.082,
    lng: 72.882,
    task: "Water level monitoring",
  },
  {
    id: "W006",
    name: "Mohan Das",
    employeeId: "EMP-106",
    site: "Site D – Hub 3",
    status: "Active",
    hr: 74,
    spo2: 98,
    lat: 19.065,
    lng: 72.86,
    task: "Drain unblocking",
  },
];

const SITES_DATA = [
  {
    id: "SITE-A",
    name: "Site A – Sector 4",
    h2s: 3.2,
    ch4: 8.1,
    o2: 20.4,
    water: 12,
    tilt: 0,
    status: "Safe",
    workers: 2,
  },
  {
    id: "SITE-B",
    name: "Site B – Block 7",
    h2s: 11.4,
    ch4: 22.7,
    o2: 18.1,
    water: 45,
    tilt: 2.1,
    status: "Unsafe",
    workers: 2,
  },
  {
    id: "SITE-C",
    name: "Site C – Zone 2",
    h2s: 1.8,
    ch4: 5.2,
    o2: 20.9,
    water: 8,
    tilt: 0,
    status: "Safe",
    workers: 1,
  },
  {
    id: "SITE-D",
    name: "Site D – Hub 3",
    h2s: 6.9,
    ch4: 12.4,
    o2: 19.2,
    water: 28,
    tilt: 0.5,
    status: "Warn",
    workers: 1,
  },
];

const ALERTS_DATA = [
  {
    id: "ALT-001",
    type: "Gas Leak",
    severity: "critical",
    worker: "Anil Patil",
    site: "Site B – Block 7",
    message: "H2S level at 11.4 ppm — critical threshold exceeded",
    time: "2 min ago",
    status: "Active",
  },
  {
    id: "ALT-002",
    type: "SOS Button",
    severity: "critical",
    worker: "Anil Patil",
    site: "Site A – Sector 4",
    message: "SOS button pressed by worker wristband",
    time: "3 min ago",
    status: "Active",
  },
  {
    id: "ALT-003",
    type: "Low Oxygen",
    severity: "critical",
    worker: "Suresh Kumar",
    site: "Site B – Block 7",
    message: "O₂ level dropped to 18.1% — below safe threshold",
    time: "5 min ago",
    status: "Active",
  },
  {
    id: "ALT-004",
    type: "Fall Detected",
    severity: "warning",
    worker: "Vijay Nair",
    site: "Site B – Block 7",
    message: "Accelerometer detected sudden fall event",
    time: "12 min ago",
    status: "Active",
  },
  {
    id: "ALT-005",
    type: "High CH₄",
    severity: "warning",
    worker: "Deepak Sharma",
    site: "Site D – Hub 3",
    message: "Methane at 12.4% LEL — approaching danger zone",
    time: "18 min ago",
    status: "Active",
  },
  {
    id: "ALT-006",
    type: "High Heart Rate",
    severity: "warning",
    worker: "Anil Patil",
    site: "Site A – Sector 4",
    message: "Heart rate at 142 bpm — possible physical stress",
    time: "22 min ago",
    status: "Acknowledged",
  },
  {
    id: "ALT-007",
    type: "Water Rise",
    severity: "warning",
    worker: "Vijay Nair",
    site: "Site B – Block 7",
    message: "Water level rose to 45cm — approaching danger zone",
    time: "35 min ago",
    status: "Resolved",
  },
  {
    id: "ALT-008",
    type: "Gas Leak",
    severity: "critical",
    worker: "Mohan Das",
    site: "Site D – Hub 3",
    message: "H2S spike detected — 8.9 ppm",
    time: "1 hr ago",
    status: "Resolved",
  },
];

const JOBS_DATA = [
  {
    id: "JOB-001",
    title: "Manhole Inspection",
    worker: "Rajan Mehta",
    site: "Site A – Sector 4",
    status: "In Progress",
    start: "08:30 AM",
    est: "11:00 AM",
    priority: "High",
  },
  {
    id: "JOB-002",
    title: "Pipe Cleaning",
    worker: "Suresh Kumar",
    site: "Site B – Block 7",
    status: "In Progress",
    start: "09:00 AM",
    est: "01:00 PM",
    priority: "Medium",
  },
  {
    id: "JOB-003",
    title: "Emergency Response",
    worker: "Anil Patil",
    site: "Site A – Sector 4",
    status: "Emergency",
    start: "10:12 AM",
    est: "—",
    priority: "Critical",
  },
  {
    id: "JOB-004",
    title: "Drain Unblocking",
    worker: "Mohan Das",
    site: "Site D – Hub 3",
    status: "In Progress",
    start: "07:45 AM",
    est: "12:30 PM",
    priority: "Medium",
  },
  {
    id: "JOB-005",
    title: "Water Level Check",
    worker: "Vijay Nair",
    site: "Site B – Block 7",
    status: "In Progress",
    start: "09:30 AM",
    est: "11:30 AM",
    priority: "High",
  },
  {
    id: "JOB-006",
    title: "Routine Survey",
    worker: "Deepak Sharma",
    site: "Site C – Zone 2",
    status: "Pending",
    start: "11:00 AM",
    est: "02:00 PM",
    priority: "Low",
  },
];

const LOGS_DATA = [
  {
    id: 1,
    time: "10:14 AM",
    type: "Alert",
    event: "H2S critical at Site B",
    worker: "Suresh Kumar",
    severity: "critical",
  },
  {
    id: 2,
    time: "10:12 AM",
    type: "Alert",
    event: "SOS activated – Anil Patil",
    worker: "Anil Patil",
    severity: "critical",
  },
  {
    id: 3,
    time: "10:09 AM",
    type: "Vitals",
    event: "SpO₂ dropped to 88% (Anil Patil)",
    worker: "Anil Patil",
    severity: "warning",
  },
  {
    id: 4,
    time: "10:02 AM",
    type: "Job",
    event: "Job JOB-003 started",
    worker: "Anil Patil",
    severity: "info",
  },
  {
    id: 5,
    time: "09:58 AM",
    type: "Sensor",
    event: "O₂ below threshold at Site B",
    worker: "—",
    severity: "warning",
  },
  {
    id: 6,
    time: "09:45 AM",
    type: "Alert",
    event: "Fall detected – Vijay Nair",
    worker: "Vijay Nair",
    severity: "warning",
  },
  {
    id: 7,
    time: "09:31 AM",
    type: "Job",
    event: "Job JOB-005 started",
    worker: "Vijay Nair",
    severity: "info",
  },
  {
    id: 8,
    time: "09:12 AM",
    type: "Sensor",
    event: "CH₄ rising at Site D – 12.4%",
    worker: "—",
    severity: "warning",
  },
  {
    id: 9,
    time: "08:55 AM",
    type: "Job",
    event: "Job JOB-004 started",
    worker: "Mohan Das",
    severity: "info",
  },
  {
    id: 10,
    time: "08:30 AM",
    type: "Job",
    event: "Job JOB-001 started",
    worker: "Rajan Mehta",
    severity: "info",
  },
  {
    id: 11,
    time: "08:10 AM",
    type: "Auth",
    event: "Supervisor logged in",
    worker: "Supervisor",
    severity: "info",
  },
];

// Generate chart data
function generateGasTrend(hours = 12) {
  const now = new Date();
  return Array.from({ length: hours }, (_, i) => {
    const t = new Date(now - (hours - 1 - i) * 3600000);
    const label = t.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return {
      time: label,
      H2S: +Math.max(0, 2 + Math.sin(i * 0.8) * 3 + Math.random() * 2).toFixed(
        1,
      ),
      CH4: +Math.max(0, 8 + Math.cos(i * 0.5) * 6 + Math.random() * 3).toFixed(
        1,
      ),
      O2: +(19.5 + Math.sin(i * 0.3) * 0.8 + Math.random() * 0.3).toFixed(1),
    };
  });
}
function generateHealthTrend(hours = 12) {
  const now = new Date();
  return Array.from({ length: hours }, (_, i) => {
    const t = new Date(now - (hours - 1 - i) * 3600000);
    const label = t.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return {
      time: label,
      avgHR: Math.round(75 + Math.sin(i * 0.7) * 12 + Math.random() * 5),
      avgSpO2: Math.round(96 + Math.sin(i * 0.4) * 2 + Math.random()),
    };
  });
}
function generateIncidents() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((d) => ({
    day: d,
    critical: Math.floor(Math.random() * 3),
    warning: Math.floor(Math.random() * 5) + 1,
  }));
}

// ─── Utility Components ───────────────────────────────────────────────────────
const Mono = ({ children, className = "" }) => (
  <span
    style={{ fontFamily: "'JetBrains Mono', monospace" }}
    className={className}
  >
    {children}
  </span>
);

const StatusDot = ({ status }) => {
  const cfg = {
    Active: { color: THEME.safe, pulse: true },
    Idle: { color: THEME.warn, pulse: false },
    Emergency: { color: THEME.danger, pulse: true },
    Safe: { color: THEME.safe, pulse: false },
    Unsafe: { color: THEME.danger, pulse: true },
    Warn: { color: THEME.warn, pulse: true },
  }[status] || { color: THEME.textMuted, pulse: false };

  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      {cfg.pulse && (
        <span
          className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60"
          style={{ backgroundColor: cfg.color }}
        />
      )}
      <span
        className="relative inline-flex rounded-full w-2.5 h-2.5"
        style={{ backgroundColor: cfg.color }}
      />
    </span>
  );
};

const Badge = ({ label, type = "info" }) => {
  const styles = {
    critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    warning: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
    safe: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
    info: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
    gray: { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" },
  };
  const s = styles[type] || styles.gray;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {label}
    </span>
  );
};

const Card = ({ children, className = "", style = {} }) => (
  <div
    className={`rounded-2xl border ${className}`}
    style={{ background: THEME.card, borderColor: THEME.border, ...style }}
  >
    {children}
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold" style={{ color: THEME.textPrimary }}>
      {title}
    </h2>
    {subtitle && (
      <p className="text-sm mt-0.5" style={{ color: THEME.textSecondary }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ─── Summary Cards ────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, accent, pulse }) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 relative"
        style={{ background: accent + "18" }}
      >
        {pulse && (
          <span
            className="absolute inset-0 rounded-xl animate-ping opacity-30"
            style={{ background: accent }}
          />
        )}
        <span className="relative z-10">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1"
          style={{ color: THEME.textSecondary }}
        >
          {label}
        </p>
        <p
          className="text-3xl font-bold leading-none"
          style={{
            color: THEME.textPrimary,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1.5" style={{ color: THEME.textSecondary }}>
            {sub}
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── Gauge Component ─────────────────────────────────────────────────────────
function SensorGauge({
  label,
  value,
  unit,
  min,
  max,
  warnAt,
  dangerAt,
  invert,
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isDanger = invert ? value <= dangerAt : value >= dangerAt;
  const isWarn = invert ? value <= warnAt : value >= warnAt;
  const color = isDanger ? THEME.danger : isWarn ? THEME.warn : THEME.safe;
  const statusLabel = isDanger ? "CRITICAL" : isWarn ? "WARNING" : "SAFE";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: THEME.textSecondary }}
        >
          {label}
        </span>
        <Badge
          label={statusLabel}
          type={isDanger ? "critical" : isWarn ? "warning" : "safe"}
        />
      </div>
      <div className="flex items-end gap-2">
        <Mono className="text-4xl font-semibold leading-none" style={{ color }}>
          {typeof value === "number" ? value.toFixed(1) : value}
        </Mono>
        <span className="text-sm mb-1" style={{ color: THEME.textMuted }}>
          {unit}
        </span>
      </div>
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: "#F3F4F6" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div
        className="flex justify-between text-xs"
        style={{ color: THEME.textMuted }}
      >
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, alerts, supervisor }) {
  const urgentCount = alerts.filter(
    (a) => a.status === "Active" && a.severity === "critical",
  ).length;
  return (
    <div
      className="flex flex-col w-64 flex-shrink-0 h-screen"
      style={{
        background: THEME.sidebar,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "#1F2937" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
            style={{ background: THEME.accent }}
          >
            ⛑
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              SafeGuard
            </p>
            <p className="text-xs leading-tight" style={{ color: "#9CA3AF" }}>
              Manhole Safety System
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const badgeCount = item.id === "alerts" ? urgentCount : 0;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-left transition-all"
              style={{
                background: isActive ? "#1F2A3C" : "transparent",
                color: isActive ? "#FFFFFF" : "#9CA3AF",
                borderLeft: isActive
                  ? `3px solid ${THEME.accent}`
                  : "3px solid transparent",
              }}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {badgeCount > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white animate-pulse"
                  style={{
                    background: THEME.danger,
                    minWidth: "1.2rem",
                    textAlign: "center",
                  }}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      {/* Supervisor info */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#1F2937" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: THEME.accent }}
          >
            {supervisor?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("") || "RS"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {supervisor?.name || "Rajesh Sharma"}
            </p>
            <p className="text-xs truncate" style={{ color: "#6B7280" }}>
              {supervisor?.role || "Supervisor"}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("sg_token");
              localStorage.removeItem("sg_user");
              window.location.reload();
            }}
            className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-red-900"
            style={{ color: "#EF4444" }}
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ page, alerts, setActive }) {
  const urgentCount = alerts.filter((a) => a.status === "Active").length;
  const now = new Date().toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div
      className="flex items-center gap-4 px-6 py-3.5 border-b bg-white"
      style={{
        borderColor: THEME.border,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="flex-1">
        <h1
          className="text-base font-bold capitalize"
          style={{ color: THEME.textPrimary }}
        >
          {NAV_ITEMS.find((n) => n.id === page)?.label || page}
        </h1>
        <p className="text-xs" style={{ color: THEME.textMuted }}>
          {now}
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <input
          type="text"
          placeholder="Search workers, sites..."
          className="pl-9 pr-4 py-2 text-sm rounded-xl border outline-none focus:ring-2"
          style={{
            background: THEME.bg,
            borderColor: THEME.border,
            color: THEME.textPrimary,
            width: "220px",
            focusRingColor: THEME.accent,
          }}
        />
        <span
          className="absolute left-3 top-2.5 text-xs"
          style={{ color: THEME.textMuted }}
        >
          🔍
        </span>
      </div>

      {/* Live indicator */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}
      >
        <span className="w-2 h-2 rounded-full animate-ping bg-emerald-400 opacity-75 absolute" />
        <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
        <span className="text-xs font-semibold" style={{ color: "#059669" }}>
          LIVE
        </span>
      </div>

      {/* Alerts bell */}
      <button
        onClick={() => setActive("alerts")}
        className="relative p-2.5 rounded-xl border transition-colors hover:bg-gray-50"
        style={{ borderColor: THEME.border }}
      >
        <span className="text-base">🔔</span>
        {urgentCount > 0 && (
          <span
            className="absolute -top-1 -right-1 text-xs font-bold text-white rounded-full w-4 h-4 flex items-center justify-center animate-pulse"
            style={{ background: THEME.danger, fontSize: "10px" }}
          >
            {urgentCount}
          </span>
        )}
      </button>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
        style={{ background: THEME.accent }}
      >
        RS
      </div>
    </div>
  );
}


// ─── PAGE: Live Map ───────────────────────────────────────────────────────────
function LiveMapPage({ workers, alerts }) {
  const mapObjRef  = useRef(null);
  const markersRef = useRef({});

  const statusColor = (status) =>
    status === 'Emergency' ? '#EF4444'
    : status === 'Active'  ? '#10B981'
    : '#9CA3AF';

  const makeIcon = (worker) => {
    const color = statusColor(worker.status);
    const pulse = worker.status === 'Emergency';
    return window.L.divIcon({
      className: '',
      html: `<div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        ${pulse ? `<div style="position:absolute;width:36px;height:36px;border-radius:50%;background:${color};opacity:0.35;animation:liveping 1.2s infinite;"></div>` : ''}
        <div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;
          display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);position:relative;z-index:2;font-family:sans-serif;">
          ${worker.name.split(' ').map(n => n[0]).join('')}
        </div></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    });
  };

  // Init map once
  useEffect(() => {
    if (mapObjRef.current || !window.L) return;
    const el = document.getElementById('safeguard-live-map');
    if (!el) return;
    const map = window.L.map('safeguard-live-map', { center: [19.076, 72.877], zoom: 13 });
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    mapObjRef.current = map;
  }, []);

  // Update markers whenever workers change
  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || !window.L) return;

    // Give workers without GPS a spread around Mumbai for demo
    const plotWorkers = workers.map((w, i) => ({
      ...w,
      lat: (w.lat && w.lat !== 0) ? w.lat : 19.070 + (i * 0.005),
      lng: (w.lng && w.lng !== 0) ? w.lng : 72.870 + (i * 0.005),
    }));

    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    plotWorkers.forEach(worker => {
      const workerAlerts = alerts.filter(
        a => a.worker === worker.name && a.status === 'Active'
      );
      const popupHtml = `
        <div style="font-family:sans-serif;min-width:180px;padding:4px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:34px;height:34px;border-radius:50%;background:${statusColor(worker.status)};
              display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;">
              ${worker.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p style="font-weight:700;font-size:13px;margin:0;color:#111827;">${worker.name}</p>
              <p style="font-size:11px;color:#6B7280;margin:0;">${worker.employeeId}</p>
            </div>
          </div>
          <div style="background:#F9FAFB;border-radius:8px;padding:8px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;">
              <span style="color:#6B7280;">Status</span>
              <span style="font-weight:600;color:${statusColor(worker.status)};">${worker.status}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;">
              <span style="color:#6B7280;">Heart Rate</span>
              <span style="font-weight:600;color:${worker.hr > 120 ? '#EF4444' : '#111827'};">${worker.hr} bpm</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;">
              <span style="color:#6B7280;">SpO₂</span>
              <span style="font-weight:600;color:${worker.spo2 < 94 ? '#EF4444' : '#111827'};">${worker.spo2}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;">
              <span style="color:#6B7280;">Site</span>
              <span style="font-weight:600;">${worker.site && worker.site !== '—' ? worker.site : 'Field'}</span>
            </div>
            ${workerAlerts.length > 0 ? `
            <div style="margin-top:6px;padding:6px;background:#FEF2F2;border-radius:6px;border:1px solid #FECACA;">
              <p style="color:#DC2626;font-size:11px;font-weight:700;margin:0;">⚠ ${workerAlerts.length} active alert${workerAlerts.length > 1 ? 's' : ''}</p>
              <p style="color:#EF4444;font-size:10px;margin:2px 0 0;">${workerAlerts[0]?.message || ''}</p>
            </div>` : ''}
          </div>
        </div>`;

      const marker = window.L.marker([worker.lat, worker.lng], { icon: makeIcon(worker) });
      marker.bindPopup(popupHtml, { maxWidth: 220 });
      marker.addTo(map);
      markersRef.current[worker.id] = marker;
    });

    if (plotWorkers.length > 0) {
      try {
        map.fitBounds(plotWorkers.map(w => [w.lat, w.lng]), { padding: [50, 50], maxZoom: 15 });
      } catch(e) {}
    }
  }, [workers, alerts]);

  const emergency = workers.filter(w => w.status === 'Emergency');
  const active    = workers.filter(w => w.status === 'Active');
  const idle      = workers.filter(w => w.status === 'Idle');

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes liveping {
          0%   { transform: scale(1); opacity: 0.35; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold" style={{ color: THEME.textPrimary }}>Live Worker Map</h2>
          <p className="text-sm mt-0.5" style={{ color: THEME.textSecondary }}>
            Real-time location of all deployed workers
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg relative"
          style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75 absolute left-3" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
          <span className="text-xs font-semibold ml-1" style={{ color: '#059669' }}>LIVE</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Workers', count: workers.length,   color: THEME.textPrimary, bg: THEME.bg      },
          { label: 'Active',        count: active.length,    color: THEME.safe,        bg: '#ECFDF5'     },
          { label: 'Idle',          count: idle.length,      color: THEME.warn,        bg: '#FFFBEB'     },
          { label: 'Emergency',     count: emergency.length, color: THEME.danger,      bg: '#FEF2F2'     },
        ].map(s => (
          <Card key={s.label} className="p-3 text-center" style={{ background: s.bg }}>
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {s.count}
            </p>
            <p className="text-xs mt-0.5 font-semibold" style={{ color: THEME.textSecondary }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Map + Side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden" style={{ height: '500px' }}>
            <div id="safeguard-live-map" style={{ width: '100%', height: '100%', zIndex: 1 }} />
          </Card>
        </div>

        <Card className="p-4" style={{ height: '500px', overflowY: 'auto' }}>
          <p className="text-sm font-bold mb-3" style={{ color: THEME.textPrimary }}>Workers on field</p>
          <div className="space-y-2">
            {workers.map(worker => (
              <div
                key={worker.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  background: worker.status === 'Emergency' ? '#FEF2F2'
                            : worker.status === 'Active'    ? '#F0FDF4' : THEME.bg,
                  border: `1px solid ${
                    worker.status === 'Emergency' ? '#FECACA'
                    : worker.status === 'Active'  ? '#BBF7D0' : THEME.border
                  }`,
                }}
                onClick={() => {
                  const map = mapObjRef.current;
                  const marker = markersRef.current[worker.id];
                  const lat = (worker.lat && worker.lat !== 0) ? worker.lat : 19.076;
                  const lng = (worker.lng && worker.lng !== 0) ? worker.lng : 72.877;
                  if (map) { map.setView([lat, lng], 16); marker?.openPopup(); }
                }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: statusColor(worker.status) }}>
                  {worker.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: THEME.textPrimary }}>{worker.name}</p>
                  <p className="text-xs truncate" style={{ color: THEME.textSecondary }}>
                    {worker.site && worker.site !== '—' ? worker.site : 'Field deployment'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusDot status={worker.status} />
                  <Mono className="text-xs" style={{ color: THEME.textMuted }}>♥{worker.hr}</Mono>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t" style={{ borderColor: THEME.border }}>
            <p className="text-xs font-semibold mb-2" style={{ color: THEME.textSecondary }}>Legend</p>
            {[
              { color: '#10B981', label: 'Active' },
              { color: '#9CA3AF', label: 'Idle'   },
              { color: '#EF4444', label: 'Emergency (pulsing)' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 mb-1.5">
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs" style={{ color: THEME.textSecondary }}>{item.label}</span>
              </div>
            ))}
            <p className="text-xs mt-2" style={{ color: THEME.textMuted }}>
              Click a worker card to zoom to their location
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PAGE: Dashboard ─────────────────────────────────────────────────────────
function DashboardPage({ workers, sites, alerts, sensors, setActive }) {
  const activeWorkers = workers.filter((w) => w.status === "Active").length;
  const safeSites = sites.filter((s) => s.status === "Safe").length;
  const activeAlerts = alerts.filter((a) => a.status === "Active").length;
  const emergency = workers.filter((w) => w.status === "Emergency").length;
  const gasTrend = generateGasTrend(8);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SectionTitle
        title="Operations Overview"
        subtitle="Real-time field status for all active sites"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon="👷"
          label="Active Workers"
          value={activeWorkers}
          sub={`${emergency} in emergency`}
          accent={THEME.safe}
          pulse={false}
        />
        <SummaryCard
          icon="📍"
          label="Safe Sites"
          value={`${safeSites}/${sites.length}`}
          sub="1 unsafe, 1 warning"
          accent={THEME.safe}
          pulse={false}
        />
        <SummaryCard
          icon="🚨"
          label="Active Alerts"
          value={activeAlerts}
          sub="3 critical, 2 warnings"
          accent={THEME.danger}
          pulse={activeAlerts > 0}
        />
        <SummaryCard
          icon="❤️"
          label="Avg SpO₂"
          value="96.0%"
          sub="All workers"
          accent={THEME.accent}
          pulse={false}
        />
      </div>

      {/* Emergency Banner */}
      {emergency > 0 && (
        <div
          className="flex items-center gap-4 p-4 rounded-2xl mb-6 animate-pulse"
          style={{ background: "#FEF2F2", border: "2px solid #FECACA" }}
        >
          <span className="text-2xl">🚨</span>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: "#DC2626" }}>
              EMERGENCY DETECTED — Anil Patil, Site A – Sector 4
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#EF4444" }}>
              SOS activated · Heart rate 142 bpm · SpO₂ 88% · Immediate response
              required
            </p>
          </div>
          <button
            onClick={() => setActive("workers")}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#DC2626" }}
          >
            Respond Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Gas trend mini chart */}
        <Card className="p-5 lg:col-span-2">
          <p
            className="text-sm font-bold mb-1"
            style={{ color: THEME.textPrimary }}
          >
            Gas Level Trends (Last 8 hours)
          </p>
          <p className="text-xs mb-4" style={{ color: THEME.textSecondary }}>
            H2S and CH₄ across all sites
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={gasTrend}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: `1px solid ${THEME.border}`,
                }}
              />
              <Area
                type="monotone"
                dataKey="H2S"
                stroke="#EF4444"
                fill="#FEE2E2"
                strokeWidth={2}
                name="H2S (ppm)"
              />
              <Area
                type="monotone"
                dataKey="CH4"
                stroke="#F59E0B"
                fill="#FEF3C7"
                strokeWidth={2}
                name="CH4 (%LEL)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Site status */}
        <Card className="p-5">
          <p
            className="text-sm font-bold mb-1"
            style={{ color: THEME.textPrimary }}
          >
            Site Status
          </p>
          <p className="text-xs mb-4" style={{ color: THEME.textSecondary }}>
            All monitored sites
          </p>
          <div className="space-y-3">
            {sites.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: THEME.bg }}
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={s.status} />
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: THEME.textPrimary }}
                    >
                      {s.name}
                    </p>
                    <p className="text-xs" style={{ color: THEME.textMuted }}>
                      {s.workers} worker{s.workers > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Badge
                  label={s.status}
                  type={
                    s.status === "Safe"
                      ? "safe"
                      : s.status === "Unsafe"
                        ? "critical"
                        : "warning"
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Alerts + Worker Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-sm font-bold"
              style={{ color: THEME.textPrimary }}
            >
              Recent Alerts
            </p>
            <button
              onClick={() => setActive("alerts")}
              className="text-xs font-semibold"
              style={{ color: THEME.accent }}
            >
              View all →
            </button>
          </div>
          <div className="space-y-2.5">
            {alerts.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: THEME.bg }}
              >
                <span className="text-base mt-0.5">
                  {a.severity === "critical" ? "🔴" : "🟡"}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: THEME.textPrimary }}
                  >
                    {a.type} — {a.worker}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: THEME.textSecondary }}
                  >
                    {a.message}
                  </p>
                </div>
                <span
                  className="text-xs whitespace-nowrap"
                  style={{ color: THEME.textMuted }}
                >
                  {a.time}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-sm font-bold"
              style={{ color: THEME.textPrimary }}
            >
              Worker Health Snapshot
            </p>
            <button
              onClick={() => setActive("workers")}
              className="text-xs font-semibold"
              style={{ color: THEME.accent }}
            >
              View all →
            </button>
          </div>
          <div className="space-y-2.5">
            {workers.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: THEME.bg }}
              >
                <StatusDot status={w.status} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: THEME.textPrimary }}
                  >
                    {w.name}
                  </p>
                  <p className="text-xs" style={{ color: THEME.textMuted }}>
                    {w.site}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span
                    style={{
                      color: "#EF4444",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    ♥ {w.hr}
                  </span>
                  <span
                    style={{
                      color: "#3B82F6",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    O₂ {w.spo2}%
                  </span>
                </div>
                <Badge
                  label={w.status}
                  type={
                    w.status === "Emergency"
                      ? "critical"
                      : w.status === "Active"
                        ? "safe"
                        : "gray"
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PAGE: Workers ────────────────────────────────────────────────────────────
function WorkersPage({ workers, onAddWorker, onUpdateWorker, onDeleteWorker }) {
  const [selected, setSelected]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    name: '', worker_id: '', phone: '', wristband_id: '', status: 'idle',
  });
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const w = selected ? workers.find((x) => x.id === selected) : null;

  function openAddForm() {
    setEditMode(false);
    setForm({ name: '', worker_id: '', phone: '', wristband_id: '', status: 'idle' });
    setError(''); setSuccess('');
    setShowForm(true);
  }

  function openEditForm(worker) {
    setEditMode(true);
    setForm({
      name:         worker.name        || '',
      worker_id:    worker.employeeId  || '',
      phone:        worker.phone       || '',
      wristband_id: worker.wristband_id|| '',
      status:       worker.status?.toLowerCase() || 'idle',
      _id:          worker.id,
    });
    setError(''); setSuccess('');
    setShowForm(true);
    setSelected(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.worker_id) {
      setError('Name and Worker ID are required');
      return;
    }
    setSaving(true);
    try {
      if (editMode) {
        await onUpdateWorker(form._id, form);
        setSuccess(`Worker ${form.name} updated successfully!`);
      } else {
        await onAddWorker(form);
        setSuccess(`Worker ${form.name} added successfully!`);
      }
      setTimeout(() => { setShowForm(false); setSuccess(''); }, 1800);
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDeleteWorker(deleteTarget.id);
      setDeleteTarget(null);
      if (selected === deleteTarget.id) setSelected(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
    setDeleting(false);
  }

  const FIELDS = [
    { label: 'Full Name *',    key: 'name',         placeholder: 'e.g. Rajan Mehta',  type: 'text' },
    { label: 'Worker ID *',    key: 'worker_id',    placeholder: 'e.g. EMP-107',       type: 'text' },
    { label: 'Phone Number',   key: 'phone',        placeholder: '+91 9000000000',     type: 'tel'  },
    { label: 'Wristband ID',   key: 'wristband_id', placeholder: 'e.g. WB-007',        type: 'text' },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: THEME.textPrimary }}>Worker Management</h2>
          <p className="text-sm mt-0.5" style={{ color: THEME.textSecondary }}>
            {workers.length} workers · {workers.filter((w) => w.status === 'Active').length} active
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: THEME.accent }}
        >
          <span>＋</span> Add Worker
        </button>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <Card className="p-5 mb-5" style={{ borderColor: THEME.accent, borderWidth: 2 }}>
          <p className="font-bold text-sm mb-4" style={{ color: THEME.textPrimary }}>
            {editMode ? `Edit Worker — ${form.name}` : 'New Worker Details'}
          </p>

          {success && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium"
              style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5"
                    style={{ color: THEME.textSecondary }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                    style={{ borderColor: THEME.border, background: THEME.bg, color: THEME.textPrimary }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5"
                  style={{ color: THEME.textSecondary }}>
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                  style={{ borderColor: THEME.border, background: THEME.bg, color: THEME.textPrimary }}
                >
                  <option value="idle">Idle</option>
                  <option value="active">Active</option>
                  <option value="off-duty">Off Duty</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                style={{ background: editMode ? '#3B82F6' : THEME.accent }}
              >
                {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Add Worker'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="px-5 py-2 rounded-xl text-sm font-semibold border hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.textSecondary }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="rounded-2xl p-6 w-80 shadow-xl"
            style={{ background: THEME.card, border: `1px solid ${THEME.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🗑️</div>
              <p className="font-bold text-base" style={{ color: THEME.textPrimary }}>
                Remove Worker?
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textSecondary }}>
                Are you sure you want to remove <span className="font-semibold">{deleteTarget.name}</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                style={{ background: THEME.danger }}
              >
                {deleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Worker List + Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {workers.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">👷</p>
              <p className="text-sm font-semibold" style={{ color: THEME.textSecondary }}>
                No workers yet — add one above
              </p>
            </Card>
          )}

          {workers.map((worker) => (
            <Card
              key={worker.id}
              className="p-4 transition-all hover:shadow-md"
              style={{
                borderColor: selected === worker.id ? THEME.accent : THEME.border,
                borderWidth:  selected === worker.id ? 2 : 1,
              }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 cursor-pointer"
                  style={{
                    background: worker.status === 'Emergency' ? THEME.danger
                              : worker.status === 'Active'    ? '#3B82F6' : '#9CA3AF',
                  }}
                  onClick={() => setSelected(selected === worker.id ? null : worker.id)}
                >
                  {worker.name.split(' ').map((n) => n[0]).join('')}
                </div>

                {/* Info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelected(selected === worker.id ? null : worker.id)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm" style={{ color: THEME.textPrimary }}>
                      {worker.name}
                    </p>
                    <StatusDot status={worker.status} />
                    <Badge
                      label={worker.status}
                      type={worker.status === 'Emergency' ? 'critical'
                          : worker.status === 'Active'    ? 'safe' : 'gray'}
                    />
                  </div>
                  <p className="text-xs" style={{ color: THEME.textSecondary }}>
                    {worker.employeeId} · {worker.site}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: THEME.textMuted }}>
                    {worker.task}
                  </p>
                </div>

                {/* Vitals */}
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                    style={{ background: '#FEF2F2' }}>
                    <span className="text-xs" style={{ color: '#EF4444' }}>♥</span>
                    <Mono className="text-sm font-semibold"
                      style={{ color: worker.hr > 120 ? THEME.danger : THEME.textPrimary }}>
                      {worker.hr} bpm
                    </Mono>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                    style={{ background: '#EFF6FF' }}>
                    <span className="text-xs" style={{ color: '#3B82F6' }}>●</span>
                    <Mono className="text-sm font-semibold"
                      style={{ color: worker.spo2 < 94 ? THEME.danger : THEME.textPrimary }}>
                      SpO₂ {worker.spo2}%
                    </Mono>
                  </div>
                </div>

                {/* Edit / Delete buttons */}
                <div className="flex flex-col gap-1.5 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditForm(worker); }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors hover:bg-blue-50"
                    style={{ borderColor: '#BFDBFE', color: '#2563EB' }}
                    title="Edit worker"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(worker); }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors hover:bg-red-50"
                    style={{ borderColor: '#FECACA', color: '#DC2626' }}
                    title="Remove worker"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Detail Panel ── */}
        <div>
          {w ? (
            <Card className="p-5 sticky top-4">
              <div className="text-center mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white mx-auto mb-3"
                  style={{ background: w.status === 'Emergency' ? THEME.danger : '#3B82F6' }}
                >
                  {w.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <p className="font-bold" style={{ color: THEME.textPrimary }}>{w.name}</p>
                <p className="text-xs mt-0.5" style={{ color: THEME.textSecondary }}>{w.employeeId}</p>
                <div className="flex justify-center mt-2">
                  <Badge
                    label={w.status}
                    type={w.status === 'Emergency' ? 'critical'
                        : w.status === 'Active'    ? 'safe' : 'gray'}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Site',       value: w.site },
                  { label: 'Task',       value: w.task },
                  { label: 'Heart Rate', value: `${w.hr} bpm`,  mono: true, alert: w.hr > 120  },
                  { label: 'SpO₂',       value: `${w.spo2}%`,   mono: true, alert: w.spo2 < 94 },
                  { label: 'GPS',        value: `${w.lat}, ${w.lng}`, mono: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: THEME.border }}>
                    <span className="text-xs" style={{ color: THEME.textSecondary }}>{row.label}</span>
                    <span
                      className="text-xs font-semibold text-right"
                      style={{
                        color: row.alert ? THEME.danger : THEME.textPrimary,
                        fontFamily: row.mono ? "'JetBrains Mono', monospace" : 'inherit',
                        maxWidth: '60%',
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEditForm(w)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border hover:bg-blue-50 transition-colors"
                  style={{ borderColor: '#BFDBFE', color: '#2563EB' }}
                >
                  Edit Worker
                </button>
                <button
                  onClick={() => setDeleteTarget(w)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border hover:bg-red-50 transition-colors"
                  style={{ borderColor: '#FECACA', color: '#DC2626' }}
                >
                  Remove
                </button>
              </div>

              {w.status === 'Emergency' && (
                <button
                  className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-white animate-pulse"
                  style={{ background: THEME.danger }}
                >
                  🚨 Dispatch Emergency Team
                </button>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">👷</p>
              <p className="text-sm font-semibold" style={{ color: THEME.textSecondary }}>
                Click a worker to view details
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── PAGE: Live Monitoring ────────────────────────────────────────────────────
function MonitoringPage({ sites, sensors }) {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SectionTitle
        title="Live Environmental Monitoring"
        subtitle="Real-time sensor feeds from all Sentinel Hub devices"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sites.map((site) => (
          <Card key={site.id} className="p-5">
            <div
              className="flex items-center justify-between mb-4 pb-3 border-b"
              style={{ borderColor: THEME.border }}
            >
              <div>
                <p
                  className="font-bold text-sm"
                  style={{ color: THEME.textPrimary }}
                >
                  {site.name}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: THEME.textSecondary }}
                >
                  {site.workers} worker{site.workers > 1 ? "s" : ""} deployed ·
                  Sentinel Hub online
                </p>
              </div>
              <Badge
                label={site.status}
                type={
                  site.status === "Safe"
                    ? "safe"
                    : site.status === "Unsafe"
                      ? "critical"
                      : "warning"
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <SensorGauge
                label="H₂S"
                value={site.h2s}
                unit=" ppm"
                min={0}
                max={20}
                warnAt={5}
                dangerAt={10}
                invert={false}
              />
              <SensorGauge
                label="CH₄"
                value={site.ch4}
                unit="% LEL"
                min={0}
                max={40}
                warnAt={10}
                dangerAt={25}
                invert={false}
              />
              <SensorGauge
                label="O₂"
                value={site.o2}
                unit="%"
                min={15}
                max={22}
                warnAt={19.5}
                dangerAt={16}
                invert={true}
              />
              <SensorGauge
                label="Water"
                value={site.water}
                unit=" cm"
                min={0}
                max={80}
                warnAt={30}
                dangerAt={60}
                invert={false}
              />
            </div>
            <div
              className="flex items-center gap-2 mt-4 pt-3 border-t"
              style={{ borderColor: THEME.border }}
            >
              <span className="text-xs" style={{ color: THEME.textMuted }}>
                Tilt:
              </span>
              <Mono
                className="text-xs font-semibold"
                style={{
                  color: site.tilt > 5 ? THEME.danger : THEME.textPrimary,
                }}
              >
                {site.tilt}°
              </Mono>
              <span className="flex-1" />
              <span
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ background: THEME.safe }}
              />
              <span className="text-xs" style={{ color: THEME.textMuted }}>
                Updated just now
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE: Jobs ───────────────────────────────────────────────────────────────
function JobsPage({ jobs, setJobs, onStart, onEnd, onDispatch, workers }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    worker: "",
    workerId: "",
    site: "",
    priority: "Medium",
  });

  const statusCfg = {
    "In Progress": "info",
    Pending: "gray",
    Completed: "safe",
    Emergency: "critical",
  };
  const priorityCfg = {
    Critical: "critical",
    High: "warning",
    Medium: "info",
    Low: "gray",
  };

  // Build worker options with availability
  const workerOptions = workers.map((w) => ({
    id: w.id,
    name: w.name,
    available: w.status === "Idle",
    status: w.status,
  }));

  async function handleDispatch() {
    if (!form.title || !form.workerId || !form.site) return;
    await onDispatch({ ...form, worker: form.worker });
    setForm({
      title: "",
      worker: "",
      workerId: "",
      site: "",
      priority: "Medium",
    });
    setShowForm(false);
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: THEME.textPrimary }}
          >
            Job Dispatch
          </h2>
          <p className="text-sm mt-0.5" style={{ color: THEME.textSecondary }}>
            Assign and manage field operations
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: THEME.accent }}
        >
          <span>＋</span> Dispatch Job
        </button>
      </div>

      {showForm && (
        <Card
          className="p-5 mb-5"
          style={{ borderColor: THEME.accent, borderWidth: 2 }}
        >
          <p
            className="font-bold text-sm mb-4"
            style={{ color: THEME.textPrimary }}
          >
            New Job Dispatch
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: THEME.textSecondary }}
              >
                Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Manhole Inspection"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                style={{
                  borderColor: THEME.border,
                  background: THEME.bg,
                  color: THEME.textPrimary,
                }}
              />
            </div>

            {/* Worker dropdown with availability */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: THEME.textSecondary }}
              >
                Assign Worker
              </label>
              <select
                value={form.workerId}
                onChange={(e) => {
                  const selected = workerOptions.find(
                    (w) => w.id === e.target.value,
                  );
                  setForm({
                    ...form,
                    workerId: e.target.value,
                    worker: selected?.name || "",
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                style={{
                  borderColor: THEME.border,
                  background: THEME.bg,
                  color: THEME.textPrimary,
                }}
              >
                <option value="">— Select a worker —</option>
                {workerOptions.map((w) => (
                  <option
                    key={w.id}
                    value={w.id}
                    disabled={!w.available}
                    style={{ color: w.available ? "inherit" : "#9CA3AF" }}
                  >
                    {w.name} — {w.available ? "✅ Available" : `❌ ${w.status}`}
                  </option>
                ))}
              </select>
              {form.workerId && (
                <p
                  className="text-xs mt-1"
                  style={{
                    color: workerOptions.find((w) => w.id === form.workerId)
                      ?.available
                      ? THEME.safe
                      : THEME.warn,
                  }}
                >
                  {workerOptions.find((w) => w.id === form.workerId)?.available
                    ? "✓ Worker is available"
                    : "⚠ Worker is currently busy"}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: THEME.textSecondary }}
              >
                Site / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Site A – Sector 4"
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                style={{
                  borderColor: THEME.border,
                  background: THEME.bg,
                  color: THEME.textPrimary,
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: THEME.textSecondary }}
              >
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                style={{
                  borderColor: THEME.border,
                  background: THEME.bg,
                  color: THEME.textPrimary,
                }}
              >
                {["Critical", "High", "Medium", "Low"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDispatch}
              disabled={!form.title || !form.workerId || !form.site}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              style={{ background: THEME.accent }}
            >
              Confirm Dispatch
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-sm font-semibold border hover:bg-gray-50"
              style={{ borderColor: THEME.border, color: THEME.textSecondary }}
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                {[
                  "Job ID",
                  "Title",
                  "Assigned Worker",
                  "Site",
                  "Status",
                  "Priority",
                  "Start",
                  "Est. End",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: THEME.textSecondary }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <tr
                  key={job.id}
                  className="transition-colors hover:bg-gray-50"
                  style={{
                    borderBottom:
                      i < jobs.length - 1
                        ? `1px solid ${THEME.border}`
                        : "none",
                  }}
                >
                  <td className="px-4 py-3">
                    <Mono
                      className="text-xs"
                      style={{ color: THEME.textMuted }}
                    >
                      {typeof job.id === "string"
                        ? job.id.slice(-6).toUpperCase()
                        : job.id}
                    </Mono>
                  </td>
                  <td
                    className="px-4 py-3 font-semibold"
                    style={{ color: THEME.textPrimary }}
                  >
                    {job.title}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: THEME.textSecondary }}
                  >
                    {job.worker}
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: THEME.textSecondary }}
                  >
                    {job.site}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={job.status}
                      type={statusCfg[job.status] || "gray"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={job.priority}
                      type={priorityCfg[job.priority] || "gray"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Mono
                      className="text-xs"
                      style={{ color: THEME.textMuted }}
                    >
                      {job.start}
                    </Mono>
                  </td>
                  <td className="px-4 py-3">
                    <Mono
                      className="text-xs"
                      style={{ color: THEME.textMuted }}
                    >
                      {job.est}
                    </Mono>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {job.status === "Pending" && (
                        <button
                          onClick={() => onStart(job.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white hover:opacity-90"
                          style={{ background: THEME.safe }}
                        >
                          Start
                        </button>
                      )}
                      {job.status === "In Progress" && (
                        <button
                          onClick={() => onEnd(job.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white hover:opacity-90"
                          style={{ background: "#6B7280" }}
                        >
                          End
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
// ─── PAGE: Alerts ─────────────────────────────────────────────────────────────
function AlertsPage({ alerts, setAlerts, onAcknowledge, onResolve }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Active", "Acknowledged", "Resolved"];

  const filtered =
    filter === "All" ? alerts : alerts.filter((a) => a.status === filter);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SectionTitle
        title="Alert Center"
        subtitle="All system and worker alerts across all sites"
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total",
            count: alerts.length,
            color: THEME.textPrimary,
            bg: THEME.bg,
          },
          {
            label: "Active",
            count: alerts.filter((a) => a.status === "Active").length,
            color: THEME.danger,
            bg: "#FEF2F2",
          },
          {
            label: "Acknowledged",
            count: alerts.filter((a) => a.status === "Acknowledged").length,
            color: THEME.warn,
            bg: "#FFFBEB",
          },
          {
            label: "Resolved",
            count: alerts.filter((a) => a.status === "Resolved").length,
            color: THEME.safe,
            bg: "#ECFDF5",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="p-4 text-center"
            style={{ background: s.bg }}
          >
            <Mono
              className="text-3xl font-bold block"
              style={{ color: s.color }}
            >
              {s.count}
            </Mono>
            <p
              className="text-xs font-semibold mt-1"
              style={{ color: THEME.textSecondary }}
            >
              {s.label}
            </p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === f ? THEME.accent : THEME.bg,
              color: filter === f ? "#fff" : THEME.textSecondary,
              border: `1px solid ${filter === f ? THEME.accent : THEME.border}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => (
          <Card
            key={alert.id}
            className="p-4"
            style={{
              borderLeft: `4px solid ${alert.severity === "critical" ? THEME.danger : THEME.warn}`,
            }}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">
                {alert.severity === "critical" ? "🔴" : "🟡"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="font-bold text-sm"
                    style={{ color: THEME.textPrimary }}
                  >
                    {alert.type}
                  </span>
                  <Badge
                    label={alert.severity.toUpperCase()}
                    type={
                      alert.severity === "critical" ? "critical" : "warning"
                    }
                  />
                  <Badge
                    label={alert.status}
                    type={
                      alert.status === "Active"
                        ? "critical"
                        : alert.status === "Acknowledged"
                          ? "warning"
                          : "safe"
                    }
                  />
                </div>
                <p className="text-sm" style={{ color: THEME.textSecondary }}>
                  {alert.message}
                </p>
                <div
                  className="flex gap-4 mt-1.5 text-xs"
                  style={{ color: THEME.textMuted }}
                >
                  <span>👷 {alert.worker}</span>
                  <span>📍 {alert.site}</span>
                  <span>🕐 {alert.time}</span>
                  <Mono>{alert.id}</Mono>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {alert.status === "Active" && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border hover:bg-amber-50 transition-colors"
                    style={{ borderColor: THEME.warn, color: THEME.warn }}
                  >
                    Acknowledge
                  </button>
                )}
                {alert.status !== "Resolved" && (
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border hover:bg-emerald-50 transition-colors"
                    style={{ borderColor: THEME.safe, color: THEME.safe }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE: Safety Logs ────────────────────────────────────────────────────────
function LogsPage({ logs }) {
  const iconMap = {
    Alert: "🚨",
    Vitals: "❤️",
    Job: "📋",
    Sensor: "📡",
    Auth: "🔐",
  };
  const typeColor = {
    Alert: THEME.danger,
    Vitals: "#EF4444",
    Job: "#3B82F6",
    Sensor: "#8B5CF6",
    Auth: "#6B7280",
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SectionTitle
        title="Safety Logs"
        subtitle="Complete audit trail of all system events"
      />
      <Card>
        <div
          className="p-4 border-b flex items-center gap-3"
          style={{ borderColor: THEME.border }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: THEME.textSecondary }}
          >
            Event Log
          </span>
          <span
            className="ml-auto px-2.5 py-1 text-xs font-semibold rounded-lg"
            style={{ background: THEME.accentLight, color: THEME.accent }}
          >
            {logs.length} events today
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: THEME.border }}>
          {logs.map((log, i) => (
            <div
              key={log.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <Mono
                className="text-xs w-16 flex-shrink-0"
                style={{ color: THEME.textMuted }}
              >
                {log.time}
              </Mono>
              <span className="text-base flex-shrink-0">
                {iconMap[log.type] || "ℹ️"}
              </span>
              <span
                className="text-xs font-semibold w-14 flex-shrink-0"
                style={{ color: typeColor[log.type] || THEME.textMuted }}
              >
                {log.type}
              </span>
              <span
                className="flex-1 text-sm"
                style={{ color: THEME.textPrimary }}
              >
                {log.event}
              </span>
              <span
                className="text-xs flex-shrink-0"
                style={{ color: THEME.textSecondary }}
              >
                {log.worker}
              </span>
              <Badge
                label={log.severity}
                type={
                  log.severity === "critical"
                    ? "critical"
                    : log.severity === "warning"
                      ? "warning"
                      : "info"
                }
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── PAGE: Analytics ─────────────────────────────────────────────────────────
function AnalyticsPage() {
  const gasTrend    = useMemo(() => generateGasTrend(12),    []);
  const healthTrend = useMemo(() => generateHealthTrend(12), []);
  const incidents   = useMemo(() => generateIncidents(),     []);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SectionTitle
        title="Analytics & Reports"
        subtitle="Historical trends, health data, and incident analysis"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <p
            className="font-bold text-sm mb-0.5"
            style={{ color: THEME.textPrimary }}
          >
            Gas Level Trends — 12hr
          </p>
          <p className="text-xs mb-4" style={{ color: THEME.textSecondary }}>
            H2S, CH₄, and O₂ across all sites
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={gasTrend}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                interval={2}
              />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: `1px solid ${THEME.border}`,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="H2S"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                name="H2S (ppm)"
              />
              <Line
                type="monotone"
                dataKey="CH4"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                name="CH4 (%LEL)"
              />
              <Line
                type="monotone"
                dataKey="O2"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="O₂ (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p
            className="font-bold text-sm mb-0.5"
            style={{ color: THEME.textPrimary }}
          >
            Worker Health Trends — 12hr
          </p>
          <p className="text-xs mb-4" style={{ color: THEME.textSecondary }}>
            Average Heart Rate and SpO₂ across all workers
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={healthTrend}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                interval={2}
              />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: `1px solid ${THEME.border}`,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="avgHR"
                stroke="#EF4444"
                fill="#FEE2E2"
                strokeWidth={2}
                name="Avg HR (bpm)"
              />
              <Area
                type="monotone"
                dataKey="avgSpO2"
                stroke="#3B82F6"
                fill="#DBEAFE"
                strokeWidth={2}
                name="Avg SpO₂ (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <p
          className="font-bold text-sm mb-0.5"
          style={{ color: THEME.textPrimary }}
        >
          Weekly Incident Summary
        </p>
        <p className="text-xs mb-4" style={{ color: THEME.textSecondary }}>
          Critical and warning incidents per day this week
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={incidents}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: `1px solid ${THEME.border}`,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="critical"
              fill="#EF4444"
              name="Critical"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="warning"
              fill="#F59E0B"
              name="Warning"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── PAGE: Settings ───────────────────────────────────────────────────────────
function SettingsPage({ supervisor }) {
  const [thresholds, setThresholds] = useState({
    h2s: 10,
    ch4: 25,
    o2: 16,
    water: 60,
    hr: 140,
    spo2: 90,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SectionTitle
        title="Settings"
        subtitle="Configure alert thresholds and system preferences"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <p
            className="font-bold text-sm mb-4"
            style={{ color: THEME.textPrimary }}
          >
            🎚 Alert Thresholds
          </p>
          <div className="space-y-4">
            {[
              {
                key: "h2s",
                label: "H₂S Danger Level",
                unit: "ppm",
                min: 1,
                max: 20,
              },
              {
                key: "ch4",
                label: "CH₄ Danger Level",
                unit: "% LEL",
                min: 5,
                max: 50,
              },
              {
                key: "o2",
                label: "O₂ Minimum Level",
                unit: "%",
                min: 14,
                max: 20,
              },
              {
                key: "water",
                label: "Water Level Danger",
                unit: "cm",
                min: 10,
                max: 100,
              },
              {
                key: "hr",
                label: "Heart Rate Max",
                unit: "bpm",
                min: 90,
                max: 200,
              },
              {
                key: "spo2",
                label: "SpO₂ Minimum",
                unit: "%",
                min: 80,
                max: 96,
              },
            ].map((field) => (
              <div key={field.key}>
                <div className="flex justify-between mb-1.5">
                  <label
                    className="text-xs font-semibold"
                    style={{ color: THEME.textSecondary }}
                  >
                    {field.label}
                  </label>
                  <Mono
                    className="text-xs font-bold"
                    style={{ color: THEME.accent }}
                  >
                    {thresholds[field.key]} {field.unit}
                  </Mono>
                </div>
                <div style={{ position: 'relative', width: '100%', height: '24px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', width: '100%', height: '4px', background: '#E5E7EB', borderRadius: '4px' }} />
                  <div style={{
                    position: 'absolute', height: '4px', borderRadius: '4px',
                    background: THEME.accent,
                    width: ((thresholds[field.key] - field.min) / (field.max - field.min) * 100) + '%',
                  }} />
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step="1"
                    value={thresholds[field.key]}
                    onChange={(e) => setThresholds({ ...thresholds, [field.key]: +e.target.value })}
                    style={{
                      position: 'absolute', width: '100%', margin: 0, padding: 0,
                      appearance: 'none', WebkitAppearance: 'none',
                      background: 'transparent', cursor: 'pointer', height: '24px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: saved ? THEME.safe : THEME.accent }}
          >
            {saved ? "✓ Saved!" : "Save Thresholds"}
          </button>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <p
              className="font-bold text-sm mb-4"
              style={{ color: THEME.textPrimary }}
            >
              🔔 Notification Preferences
            </p>
            <div className="space-y-3">
              {[
                "Email alerts for critical events",
                "SMS for SOS activation",
                "Push notifications for gas leaks",
                "Daily safety summary report",
                "Worker health digest",
              ].map((opt) => (
                <label
                  key={opt}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span
                    className="text-sm"
                    style={{ color: THEME.textPrimary }}
                  >
                    {opt}
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: THEME.accent }}
                  />
                </label>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <p
              className="font-bold text-sm mb-4"
              style={{ color: THEME.textPrimary }}
            >
              👤 Account
            </p>
            <div className="space-y-3">
              {[
                { label: "Name",  value: supervisor?.name  || "—" },
                { label: "Role",  value: supervisor?.role  || "Supervisor" },
                { label: "Email", value: supervisor?.email || "—" },
                { label: "Phone", value: supervisor?.phone || "—" },
                { label: "Shift", value: supervisor?.shift || "06:00 AM – 02:00 PM" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: THEME.border }}
                >
                  <span
                    className="text-xs"
                    style={{ color: THEME.textSecondary }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: THEME.textPrimary }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("supervisor@safeguard.in");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("sg_token", data.token);
      localStorage.setItem("sg_user", JSON.stringify(data.supervisor));
      onLogin(data.supervisor);
    } catch (err) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, phone }),
      });
      setLoading(false);
      setSuccess(`Account created for ${name}! You can now log in.`);
      setMode("login");
      setPassword("");
    } catch (err) {
      setError(err.message || "Signup failed");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: THEME.bg,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white mx-auto mb-4"
            style={{ background: THEME.accent }}
          >
            ⛑
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: THEME.textPrimary }}
          >
            SafeGuard Portal
          </h1>
          <p className="mt-1 text-sm" style={{ color: THEME.textSecondary }}>
            Manhole Safety Monitoring System
          </p>
        </div>

        <Card className="p-7">
          {/* Tabs */}
          <div
            className="flex mb-6 rounded-xl overflow-hidden border"
            style={{ borderColor: THEME.border }}
          >
            {["login", "register"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab);
                  setError("");
                  setSuccess("");
                }}
                className="flex-1 py-2.5 text-sm font-semibold capitalize transition-all"
                style={{
                  background: mode === tab ? THEME.accent : "transparent",
                  color: mode === tab ? "#fff" : THEME.textSecondary,
                }}
              >
                {tab === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {success && (
            <div
              className="mb-4 p-3 rounded-xl text-sm font-medium"
              style={{
                background: "#ECFDF5",
                color: "#059669",
                border: "1px solid #A7F3D0",
              }}
            >
              ✓ {success}
            </div>
          )}
          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm font-medium"
              style={{
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
              }}
            >
              {error}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: THEME.textSecondary }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{
                    borderColor: THEME.border,
                    background: THEME.bg,
                    color: THEME.textPrimary,
                  }}
                  placeholder="you@safeguard.in"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: THEME.textSecondary }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{
                    borderColor: THEME.border,
                    background: THEME.bg,
                    color: THEME.textPrimary,
                  }}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                style={{ background: THEME.accent }}
              >
                {loading ? "Signing in..." : "Sign In →"}
              </button>
              <p
                className="text-center text-xs"
                style={{ color: THEME.textMuted }}
              >
                Demo: supervisor@safeguard.in / password123
              </p>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: THEME.textSecondary }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{
                    borderColor: THEME.border,
                    background: THEME.bg,
                    color: THEME.textPrimary,
                  }}
                  placeholder="Rajesh Sharma"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: THEME.textSecondary }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{
                    borderColor: THEME.border,
                    background: THEME.bg,
                    color: THEME.textPrimary,
                  }}
                  placeholder="you@safeguard.in"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: THEME.textSecondary }}
                >
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{
                    borderColor: THEME.border,
                    background: THEME.bg,
                    color: THEME.textPrimary,
                  }}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: THEME.textSecondary }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{
                    borderColor: THEME.border,
                    background: THEME.bg,
                    color: THEME.textPrimary,
                  }}
                  placeholder="Min. 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                style={{ background: THEME.accent }}
              >
                {loading ? "Creating account..." : "Create Account →"}
              </button>
            </form>
          )}
        </Card>

        <div className="flex justify-center gap-6 mt-6">
          {["Secure Auth", "AES-256 Encrypted", "Role-Based Access"].map(
            (tag) => (
              <span
                key={tag}
                className="text-xs flex items-center gap-1"
                style={{ color: THEME.textMuted }}
              >
                <span style={{ color: THEME.safe }}>✓</span> {tag}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [workers, setWorkers] = useState(WORKERS_DATA);
  const [sites, setSites] = useState(SITES_DATA);
  const [alerts, setAlerts] = useState(ALERTS_DATA);
  const [jobs, setJobs] = useState(JOBS_DATA);
  const [logs, setLogs] = useState(LOGS_DATA);
  const [supervisor, setSupervisor] = useState(null);
  const socketRef = useRef(null);

  // ── Map raw backend worker to UI shape ──────────────────────────────────
  const mapWorker = (w) => ({
    id: w._id,
    name: w.name,
    employeeId: w.employeeId || w.worker_id || w.name,
    site: (w.location?.address && w.location.address !== 'Not assigned' && w.location.address !== '')
              ? w.location.address
              : (w.site && w.site !== 'Not assigned' ? w.site : '—'),
    status:
      w.status === "active"
        ? "Active"
        : w.status === "emergency"
          ? "Emergency"
          : "Idle",
    hr: w.heart_rate || w.hr || 75,
    spo2: w.spo2 || 97,
    lat: w.location?.lat || 19.076,
    lng: w.location?.lng || 72.877,
    task: w.current_job?.task_description || w.current_job?.title || "Standby",
  });

  // ── Map raw backend alert to UI shape ────────────────────────────────────
  const mapAlert = (a) => ({
    id:       a._id,
    type:     a.type || a.alert_type || 'Alert',
    severity: a.severity,
    worker:   a.workerId?.name
           || a.worker_id?.name
           || a.workerName
           || (a.workerId && typeof a.workerId === 'object' ? a.workerId.name : null)
           || '—',
    site:     a.siteId || a.site || a.location?.address || '—',
    message:  a.message,
    time:     new Date(a.triggeredAt || a.timestamp || a.createdAt)
                .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status:   a.status === 'active'       ? 'Active'
            : a.status === 'Active'       ? 'Active'
            : a.status === 'acknowledged' ? 'Acknowledged'
            : a.status === 'Acknowledged' ? 'Acknowledged'
            : 'Resolved',
  });

  // ── Map raw backend job to UI shape ──────────────────────────────────────
  const mapJob = (j) => ({
    id: j._id,
    title: j.title || j.task_description || 'Untitled Job',
    worker: j.workerId?.name || j.worker_id?.name || 'Unassigned',
    site: j.site || j.location?.address || '—',
    status:
      j.status === 'In Progress' ? 'In Progress'
      : j.status === 'active'    ? 'In Progress'
      : j.status === 'Pending'   ? 'Pending'
      : j.status === 'pending'   ? 'Pending'
      : j.status === 'Emergency' ? 'Emergency'
      : j.status === 'emergency' ? 'Emergency'
      : j.status === 'Completed' ? 'Completed'
      : j.status === 'Cancelled' ? 'Cancelled'
      : 'Pending',
    start:
      j.startedAt || j.start_time
        ? new Date(j.startedAt || j.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
    est: j.endedAt || j.end_time
      ? new Date(j.endedAt || j.end_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : j.estimatedEnd
      ? new Date(j.estimatedEnd).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    priority: j.priority
      ? j.priority.charAt(0).toUpperCase() + j.priority.slice(1)
      : "Medium",
  });

  // ── Load all data from backend ───────────────────────────────────────────
  async function loadData() {
    try {
      const [workersRes, alertsRes, jobsRes] = await Promise.all([
        apiFetch("/workers"),
        apiFetch("/alerts"),
        apiFetch("/jobs"),
      ]);
      const rawWorkers = workersRes?.workers || workersRes || [];
      const rawAlerts = alertsRes?.alerts || alertsRes || [];
      const rawJobs = jobsRes?.jobs || jobsRes || [];
      if (rawWorkers.length) setWorkers(rawWorkers.map(mapWorker));
      if (rawAlerts.length) setAlerts(rawAlerts.map(mapAlert));
      if (rawJobs.length) setJobs(rawJobs.map(mapJob));
      console.log("[APP] ✅ Live data loaded from backend");
    } catch (err) {
      console.warn("[APP] Using demo data:", err.message);
    }
  }

  // ── Socket.io setup ──────────────────────────────────────────────────────
  function connectSocket(supervisorId) {
    const socket = io("http://localhost:5000", {
      auth: { token: getToken() },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WS] ✅ Socket connected");
      socket.emit("join:supervisor", supervisorId);
    });

    // New alert from IoT device or system
    socket.on("alert:new", (alert) => {
      console.log("[WS] New alert:", alert.type);
      setAlerts((prev) => [mapAlert(alert), ...prev]);
      setLogs((prev) => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "Alert",
          event: `${alert.type} — ${alert.message}`,
          worker: alert.workerId?.name || "—",
          severity: alert.severity,
        },
        ...prev,
      ]);
    });

    // Alert status changed (acknowledged/resolved)
    socket.on("alert:updated", (alert) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert._id ? mapAlert(alert) : a)),
      );
    });

    // Live vitals from wristband
    socket.on("vitals:update", (data) => {
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === data.workerId
            ? {
                ...w,
                hr: data.heart_rate || data.hr || w.hr,
                spo2: data.spo2 || w.spo2,
                status:
                  data.status === "emergency"
                    ? "Emergency"
                    : data.status === "active"
                      ? "Active"
                      : w.status,
              }
            : w,
        ),
      );
    });

    // Worker emergency triggered
    socket.on("worker:emergency", ({ workerId }) => {
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === workerId ? { ...w, status: "Emergency" } : w,
        ),
      );
    });

    // Job created/updated
    socket.on("job:created", (job) =>
      setJobs((prev) => [mapJob(job), ...prev]),
    );
    socket.on("job:started", (job) =>
      setJobs((prev) => prev.map((j) => (j.id === job._id ? mapJob(job) : j))),
    );
    socket.on("job:completed", (job) =>
      setJobs((prev) => prev.map((j) => (j.id === job._id ? mapJob(job) : j))),
    );

    socket.on("disconnect", () => console.log("[WS] Socket disconnected"));
  }

  // ── On login ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authed || !supervisor) return;
    loadData();
    connectSocket(supervisor._id);

    // Sensor drift simulation (until real IoT devices connected)
    const interval = setInterval(() => {
      setSites((prev) =>
        prev.map((s) => ({
          ...s,
          h2s: +Math.max(0.1, s.h2s + (Math.random() - 0.5) * 0.8).toFixed(1),
          ch4: +Math.max(0.1, s.ch4 + (Math.random() - 0.5) * 1.2).toFixed(1),
          o2: +Math.min(
            21,
            Math.max(15, s.o2 + (Math.random() - 0.5) * 0.1),
          ).toFixed(1),
          water: +Math.max(0, s.water + (Math.random() - 0.45) * 2).toFixed(0),
        })),
      );
    }, 3000);

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
    };
  }, [authed, supervisor]);

  // ── Job actions wired to backend ──────────────────────────────────────────
  async function handleStartJob(jobId) {
    try {
      await apiFetch(`/jobs/${jobId}/start`, { method: "PATCH" });
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "In Progress",
                start: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : j,
        ),
      );
    } catch (err) {
      console.error("Start job failed:", err.message);
    }
  }

  async function handleEndJob(jobId) {
    try {
      await apiFetch(`/jobs/${jobId}/end`, { method: "PATCH" });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "Completed" } : j)),
      );
    } catch (err) {
      console.error("End job failed:", err.message);
    }
  }

  async function handleDispatchJob(formData) {
    try {
      if (!formData.workerId || !formData.title || !formData.site) {
        alert('Please fill in all required fields');
        return;
      }
      const res = await apiFetch('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          worker_id:        formData.workerId,
          title:            formData.title,
          task_description: formData.title,
          location:         { address: formData.site },
          site:             formData.site,
          priority:         (formData.priority || 'medium').toLowerCase(),
          status:           'pending',
        }),
      });
      console.log('[DISPATCH] Job created:', res);
      if (res && (res.job || res._id)) {
        const newJob = res.job || res;
        setJobs((prev) => [mapJob(newJob), ...prev]);
      }
      await loadData();
    } catch (err) {
      console.error('Dispatch job failed:', err);
      alert('Job dispatch failed: ' + (err.message || 'Unknown error'));
    }
  }
  // ── Alert actions wired to backend ────────────────────────────────────────
  async function handleAcknowledgeAlert(alertId) {
    try {
      await apiFetch(`/alerts/${alertId}/acknowledge`, { method: "PATCH" });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: "Acknowledged" } : a,
        ),
      );
    } catch (err) {
      console.error("Acknowledge failed:", err.message);
    }
  }

  async function handleResolveAlert(alertId) {
    try {
      await apiFetch(`/alerts/${alertId}/resolve`, { method: "PATCH" });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: "Resolved" } : a)),
      );
    } catch (err) {
      console.error("Resolve failed:", err.message);
    }
  }

  // ── Worker actions ────────────────────────────────────────────────────────
  async function handleAddWorker(formData) {
    const res = await apiFetch('/workers', {
      method: 'POST',
      body: JSON.stringify({
        name:          formData.name,
        worker_id:     formData.worker_id,
        phone:         formData.phone         || '',
        wristband_id:  formData.wristband_id  || '',
        status:        formData.status        || 'idle',
        heart_rate:    75,
        spo2:          98,
        health_status: 'Good',
        location: { lat: 0, lng: 0, address: 'Not assigned' },
      }),
    });
    await loadData();
    return res;
  }

  async function handleUpdateWorker(workerId, formData) {
    await apiFetch(`/workers/${workerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name:         formData.name,
        worker_id:    formData.worker_id,
        phone:        formData.phone        || '',
        wristband_id: formData.wristband_id || '',
        status:       formData.status       || 'idle',
      }),
    });
    await loadData();
  }

  async function handleDeleteWorker(workerId) {
    await apiFetch(`/workers/${workerId}`, { method: 'DELETE' });
    await loadData();
  }

  if (!authed) {
    return (
      <LoginPage onLogin={(user) => {
        setSupervisor(user);
        setAuthed(true);
      }} />
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage workers={workers} sites={sites} alerts={alerts} sensors={sites} setActive={setPage} />;
      case 'workers':
        return (
          <WorkersPage
            workers={workers}
            onAddWorker={handleAddWorker}
            onUpdateWorker={handleUpdateWorker}
            onDeleteWorker={handleDeleteWorker}
          />
        );
      case 'jobs':
        return (
          <JobsPage
            jobs={jobs}
            setJobs={setJobs}
            onStart={handleStartJob}
            onEnd={handleEndJob}
            onDispatch={handleDispatchJob}
            workers={workers}
          />
        );
      case 'livemap':
        return <LiveMapPage workers={workers} alerts={alerts} />;
      case 'monitoring':
        return <MonitoringPage sites={sites} />;
      case 'alerts':
        return (
          <AlertsPage
            alerts={alerts}
            setAlerts={setAlerts}
            onAcknowledge={handleAcknowledgeAlert}
            onResolve={handleResolveAlert}
          />
        );
      case 'logs':       return <LogsPage logs={logs} />;
      case 'analytics':  return <AnalyticsPage />;
      case 'settings':   return <SettingsPage supervisor={supervisor} />;
      default:
        return <DashboardPage workers={workers} sites={sites} alerts={alerts} sensors={sites} setActive={setPage} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: THEME.bg }}>
      <Sidebar active={page} setActive={setPage} alerts={alerts} supervisor={supervisor} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar page={page} alerts={alerts} setActive={setPage} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

