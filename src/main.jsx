import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Eye,
  FileDown,
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Mail,
  Instagram,
  MoreHorizontal,
  Plus,
  Phone,
  Search,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Target,
  TrendingUp,
  Camera,
  UserPlus,
  Users,
  X,
  QrCode,
  Printer,
  History,
} from 'lucide-react';
import './styles.css';
import { readState, writeState, clearState } from './db';
import { supabase } from './supabase';
import {
  signInOwner,
  signOutOwner,
  getSupabaseSession,
  subscribeToAuthChanges,
} from './supabaseAuth';
import {
  loadCloudState,
  insertRecord,
  updateRecord,
  deleteRecord,
  saveSettings as saveCloudSettings,
  publicCheckIn,
  publicSubmitFeedback,
  publicSubmitEnquiry,
  getMyAccess,
  getGymStaff,
  updateStaffPermissions,
  setStaffActive,
} from './cloudData';

const PT_HISTORY_MARKER = '<!--PREFACE_PT_HISTORY:';
function getPTSessionHistory(notes) {
  const value = String(notes || '');
  const index = value.lastIndexOf(PT_HISTORY_MARKER);
  if (index < 0) return [];
  try {
    const raw = value.slice(index + PT_HISTORY_MARKER.length).split('-->')[0];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function cleanPTSessionNotes(notes) {
  const value = String(notes || '');
  const index = value.lastIndexOf(PT_HISTORY_MARKER);
  return (index < 0 ? value : value.slice(0, index)).trim();
}
function withPTSessionHistory(notes, history) {
  const clean = cleanPTSessionNotes(notes);
  return `${clean}${clean ? '\\n\\n' : ''}${PT_HISTORY_MARKER}${JSON.stringify(history || [])}-->`;
}
function printPTMasterRecord({ member, sessions, trainers, settings = {} }) {
  const rows = (sessions || []).flatMap((pkg) => {
    const history = getPTSessionHistory(pkg.notes);
    return history.map((entry, index) => ({ ...entry, packageId: pkg.id, planName: pkg.planName || pkg.type || 'Personal Training', trainerName: trainers.find((t) => t.id === pkg.trainerId)?.name || pkg.trainer || '—', fee: pkg.fee, packageIndex: index + 1 }));
  }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.time || '').localeCompare(String(a.time || '')));
  const packages = [...(sessions || [])].sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
  const completed = rows.length;
  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const esc = (v) => String(v ?? '—').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) { alert('Please allow pop-ups to print the PT record.'); return; }
  win.document.write(`<!doctype html><html><head><title>PT Master Record - ${esc(member?.name || 'Member')}</title><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#17243b;margin:28px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #6d4aff;padding-bottom:16px;margin-bottom:18px}h1{margin:0 0 5px;font-size:25px}h2{font-size:17px;margin:24px 0 10px}.muted{color:#64748b}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.metric{padding:12px;border:1px solid #e2e8f0;border-radius:9px}.metric span{display:block;color:#64748b;font-size:11px}.metric strong{display:block;font-size:19px;margin-top:5px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{padding:9px 8px;border:1px solid #dbe2ec;text-align:left;vertical-align:top}th{background:#f2efff;font-size:11px;text-transform:uppercase;letter-spacing:.03em}.notes{max-width:240px;white-space:pre-wrap;word-break:break-word}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:60px}.signatures div{border-top:1px solid #64748b;padding-top:8px;text-align:center}.print-btn{background:#6d4aff;color:#fff;border:0;padding:10px 16px;border-radius:7px;cursor:pointer}@media print{body{margin:12mm}.print-btn{display:none}tr{break-inside:avoid}header{break-after:avoid}}
  </style></head><body><header><div><h1>${esc(settings?.gymName || 'Preface Fitness')}</h1><div class="muted">Personal Training · Client Master Record</div></div><button class="print-btn" onclick="window.print()">Print / Save PDF</button></header>
  <h2>Client details</h2><div><strong>${esc(member?.name)}</strong> &nbsp; · &nbsp; Member ID: ${esc(member?.id)} &nbsp; · &nbsp; Phone: ${esc(member?.phone || '—')}</div>
  <div class="summary"><div class="metric"><span>Completed sessions</span><strong>${completed}</strong></div><div class="metric"><span>PT packages</span><strong>${packages.length}</strong></div><div class="metric"><span>Sessions assigned</span><strong>${packages.reduce((n,p)=>n+Number(p.sessionsTotal||1),0)}</strong></div><div class="metric"><span>Sessions remaining</span><strong>${packages.reduce((n,p)=>n+Math.max(0,Number(p.sessionsTotal||1)-Number(p.sessionsCompleted||0)),0)}</strong></div></div>
  <h2>Session history</h2>${rows.length ? `<table><thead><tr><th>#</th><th>Date</th><th>Time</th><th>Trainer</th><th>Package</th><th>Session note</th><th>Recorded by</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${rows.length-i}</td><td>${esc(r.date)}</td><td>${esc(r.time || '—')}</td><td>${esc(r.trainerName)}</td><td>${esc(r.planName)}</td><td class="notes">${esc(r.notes || '—')}</td><td>${esc(r.recordedBy || 'Staff')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No individual completed-session history has been recorded yet. Older package counts may exist without per-session dates.</p>'}
  <h2>PT packages</h2><table><thead><tr><th>Package start</th><th>Plan</th><th>Trainer</th><th>Completed / Total</th><th>Expiry</th><th>Fee</th><th>Status</th></tr></thead><tbody>${packages.map(p=>`<tr><td>${esc(p.date)}</td><td>${esc(p.planName||p.type||'Personal Training')}</td><td>${esc(trainers.find(t=>t.id===p.trainerId)?.name||p.trainer||'—')}</td><td>${Number(p.sessionsCompleted||0)} / ${Number(p.sessionsTotal||1)}</td><td>${esc(p.expiryDate||'—')}</td><td>${money(p.fee)}</td><td>${esc(p.status)}</td></tr>`).join('')}</tbody></table>
  <div class="signatures"><div>Client signature</div><div>Trainer / Gym representative</div></div><script>window.onload=()=>{};</script></body></html>`);
  win.document.close();
}

const LOGO_URL = `${import.meta.env.BASE_URL}preface-logo.jpg`;

const STORAGE_KEY = 'preface-fitness-v1';
const AUTH_SESSION_KEY = 'preface-fitness-auth-session';
const AUTH_SESSION_MS = 20 * 60 * 1000;
const today = new Date().toISOString().slice(0, 10);

const MEMBERSHIP_PLANS = [
  { name: 'Monthly', months: 1, price: 1500, description: 'Flexible month-to-month membership' },
  { name: 'Quarterly', months: 3, price: 4000, description: '3 month membership' },
  { name: 'Half-yearly', months: 6, price: 7000, description: '6 month membership' },
  { name: 'Annual', months: 12, price: 12000, description: '12 month membership' },
];

const DEFAULT_MEMBERSHIP_PRICES = Object.fromEntries(
  MEMBERSHIP_PLANS.map((plan) => [plan.name, plan.price])
);


const MEMBER_META_MARKER = '<!--PREFACE_MEMBER_META:';
const MEMBER_MEDICAL_OPTIONS = [
  'Heart Disease', 'Asthma', 'Infectious Diseases', 'High/Low Blood Pressure',
  'Family Hx of Heart Disease', 'Cardiovascular Condition', 'Dizziness', 'Arthritis',
  'Diabetes', 'Fainting', 'Epilepsy/Fits', 'Blackouts', 'Knees', 'Lower Back',
  'Neck/Shoulders', 'Flexibility', 'Hips/Pelvis', 'Other',
];
function readMemberMeta(notes) {
  const value = String(notes || '');
  const index = value.lastIndexOf(MEMBER_META_MARKER);
  if (index < 0) return {};
  const raw = value.slice(index + MEMBER_META_MARKER.length).split('-->')[0];
  try { return JSON.parse(raw); } catch { return {}; }
}
function cleanMemberNotes(notes) {
  const value = String(notes || '');
  const index = value.lastIndexOf(MEMBER_META_MARKER);
  return (index < 0 ? value : value.slice(0, index)).trim();
}
function encodeMemberNotes(notes, meta = {}) {
  const clean = String(notes || '').trim();
  const payload = JSON.stringify({
    medicalConditions: Array.isArray(meta.medicalConditions) ? meta.medicalConditions : [],
    medicalOther: String(meta.medicalOther || ''),
    surgeryDetails: String(meta.surgeryDetails || ''),
    additionalMedicalNotes: String(meta.additionalMedicalNotes || ''),
    referralOther: String(meta.referralOther || ''),
    chest: String(meta.chest ?? ''),
    shoulder: String(meta.shoulder ?? ''),
    biceps: String(meta.biceps ?? ''),
    forearms: String(meta.forearms ?? ''),
    waist: String(meta.waist ?? ''),
    hips: String(meta.hips ?? ''),
    thighs: String(meta.thighs ?? ''),
    calves: String(meta.calves ?? ''),
    neck: String(meta.neck ?? ''),
    gstinAadhaar: String(meta.gstinAadhaar ?? ''),
    billingState: String(meta.billingState ?? ''),
    billingStateCode: String(meta.billingStateCode ?? ''),
    memberInvoiceNumber: String(meta.memberInvoiceNumber ?? '')
  });
  return `${clean}${clean ? '\n\n' : ''}${MEMBER_META_MARKER}${payload}-->`;
}


const VIBRANT_THEME_CSS = `
  :root { --pf-purple:#6d4aff; --pf-violet:#8d4dff; --pf-teal:#12bfa6; --pf-green:#2acb78; --pf-pink:#f23c92; --pf-gold:#f3bd16; --pf-orange:#f57c18; --pf-blue:#3f8cff; --pf-ink:#15233a; --pf-muted:#64748b; }
  html, body, #root { min-height:100%; }
  body { font-size:18px !important; background:radial-gradient(circle at 8% 8%,rgba(109,74,255,.14),transparent 28%),radial-gradient(circle at 92% 18%,rgba(18,191,166,.12),transparent 25%),radial-gradient(circle at 78% 88%,rgba(242,60,146,.10),transparent 28%),linear-gradient(135deg,#eef2ff 0%,#f4efff 42%,#eefbfa 72%,#fff1f8 100%) !important; color:var(--pf-ink) !important; }
  button, input, select, textarea { font:inherit; }
  .vibrant-app-shell { min-height:100vh !important; background:radial-gradient(circle at 5% 12%,rgba(109,74,255,.13),transparent 30%),radial-gradient(circle at 96% 18%,rgba(18,191,166,.11),transparent 28%),radial-gradient(circle at 70% 92%,rgba(242,60,146,.09),transparent 30%),linear-gradient(135deg,#eef2ff 0%,#f6f0ff 44%,#edfafa 73%,#fff1f8 100%) !important; }
  .vibrant-app-shell .sidebar-compact { width:205px !important; min-width:205px !important; background:linear-gradient(180deg,#17183b 0%,#27205a 52%,#3a2169 100%) !important; color:#fff !important; border-right:0 !important; box-shadow:16px 0 40px rgba(54,38,113,.16) !important; position:sticky !important; top:0 !important; height:100vh !important; z-index:80 !important; padding:18px 12px !important; }
  .vibrant-app-shell .sidebar-compact.collapsed { width:0 !important; min-width:0 !important; padding:0 !important; margin:0 !important; overflow:hidden !important; opacity:0 !important; pointer-events:none !important; box-shadow:none !important; }
  .vibrant-app-shell .sidebar-compact.collapsed > * { visibility:hidden !important; }
  .vibrant-app-shell .menu-btn { display:flex !important; align-items:center !important; justify-content:center !important; flex:0 0 46px !important; width:46px !important; height:46px !important; border-radius:13px !important; background:#f5f2ff !important; color:#5b4bc3 !important; border:1px solid #e9e3ff !important; cursor:pointer !important; }
  .vibrant-collapsed-brand { display:none !important; align-items:center !important; gap:10px !important; margin-right:4px !important; }
  .vibrant-collapsed-brand img { width:44px !important; height:44px !important; object-fit:cover !important; border-radius:13px !important; box-shadow:0 8px 18px rgba(42,31,104,.16) !important; }
  .vibrant-collapsed-brand span { font-size:15px !important; font-weight:900 !important; color:#18243d !important; white-space:nowrap !important; }
  .vibrant-app-shell.sidebar-is-collapsed .vibrant-collapsed-brand { display:flex !important; }
  .vibrant-app-shell.sidebar-is-collapsed .topbar-primary-row { justify-content:flex-start !important; }
  .vibrant-app-shell.sidebar-is-collapsed .topbar-primary-row .topbar-actions { margin-left:auto !important; }
  .vibrant-app-shell .top-navigation-scroll { display:grid !important; grid-template-columns:repeat(8,minmax(120px,1fr)) !important; gap:6px !important; padding:8px 0 12px !important; align-items:stretch !important; }
  .vibrant-app-shell .top-navigation-item { width:100% !important; min-width:0 !important; justify-content:center !important; min-height:42px !important; padding:0 9px !important; font-size:14px !important; border:1px solid #edf0f7 !important; background:#fff !important; box-shadow:0 2px 7px rgba(31,42,71,.035) !important; }
  .vibrant-app-shell .top-navigation-item.active { border-color:transparent !important; background:linear-gradient(135deg,#6e4cff,#8a4eff) !important; box-shadow:0 8px 18px rgba(111,77,255,.20) !important; }
  .vibrant-app-shell .top-navigation-item span { overflow:hidden !important; text-overflow:ellipsis !important; }
  .vibrant-app-shell .topbar-actions { display:flex !important; align-items:center !important; gap:9px !important; flex-shrink:0 !important; }
  .vibrant-app-shell .topbar-left { display:flex !important; align-items:center !important; gap:10px !important; min-width:0 !important; }
  .vibrant-app-shell .vibrant-breadcrumb { white-space:nowrap !important; }
  /* Final polish: clean responsive navigation, subtle glass/reflection treatment and no page overflow. */
  html, body, #root { width:100% !important; max-width:100% !important; overflow-x:hidden !important; }
  .vibrant-app-shell { width:100% !important; max-width:100vw !important; overflow-x:hidden !important; }
  .vibrant-app-shell .main { max-width:100vw !important; box-sizing:border-box !important; overflow-x:hidden !important; }

  /* Transparent, glass-like fixed navbar. */
  .vibrant-topbar {
    background:rgba(255,255,255,.48) !important;
    backdrop-filter:blur(22px) saturate(145%) !important;
    -webkit-backdrop-filter:blur(22px) saturate(145%) !important;
    border-bottom:1px solid rgba(100,88,180,.13) !important;
    box-shadow:0 8px 28px rgba(31,35,72,.055) !important;
    padding:10px 20px 12px !important;
  }
  .topbar-primary-row { min-height:56px !important; height:56px !important; gap:12px !important; }
  .vibrant-app-shell .topbar-left { gap:10px !important; flex:1 1 auto !important; min-width:0 !important; }
  .vibrant-collapsed-brand { flex:0 0 auto !important; }
  .vibrant-app-shell .menu-btn { flex:0 0 44px !important; width:44px !important; height:44px !important; }
  .vibrant-app-shell .topbar-actions { margin-left:auto !important; flex:0 0 auto !important; }

  /* Sidebar starts below the fixed navbar. The close button has its own row space. */
  .vibrant-app-shell .sidebar-compact { top:132px !important; padding:16px 12px 18px !important; }
  .vibrant-app-shell .sidebar-compact .compact-brand {
    height:58px !important;
    min-height:58px !important;
    margin:0 0 8px !important;
    padding:0 !important;
    display:block !important;
  }
  .vibrant-app-shell .sidebar-compact .compact-sidebar-label { padding:0 10px 10px !important; }

  /* The complete navigation stays visible: 8 equal columns x 2 rows on desktop. */
  .vibrant-app-shell .top-navigation-scroll {
    display:grid !important;
    grid-template-columns:repeat(8,minmax(0,1fr)) !important;
    grid-auto-rows:40px !important;
    gap:7px !important;
    width:100% !important;
    max-width:none !important;
    margin:7px 0 0 !important;
    padding:0 0 2px !important;
    overflow:visible !important;
  }
  .vibrant-app-shell .top-navigation-item {
    min-width:0 !important;
    width:100% !important;
    height:40px !important;
    min-height:40px !important;
    padding:0 7px !important;
    gap:6px !important;
    border-radius:10px !important;
    background:linear-gradient(135deg,rgba(255,255,255,.74),rgba(246,242,255,.58)) !important;
    border:1px solid rgba(111,77,255,.15) !important;
    box-shadow:0 2px 8px rgba(40,46,78,.035) !important;
    white-space:normal !important;
    overflow:visible !important;
    text-overflow:clip !important;
    transition:transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease !important;
  }
  .vibrant-app-shell .top-navigation-item span {
    overflow:visible !important;
    text-overflow:clip !important;
    white-space:nowrap !important;
    line-height:1 !important;
    font-size:12px !important;
  }
  .vibrant-app-shell .top-navigation-item:hover {
    transform:translateY(-1px) !important;
    background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(239,235,255,.82)) !important;
    border-color:rgba(105,72,233,.24) !important;
    box-shadow:0 7px 16px rgba(46,43,91,.08) !important;
  }
  .vibrant-app-shell .top-navigation-item.active { background:linear-gradient(135deg,#6e4cff,#8a4eff) !important; }

  /* Professional glass/reflection treatment for controls and tiles. */
  .vibrant-app-shell button,
  .vibrant-app-shell .vibrant-stat-tile,
  .vibrant-app-shell .vibrant-panel,
  .vibrant-app-shell .dashboard-filter-card {
    -webkit-tap-highlight-color:transparent !important;
  }
  .vibrant-app-shell button { transition:transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease !important; }
  .vibrant-app-shell .vibrant-stat-tile,
  .vibrant-app-shell .vibrant-stat-tile::after,
  .vibrant-app-shell .top-navigation-item,
  .vibrant-app-shell .btn,
  .vibrant-app-shell .quick-action,
  .vibrant-app-shell .dashboard-filter-btn,
  .vibrant-app-shell .nav-item {
    position:relative !important;
  }
  .vibrant-app-shell .vibrant-stat-tile::after,
  .vibrant-app-shell .top-navigation-item::after,
  .vibrant-app-shell .btn::after,
  .vibrant-app-shell .quick-action::after,
  .vibrant-app-shell .dashboard-filter-btn::after,
  .vibrant-app-shell .nav-item::after {
    content:"" !important;
    position:absolute !important;
    left:-55% !important;
    top:-80% !important;
    width:34% !important;
    height:260% !important;
    transform:rotate(22deg) !important;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.30),transparent) !important;
    opacity:0 !important;
    pointer-events:none !important;
    transition:left .45s ease, opacity .18s ease !important;
  }
  .vibrant-app-shell .vibrant-stat-tile:hover::after,
  .vibrant-app-shell .top-navigation-item:hover::after,
  .vibrant-app-shell .btn:hover::after,
  .vibrant-app-shell .quick-action:hover::after,
  .vibrant-app-shell .dashboard-filter-btn:hover::after,
  .vibrant-app-shell .nav-item:hover::after { left:125% !important; opacity:1 !important; }
  .vibrant-app-shell .vibrant-stat-tile:hover { transform:translateY(-3px) !important; box-shadow:0 17px 34px rgba(31,42,71,.13) !important; }
  .vibrant-app-shell .vibrant-stat-tile:active,
  .vibrant-app-shell .btn:active,
  .vibrant-app-shell .top-navigation-item:active { transform:translateY(0) scale(.992) !important; }

  /* Metric progress bars are intentionally subtle, not decorative-only. */
  .vibrant-stat-progress { height:7px !important; background:rgba(255,255,255,.42) !important; }
  .vibrant-stat-progress span {
    min-width:0 !important;
    max-width:100% !important;
    background:linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,255,255,.64)) !important;
    box-shadow:0 0 10px rgba(255,255,255,.38) !important;
    transition:width .55s ease !important;
  }

  /* Richer, more vibrant dashboard palette while keeping text readable. */
  .vibrant-stat-tile:nth-child(4n+1) { background:linear-gradient(135deg,#d9faea 0%,#c5f5e3 55%,#b8efe0 100%) !important; border:1px solid rgba(42,203,120,.18) !important; }
  .vibrant-stat-tile:nth-child(4n+2) { background:linear-gradient(135deg,#eee1ff 0%,#dfcaff 55%,#d6c0ff 100%) !important; border:1px solid rgba(109,74,255,.17) !important; }
  .vibrant-stat-tile:nth-child(4n+3) { background:linear-gradient(135deg,#ffdce9 0%,#ffcbe0 55%,#ffc0d9 100%) !important; border:1px solid rgba(242,60,146,.16) !important; }
  .vibrant-stat-tile:nth-child(4n) { background:linear-gradient(135deg,#fff1bd 0%,#ffe9a0 55%,#ffdf83 100%) !important; border:1px solid rgba(243,189,22,.18) !important; }
  .vibrant-stat-tile:nth-child(4n+5) { background:linear-gradient(135deg,#ffe4c7 0%,#ffd8ae 55%,#ffcf9e 100%) !important; }
  .vibrant-stat-tile:nth-child(4n+6) { background:linear-gradient(135deg,#d8f8e8 0%,#c5f0db 55%,#b7ebd4 100%) !important; }
  .vibrant-stat-tile:nth-child(4n+7) { background:linear-gradient(135deg,#cff5f2 0%,#bcece8 55%,#afe5df 100%) !important; }
  .vibrant-stat-tile:nth-child(4n+8) { background:linear-gradient(135deg,#e9edf4 0%,#dfe5ee 55%,#d5deea 100%) !important; }

  .vibrant-dashboard-hero h1 { text-shadow:0 4px 20px rgba(74,55,145,.10) !important; }
  .dashboard-filter-card, .vibrant-panel { background:rgba(255,255,255,.70) !important; border:1px solid rgba(109,74,255,.12) !important; box-shadow:0 14px 40px rgba(67,54,133,.08) !important; backdrop-filter:blur(14px) !important; }

  /* Keep the dashboard inside the viewport instead of forcing horizontal zoom-out. */
  .vibrant-app-shell .content { width:100% !important; max-width:none !important; padding:26px 28px 48px !important; box-sizing:border-box !important; }
  .vibrant-dashboard { width:100% !important; max-width:none !important; min-width:0 !important; }


  .renewal-date-grid { margin-top: 12px; }
  .renewal-date-grid input[type="date"] { width: 100%; min-height: 42px; }
  @media(max-width:700px){ .renewal-date-grid { grid-template-columns: 1fr; } }

  .membership-activity-panel{margin-top:24px;padding:24px;border:1px solid rgba(106,76,255,.15);border-radius:24px;background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(247,244,255,.94));box-shadow:0 16px 38px rgba(52,43,116,.08)}
  .membership-activity-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding-bottom:20px;border-bottom:1px solid #ece8f8}
  .membership-activity-head h2{margin:5px 0;color:#18253e;font-size:24px;font-weight:900}.membership-activity-head p{margin:0;color:#77849a;font-size:13px}
  .membership-activity-range{display:flex;align-items:flex-end;gap:10px}.membership-activity-range label{display:grid;gap:6px}.membership-activity-range label>span{color:#68758b;font-size:11px;font-weight:850}
  .membership-date-input{position:relative;display:flex;align-items:center}.membership-date-input input{width:155px;height:42px;padding:0 38px 0 12px;border:1px solid #dfe4ef;border-radius:11px;background:#fff;color:#26344c;font-weight:750;outline:none}.membership-date-input svg{position:absolute;right:11px;pointer-events:none;color:#6950e9}.membership-range-arrow{padding-bottom:11px;color:#8b78dd;font-weight:900}
  .membership-activity-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px}.membership-activity-stat{padding:15px;border-radius:16px;border:1px solid rgba(130,140,160,.12);background:#fff}.membership-activity-stat span,.membership-activity-stat small{display:block;color:#718096;font-size:11px;font-weight:700}.membership-activity-stat strong{display:block;margin:5px 0 2px;color:#1b2942;font-size:22px;font-weight:950}.membership-activity-stat small{color:#9aa5b5;font-size:10px}
  .stat-purple{box-shadow:inset 0 3px #7652f6}.stat-orange{box-shadow:inset 0 3px #f59e0b}.stat-red{box-shadow:inset 0 3px #ef476f}.stat-green{box-shadow:inset 0 3px #11a887}.stat-blue{box-shadow:inset 0 3px #3988ff}.stat-cyan{box-shadow:inset 0 3px #16b9d4}.stat-pink{box-shadow:inset 0 3px #e95acb}.stat-indigo{box-shadow:inset 0 3px #5966d8}
  .membership-activity-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.membership-activity-list-card{padding:16px;border:1px solid #e9e7f2;border-radius:18px;background:rgba(255,255,255,.78)}.membership-activity-list-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.membership-activity-list-head strong{display:block;color:#26344c;font-size:14px;font-weight:900}.membership-activity-list-head span{display:block;margin-top:3px;color:#8994a5;font-size:10px}.membership-activity-list{display:grid;gap:8px;margin-top:12px}.membership-activity-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid #edf0f5;border-radius:12px;background:#fff}.membership-activity-row strong{display:block;color:#293750;font-size:12px}.membership-activity-row span{display:block;margin-top:3px;color:#8994a5;font-size:10px}.membership-activity-row b{padding:5px 8px;border-radius:999px;font-size:10px}.membership-activity-row b.expired{background:#ffe4e8;color:#bd314d}.membership-activity-row b.soon{background:#fff1c7;color:#986b00}.membership-activity-row b.upcoming{background:#e5f8ef;color:#11815f}.membership-activity-row b.enrolled{background:#e8e4ff;color:#6248db}.membership-activity-empty{margin-top:12px;padding:16px;border-radius:12px;background:#f8fafc;color:#8994a5;font-size:12px;text-align:center}
  @media(max-width:1100px){.membership-activity-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.membership-activity-head{align-items:flex-start;flex-direction:column}.membership-activity-range{width:100%}}@media(max-width:700px){.membership-activity-columns{grid-template-columns:1fr}.membership-activity-range{flex-wrap:wrap}.membership-date-input input{width:140px}.membership-range-arrow{display:none}}
  .vibrant-tile-grid { width:100% !important; min-width:0 !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
  .vibrant-stat-tile { min-width:0 !important; }
  .dashboard-filter-card { min-width:0 !important; }
  .dashboard-filter-heading { min-width:0 !important; }
  .dashboard-date-controls { min-width:0 !important; }

  @media (max-width:1450px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(8,minmax(0,1fr)) !important; }
    .vibrant-app-shell .top-navigation-item span { font-size:11px !important; }
    .vibrant-app-shell .top-navigation-item { gap:4px !important; padding:0 4px !important; }
    .vibrant-app-shell .vibrant-tile-grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:14px !important; }
    .vibrant-stat-tile { padding-left:16px !important; padding-right:16px !important; gap:11px !important; }
    .vibrant-stat-copy strong { font-size:27px !important; }
  }
  @media (max-width:1200px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(8,minmax(0,1fr)) !important; }
    .vibrant-app-shell .top-navigation-item span { font-size:10px !important; }
    .vibrant-app-shell .top-navigation-item svg { width:15px !important; height:15px !important; }
    .vibrant-app-shell .vibrant-tile-grid { grid-template-columns:repeat(3,minmax(0,1fr)) !important; }
    .dashboard-filter-card { align-items:flex-start !important; flex-direction:column !important; }
  }
  @media (max-width:900px) {
    .vibrant-topbar { min-height:174px !important; }
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(4,minmax(0,1fr)) !important; grid-auto-rows:38px !important; }
    .vibrant-app-shell .top-navigation-item span { font-size:11px !important; }
    .vibrant-app-shell .sidebar-compact { top:174px !important; }
    .vibrant-app-shell .main { padding-top:174px !important; margin-left:0 !important; width:100% !important; }
    .vibrant-app-shell .vibrant-tile-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
  }
  @media (max-width:600px) {
    .vibrant-topbar { min-height:220px !important; padding:8px 10px 10px !important; }
    .vibrant-app-shell .topbar-primary-row { grid-template-columns:1fr auto !important; display:grid !important; height:54px !important; }
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(2,minmax(0,1fr)) !important; grid-auto-rows:38px !important; }
    .vibrant-app-shell .sidebar-compact { top:220px !important; }
    .vibrant-app-shell .main { padding-top:220px !important; }
    .vibrant-app-shell .content { padding:18px 12px 36px !important; }
    .vibrant-app-shell .vibrant-tile-grid { grid-template-columns:1fr !important; }
  }

  .compact-brand { padding:10px 8px 20px !important; border-bottom:1px solid rgba(255,255,255,.12) !important; }
  .compact-brand .brand-logo { width:48px !important; height:48px !important; border-radius:15px !important; overflow:hidden !important; box-shadow:0 10px 24px rgba(0,0,0,.22) !important; }
  .compact-brand .brand-logo img { width:100% !important; height:100% !important; object-fit:cover !important; }
  .compact-brand-copy .brand-name { color:#fff !important; font-size:20px !important; font-weight:900 !important; letter-spacing:.2px !important; }
  .compact-brand-copy .brand-sub { color:#b9b8dc !important; font-size:10px !important; font-weight:800 !important; letter-spacing:2px !important; }
  .compact-sidebar-label { padding:22px 10px 8px !important; color:#a9a9cf !important; font-size:11px !important; font-weight:900 !important; letter-spacing:1.6px !important; }
  .compact-sidebar-nav { display:flex !important; flex-direction:column !important; gap:7px !important; }
  .vibrant-app-shell .sidebar-compact .nav-item { min-height:52px !important; padding:0 12px !important; border-radius:14px !important; color:#d9d9ef !important; font-size:15px !important; font-weight:750 !important; border:1px solid transparent !important; transition:.2s ease !important; }
  .vibrant-app-shell .sidebar-compact .nav-item:hover { background:rgba(255,255,255,.10) !important; color:#fff !important; transform:translateX(2px); }
  .vibrant-app-shell .sidebar-compact .nav-item.active { background:linear-gradient(135deg,#8b5cff,#6846f5) !important; color:#fff !important; box-shadow:0 12px 26px rgba(111,77,255,.32) !important; }
  .compact-sidebar-bottom { margin-top:auto !important; }
  .compact-storage-card { background:rgba(255,255,255,.08) !important; border:1px solid rgba(255,255,255,.10) !important; padding:11px !important; border-radius:14px !important; color:#fff !important; }
  .compact-storage-card strong { color:#fff !important; font-size:12px !important; }
  .vibrant-app-shell .main { min-width:0 !important; width:calc(100% - 205px) !important; background:transparent !important; transition:width .25s ease !important; }
  .vibrant-app-shell .sidebar-compact.collapsed + .main { width:100% !important; }
  .vibrant-topbar { position:sticky !important; top:0 !important; z-index:70 !important; background:linear-gradient(90deg,rgba(255,255,255,.58),rgba(246,241,255,.48),rgba(238,250,249,.46),rgba(255,241,248,.52)) !important; backdrop-filter:blur(24px) saturate(165%) !important; -webkit-backdrop-filter:blur(24px) saturate(165%) !important; border-bottom:1px solid rgba(106,82,220,.16) !important; box-shadow:0 10px 34px rgba(74,55,145,.09) !important; padding:0 22px !important; }
  .topbar-primary-row { min-height:72px !important; display:flex !important; align-items:center !important; justify-content:space-between !important; gap:18px !important; }
  .vibrant-breadcrumb { display:flex !important; align-items:center !important; gap:8px !important; font-size:16px !important; color:#8590a5 !important; font-weight:650 !important; }
  .vibrant-breadcrumb strong { color:#18243d !important; font-size:19px !important; }
  .vibrant-icon-btn { width:44px !important; height:44px !important; border-radius:13px !important; background:#f5f2ff !important; color:#5b4bc3 !important; border:1px solid #e9e3ff !important; }
  .vibrant-admin-chip { min-height:48px !important; border-radius:15px !important; background:#f7f6ff !important; border:1px solid #ebe7ff !important; padding:5px 11px 5px 6px !important; }
  .vibrant-admin-chip .avatar { background:linear-gradient(135deg,#7255ff,#a44cff) !important; color:#fff !important; width:37px !important; height:37px !important; }
  .top-navigation-scroll { display:flex !important; align-items:center !important; justify-content:flex-start !important; gap:4px 5px !important; flex-wrap:wrap !important; overflow:visible !important; padding:0 0 10px !important; width:100% !important; }
  .top-navigation-scroll::-webkit-scrollbar { display:none; }
  .top-navigation-item { flex:0 0 auto !important; display:inline-flex !important; align-items:center !important; gap:6px !important; min-height:38px !important; padding:0 10px !important; border:1px solid transparent !important; border-radius:11px !important; background:transparent !important; color:#68748b !important; font-size:13px !important; font-weight:800 !important; cursor:pointer !important; transition:.18s ease !important; white-space:nowrap !important; }
  .top-navigation-item:hover { background:#f1efff !important; color:#6049e9 !important; }
  .top-navigation-item.active { background:linear-gradient(135deg,#6e4cff,#8a4eff) !important; color:#fff !important; box-shadow:0 8px 18px rgba(111,77,255,.23) !important; }
  .vibrant-app-shell .content { padding:28px 30px 50px !important; max-width:1800px !important; margin:0 auto !important; }
  .vibrant-dashboard { animation:pfFadeIn .35s ease both; }
  .vibrant-dashboard-hero { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; padding:10px 4px 25px; }
  .vibrant-dashboard-hero h1 { margin:7px 0 6px !important; font-size:38px !important; line-height:1.12 !important; font-weight:950 !important; letter-spacing:-1px !important; color:#15233e !important; }
  .vibrant-dashboard-hero p { margin:0 !important; color:#69768e !important; font-size:18px !important; }
  .vibrant-dashboard-actions { display:flex; gap:10px; flex-wrap:wrap; }
  .vibrant-dashboard-actions .btn { min-height:48px !important; border-radius:13px !important; font-size:16px !important; font-weight:850 !important; }
  .dashboard-filter-card { background:#fff !important; border:1px solid #e9e6f8 !important; border-radius:20px !important; padding:18px 20px !important; box-shadow:0 12px 35px rgba(66,51,132,.07) !important; margin-bottom:20px !important; display:flex; align-items:center; justify-content:space-between; gap:18px; }
  .dashboard-filter-heading { display:flex; align-items:center; gap:14px; min-width:230px; }
  .dashboard-filter-heading strong { display:block; font-size:20px !important; color:#1d2940 !important; }
  .dashboard-filter-heading span { display:block; color:#7b879c; font-size:13px !important; margin-top:3px; }
  .dashboard-filter-badge { display:inline-flex; align-items:center; gap:6px; color:#0e9d7f; background:#e8fbf5; border:1px solid #c9f4e8; padding:7px 10px; border-radius:999px; font-size:12px; font-weight:900; }
  .dashboard-date-controls { display:flex; align-items:flex-end; gap:10px; flex-wrap:wrap; }
  .dashboard-date-controls label { display:flex; flex-direction:column; gap:6px; }
  .dashboard-date-controls label>span { font-size:12px; font-weight:850; color:#68748b; }
  .date-input-wrap { position:relative; }
  .date-input-wrap input { width:180px; height:44px; border:1px solid #e0e4ef; border-radius:11px; padding:0 38px 0 12px; background:#fbfcff; color:#26334a; font-size:15px !important; font-weight:700; }
  .date-input-wrap svg { position:absolute; right:11px; top:13px; color:#6b54e8; pointer-events:none; }
  .dashboard-filter-btn { height:44px; border:0; border-radius:11px; padding:0 16px; background:linear-gradient(135deg,#6d4aff,#914cff); color:#fff; font-weight:850; font-size:14px; display:inline-flex; align-items:center; gap:7px; cursor:pointer; }
  .vibrant-tile-grid { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:18px !important; }
  .vibrant-stat-tile { position:relative; min-height:152px; border:1px solid transparent !important; border-radius:20px !important; padding:22px 20px 24px !important; display:flex !important; align-items:center !important; gap:16px !important; text-align:left !important; overflow:hidden !important; cursor:pointer !important; box-shadow:0 12px 28px rgba(31,42,71,.08) !important; transition:transform .2s ease, box-shadow .2s ease !important; }
  .vibrant-stat-tile:hover { transform:translateY(-4px); box-shadow:0 18px 35px rgba(31,42,71,.14) !important; }
  .vibrant-stat-icon { width:58px; height:58px; min-width:58px; border-radius:50%; display:grid; place-items:center; background:rgba(255,255,255,.72); box-shadow:inset 0 0 0 1px rgba(255,255,255,.5); }
  .vibrant-stat-copy { min-width:0; }
  .vibrant-stat-copy span { display:block; font-size:15px !important; line-height:1.2; font-weight:850 !important; color:#202d43 !important; text-transform:none !important; }
  .vibrant-stat-copy strong { display:block; margin-top:9px; font-size:30px !important; line-height:1 !important; font-weight:950 !important; color:#0f1c31 !important; letter-spacing:-.5px; }
  .vibrant-stat-arrow { position:absolute; right:14px; top:14px; width:31px; height:31px; border-radius:10px; display:grid; place-items:center; background:rgba(255,255,255,.65); color:#4d5a71; }
  .vibrant-stat-progress { position:absolute; left:0; right:0; bottom:0; height:8px; background:rgba(255,255,255,.42); }
  .vibrant-stat-progress span { display:block; width:52%; height:100%; border-radius:0 9px 9px 0; background:rgba(255,255,255,.96); }
  .tone-mint { background:linear-gradient(135deg,#e8fbf2,#d8f7e9) !important; } .tone-mint .vibrant-stat-icon{color:#17b86e}.tone-violet{background:linear-gradient(135deg,#f3eaff,#e7d9ff)!important}.tone-violet .vibrant-stat-icon{color:#8950c8}.tone-pink{background:linear-gradient(135deg,#ffeaf4,#ffd9eb)!important}.tone-pink .vibrant-stat-icon{color:#ec3b91}.tone-gold{background:linear-gradient(135deg,#fff7d9,#ffedac)!important}.tone-gold .vibrant-stat-icon{color:#e6b000}.tone-orange{background:linear-gradient(135deg,#fff0df,#ffe1c2)!important}.tone-orange .vibrant-stat-icon{color:#ef791a}.tone-green{background:linear-gradient(135deg,#e6faed,#d5f4df)!important}.tone-green .vibrant-stat-icon{color:#20ae63}.tone-teal{background:linear-gradient(135deg,#e1f9f5,#cff2eb)!important}.tone-teal .vibrant-stat-icon{color:#0caf9d}.tone-slate{background:linear-gradient(135deg,#eef2f6,#e2e7ed)!important}.tone-slate .vibrant-stat-icon{color:#43566f}.tone-blue{background:linear-gradient(135deg,#e7f1ff,#d6e6ff)!important}.tone-blue .vibrant-stat-icon{color:#3d81e9}.tone-cyan{background:linear-gradient(135deg,#e3faf8,#cff2ed)!important}.tone-cyan .vibrant-stat-icon{color:#16ad9e}.tone-indigo{background:linear-gradient(135deg,#eeecff,#ddd8ff)!important}.tone-indigo .vibrant-stat-icon{color:#6654e8}.tone-purple{background:linear-gradient(135deg,#eeeaff,#ddd5ff)!important}.tone-purple .vibrant-stat-icon{color:#7255dd}
  .vibrant-dashboard-lower { display:grid; grid-template-columns:1.15fr .85fr; gap:18px; margin-top:20px; }
  .vibrant-panel { background:#fff; border:1px solid #e9e6f5; border-radius:20px; padding:20px; box-shadow:0 12px 30px rgba(54,42,110,.06); }
  .vibrant-panel-heading { display:flex; align-items:center; justify-content:space-between; color:#7358e8; margin-bottom:15px; }
  .vibrant-panel-heading span { font-size:11px; letter-spacing:1.4px; font-weight:950; color:#8b91a2; }
  .vibrant-panel-heading h3 { margin:4px 0 0; font-size:22px; color:#18253d; }
  .vibrant-attention-list { display:flex; flex-direction:column; gap:8px; }
  .vibrant-attention-list button { border:0; background:#f8f7ff; border-radius:14px; padding:13px 14px; display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; text-align:left; cursor:pointer; }
  .vibrant-attention-list button>svg:first-child { color:#7055e7; }
  .vibrant-attention-list strong { display:block; color:#24324a; font-size:15px; } .vibrant-attention-list span{display:block;color:#7d8798;font-size:12px;margin-top:3px}
  .vibrant-empty { min-height:110px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#1baf7d; gap:4px; text-align:center; }
  .vibrant-empty strong { color:#2a3850; font-size:17px; } .vibrant-empty span { color:#8791a3; font-size:13px; }
  .vibrant-quick-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  .vibrant-quick-grid .quick-action { min-height:92px !important; border-radius:15px !important; background:linear-gradient(135deg,#f7f5ff,#fff) !important; border:1px solid #ece8fb !important; }
  .vibrant-app-shell .page h1,.vibrant-app-shell .page-heading h1,.vibrant-app-shell .page-header h1 { font-size:34px !important; font-weight:950 !important; color:#17243b !important; }
  .vibrant-app-shell .page p,.vibrant-app-shell .page-header p { font-size:16px !important; }
  .vibrant-app-shell .card,.vibrant-app-shell .panel { border-radius:18px !important; box-shadow:0 10px 28px rgba(44,43,90,.06) !important; border-color:#e8e8f2 !important; }
  .vibrant-app-shell .card-header h3,.vibrant-app-shell .panel h3 { font-size:20px !important; }
  .vibrant-app-shell input,.vibrant-app-shell select,.vibrant-app-shell textarea { min-height:44px; font-size:16px !important; border-radius:11px !important; }
  .vibrant-app-shell table { font-size:16px !important; }
  .vibrant-app-shell th { font-size:13px !important; }
  .vibrant-app-shell .btn { font-size:15px !important; min-height:44px; border-radius:11px !important; }

  /* Global action-modal positioning:
     Keep every app modal below the fixed top navigation and make the
     backdrop itself scrollable so tall forms never hide behind the navbar. */
  .vibrant-app-shell .modal-backdrop {
    position: fixed !important;
    top: 132px !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    height: auto !important;
    min-height: 0 !important;
    padding: 18px 24px 28px !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: center !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    overscroll-behavior: contain !important;
    -webkit-overflow-scrolling: touch !important;
    z-index: 1200 !important;
  }

  .vibrant-app-shell .modal-backdrop > .modal {
    width: min(960px, 100%) !important;
    max-height: calc(100vh - 178px) !important;
    margin: 0 auto !important;
    flex: 0 1 auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    overscroll-behavior: contain !important;
    -webkit-overflow-scrolling: touch !important;
  }

  .vibrant-app-shell .modal-backdrop > .modal.modal-wide {
    width: min(1120px, 100%) !important;
  }

  /* Member/photo, diet, workout and other tall forms */
  .vibrant-app-shell .modal-backdrop > .modal::-webkit-scrollbar,
  .vibrant-app-shell .modal-backdrop::-webkit-scrollbar {
    width: 8px;
  }

  @media (max-width: 900px) {
    .vibrant-app-shell .modal-backdrop {
      top: 108px !important;
      padding: 14px 14px 24px !important;
    }

    .vibrant-app-shell .modal-backdrop > .modal {
      max-height: calc(100vh - 136px) !important;
    }
  }

  @media (max-width: 600px) {
    .vibrant-app-shell .modal-backdrop {
      top: 98px !important;
      padding: 10px 8px 20px !important;
    }

    .vibrant-app-shell .modal-backdrop > .modal {
      max-height: calc(100vh - 116px) !important;
      border-radius: 18px !important;
    }
  }

  .vibrant-app-shell .modal { border-radius:22px !important; }
  .vibrant-app-shell .modal-header h2 { font-size:24px !important; }
  @keyframes pfFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @media (max-width:1200px) { .vibrant-tile-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.dashboard-filter-card{align-items:flex-start;flex-direction:column}.vibrant-dashboard-lower{grid-template-columns:1fr}.vibrant-app-shell .content{padding:24px 20px 40px!important} }
  .vibrant-app-shell .backdrop { display:none !important; }

  .trainer-profile-modal { width:min(1120px,100%) !important; }
  @media(max-width:760px) {
    .trainer-profile-modal > div { padding:20px 16px !important; }
    .trainer-profile-modal > div > div:nth-child(2) { grid-template-columns:1fr !important; gap:16px !important; }
    .trainer-profile-modal > div > div:nth-child(2) > div:first-child { width:190px !important; height:190px !important; }
    .trainer-profile-modal > div > div:nth-child(3) { grid-template-columns:1fr !important; gap:18px !important; }
    .trainer-profile-modal > div > div:nth-child(5) { grid-template-columns:1fr !important; }
  }

  @media (max-width:1100px) { .vibrant-app-shell .top-navigation-scroll{grid-template-columns:repeat(5,minmax(120px,1fr))!important}.vibrant-app-shell .sidebar-compact{position:fixed!important;left:0!important;top:0;transition:transform .25s ease,opacity .25s ease;width:205px!important;min-width:205px!important}.vibrant-app-shell .sidebar-compact.collapsed{left:0!important;transform:translateX(-225px);width:205px!important;min-width:205px!important;opacity:1!important;padding:18px 12px!important;pointer-events:none!important}.vibrant-app-shell .sidebar-compact.collapsed > *{visibility:visible!important}.vibrant-app-shell .sidebar-compact.open{left:0!important;transform:translateX(0)}.vibrant-app-shell .main{width:100%!important}.vibrant-app-shell .backdrop{display:block!important;position:fixed!important;inset:0!important;z-index:79!important;background:rgba(11,15,38,.38)!important;border:0!important}.top-navigation-scroll{margin-left:-4px;margin-right:-4px}.vibrant-dashboard-hero{align-items:flex-start;flex-direction:column}.vibrant-dashboard-hero h1{font-size:31px!important}.vibrant-tile-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.vibrant-stat-tile{min-height:135px}.topbar-primary-row{min-height:64px!important}.vibrant-app-shell .content{padding:20px 14px 34px!important} }
  @media (max-width:560px) { .vibrant-app-shell .top-navigation-scroll{grid-template-columns:repeat(2,minmax(0,1fr))!important}.vibrant-app-shell .vibrant-collapsed-brand span{display:none!important}.vibrant-app-shell .menu-btn{width:42px!important;height:42px!important;flex-basis:42px!important} body{font-size:16px!important}.topbar{padding:0 12px!important}.top-navigation-item{font-size:13px!important;padding:0 11px!important}.vibrant-tile-grid{grid-template-columns:1fr!important}.vibrant-stat-copy strong{font-size:28px!important}.vibrant-dashboard-hero h1{font-size:28px!important}.dashboard-date-controls{width:100%}.date-input-wrap input{width:100%}.dashboard-date-controls label{flex:1;min-width:0}.dashboard-filter-btn{width:100%;justify-content:center}.vibrant-quick-grid{grid-template-columns:1fr 1fr}.vibrant-admin-chip>div:not(.avatar){display:none} }


  /* ===== PROFESSIONAL FULL-WIDTH NAVIGATION ===== */
  .vibrant-app-shell {
    display:block !important;
    min-height:100vh !important;
  }

  /* The navbar belongs to the viewport, not to the sidebar/main column. */
  .vibrant-topbar {
    position:fixed !important;
    inset:0 0 auto 0 !important;
    width:100vw !important;
    min-height:132px !important;
    height:auto !important;
    padding:10px 22px 12px !important;
    background:rgba(255,255,255,.97) !important;
    border-bottom:1px solid #e7e9f2 !important;
    box-shadow:0 8px 30px rgba(24,35,58,.07) !important;
    z-index:200 !important;
    box-sizing:border-box !important;
  }

  .topbar-primary-row {
    min-height:58px !important;
    height:58px !important;
    max-width:1800px !important;
    margin:0 auto !important;
    padding:0 2px !important;
    display:grid !important;
    grid-template-columns:auto minmax(250px,1fr) auto !important;
    align-items:center !important;
    gap:16px !important;
  }

  .vibrant-app-shell .topbar-left {
    display:flex !important;
    align-items:center !important;
    gap:11px !important;
    min-width:0 !important;
  }

  /* Always-visible brand in the fixed navbar. */
  .vibrant-collapsed-brand {
    display:flex !important;
    align-items:center !important;
    gap:9px !important;
    margin:0 8px 0 0 !important;
    padding-right:16px !important;
    border-right:1px solid #e8eaf2 !important;
  }
  .vibrant-collapsed-brand img {
    width:42px !important;
    height:42px !important;
    border-radius:12px !important;
    object-fit:cover !important;
    box-shadow:0 4px 12px rgba(25,35,58,.12) !important;
  }
  .vibrant-collapsed-brand span {
    display:block !important;
    font-size:15px !important;
    line-height:1.05 !important;
    font-weight:850 !important;
    color:#1a2740 !important;
    white-space:nowrap !important;
  }

  .vibrant-app-shell .menu-btn {
    flex:0 0 42px !important;
    width:42px !important;
    height:42px !important;
    border-radius:11px !important;
    background:#f7f7fb !important;
    color:#4e5b73 !important;
    border:1px solid #e5e8ef !important;
  }
  .vibrant-app-shell .menu-btn:hover {
    background:#f0edff !important;
    color:#6847e8 !important;
  }

  .vibrant-breadcrumb {
    display:flex !important;
    align-items:center !important;
    gap:7px !important;
    min-width:0 !important;
    white-space:nowrap !important;
    color:#8490a5 !important;
    font-size:14px !important;
    font-weight:650 !important;
  }
  .vibrant-breadcrumb span { display:none !important; }
  .vibrant-breadcrumb strong {
    color:#17243b !important;
    font-size:22px !important;
    font-weight:850 !important;
    letter-spacing:-.35px !important;
  }

  .vibrant-app-shell .topbar-actions {
    display:flex !important;
    align-items:center !important;
    justify-content:flex-end !important;
    gap:8px !important;
    flex-shrink:0 !important;
  }
  .vibrant-icon-btn {
    width:42px !important;
    height:42px !important;
    border-radius:11px !important;
    background:#fff !important;
    color:#536078 !important;
    border:1px solid #e3e6ee !important;
    box-shadow:none !important;
  }
  .vibrant-icon-btn:hover { background:#f7f5ff !important; color:#6847e8 !important; }
  .vibrant-admin-chip {
    min-height:42px !important;
    border-radius:11px !important;
    background:#fff !important;
    border:1px solid #e3e6ee !important;
    padding:3px 10px 3px 5px !important;
    box-shadow:none !important;
  }
  .vibrant-admin-chip .avatar {
    width:34px !important;
    height:34px !important;
    background:#6d4aff !important;
  }

  /* Exactly two clean rows on desktop. Every item has equal geometry. */
  .vibrant-app-shell .top-navigation-scroll {
    max-width:1800px !important;
    margin:7px auto 0 !important;
    padding:0 !important;
    display:grid !important;
    grid-template-columns:repeat(8,minmax(0,1fr)) !important;
    grid-auto-rows:38px !important;
    gap:6px !important;
    overflow:visible !important;
    width:100% !important;
  }
  .vibrant-app-shell .top-navigation-item {
    width:100% !important;
    min-width:0 !important;
    min-height:38px !important;
    height:38px !important;
    padding:0 8px !important;
    border-radius:9px !important;
    border:1px solid #e7e9f0 !important;
    background:#fafbfc !important;
    color:#536078 !important;
    box-shadow:none !important;
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    gap:7px !important;
    font-size:13px !important;
    font-weight:800 !important;
    white-space:nowrap !important;
    overflow:hidden !important;
  }
  .vibrant-app-shell .top-navigation-item svg { flex:0 0 auto !important; }
  .vibrant-app-shell .top-navigation-item span {
    min-width:0 !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;
    white-space:nowrap !important;
  }
  .vibrant-app-shell .top-navigation-item:hover {
    background:#f4f2ff !important;
    border-color:#ddd7ff !important;
    color:#5f43d6 !important;
    transform:none !important;
  }
  .vibrant-app-shell .top-navigation-item.active {
    background:#6948e9 !important;
    border-color:#6948e9 !important;
    color:#fff !important;
    box-shadow:0 5px 12px rgba(105,72,233,.20) !important;
  }

  /* Sidebar sits UNDER the fixed navbar. */
  .vibrant-app-shell .sidebar-compact {
    position:fixed !important;
    left:0 !important;
    top:132px !important;
    bottom:0 !important;
    width:205px !important;
    min-width:205px !important;
    height:auto !important;
    max-height:none !important;
    overflow-y:auto !important;
    z-index:150 !important;
    transition:transform .24s ease, opacity .24s ease !important;
  }
  .vibrant-app-shell .sidebar-compact.collapsed {
    width:205px !important;
    min-width:205px !important;
    height:auto !important;
    padding:4px 12px 18px !important;
    opacity:0 !important;
    transform:translateX(-100%) !important;
    pointer-events:none !important;
  }

  /* Keep the sidebar itself clean; branding is already permanently in navbar. */
  .vibrant-app-shell .sidebar-compact .compact-brand {
    display:none !important;
    position:relative !important;
    height:42px !important;
    padding:0 !important;
    margin:0 0 4px !important;
    border:0 !important;
  }
  .vibrant-app-shell .sidebar-compact .compact-brand .brand-logo,
  .vibrant-app-shell .sidebar-compact .compact-brand .compact-brand-copy {
    display:none !important;
  }
  .vibrant-app-shell .sidebar-compact .compact-sidebar-label {
    padding-top:0 !important;
  }

  .vibrant-app-shell .main {
    width:100% !important;
    min-width:0 !important;
    margin-left:205px !important;
    padding-top:132px !important;
    box-sizing:border-box !important;
    transition:margin-left .24s ease !important;
  }
  .vibrant-app-shell.sidebar-is-collapsed .main {
    width:100% !important;
    margin-left:0 !important;
  }
  .vibrant-app-shell .content {
    width:100% !important;
    max-width:1800px !important;
    box-sizing:border-box !important;
  }
  .vibrant-app-shell .backdrop { display:none !important; }

  @media (max-width:1500px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(8,minmax(0,1fr)) !important; }
    .vibrant-app-shell .top-navigation-item { font-size:12px !important; gap:5px !important; }
    .vibrant-app-shell .top-navigation-item svg { width:16px !important; height:16px !important; }
  }

  @media (max-width:1100px) {
    .vibrant-topbar { min-height:174px !important; }
    .topbar-primary-row { grid-template-columns:1fr auto !important; min-height:58px !important; }
    .vibrant-app-shell .topbar-left { grid-column:1 / 2 !important; }
    .vibrant-app-shell .topbar-actions { grid-column:2 / 3 !important; grid-row:1 !important; }
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(4,minmax(0,1fr)) !important; grid-auto-rows:36px !important; }
    .vibrant-app-shell .top-navigation-item { height:36px !important; }
    .vibrant-app-shell .sidebar-compact { top:174px !important; }
    .vibrant-app-shell .main { padding-top:174px !important; margin-left:0 !important; }
    .vibrant-app-shell .sidebar-compact.open { transform:translateX(0) !important; }
    .vibrant-app-shell .sidebar-compact.collapsed { transform:translateX(-100%) !important; }
    .vibrant-app-shell .backdrop { display:block !important; position:fixed !important; inset:174px 0 0 0 !important; z-index:140 !important; background:rgba(13,18,38,.35) !important; border:0 !important; }
  }

  @media (max-width:700px) {
    .vibrant-topbar { min-height:220px !important; padding:8px 12px 10px !important; }
    .topbar-primary-row { grid-template-columns:1fr auto !important; gap:8px !important; }
    .vibrant-collapsed-brand { padding-right:8px !important; margin-right:0 !important; }
    .vibrant-collapsed-brand img { width:38px !important; height:38px !important; }
    .vibrant-collapsed-brand span { font-size:13px !important; }
    .vibrant-breadcrumb strong { font-size:18px !important; }
    .vibrant-admin-chip > div:not(.avatar), .vibrant-admin-chip > svg { display:none !important; }
    .vibrant-admin-chip { padding-right:5px !important; }
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(2,minmax(0,1fr)) !important; grid-auto-rows:38px !important; margin-top:7px !important; }
    .vibrant-app-shell .top-navigation-item { height:38px !important; font-size:12px !important; }
    .vibrant-app-shell .sidebar-compact { top:220px !important; }
    .vibrant-app-shell .main { padding-top:220px !important; }
    .vibrant-app-shell .backdrop { inset:220px 0 0 0 !important; }
  }

  /* FINAL SIDEBAR SPACING FIX: remove the hidden brand block from layout completely. */
  .vibrant-app-shell .sidebar-compact .compact-brand {
    display:none !important;
    width:0 !important;
    height:0 !important;
    min-height:0 !important;
    max-height:0 !important;
    margin:0 !important;
    padding:0 !important;
    border:0 !important;
    overflow:hidden !important;
    visibility:hidden !important;
  }
  .vibrant-app-shell .sidebar-compact .compact-sidebar-label {
    display:block !important;
    padding:0 10px 10px !important;
    margin:0 !important;
  }
  .vibrant-app-shell .sidebar-compact .compact-sidebar-nav {
    margin:0 !important;
    padding:0 !important;
  }

`;

function addMonthsToDate(dateString, months) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function timeTo24Hour(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    if (meridiem === 'PM' && hour !== 12) hour += 12;
  }
  if (hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function addMinutesToTime(value, minutes) {
  const base = timeTo24Hour(value);
  if (!base) return null;
  const [hour, minute] = base.split(':').map(Number);
  const total = hour * 60 + minute + Number(minutes || 0);
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function getDaysRemaining(expiry) {
  if (!expiry) return 0;
  const todayDate = new Date(`${today}T00:00:00`);
  const expiryDate = new Date(`${expiry}T00:00:00`);
  return Math.ceil((expiryDate - todayDate) / 86400000);
}

function getMembershipStatus(expiry) {
  const days = getDaysRemaining(expiry);
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring';
  return 'Active';
}

const PRODUCTION_APP_URL = 'https://noscodera.github.io/preface-fitness/';
const PRODUCTION_GYM_ID = 'd702119b-3205-46a2-9ee0-294d682ddf14';
const PUBLIC_GYM_ID_STORAGE_KEY = 'preface-fitness-public-gym-id';

function getWhatsAppNumberFromGymPhone(value) {
  const digits = String(value || '').replace(/\\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('91') && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function normalizeExternalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|mailto:|tel:|javascript:)/i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, '')}`;
}

function getCheckInPath() {
  return `${PRODUCTION_APP_URL.replace(/\/$/, '')}/#check-in`;
}

function getCheckInUrl(gymId = PRODUCTION_GYM_ID, gymLat = '', gymLng = '') {
  const params = new URLSearchParams();
  if (gymId) params.set('gym', gymId);
  if (gymLat !== '' && gymLng !== '') {
    params.set('lat', String(gymLat));
    params.set('lng', String(gymLng));
  }
  const query = params.toString();
  return query
    ? `${PRODUCTION_APP_URL}?${query}#check-in`
    : `${PRODUCTION_APP_URL}#check-in`;
}

function getFeedbackUrl(gymId, gymName = 'Preface Fitness') {
  const params = new URLSearchParams();

  if (gymId) {
    params.set('gym', gymId);
  }

  if (gymName) {
    params.set('name', gymName);
  }

  const query = params.toString();
  const base = PRODUCTION_APP_URL.replace(/\/$/, '');

  return query
    ? `${base}/?${query}#feedback`
    : `${base}/#feedback`;
}

function distanceInMeters(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


const seed = {
  members: [
    { id: 'PF-1001', attendanceNumber: '1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', plan: 'Annual', start: '2025-10-12', expiry: '2026-10-12', status: 'Active', visits: 18, due: 0 },
    { id: 'PF-1002', attendanceNumber: '2', name: 'Priya Verma', phone: '9811112233', email: 'priya@example.com', plan: 'Quarterly', start: '2026-07-03', expiry: '2026-10-03', status: 'Expiring', visits: 14, due: 1200 },
    { id: 'PF-1003', attendanceNumber: '3', name: 'Amit Singh', phone: '9898989898', email: 'amit@example.com', plan: 'Monthly', start: '2026-09-01', expiry: '2026-10-01', status: 'Expiring', visits: 9, due: 0 },
    { id: 'PF-1004', attendanceNumber: '4', name: 'Neha Gupta', phone: '9911223344', email: 'neha@example.com', plan: 'Annual', start: '2025-09-20', expiry: '2026-09-20', status: 'Expired', visits: 6, due: 2500 },
    { id: 'PF-1005', attendanceNumber: '5', name: 'Arjun Mehta', phone: '9000011111', email: 'arjun@example.com', plan: 'Half-yearly', start: '2026-05-15', expiry: '2026-11-15', status: 'Active', visits: 22, due: 0 },
  ],
  leads: [
    { id: 'L-101', name: 'Karan Malhotra', phone: '9988776655', source: 'Instagram', stage: 'New', followUp: today },
    { id: 'L-102', name: 'Sana Khan', phone: '9876501234', source: 'Walk-in', stage: 'Trial Booked', followUp: today },
    { id: 'L-103', name: 'Vivek Jain', phone: '9123456789', source: 'Referral', stage: 'Contacted', followUp: '2026-09-24' },
  ],
  payments: [
    { id: 'PAY-1001', member: 'Rahul Sharma', amount: 18000, type: 'Membership', mode: 'UPI', date: '2026-09-22' },
    { id: 'PAY-1002', member: 'Priya Verma', amount: 5000, type: 'Membership', mode: 'Cash', date: '2026-09-20' },
    { id: 'PAY-1003', member: 'Arjun Mehta', amount: 9000, type: 'PT', mode: 'Card', date: '2026-09-19' },
  ],
  attendance: [
    { id: 'A-1', member: 'Rahul Sharma', date: today, time: '06:42 PM' },
    { id: 'A-2', member: 'Priya Verma', date: today, time: '07:03 PM' },
    { id: 'A-3', member: 'Arjun Mehta', date: today, time: '07:18 PM' },
  ],
  workoutPlans: [
    {
      id: 'WP-1001',
      name: 'Full Body Foundation',
      goal: 'General Fitness',
      level: 'Beginner',
      durationWeeks: 4,
      trainer: 'Administrator',
      notes: 'Focus on controlled form and gradual progression.',
      assignedMemberIds: ['PF-1001', 'PF-1003'],
      exercises: [
        { id: 'EX-1', name: 'Goblet Squat', muscle: 'Legs', sets: 3, reps: '12', weight: '10 kg', rest: '60 sec' },
        { id: 'EX-2', name: 'Dumbbell Bench Press', muscle: 'Chest', sets: 3, reps: '10', weight: '8 kg', rest: '60 sec' },
        { id: 'EX-3', name: 'Lat Pulldown', muscle: 'Back', sets: 3, reps: '12', weight: '25 kg', rest: '60 sec' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'WP-1002',
      name: 'Hypertrophy Upper Body',
      goal: 'Muscle Building',
      level: 'Intermediate',
      durationWeeks: 6,
      trainer: 'Administrator',
      notes: 'Progressive overload with 1–2 reps in reserve.',
      assignedMemberIds: ['PF-1005'],
      exercises: [
        { id: 'EX-4', name: 'Barbell Bench Press', muscle: 'Chest', sets: 4, reps: '8-10', weight: '40 kg', rest: '90 sec' },
        { id: 'EX-5', name: 'Seated Cable Row', muscle: 'Back', sets: 4, reps: '10-12', weight: '30 kg', rest: '75 sec' },
        { id: 'EX-6', name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', sets: 3, reps: '10', weight: '10 kg', rest: '75 sec' },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  dietPlans: [
    {
      id: 'DP-1001',
      name: 'Fat Loss Starter',
      goal: 'Fat Loss',
      calories: 1800,
      protein: 130,
      durationWeeks: 8,
      coach: 'Administrator',
      notes: 'High protein meals with controlled portions and consistent meal timing.',
      assignedMemberIds: ['PF-1001', 'PF-1002'],
      meals: [
        { id: 'MEAL-1', meal: 'Breakfast', food: 'Oats + whey + banana', calories: 420, protein: 30 },
        { id: 'MEAL-2', meal: 'Lunch', food: 'Paneer + roti + salad', calories: 520, protein: 35 },
        { id: 'MEAL-3', meal: 'Snack', food: 'Peanut butter + milk', calories: 300, protein: 15 },
        { id: 'MEAL-4', meal: 'Dinner', food: 'Chicken + rice + vegetables', calories: 560, protein: 50 },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'DP-1002',
      name: 'Lean Muscle Plan',
      goal: 'Muscle Building',
      calories: 2400,
      protein: 160,
      durationWeeks: 12,
      coach: 'Administrator',
      notes: 'Protein-focused plan with enough calories to support progressive training.',
      assignedMemberIds: ['PF-1005'],
      meals: [
        { id: 'MEAL-5', meal: 'Breakfast', food: 'Eggs + oats + milk', calories: 560, protein: 35 },
        { id: 'MEAL-6', meal: 'Lunch', food: 'Chicken + rice + curd', calories: 680, protein: 50 },
        { id: 'MEAL-7', meal: 'Snack', food: 'Whey + banana + peanut butter', calories: 420, protein: 32 },
        { id: 'MEAL-8', meal: 'Dinner', food: 'Paneer + roti + vegetables', calories: 740, protein: 43 },
      ],
      createdAt: new Date().toISOString(),
    },
  ],

  trainers: [
    {
      id: 'TR-1001',
      name: 'Rahul Trainer',
      phone: '9877001100',
      specialization: 'Strength & Conditioning',
      experience: 6,
      status: 'Active',
      monthlySalary: 30000,
      notes: 'Handles strength and hypertrophy programs.',
    },
    {
      id: 'TR-1002',
      name: 'Neha Coach',
      phone: '9811002200',
      specialization: 'Weight Loss & Functional Training',
      experience: 4,
      status: 'Active',
      monthlySalary: 28000,
      notes: 'Focuses on beginner and fat-loss clients.',
    },
  ],
  ptSessions: [
    {
      id: 'PT-1001',
      trainerId: 'TR-1001',
      memberId: 'PF-1001',
      date: today,
      time: '07:00 PM',
      duration: 60,
      type: 'Personal Training',
      status: 'Scheduled',
      fee: 1200,
      notes: 'Upper body strength session.',
    },
    {
      id: 'PT-1002',
      trainerId: 'TR-1002',
      memberId: 'PF-1002',
      date: today,
      time: '06:00 PM',
      duration: 60,
      type: 'Personal Training',
      status: 'Completed',
      fee: 1000,
      notes: 'Fat-loss conditioning session.',
    },
  ],
  communicationLogs: [
    {
      id: 'MSG-1001',
      memberId: 'PF-1001',
      channel: 'WhatsApp',
      direction: 'Outgoing',
      template: 'Membership renewal reminder',
      message: 'Hi Rahul, your Preface Fitness membership is due for renewal soon.',
      date: today,
      time: '10:15 AM',
      status: 'Sent',
    },
    {
      id: 'MSG-1002',
      memberId: 'PF-1002',
      channel: 'SMS',
      direction: 'Outgoing',
      template: 'Payment reminder',
      message: 'Hi Priya, this is a reminder from Preface Fitness regarding your pending payment.',
      date: '2026-09-22',
      time: '05:40 PM',
      status: 'Sent',
    },
  ],
  progressRecords: [
    {
      id: 'PR-1001',
      memberId: 'PF-1001',
      date: '2026-09-01',
      weight: 84,
      bodyFat: 24,
      chest: 40,
      waist: 36,
      hips: 39,
      arms: 14,
      thighs: 22,
      neck: 15,
      notes: 'Good strength progress. Continue progressive overload.',
      photos: { front: '', side: '', back: '' },
    },
    {
      id: 'PR-1002',
      memberId: 'PF-1001',
      date: '2026-08-01',
      weight: 86,
      bodyFat: 25,
      chest: 39.5,
      waist: 37,
      hips: 39.5,
      arms: 13.8,
      thighs: 22,
      neck: 15,
      notes: 'Weight trending down steadily.',
      photos: { front: '', side: '', back: '' },
    },
    {
      id: 'PR-1003',
      memberId: 'PF-1002',
      date: '2026-09-05',
      weight: 68,
      bodyFat: 29,
      chest: 36,
      waist: 31,
      hips: 37,
      arms: 12,
      thighs: 21,
      neck: 13,
      notes: '',
      photos: { front: '', side: '', back: '' },
    },
  ],

  settings: {
    gymName: 'Preface Fitness', currency: '₹', gymAddress: '', gymPhone: '', gymEmail: '', gstin: '', invoicePrefix: 'PO', invoiceSeriesA: { prefix: 'PO', numberLength: 6, financialYear: '2026-27', nextNumber: 138, yearlyNext: { '2026-27': 138 } }, invoiceSeriesB: { prefix: 'PO', numberLength: 6, financialYear: '2026-27', nextNumber: 138, yearlyNext: { '2026-27': 138 } }, defaultGstRate: 5, referralPointsPerReferral: 10, gymLatitude: '', gymLongitude: '',
    notice: { enabled: false, dashboardEnabled: false, text: '', priority: 'medium', id: '', createdAt: '' },
    noticeHistory: [],
    gymIntro: { description: 'A modern fitness destination focused on strength, conditioning, personal training and sustainable results.', facilities: ['Strength & cardio zone', 'Personal training', 'Functional training', 'Locker & changing facilities', 'Member progress tracking', 'Diet & nutrition guidance'] },
    publicPage: {
      whatsappNumber: '', instagramUrl: '', facebookUrl: '', websiteUrl: '',
      googleRating: '5.0', googleReviewCount: '94', googleMapsUrl: '', googleSearchUrl: 'https://www.google.com/search?q=preface+fitness', googlePlaceName: 'Preface Fitness', googlePhone: '093692 79056', googleAddress: 'Preface Fitness, Nadan Mahal Rd. above Hdfc Bank, Yahiyaganj, Lucknow, Uttar Pradesh 226003', hoursText: 'Mon-Sun · 6 AM - 11 PM',
      trainers: [],
      packages: [],
      reviews: []
    },
    auth: { username: 'admin', passwordHash: '' }
  },
};


const NOTICE_SETTINGS_CSS = `
  .notice-settings-toggles{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 16px}
  .notice-toggle{display:flex;align-items:center;gap:9px;padding:10px 13px;border:1px solid #dce3ed;border-radius:11px;background:#f8fafc;color:#334155;font-size:13px;font-weight:700;cursor:pointer}
  .notice-toggle input{accent-color:#6d4aff;width:17px;height:17px}
  .notice-preview{position:relative;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;border:1px solid #dfe5ef;background:#f8f7ff;color:#334155;overflow:hidden}
  .notice-preview>div{min-width:0}.notice-preview strong,.notice-preview span{display:block}.notice-preview strong{font-size:13px}.notice-preview span{font-size:13px;line-height:1.5;margin-top:3px;color:#64748b;overflow-wrap:anywhere}
  .notice-preview.priority-high{background:#fff4f6;border-color:#ffd2da}.notice-preview.priority-low{background:#effcf8;border-color:#ccefe6}
  .notice-preview-pulse{width:9px;height:9px;border-radius:50%;background:#6d4aff;box-shadow:0 0 0 0 rgba(109,74,255,.45);animation:noticeSettingsPulse 2s infinite;flex:0 0 auto}
  .notice-preview.priority-high .notice-preview-pulse{background:#ef476f;box-shadow:0 0 0 0 rgba(239,71,111,.45)}.notice-preview.priority-low .notice-preview-pulse{background:#12bfa6;box-shadow:0 0 0 0 rgba(18,191,166,.45)}
  @keyframes noticeSettingsPulse{0%{box-shadow:0 0 0 0 rgba(109,74,255,.45)}70%{box-shadow:0 0 0 8px rgba(109,74,255,0)}100%{box-shadow:0 0 0 0 rgba(109,74,255,0)}}
  .notice-history{margin-top:24px;border-top:1px solid #e7ebf1;padding-top:20px}.notice-history-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:12px}.notice-history-head h4{margin:0;font-size:16px;color:#18263d}.notice-history-head p{margin:5px 0 0;color:#718096;font-size:12px;line-height:1.5}.notice-history-head>span{font-size:11px;font-weight:900;color:#6d4aff;background:#f0edff;padding:6px 9px;border-radius:999px;white-space:nowrap}
  .notice-history-item{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid #edf0f4}.notice-history-item.active{background:#fbfaff;border-radius:12px;padding-left:10px;padding-right:10px}.notice-history-dot{width:9px;height:9px;border-radius:50%;background:#6d4aff}.notice-history-dot.priority-high{background:#ef476f}.notice-history-dot.priority-low{background:#12bfa6}.notice-history-copy{min-width:0}.notice-history-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}.notice-history-meta span{font-size:9px;font-weight:900;letter-spacing:1px;color:#6d4aff}.notice-history-meta small{font-size:10px;color:#94a3b8}.notice-history-meta b{font-size:9px;background:#e9f9f1;color:#168454;padding:3px 6px;border-radius:999px}.notice-history-copy>strong{display:block;color:#334155;font-size:13px;line-height:1.45;overflow-wrap:anywhere}.notice-history-item .btn{white-space:nowrap}.notice-history-empty{display:flex;align-items:center;gap:10px;padding:18px;border-radius:12px;background:#f8fafc;color:#718096;font-size:12px}
  @media(max-width:620px){.gym-public-dark-v2 .gym-public-brand img{width:50px;height:50px}.gym-public-dark-v2 .gym-public-brand strong{font-size:23px;letter-spacing:-.3px}.gym-public-dark-v2 .gym-public-brand span{font-size:9px;letter-spacing:1.5px}.notice-history-item{grid-template-columns:8px minmax(0,1fr)}.notice-history-item .btn{grid-column:2;justify-self:start}.notice-history-head{align-items:center}}
`;

const FINAL_UI_FIX_CSS = `
  html, body, #root { width:100% !important; max-width:100% !important; min-width:0 !important; overflow-x:hidden !important; }
  body { margin:0 !important; }

  /* ===== FULL-WIDTH FIXED NAVBAR ===== */
  .vibrant-app-shell .main {
    width:100% !important;
    max-width:none !important;
    min-width:0 !important;
    margin-left:0 !important;
    padding-top:132px !important;
    box-sizing:border-box !important;
    overflow-x:hidden !important;
  }
  .vibrant-app-shell .vibrant-topbar {
    position:fixed !important;
    top:0 !important;
    left:0 !important;
    right:0 !important;
    width:100vw !important;
    max-width:100vw !important;
    min-height:132px !important;
    height:132px !important;
    box-sizing:border-box !important;
    z-index:300 !important;
    margin:0 !important;
    padding:12px 24px 10px !important;
    background:rgba(255,255,255,.58) !important;
    backdrop-filter:blur(20px) saturate(150%) !important;
    -webkit-backdrop-filter:blur(20px) saturate(150%) !important;
    border-bottom:1px solid rgba(92,76,170,.13) !important;
    box-shadow:0 5px 22px rgba(32,30,73,.07) !important;
  }
  .vibrant-app-shell .topbar-primary-row {
    width:100% !important;
    height:56px !important;
    min-height:56px !important;
    display:flex !important;
    align-items:center !important;
    gap:12px !important;
    box-sizing:border-box !important;
  }
  .vibrant-app-shell .topbar-left {
    display:flex !important;
    align-items:center !important;
    gap:10px !important;
    min-width:0 !important;
    flex:1 1 auto !important;
  }
  /* Logo is ALWAYS visible, whether sidebar is open or closed. */
  .vibrant-app-shell .vibrant-collapsed-brand {
    display:flex !important;
    align-items:center !important;
    gap:10px !important;
    flex:0 0 auto !important;
    min-width:max-content !important;
    margin:0 4px 0 0 !important;
  }
  .vibrant-app-shell .vibrant-collapsed-brand img {
    display:block !important;
    width:46px !important;
    height:46px !important;
    object-fit:cover !important;
    border-radius:12px !important;
    box-shadow:0 5px 15px rgba(20,20,55,.12) !important;
  }
  .vibrant-app-shell .vibrant-collapsed-brand span {
    display:block !important;
    color:#1b2942 !important;
    font-size:16px !important;
    font-weight:900 !important;
    white-space:nowrap !important;
  }
  .vibrant-app-shell .menu-btn {
    flex:0 0 44px !important;
    width:44px !important;
    height:44px !important;
    margin:0 !important;
    order:0 !important;
  }
  .vibrant-app-shell .vibrant-breadcrumb {
    display:flex !important;
    align-items:center !important;
    gap:7px !important;
    min-width:0 !important;
    white-space:nowrap !important;
    padding-left:10px !important;
    border-left:1px solid rgba(94,86,155,.16) !important;
  }
  .vibrant-app-shell .vibrant-breadcrumb span { color:#8290a7 !important; font-weight:700 !important; }
  .vibrant-app-shell .vibrant-breadcrumb strong { color:#17243c !important; font-size:22px !important; }
  .vibrant-app-shell .topbar-actions {
    display:flex !important;
    align-items:center !important;
    gap:8px !important;
    flex:0 0 auto !important;
    margin-left:auto !important;
  }
  .vibrant-app-shell .vibrant-icon-btn {
    width:44px !important;
    height:44px !important;
    flex:0 0 44px !important;
  }
  .vibrant-app-shell .vibrant-admin-chip { min-height:44px !important; }

  /* Navigation is a real two-row grid, not a scrolling strip. */
  .vibrant-app-shell .top-navigation-scroll {
    display:grid !important;
    grid-template-columns:repeat(8,minmax(0,1fr)) !important;
    grid-template-rows:repeat(2,40px) !important;
    grid-auto-flow:row !important;
    gap:6px !important;
    width:100% !important;
    height:86px !important;
    margin:0 !important;
    padding:0 !important;
    overflow:visible !important;
    box-sizing:border-box !important;
  }
  .vibrant-app-shell .top-navigation-item {
    width:100% !important;
    min-width:0 !important;
    height:40px !important;
    min-height:40px !important;
    box-sizing:border-box !important;
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    gap:7px !important;
    padding:0 8px !important;
    border-radius:10px !important;
    border:1px solid rgba(107,113,137,.16) !important;
    background:rgba(255,255,255,.30) !important;
    color:#536078 !important;
    box-shadow:0 2px 8px rgba(31,42,71,.035) !important;
    font-size:13px !important;
    font-weight:800 !important;
    white-space:nowrap !important;
    overflow:visible !important;
    text-overflow:clip !important;
    position:relative !important;
  }
  .vibrant-app-shell .top-navigation-item span {
    display:inline !important;
    min-width:max-content !important;
    overflow:visible !important;
    text-overflow:clip !important;
    white-space:nowrap !important;
  }
  .vibrant-app-shell .top-navigation-item svg { flex:0 0 auto !important; }
  .vibrant-app-shell .top-navigation-item.active {
    color:#fff !important;
    background:linear-gradient(135deg,#6d4aff,#8750ff) !important;
    border-color:transparent !important;
    box-shadow:0 7px 16px rgba(109,74,255,.20) !important;
  }
  .vibrant-app-shell .top-navigation-item:hover {
    transform:translateY(-1px) !important;
    border-color:rgba(109,74,255,.25) !important;
    background:rgba(255,255,255,.62) !important;
  }

  /* ===== SIDEBAR: UNDER NAVBAR, NEVER CHANGES PAGE WIDTH ===== */
  .vibrant-app-shell .sidebar-compact {
    position:fixed !important;
    left:0 !important;
    top:132px !important;
    bottom:0 !important;
    width:225px !important;
    min-width:225px !important;
    height:auto !important;
    max-height:none !important;
    margin:0 !important;
    padding:16px 12px 18px !important;
    box-sizing:border-box !important;
    overflow-y:auto !important;
    overflow-x:hidden !important;
    z-index:290 !important;
    transform:translateX(0) !important;
    opacity:1 !important;
    transition:transform .22s ease, opacity .22s ease !important;
  }
  .vibrant-app-shell .sidebar-compact.collapsed {
    width:225px !important;
    min-width:225px !important;
    transform:translateX(-101%) !important;
    opacity:0 !important;
    pointer-events:none !important;
  }
  .vibrant-app-shell .sidebar-compact .compact-brand {
    position:relative !important;
    height:48px !important;
    min-height:48px !important;
    margin:0 0 14px !important;
    padding:0 !important;
    display:block !important;
  }
  .vibrant-app-shell .sidebar-compact .compact-brand .brand-logo,
  .vibrant-app-shell .sidebar-compact .compact-brand .compact-brand-copy { display:none !important; }
  .vibrant-app-shell .compact-sidebar-label { padding:0 10px 10px !important; }
  .vibrant-app-shell .compact-sidebar-nav { display:flex !important; flex-direction:column !important; gap:7px !important; }
  .vibrant-app-shell .sidebar-compact .nav-item { min-height:50px !important; }
  .vibrant-app-shell .backdrop {
    position:fixed !important;
    left:0 !important;
    right:0 !important;
    top:132px !important;
    bottom:0 !important;
    z-index:280 !important;
    background:rgba(17,20,48,.30) !important;
    border:0 !important;
  }

  /* Main content always uses the entire viewport. */
  .vibrant-app-shell .content {
    width:100% !important;
    max-width:none !important;
    min-width:0 !important;
    margin:0 !important;
    padding:28px 30px 48px !important;
    box-sizing:border-box !important;
    overflow-x:hidden !important;
  }
  .vibrant-app-shell .vibrant-dashboard { width:100% !important; max-width:1800px !important; margin:0 auto !important; }

  /* Subtle professional reflection / micro-animation. */
  .vibrant-app-shell .vibrant-stat-tile,
  .vibrant-app-shell .top-navigation-item,
  .vibrant-app-shell .btn,
  .vibrant-app-shell .quick-action,
  .vibrant-app-shell .dashboard-filter-btn,
  .vibrant-app-shell .nav-item { overflow:hidden !important; }
  .vibrant-app-shell .vibrant-stat-tile::before,
  .vibrant-app-shell .top-navigation-item::before,
  .vibrant-app-shell .btn::before,
  .vibrant-app-shell .quick-action::before,
  .vibrant-app-shell .dashboard-filter-btn::before,
  .vibrant-app-shell .nav-item::before {
    content:"" !important;
    position:absolute !important;
    top:-30% !important;
    left:-80% !important;
    width:42% !important;
    height:160% !important;
    transform:rotate(20deg) !important;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.34),transparent) !important;
    opacity:0 !important;
    pointer-events:none !important;
    transition:left .42s ease,opacity .18s ease !important;
  }
  .vibrant-app-shell .vibrant-stat-tile:hover::before,
  .vibrant-app-shell .top-navigation-item:hover::before,
  .vibrant-app-shell .btn:hover::before,
  .vibrant-app-shell .quick-action:hover::before,
  .vibrant-app-shell .dashboard-filter-btn:hover::before,
  .vibrant-app-shell .nav-item:hover::before { left:125% !important; opacity:1 !important; }

  .vibrant-app-shell .vibrant-stat-tile { transition:transform .18s ease,box-shadow .18s ease !important; }
  .vibrant-app-shell .vibrant-stat-tile:hover { transform:translateY(-3px) !important; box-shadow:0 18px 36px rgba(31,42,71,.14) !important; }
  .vibrant-app-shell .top-navigation-item:active,
  .vibrant-app-shell .btn:active,
  .vibrant-app-shell .nav-item:active { transform:scale(.992) !important; }

  /* Data-driven progress indicator remains visible at the bottom of each tile. */
  .vibrant-app-shell .vibrant-stat-progress { height:7px !important; background:rgba(255,255,255,.46) !important; }
  .vibrant-app-shell .vibrant-stat-progress span { transition:width .5s ease !important; }

  @media (max-width:1500px) {
    .vibrant-app-shell .top-navigation-item { font-size:12px !important; gap:5px !important; padding-left:5px !important; padding-right:5px !important; }
    .vibrant-app-shell .top-navigation-item svg { width:16px !important; height:16px !important; }
  }
  @media (max-width:1150px) {
    .vibrant-app-shell .vibrant-topbar { height:174px !important; min-height:174px !important; }
    .vibrant-app-shell .main { padding-top:174px !important; }
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(4,minmax(0,1fr)) !important; grid-template-rows:repeat(4,38px) !important; height:158px !important; }
    .vibrant-app-shell .top-navigation-item { height:38px !important; min-height:38px !important; font-size:12px !important; }
    .vibrant-app-shell .sidebar-compact { top:174px !important; }
    .vibrant-app-shell .backdrop { top:174px !important; }
  }
  @media (max-width:700px) {
    .vibrant-app-shell .vibrant-topbar { height:220px !important; min-height:220px !important; padding:8px 12px 10px !important; }
    .vibrant-app-shell .main { padding-top:220px !important; }
    .vibrant-app-shell .topbar-primary-row { height:54px !important; min-height:54px !important; }
    .vibrant-app-shell .vibrant-collapsed-brand span { font-size:13px !important; }
    .vibrant-app-shell .vibrant-breadcrumb span,.vibrant-app-shell .vibrant-breadcrumb svg { display:none !important; }
    .vibrant-app-shell .vibrant-breadcrumb strong { font-size:18px !important; }
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(2,minmax(0,1fr)) !important; grid-template-rows:repeat(8,36px) !important; height:330px !important; }
    .vibrant-app-shell .top-navigation-item { height:36px !important; min-height:36px !important; font-size:11px !important; }
    .vibrant-app-shell .sidebar-compact { top:220px !important; }
    .vibrant-app-shell .backdrop { top:220px !important; }
    .vibrant-app-shell .content { padding:20px 14px 34px !important; }
  }
`;

const FINAL_LAYOUT_CSS = `
  /* NAVBAR FINAL POLISH: full-width two-row layout with no redundant page-title block. */
  .vibrant-app-shell .vibrant-topbar {
    display:flex !important;
    flex-direction:column !important;
    align-items:stretch !important;
    justify-content:flex-start !important;
    overflow:visible !important;
  }
  .vibrant-app-shell .topbar-primary-row {
    flex:0 0 58px !important;
    height:58px !important;
    min-height:58px !important;
    width:100% !important;
  }
  .vibrant-app-shell .topbar-left {
    flex:0 0 auto !important;
    width:auto !important;
  }
  .vibrant-app-shell .topbar-actions {
    margin-left:auto !important;
  }
  .vibrant-app-shell .top-navigation-scroll {
    flex:0 0 auto !important;
    align-self:stretch !important;
    width:100% !important;
    max-width:none !important;
    display:grid !important;
    grid-template-columns:repeat(8,minmax(0,1fr)) !important;
    grid-template-rows:repeat(2,44px) !important;
    grid-auto-flow:row !important;
    gap:8px !important;
    margin:7px 0 0 !important;
    padding:0 0 7px !important;
    height:96px !important;
    box-sizing:border-box !important;
    overflow:visible !important;
  }
  .vibrant-app-shell .top-navigation-item {
    min-width:0 !important;
    width:100% !important;
    height:44px !important;
    min-height:44px !important;
    padding:0 16px !important;
    gap:9px !important;
    justify-content:center !important;
    align-items:center !important;
    box-sizing:border-box !important;
    border-radius:12px !important;
    font-size:15px !important;
    font-weight:800 !important;
    line-height:1 !important;
    white-space:nowrap !important;
    overflow:hidden !important;
    text-overflow:clip !important;
  }
  /* Keep the second navigation row clearly inside the navbar. */
  .vibrant-app-shell .top-navigation-item:nth-child(n+9) {
    transform:translateY(-12px) !important;
  }
  .vibrant-app-shell .top-navigation-item:nth-child(n+9):hover {
    transform:translateY(-13px) !important;
  }
  .vibrant-app-shell .top-navigation-item:nth-child(n+9):active {
    transform:translateY(-11px) scale(.992) !important;
  }

  .vibrant-app-shell .top-navigation-item svg {
    width:20px !important;
    height:20px !important;
    flex:0 0 20px !important;
  }
  .vibrant-app-shell .top-navigation-item span {
    display:block !important;
    width:auto !important;
    max-width:none !important;
    overflow:visible !important;
    text-overflow:clip !important;
    white-space:nowrap !important;
  }
  @media (max-width:1500px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(5,minmax(0,1fr)) !important; grid-template-rows:repeat(3,44px) !important; height:148px !important; }
    .vibrant-app-shell .vibrant-topbar { height:204px !important; min-height:204px !important; }
    .vibrant-app-shell .main { padding-top:204px !important; }
    .vibrant-app-shell .sidebar-compact { top:204px !important; }
  }
  @media (max-width:900px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(4,minmax(0,1fr)) !important; grid-template-rows:repeat(4,42px) !important; height:174px !important; }
    .vibrant-app-shell .vibrant-topbar { height:230px !important; min-height:230px !important; }
    .vibrant-app-shell .main { padding-top:230px !important; }
    .vibrant-app-shell .sidebar-compact { top:230px !important; }
  }
  @media (max-width:600px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(2,minmax(0,1fr)) !important; grid-template-rows:repeat(8,40px) !important; height:326px !important; }
    .vibrant-app-shell .vibrant-topbar { height:382px !important; min-height:382px !important; }
    .vibrant-app-shell .main { padding-top:382px !important; }
    .vibrant-app-shell .sidebar-compact { top:382px !important; }
  }

  /* =========================================================
     FINAL DASHBOARD / NAVBAR LAYOUT
     ========================================================= */
  html, body, #root { width:100%; max-width:100%; overflow-x:hidden !important; }
  .vibrant-app-shell { width:100%; min-height:100vh; overflow-x:hidden !important; }

  /* Navbar: full viewport width, stable two-row navigation. */
  .vibrant-app-shell .vibrant-topbar {
    position:fixed !important;
    top:0 !important; left:0 !important; right:0 !important;
    width:100vw !important;
    height:132px !important;
    min-height:132px !important;
    margin:0 !important;
    padding:10px 22px 12px !important;
    box-sizing:border-box !important;
    background:rgba(248,249,255,.58) !important;
    backdrop-filter:blur(18px) saturate(135%) !important;
    -webkit-backdrop-filter:blur(18px) saturate(135%) !important;
    border-bottom:1px solid rgba(82,74,145,.12) !important;
    box-shadow:0 8px 28px rgba(31,35,72,.055) !important;
    z-index:1000 !important;
  }
  .vibrant-app-shell .topbar-primary-row {
    width:100% !important;
    height:56px !important;
    min-height:56px !important;
    display:flex !important;
    align-items:center !important;
    justify-content:flex-start !important;
    gap:14px !important;
    margin:0 !important;
  }
  .vibrant-app-shell .topbar-left { flex:0 0 auto !important; min-width:0 !important; }
  .vibrant-app-shell .topbar-actions { margin-left:auto !important; flex:0 0 auto !important; }
  .vibrant-app-shell .vibrant-collapsed-brand { display:flex !important; flex:0 0 auto !important; }
  .vibrant-app-shell .menu-btn { flex:0 0 46px !important; width:46px !important; height:46px !important; }
  .vibrant-app-shell .top-navigation-scroll {
    position:static !important;
    display:grid !important;
    grid-template-columns:repeat(8,minmax(0,1fr)) !important;
    grid-template-rows:repeat(2,38px) !important;
    grid-auto-flow:row !important;
    width:100% !important;
    height:82px !important;
    margin:6px 0 0 !important;
    padding:0 !important;
    gap:6px !important;
    overflow:visible !important;
    box-sizing:border-box !important;
  }
  .vibrant-app-shell .top-navigation-item {
    width:100% !important; min-width:0 !important; height:38px !important;
    min-height:38px !important; box-sizing:border-box !important;
    display:flex !important; align-items:center !important; justify-content:center !important;
    padding:0 12px !important; gap:8px !important; border-radius:11px !important;
    transform:none !important; opacity:1 !important; pointer-events:auto !important;
    white-space:nowrap !important; overflow:visible !important; text-overflow:clip !important;
    font-size:14px !important; font-weight:800 !important;
    background:rgba(255,255,255,.42) !important;
    border:1px solid rgba(96,105,139,.15) !important;
    box-shadow:0 3px 10px rgba(34,43,76,.045) !important;
  }
  .vibrant-app-shell .top-navigation-item span {
    display:inline-block !important; overflow:visible !important; text-overflow:clip !important;
    white-space:nowrap !important; max-width:none !important;
  }
  .vibrant-app-shell .top-navigation-item.active { background:linear-gradient(135deg,#6d4aff,#8a4eff) !important; color:#fff !important; }
  .vibrant-app-shell .top-navigation-item:hover { transform:translateY(-1px) !important; box-shadow:0 7px 16px rgba(46,43,91,.10) !important; }

  /* Sidebar occupies layout width rather than covering dashboard. */
  .vibrant-app-shell .sidebar-compact {
    position:fixed !important; left:0 !important; top:132px !important; bottom:0 !important;
    width:205px !important; min-width:205px !important; height:auto !important;
    z-index:900 !important; transform:translateX(0) !important; opacity:1 !important;
  }
  .vibrant-app-shell .sidebar-compact.collapsed { transform:translateX(-100%) !important; opacity:0 !important; pointer-events:none !important; }
  .vibrant-app-shell .main {
    width:calc(100% - 205px) !important;
    max-width:none !important;
    min-width:0 !important;
    margin-left:205px !important;
    padding-top:132px !important;
    box-sizing:border-box !important;
    overflow-x:hidden !important;
    transition:width .22s ease, margin-left .22s ease !important;
  }
  .vibrant-app-shell.sidebar-is-collapsed .main { width:100% !important; margin-left:0 !important; }
  .vibrant-app-shell .content { width:100% !important; max-width:none !important; box-sizing:border-box !important; }

  /* Dashboard tiles: four columns while space permits, then shrink cleanly. */
  .vibrant-app-shell .vibrant-tile-grid {
    display:grid !important;
    grid-template-columns:repeat(4,minmax(0,1fr)) !important;
    gap:16px !important;
    width:100% !important;
  }
  .vibrant-app-shell .vibrant-stat-tile { min-width:0 !important; width:100% !important; box-sizing:border-box !important; }

  /* Remove the old lower attention/shortcut area if any legacy markup survives. */
  .vibrant-app-shell .vibrant-dashboard-lower { display:none !important; }

  /* Subtle professional reflection + hover. */
  .vibrant-app-shell .vibrant-stat-tile,
  .vibrant-app-shell .top-navigation-item,
  .vibrant-app-shell .btn,
  .vibrant-app-shell .nav-item {
    position:relative !important; overflow:hidden !important;
    transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease !important;
  }
  .vibrant-app-shell .vibrant-stat-tile::before,
  .vibrant-app-shell .top-navigation-item::before,
  .vibrant-app-shell .btn::before,
  .vibrant-app-shell .nav-item::before {
    content:"" !important; position:absolute !important; top:0 !important; left:-120% !important;
    width:55% !important; height:100% !important;
    background:linear-gradient(105deg,transparent,rgba(255,255,255,.34),transparent) !important;
    transform:skewX(-18deg) !important; pointer-events:none !important; transition:left .5s ease !important;
  }
  .vibrant-app-shell .vibrant-stat-tile:hover,
  .vibrant-app-shell .top-navigation-item:hover,
  .vibrant-app-shell .btn:hover,
  .vibrant-app-shell .nav-item:hover { transform:translateY(-2px) !important; }
  .vibrant-app-shell .vibrant-stat-tile:hover::before,
  .vibrant-app-shell .top-navigation-item:hover::before,
  .vibrant-app-shell .btn:hover::before,
  .vibrant-app-shell .nav-item:hover::before { left:125% !important; }

  @media (max-width:1500px) {
    .vibrant-app-shell .top-navigation-item { padding:0 8px !important; font-size:13px !important; gap:6px !important; }
    .vibrant-app-shell .vibrant-tile-grid { gap:13px !important; }
  }
  @media (max-width:1250px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(5,minmax(0,1fr)) !important; grid-template-rows:repeat(3,38px) !important; height:126px !important; }
    .vibrant-app-shell .vibrant-topbar { height:176px !important; min-height:176px !important; }
    .vibrant-app-shell .main { padding-top:176px !important; }
    .vibrant-app-shell .sidebar-compact { top:176px !important; }
    .vibrant-app-shell .vibrant-tile-grid { grid-template-columns:repeat(3,minmax(0,1fr)) !important; }
  }
  @media (max-width:900px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(4,minmax(0,1fr)) !important; grid-template-rows:repeat(4,38px) !important; height:164px !important; }
    .vibrant-app-shell .vibrant-topbar { height:214px !important; min-height:214px !important; }
    .vibrant-app-shell .main { padding-top:214px !important; width:100% !important; margin-left:0 !important; }
    .vibrant-app-shell .sidebar-compact { top:214px !important; }
    .vibrant-app-shell .vibrant-tile-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
  }
  @media (max-width:600px) {
    .vibrant-app-shell .top-navigation-scroll { grid-template-columns:repeat(2,minmax(0,1fr)) !important; grid-template-rows:repeat(8,38px) !important; height:318px !important; }
    .vibrant-app-shell .vibrant-topbar { height:368px !important; min-height:368px !important; }
    .vibrant-app-shell .main { padding-top:368px !important; }
    .vibrant-app-shell .sidebar-compact { top:368px !important; }
    .vibrant-app-shell .vibrant-tile-grid { grid-template-columns:1fr !important; }
  }

  /* =========================================================
     DEFINITIVE NAVBAR OVERRIDE
     Full-width navigation; no redundant Dashboard title in row 1.
     ========================================================= */
  .vibrant-app-shell .vibrant-topbar {
    display:flex !important;
    flex-direction:column !important;
    align-items:stretch !important;
    justify-content:flex-start !important;
    height:162px !important;
    min-height:162px !important;
    width:100vw !important;
    left:0 !important;
    right:0 !important;
    padding:8px 22px 7px !important;
    box-sizing:border-box !important;
  }
  .vibrant-app-shell .main { padding-top:162px !important; }
  .vibrant-app-shell .sidebar-compact { top:162px !important; }
  .vibrant-app-shell .topbar-primary-row {
    flex:0 0 58px !important;
    width:100% !important;
    height:58px !important;
    min-height:58px !important;
    margin:0 !important;
    display:flex !important;
    align-items:center !important;
  }
  .vibrant-app-shell .topbar-left {
    flex:0 0 auto !important;
    width:auto !important;
    min-width:0 !important;
    margin:0 !important;
  }
  .vibrant-app-shell .topbar-actions {
    margin-left:auto !important;
    flex:0 0 auto !important;
  }
  .vibrant-app-shell .top-navigation-scroll {
    position:static !important;
    display:grid !important;
    align-self:stretch !important;
    flex:0 0 96px !important;
    width:100% !important;
    max-width:none !important;
    height:96px !important;
    min-height:96px !important;
    margin:7px 0 0 !important;
    padding:0 !important;
    box-sizing:border-box !important;
    grid-template-columns:repeat(8,minmax(0,1fr)) !important;
    grid-template-rows:repeat(2,44px) !important;
    grid-auto-flow:row !important;
    gap:8px !important;
    overflow:visible !important;
  }
  .vibrant-app-shell .top-navigation-item {
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    width:100% !important;
    min-width:0 !important;
    height:44px !important;
    min-height:44px !important;
    box-sizing:border-box !important;
    padding:0 15px !important;
    gap:9px !important;
    border-radius:12px !important;
    font-size:15px !important;
    font-weight:800 !important;
    line-height:1 !important;
    white-space:nowrap !important;
    overflow:visible !important;
    text-overflow:clip !important;
  }
  .vibrant-app-shell .top-navigation-item svg {
    width:20px !important;
    height:20px !important;
    min-width:20px !important;
    flex:0 0 20px !important;
  }
  .vibrant-app-shell .top-navigation-item span {
    display:inline-block !important;
    width:auto !important;
    max-width:none !important;
    overflow:visible !important;
    text-overflow:clip !important;
    white-space:nowrap !important;
  }

  @media (max-width:1500px) {
    .vibrant-app-shell .vibrant-topbar { height:214px !important; min-height:214px !important; }
    .vibrant-app-shell .top-navigation-scroll {
      flex-basis:148px !important; height:148px !important; min-height:148px !important;
      grid-template-columns:repeat(5,minmax(0,1fr)) !important;
      grid-template-rows:repeat(3,44px) !important;
      gap:8px !important;
    }
    .vibrant-app-shell .main { padding-top:214px !important; }
    .vibrant-app-shell .sidebar-compact { top:214px !important; }
  }
  @media (max-width:900px) {
    .vibrant-app-shell .vibrant-topbar { height:266px !important; min-height:266px !important; }
    .vibrant-app-shell .top-navigation-scroll {
      flex-basis:200px !important; height:200px !important; min-height:200px !important;
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      grid-template-rows:repeat(4,44px) !important;
      gap:8px !important;
    }
    .vibrant-app-shell .main { padding-top:266px !important; }
    .vibrant-app-shell .sidebar-compact { top:266px !important; }
  }
  @media (max-width:600px) {
    .vibrant-app-shell .vibrant-topbar { height:474px !important; min-height:474px !important; }
    .vibrant-app-shell .top-navigation-scroll {
      flex-basis:408px !important; height:408px !important; min-height:408px !important;
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      grid-template-rows:repeat(8,44px) !important;
      gap:8px !important;
    }
    .vibrant-app-shell .main { padding-top:474px !important; }
    .vibrant-app-shell .sidebar-compact { top:474px !important; }
  }
`;

function loadLegacyData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function hashPassword(password) {
  const value = String(password || '');
  if (window.crypto?.subtle) {
    const buffer = await window.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(value)
    );
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  return window.btoa(unescape(encodeURIComponent(value)));
}

async function getPublicGymProfile(gymId) {
  const cleanGymId = String(gymId || '').trim();
  if (!cleanGymId) throw new Error('Public gym page is missing the gym ID.');
  const { data, error } = await supabase.rpc('public_get_gym_profile', { p_gym_id: cleanGymId });
  if (error) throw new Error(error.message || 'Unable to load public gym profile');
  if (!data || !data.settings) throw new Error('Public gym profile returned no settings. Run the public gym profile SQL in Supabase.');
  return data;
}

async function resizePublicImage(file, maxSize = 900, quality = 0.82) {
  if (!file) return '';

  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Please select an image file.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Unable to read the selected image.'));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error('Unable to process the selected image.'));

      image.onload = () => {
        const scale = Math.min(
          1,
          maxSize / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
        );

        const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
        const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Your browser could not prepare the image.'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        const output = canvas.toDataURL('image/jpeg', quality);

        if (!output || output === 'data:,') {
          reject(new Error('Unable to create the image preview.'));
          return;
        }

        resolve(output);
      };

      image.src = String(reader.result || '');
    };

    reader.readAsDataURL(file);
  });
}

function openPublicGymPage(gymId = '') {
  const storedGymId = (() => { try { return window.localStorage.getItem(PUBLIC_GYM_ID_STORAGE_KEY) || ''; } catch { return ''; } })();
  const cleanGymId = String(gymId || storedGymId || PRODUCTION_GYM_ID).trim();
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const baseUrl = isLocal ? window.location.origin : PRODUCTION_APP_URL.replace(/\/$/, '');
  const separator = isLocal ? '/' : '/';
  const url = `${baseUrl}${separator}?gym=${encodeURIComponent(cleanGymId)}#gym`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

const STAFF_PERMISSION_DEFINITIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'View dashboard and daily overview' },
  { key: 'performance', label: 'Performance', description: 'View performance analytics' },
  { key: 'members', label: 'Members', description: 'Add, edit and manage members' },
  { key: 'leads', label: 'Leads', description: 'Manage sales leads and prospects' },
  { key: 'enquiries', label: 'Website Enquiries', description: 'View enquiries submitted through the public gym website' },
  { key: 'memberships', label: 'Memberships', description: 'Manage membership renewals and plans' },
  { key: 'attendance', label: 'Attendance', description: 'View and record attendance' },
  { key: 'payments', label: 'Payments & Invoices', description: 'Record payments and generate invoices' },
  { key: 'training', label: 'Training', description: 'Manage workout plans' },
  { key: 'trainers', label: 'Trainers & PT', description: 'Manage trainers and PT sessions' },
  { key: 'progress', label: 'Progress', description: 'Manage member progress records' },
  { key: 'diet', label: 'Diet & Nutrition', description: 'Manage diet plans' },
  { key: 'communication', label: 'Communication', description: 'Manage member communication' },
  { key: 'feedback', label: 'Customer Feedback', description: 'View and manage feedback' },
  { key: 'reports', label: 'Reports', description: 'View reports and business summaries' },
  { key: 'settings', label: 'Settings', description: 'Change gym settings' },
];

const DEFAULT_STAFF_PERMISSIONS = Object.fromEntries(
  STAFF_PERMISSION_DEFINITIONS.map((item) => [
    item.key,
    item.key === 'dashboard' ||
      item.key === 'members' ||
      item.key === 'attendance' ||
      item.key === 'payments',
  ])
);

const PERMISSION_FOR_PAGE = Object.fromEntries(
  STAFF_PERMISSION_DEFINITIONS.map((item) => [item.label, item.key])
);

function App() {
  const [data, setData] = useState(seed);
  const [dbReady, setDbReady] = useState(false);
  const [active, setActive] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [excelImportPreview, setExcelImportPreview] = useState(null);
  const [excelImportBusy, setExcelImportBusy] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('checking');
  const [access, setAccess] = useState({
    userId: '',
    gymId: '',
    role: 'staff',
    permissions: {},
  });

  const normalizedRole = String(access.role || '').trim().toLowerCase();
  const isOwner = ['owner', 'admin', 'administrator'].includes(normalizedRole);
  const isReadOnlyStaff = isAuthenticated && !isOwner;
  // Existing staff accounts may not yet have an explicit 'enquiries' key.
  // Reuse their existing Leads or Customer Feedback permission for access.
  const can = (permission) => isOwner || access.permissions?.[permission] === true || (permission === 'enquiries' && (access.permissions?.leads === true || access.permissions?.feedback === true));
  const seenWebsiteEnquiriesRef = useRef(null);

  // Staff may add a new member and record payments. Other mutations are
  // blocked at the app-shell capture layer; deletion remains blocked always.
  // This is UI protection and should be paired with Supabase RLS policies.
  const blockStaffMutation = (event) => {
    if (!isReadOnlyStaff) return;
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest('button, [role="button"], input[type="submit"], input[type="button"]');
    if (!control) return;

    const label = [
      control.innerText,
      control.getAttribute('aria-label'),
      control.getAttribute('title'),
      control.getAttribute('data-action'),
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().toLowerCase();

    const isDeleteAction = /\b(delete|remove|discard|erase|clear record|permanently)\b/.test(label);
    const isAddMemberAction = /\badd member\b/.test(label) && (
      modal === 'member' || (!modal && !isDeleteAction)
    );
    const isRecordPaymentAction = /\brecord payment\b/.test(label) && (
      modal === 'payment' || (!modal && !isDeleteAction)
    );

    // Permit only the two requested workflows. Keep normal navigation and
    // non-mutating controls usable for staff.
    const isAllowedStaffMutation = (isAddMemberAction && (modal === 'member' || !modal)) ||
      (isRecordPaymentAction && (modal === 'payment' || !modal));

    const mutationAction = /\b(add|create|new member|new lead|delete|remove|edit|save|submit|update|modify|record payment|mark attendance|check.?in|convert|confirm payment|refund|renew|extend membership|enable staff|disable staff|save permissions|allow all|remove all|upload|import|export changes|reset data|reset database)\b/.test(label);

    if (isDeleteAction || (mutationAction && !isAllowedStaffMutation)) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      setToast(isDeleteAction
        ? 'Staff access: deleting records is not allowed.'
        : 'Staff can add members and record payments only. Other changes are restricted.');
    }
  };

  const blockStaffFormSubmit = (event) => {
    if (!isReadOnlyStaff) return;
    const isAllowedCreateFlow = modal === 'member' || modal === 'payment';
    if (isAllowedCreateFlow) return;
    event.preventDefault();
    event.stopPropagation();
    setToast('Staff can add members and record payments only. Other changes are restricted.');
  };

  useEffect(() => {
    let cancelled = false;
    let unsubscribeAuth = () => {};

    (async () => {
      const stored = await readState(null);
      if (cancelled) return;

      if (stored) {
        const normalized = {
          ...stored,
          workoutPlans: Array.isArray(stored.workoutPlans) ? stored.workoutPlans : [],
          dietPlans: Array.isArray(stored.dietPlans) ? stored.dietPlans : seed.dietPlans,
          settings: {
            ...seed.settings,
            ...(stored.settings || {}),
            auth: {
              ...seed.settings.auth,
              ...((stored.settings || {}).auth || {}),
            },
          },
        };
        setData(normalized);
        await writeState(normalized);
      } else {
        const legacy = loadLegacyData();

        if (legacy) {
          const normalized = {
            ...legacy,
            workoutPlans: Array.isArray(legacy.workoutPlans) ? legacy.workoutPlans : [],
            dietPlans: Array.isArray(legacy.dietPlans) ? legacy.dietPlans : seed.dietPlans,
            settings: {
              ...seed.settings,
              ...(legacy.settings || {}),
              auth: {
                ...seed.settings.auth,
                ...((legacy.settings || {}).auth || {}),
              },
            },
          };
          setData(normalized);
          await writeState(normalized);
        } else {
          await writeState(seed);
        }
      }

      if (cancelled) return;

      setDbReady(true);

      try {
        const session = await getSupabaseSession();

        if (!cancelled) {
          setIsAuthenticated(Boolean(session?.user));
        }
      } catch (error) {
        console.error('Supabase session check failed:', error);

        if (!cancelled) {
          setIsAuthenticated(false);
        }
      }

      if (cancelled) return;

      unsubscribeAuth = subscribeToAuthChanges(({ session }) => {
        if (cancelled) return;
        setIsAuthenticated(Boolean(session?.user));
      });
    })();

    return () => {
      cancelled = true;
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!dbReady || !isAuthenticated) return;

    let cancelled = false;

    (async () => {
      setCloudStatus('checking');
      try {
        const currentAccess = await getMyAccess();

        if (cancelled) return;

        setAccess({
          userId: currentAccess?.userId || '',
          gymId: currentAccess?.gymId || '',
          role: currentAccess?.role || 'staff',
          permissions: currentAccess?.permissions || {},
        });

        const cloud = await loadCloudState();

        console.log('===== PREFACE CLOUD LOAD =====');
        console.log('Cloud object:', cloud);
        console.log('Cloud members:', cloud?.members);
        console.log('Cloud members count:', cloud?.members?.length);
        console.log('Cloud gym:', cloud?.gym);
        console.log('Cloud payments count:', cloud?.payments?.length);
        console.log('==============================');

        if (cancelled || !cloud) return;

        if (cloud.gym?.id) { try { window.localStorage.setItem(PUBLIC_GYM_ID_STORAGE_KEY, String(cloud.gym.id)); } catch {} }

        setCloudStatus('connected');
        setData((current) => ({
          ...current,
          gym: cloud.gym || current.gym,
          // Supabase is the source of truth. An empty cloud table must stay
          // empty in the UI; do not resurrect stale browser-only records.
          // Missing properties still fall back for compatibility, but [] is authoritative.
          membershipPlans: Array.isArray(cloud.membershipPlans)
            ? cloud.membershipPlans
            : (current.membershipPlans || []),
          members: Array.isArray(cloud.members)
            ? cloud.members
            : (current.members || []),
          leads: Array.isArray(cloud.leads)
            ? cloud.leads
            : (current.leads || []),
          payments: Array.isArray(cloud.payments)
            ? cloud.payments
            : (current.payments || []),
          attendance: Array.isArray(cloud.attendance)
            ? cloud.attendance
            : (current.attendance || []),
          trainers: Array.isArray(cloud.trainers)
            ? cloud.trainers
            : (current.trainers || []),
          ptSessions: Array.isArray(cloud.ptSessions)
            ? cloud.ptSessions
            : (current.ptSessions || []),
          progressRecords: Array.isArray(cloud.progressRecords)
            ? cloud.progressRecords
            : (current.progressRecords || []),
          // Workout plans are stored inside the gym settings JSON because this
          // app does not have a dedicated workout_plans table wired into cloudData.
          // Prefer the dedicated cloud collection only when it contains records;
          // otherwise restore plans from the persisted settings payload.
          workoutPlans: (Array.isArray(cloud.workoutPlans) && cloud.workoutPlans.length > 0)
            ? cloud.workoutPlans
            : (Array.isArray(cloud.settings?.workoutPlans)
              ? cloud.settings.workoutPlans
              : (Array.isArray(current.workoutPlans) ? current.workoutPlans : [])),
          dietPlans: Array.isArray(cloud.dietPlans)
            ? cloud.dietPlans
            : (current.dietPlans || []),
          communicationLogs: Array.isArray(cloud.communicationLogs)
            ? cloud.communicationLogs
            : (current.communicationLogs || []),
          // Website enquiries are maintained separately from Customer Feedback.
          feedbacks: Array.isArray(cloud.feedbacks)
            ? cloud.feedbacks
            : current.feedbacks,
          websiteEnquiries: Array.isArray(cloud.websiteEnquiries)
            ? cloud.websiteEnquiries
            : (current.websiteEnquiries || []),
          settings: {
            ...(current.settings || {}),
            ...(cloud.settings || {}),
          },
        }));
      } catch (error) {
        setCloudStatus('error');
        console.error('===== PREFACE CLOUD LOAD ERROR =====');
        console.error(error);
        console.error(error?.message);
        console.error(error?.stack);
        console.error('====================================');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dbReady, isAuthenticated]);

  useEffect(() => {
    if (dbReady) writeState(data).catch(() => setToast('Could not save local database'));
  }, [data, dbReady]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeMembers = data.members.filter((m) => m.status === 'Active').length;
  const expiringMembers = data.members.filter((m) => m.status === 'Expiring').length;
  const overdue = data.members.reduce((sum, m) => sum + Number(m.due || 0), 0);
  const revenue = data.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const planPrices = { ...DEFAULT_MEMBERSHIP_PRICES, ...(data.settings?.membershipPrices || {}) };

  const getMemberStatus = getMembershipStatus;

  const addMember = async (member) => {
    const requestedPin = String(member.portalPin || '');
    if (!/^\d{6}$/.test(requestedPin)) {
      setToast('Enter a valid 6-digit Member Portal PIN.');
      return;
    }
    const requestedId = String(member.id || '').trim();
    const id = requestedId || nextSystemMemberId(data.members);

    if (data.members.some((item) => String(item.id).toLowerCase() === id.toLowerCase())) {
      setToast(`Member ID ${id} is already in use`);
      return;
    }

    const cleanAmount = Math.max(0, Number(member.amount ?? planPrices[member.plan] ?? 0) || 0);
    const cleanPaid = Math.max(0, Number(member.paid || 0) || 0);
    // Always derive the outstanding balance from the agreed membership fee and
    // actual amount received. Do not trust a stale/empty form `due` value.
    const cleanDue = Math.max(0, cleanAmount - cleanPaid);
    const clean = {
      ...member,
      id,
      visits: 0,
      due: cleanDue,
      amount: cleanAmount,
      paid: cleanPaid,
      status: getMemberStatus(member.expiry),
      paymentMode: member.paymentMode || 'Cash',
      gstMode: member.gstMode || 'without',
      gstRate: Number(member.gstRate || data.settings?.defaultGstRate || 5),
      createdAt: new Date().toISOString(),
    };
    const memberInvoiceAllocation = allocateMemberInvoiceNumber(data.settings || {}, clean.gstMode === 'gst', today);
    clean.memberInvoiceNumber = memberInvoiceAllocation.invoiceNumber;
    clean.notes = encodeMemberNotes(clean.notes, clean);
    let invoiceSettingsAfterMember = memberInvoiceAllocation.settings;

    try {
      const referredMember = data.members.find((item) => String(item.id) === String(clean.referredBy || ''));
      const row = await insertRecord('members', {
        member_code: clean.id,
        name: clean.name || '',
        phone: clean.phone || '',
        email: clean.email || '',
        dob: clean.dob || clean.birthday || null,
        gender: clean.gender || '',
        address: clean.address || '',
        emergency_contact: clean.emergencyContact || '',
        plan_name: clean.plan || '',
        start_date: clean.start || null,
        expiry_date: clean.expiry || null,
        status: clean.status || 'Active',
        visits: Number(clean.visits || 0),
        due_amount: Number(clean.due || 0),
        membership_amount: Number(clean.amount || 0),
        paid_amount: Number(clean.paid || 0),
        height: clean.height || '',
        weight: clean.weight || '',
        body_fat: clean.bodyFat || '',
        trainer_name: clean.trainer || '',
        referral_source: clean.referral || '',
        notes: clean.notes || '',
        photo: clean.photo || '',
        diet_preference: clean.dietPreference || '',
        attendance_number: clean.attendanceNumber || '',
        referral_points: Number(clean.referralPoints || 0),
        referred_by_member_id: referredMember?.cloudId || null,
      });

      // Portal PIN is stored only as a server-side hash via a restricted RPC.
      // Never include the PIN in the members row or local app state.
      const pinValue = String(member.portalPin || '');
      if (!/^\d{6}$/.test(pinValue)) {
        throw new Error('Enter a valid 6-digit Member Portal PIN.');
      }
      const { error: pinError } = await supabase.rpc('set_member_portal_pin', {
        p_member_id: row.id,
        p_pin: pinValue,
      });
      if (pinError) {
        console.error('Member Portal PIN setup failed:', pinError);
        throw new Error(`Member was created, but PIN setup failed. Ask the admin to set the PIN from the member profile. Details: ${pinError.message}`);
      }

      const saved = { ...clean, cloudId: row.id, id: row.member_code || clean.id };
      delete saved.portalPin;

      let initialPayment = null;
      if (Number(clean.paid || 0) > 0) {
        const paymentId = `PAY-${Date.now()}`;
        const gst = clean.gstMode === 'gst' ? calculateGstBreakdown(clean.amount, clean.gstRate) : calculateGstBreakdown(clean.amount, 0);
        const invoiceAllocation = allocateInvoiceNumber(invoiceSettingsAfterMember, clean.gstMode === 'gst', today);
        const invoiceNumber = clean.memberInvoiceNumber;
        invoiceSettingsAfterMember = invoiceAllocation.settings;
        const paymentRow = await insertRecord('payments', {
          member_id: row.id,
          legacy_id: paymentId,
          amount: Number(clean.paid || 0),
          payment_type: 'Membership',
          payment_mode: clean.paymentMode || 'Cash',
          payment_date: today,
          notes: `Initial membership payment | Plan: ${clean.plan || 'Membership'} | Start: ${clean.start || ''} | Expiry: ${clean.expiry || ''}`,
          invoice_number: invoiceNumber,
          gst_applicable: clean.gstMode === 'gst',
          gst_rate: gst.rate,
          taxable_amount: gst.taxable,
          cgst_amount: gst.cgst,
          sgst_amount: gst.sgst,
          invoice_amount: Number(clean.amount || 0),
          paid_amount_at_invoice: Number(clean.paid || 0),
          balance_at_invoice: Number(clean.due || 0),
          description: `${clean.plan || 'Membership'} membership`,
        });
        setData((d) => ({ ...d, settings: invoiceAllocation.settings }));
        saveCloudSettings({ invoiceSeriesA: invoiceAllocation.settings.invoiceSeriesA, invoiceSeriesB: invoiceAllocation.settings.invoiceSeriesB }).catch((error) => console.error('Invoice series sync failed:', error));
        initialPayment = {
          id: paymentRow.legacy_id || paymentId,
          cloudId: paymentRow.id,
          memberId: saved.id,
          member: saved.name,
          amount: Number(clean.paid || 0),
          type: 'Membership',
          mode: clean.paymentMode || 'Cash',
          date: today,
          notes: `Initial membership payment | Plan: ${clean.plan || 'Membership'} | Start: ${clean.start || ''} | Expiry: ${clean.expiry || ''}`,
          invoiceNumber,
          gstApplicable: clean.gstMode === 'gst',
          gstRate: gst.rate,
          taxableAmount: gst.taxable,
          cgstAmount: gst.cgst,
          sgstAmount: gst.sgst,
          invoiceAmount: Number(clean.amount || 0),
          paidAmountAtInvoice: Number(clean.paid || 0),
          balanceAtInvoice: Number(clean.due || 0),
          description: `${clean.plan || 'Membership'} membership`,
        };
      }

      setData((d) => ({
        ...d,
        settings: invoiceSettingsAfterMember,
        members: [saved, ...d.members],
        payments: initialPayment ? [initialPayment, ...d.payments] : d.payments,
      }));
      saveCloudSettings({ invoiceSeriesA: invoiceSettingsAfterMember.invoiceSeriesA, invoiceSeriesB: invoiceSettingsAfterMember.invoiceSeriesB }).catch((error) => console.error('Member invoice series sync failed:', error));
      setModal(null);
      setToast(initialPayment ? 'Member added and payment recorded successfully' : 'Member added successfully');
    } catch (error) {
      console.error('Supabase member insert failed:', error);
      setToast(error?.message || 'Could not save member to Supabase');
    }
  };

  const updateMember = async (updated) => {
    const existing = data.members.find((m) => m.id === updated.id);
    if (!existing?.cloudId) {
      setToast('This member is not linked to Supabase yet');
      return;
    }

    const clean = {
      ...existing,
      ...updated,
      due: Number(updated.due || 0),
      amount: Number(updated.amount || 0),
      paid: Number(updated.paid || 0),
      status: getMemberStatus(updated.expiry),
    };
    clean.notes = encodeMemberNotes(clean.notes, clean);

    try {
      const referredMember = data.members.find((item) => String(item.id) === String(clean.referredBy || ''));
      await updateRecord('members', existing.cloudId, {
        member_code: String(clean.id || '').trim(),
        name: clean.name || '',
        phone: clean.phone || '',
        email: clean.email || '',
        dob: clean.dob || clean.birthday || null,
        gender: clean.gender || '',
        address: clean.address || '',
        emergency_contact: clean.emergencyContact || '',
        plan_name: clean.plan || '',
        start_date: clean.start || null,
        expiry_date: clean.expiry || null,
        status: clean.status || 'Active',
        visits: Number(clean.visits || 0),
        due_amount: Number(clean.due || 0),
        membership_amount: Number(clean.amount || 0),
        paid_amount: Number(clean.paid || 0),
        height: clean.height || '',
        weight: clean.weight || '',
        body_fat: clean.bodyFat || '',
        trainer_name: clean.trainer || '',
        referral_source: clean.referral || '',
        notes: clean.notes || '',
        photo: clean.photo || '',
        diet_preference: clean.dietPreference || '',
        attendance_number: clean.attendanceNumber || '',
        referral_points: Number(clean.referralPoints || 0),
        referred_by_member_id: referredMember?.cloudId || null,
      });

      const requestedPin = String(updated.portalPin || '').trim();
      if (requestedPin) {
        if (!isOwner) throw new Error('Only an Admin can change or reset a member portal PIN.');
        if (!/^\d{6}$/.test(requestedPin)) throw new Error('PIN must be exactly 6 digits.');
        const { error: pinError } = await supabase.rpc('set_member_portal_pin', {
          p_member_id: existing.cloudId,
          p_pin: requestedPin,
        });
        if (pinError) throw new Error(`Member details saved, but PIN update failed: ${pinError.message}`);
      }

      const safeClean = { ...clean };
      delete safeClean.portalPin;
      setData((d) => ({
        ...d,
        members: d.members.map((m) => m.id === updated.id ? { ...safeClean, cloudId: existing.cloudId } : m),
      }));
      setModal(null);
      setToast('Member updated successfully');
    } catch (error) {
      console.error('Supabase member update failed:', error);
      setToast(error?.message || 'Could not update member in Supabase');
    }
  };

  const renewMembership = async (member, renewal) => {
    const plan = MEMBERSHIP_PLANS.find((item) => item.name === renewal.plan);
    if (!plan) return;

    if (!member.cloudId) {
      setToast('This member is not linked to Supabase yet');
      return;
    }

    const currentDays = getDaysRemaining(member.expiry);
    const renewalStart = currentDays >= 0 && member.expiry ? member.expiry : today;
    const newExpiry = addMonthsToDate(renewalStart, plan.months);
    const renewalAmount = Number(
      renewal.amount || planPrices[plan.name] || plan.price
    );
    const renewalPaid = Number(renewal.paid || 0);
    const oldDue = Number(member.due || 0);
    const renewalDue = Math.max(0, renewalAmount - renewalPaid);

    const updatedMember = {
      ...member,
      plan: plan.name,
      start: renewalStart,
      expiry: newExpiry,
      amount: renewalAmount,
      paid: renewalPaid,
      due: oldDue + renewalDue,
      status: getMembershipStatus(newExpiry),
    };

    try {
      await updateRecord('members', member.cloudId, {
        plan_name: updatedMember.plan,
        start_date: updatedMember.start || null,
        expiry_date: updatedMember.expiry || null,
        status: updatedMember.status || 'Active',
        membership_amount: Number(updatedMember.amount || 0),
        paid_amount: Number(updatedMember.paid || 0),
        due_amount: Number(updatedMember.due || 0),
      });

      if (renewalPaid > 0) {
        await insertRecord('payments', {
          member_id: member.cloudId,
          legacy_id: `PAY-${Date.now()}`,
          amount: renewalPaid,
          payment_type: 'Membership',
          payment_mode: renewal.mode || 'Cash',
          payment_date: renewal.paymentDate || today,
          notes: `Membership renewal - ${plan.name} | Payment date: ${renewal.paymentDate || today} | Previous expiry: ${member.expiry || ''} | New plan start: ${renewalStart} | New expiry: ${newExpiry}`,
        });
      }

      setData((d) => ({
        ...d,
        members: d.members.map((m) =>
          m.id === member.id ? { ...updatedMember } : m
        ),
        payments:
          renewalPaid > 0
            ? [
                {
                  id: `PAY-${Date.now()}`,
                  memberId: member.id,
                  member: member.name,
                  amount: renewalPaid,
                  type: 'Membership',
                  mode: renewal.mode || 'Cash',
                  date: renewal.paymentDate || today,
                  notes: `Membership renewal - ${plan.name} | Payment date: ${renewal.paymentDate || today} | Previous expiry: ${member.expiry || ''} | New plan start: ${renewalStart} | New expiry: ${newExpiry}`,
                },
                ...d.payments,
              ]
            : d.payments,
      }));

      setModal(null);
      setToast(`${member.name}'s membership renewed successfully`);
    } catch (error) {
      console.error('Supabase membership renewal failed:', error);
      setToast(error?.message || 'Unable to renew membership in Supabase');
    }
  };

  const addLead = (lead) => {
    const id = `L-${101 + data.leads.length}`;
    setData((d) => ({ ...d, leads: [{ ...lead, id, stage: 'New' }, ...d.leads] }));
    setModal(null);
    setToast('Lead added successfully');
  };

  const addPayment = async (payment) => {
    const member = data.members.find(
      (item) => item.id === payment.memberId || item.name === payment.member
    );

    if (!member?.cloudId) {
      setToast('Please select a Supabase-linked member');
      return;
    }

    const amount = Number(payment.amount || 0);
    if (amount <= 0) {
      setToast('Enter a valid payment amount');
      return;
    }

    const paymentId = `PAY-${Date.now()}`;
    const currentPaid = Number(member.paid || 0);
    const currentDue = Number(member.due || 0);
    const paidAgainstDue = Math.min(currentDue, amount);

    const nextPaid = currentPaid + amount;
    const nextDue = Math.max(0, currentDue - paidAgainstDue);

    try {
      // Resolve the authoritative Supabase member UUID before inserting a payment.
      // UI IDs/cloudIds may be stale for legacy or imported members, so verify by
      // UUID first, then member code, then exact phone + name within visible RLS rows.
      let dbMemberId = null;
      const { data: memberByUuid, error: memberUuidError } = await supabase
        .from('members')
        .select('id')
        .eq('id', member.cloudId)
        .maybeSingle();

      if (!memberUuidError && memberByUuid?.id) {
        dbMemberId = memberByUuid.id;
      }

      if (!dbMemberId) {
        const { data: memberByCode, error: memberCodeError } = await supabase
          .from('members')
          .select('id, member_code, name, phone')
          .eq('member_code', String(member.id))
          .maybeSingle();

        if (memberCodeError) throw memberCodeError;
        dbMemberId = memberByCode?.id || null;
      }

      if (!dbMemberId && member.phone) {
        const { data: matchingMembers, error: phoneLookupError } = await supabase
          .from('members')
          .select('id, member_code, name, phone')
          .eq('phone', String(member.phone).trim());

        if (phoneLookupError) throw phoneLookupError;

        const exactMatch = (matchingMembers || []).find((row) =>
          String(row.name || '').trim().toLowerCase() === String(member.name || '').trim().toLowerCase()
        );
        dbMemberId = exactMatch?.id || null;
      }

      if (!dbMemberId) {
        throw new Error(`Could not match ${member.name} (${member.id}) to a saved Supabase member. Refresh the app data; if the member is missing from Supabase, add/import the member first.`);
      }

      const gstApplicable = payment.gstMode === 'gst';
      const invoiceAmount = amount; // Invoice only the amount actually received in this transaction.
      const gst = calculateGstBreakdown(invoiceAmount, gstApplicable ? Number(payment.gstRate || data.settings?.defaultGstRate || 5) : 0);
      const invoiceAllocation = allocateInvoiceNumber(data.settings || {}, gstApplicable, payment.date || today);
      const existingMemberPayments = data.payments.filter((p) => p.memberId === member.id || (p.member && p.member === member.name));
      const memberBaseInvoiceNumber = getMemberMasterInvoiceNumber(member, data.settings || {});
      const paymentSuffixIndex = existingMemberPayments.length;
      const invoiceNumber = paymentSuffixIndex > 0
        ? `${memberBaseInvoiceNumber}-${romanPaymentSuffix(paymentSuffixIndex)}`
        : memberBaseInvoiceNumber;

      await insertRecord('payments', {
        member_id: dbMemberId,
        legacy_id: paymentId,
        amount,
        payment_type: payment.type || 'Membership',
        payment_mode: payment.mode || 'Cash',
        payment_date: payment.date || today,
        notes: payment.notes || '',
        invoice_number: invoiceNumber,
        gst_applicable: gstApplicable,
        gst_rate: gst.rate,
        taxable_amount: gst.taxable,
        cgst_amount: gst.cgst,
        sgst_amount: gst.sgst,
        invoice_amount: invoiceAmount,
        paid_amount_at_invoice: payment.type === 'Membership' ? nextPaid : amount,
        balance_at_invoice: payment.type === 'Membership' ? nextDue : 0,
        description: payment.type === 'Membership' ? `${member.plan || 'Membership'} membership` : `${payment.type || 'Payment'} payment`,
      });

      setData((d) => ({ ...d, settings: invoiceAllocation.settings }));
      saveCloudSettings({ invoiceSeriesA: invoiceAllocation.settings.invoiceSeriesA, invoiceSeriesB: invoiceAllocation.settings.invoiceSeriesB }).catch((error) => console.error('Invoice series sync failed:', error));

      if (payment.type === 'Membership') {
        await updateRecord('members', dbMemberId, {
          paid_amount: nextPaid,
          due_amount: nextDue,
        });
      }

      setData((d) => ({
        ...d,
        payments: [
          {
            ...payment,
            id: paymentId,
            memberId: member.id,
            member: member.name,
            amount,
            date: payment.date || today,
            createdAt: new Date().toISOString(),
            invoiceNumber,
            gstApplicable,
            gstRate: gst.rate,
            taxableAmount: gst.taxable,
            cgstAmount: gst.cgst,
            sgstAmount: gst.sgst,
            invoiceAmount,
            paidAmountAtInvoice: payment.type === 'Membership' ? nextPaid : amount,
            balanceAtInvoice: payment.type === 'Membership' ? nextDue : 0,
            description: payment.type === 'Membership' ? `${member.plan || 'Membership'} membership` : `${payment.type || 'Payment'} payment`,
          },
          ...d.payments,
        ],
        members: d.members.map((item) =>
          item.id === member.id && payment.type === 'Membership'
            ? {
                ...item,
                paid: nextPaid,
                due: nextDue,
              }
            : item
        ),
      }));

      setModal(null);
      setToast('Payment recorded in Supabase');
    } catch (error) {
      console.error('Supabase payment insert failed:', error);
      setToast(error?.message || 'Unable to save payment in Supabase');
    }
  };

  const addFeedback = async (feedback) => {
    const clean = {
      memberId: feedback.memberId || '',
      memberName: feedback.memberName || '',
      category: feedback.category || 'General',
      priority: feedback.priority || 'medium',
      feedback: String(feedback.feedback || '').trim(),
      status: feedback.status || 'Open',
      date: feedback.date || today,
      notes: feedback.notes || '',
    };

    if (!clean.feedback) {
      setToast('Please enter the customer feedback first.');
      return;
    }

    try {
      const member = data.members.find((item) => item.id === clean.memberId);
      const row = await insertRecord('feedbacks', {
        member_id: member?.cloudId || null,
        member_name: clean.memberName || member?.name || '',
        category: clean.category,
        priority: clean.priority,
        feedback: clean.feedback,
        status: clean.status,
        feedback_date: clean.date,
        notes: clean.notes,
      });
      const saved = {
        id: row.id,
        cloudId: row.id,
        memberId: member?.id || clean.memberId,
        memberName: clean.memberName || member?.name || '',
        category: clean.category,
        priority: clean.priority,
        feedback: clean.feedback,
        status: clean.status,
        date: clean.date,
        notes: clean.notes,
      };
      setData((d) => ({ ...d, feedbacks: [saved, ...(d.feedbacks || [])] }));
      setModal(null);
      setToast('Customer feedback recorded successfully');
    } catch (error) {
      console.error('Supabase feedback insert failed:', error);
      setToast(error?.message || 'Unable to save feedback');
    }
  };

  const deleteFeedback = async (feedback) => {
    if (!window.confirm('Delete this feedback record?')) return;
    try {
      if (feedback.cloudId) await deleteRecord('feedbacks', feedback.cloudId);
      setData((d) => ({ ...d, feedbacks: (d.feedbacks || []).filter((item) => item.id !== feedback.id) }));
      setToast('Feedback deleted');
    } catch (error) {
      console.error('Supabase feedback delete failed:', error);
      setToast(error?.message || 'Unable to delete feedback');
    }
  };

  const updateWebsiteEnquiryStatus = async (enquiry, status) => {
    try {
      if (enquiry.cloudId) await updateRecord('feedbacks', enquiry.cloudId, { status });
      setData((current) => ({
        ...current,
        websiteEnquiries: (current.websiteEnquiries || []).map((item) =>
          (item.cloudId || item.id) === (enquiry.cloudId || enquiry.id) ? { ...item, status } : item
        ),
      }));
      setToast(`Enquiry marked ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Website enquiry status update failed:', error);
      setToast(error?.message || 'Unable to update enquiry status');
    }
  };

  const markAttendance = (memberOrId, attendanceDate = today) => {
    // Prefer a unique member ID. Names are not unique (e.g. two members named Aditya Rawat).
    const requestedId = typeof memberOrId === 'object' && memberOrId
      ? memberOrId.id
      : memberOrId;
    const member = data.members.find((m) => String(m.id) === String(requestedId)) || (() => {
      if (typeof memberOrId !== 'string') return null;
      const matches = data.members.filter((m) => m.name === memberOrId);
      return matches.length === 1 ? matches[0] : null;
    })();

    if (!member) {
      return setToast('Could not identify this member uniquely. Please select the member by ID.');
    }

    const already = data.attendance.some((a) =>
      a.date === attendanceDate && String(a.memberId || '') === String(member.id)
    );

    if (already) {
      return setToast(`${member.name} is already marked present for this date`);
    }

    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setData((d) => ({
      ...d,
      attendance: [
        {
          id: `A-${Date.now()}`,
          member: member.name,
          memberId: member.id,
          date: attendanceDate,
          time,
        },
        ...d.attendance,
      ],
      members: d.members.map((m) =>
        String(m.id) === String(member.id)
          ? { ...m, visits: Number(m.visits || 0) + 1 }
          : m
      ),
    }));

    setToast(`${member.name} marked present`);
  };

  const removeAttendanceRecord = async (record) => {
    if (!isOwner) {
      setToast('Only the Administrator can remove attendance records.');
      return;
    }

    const memberName = record?.member || 'this member';
    const recordDate = record?.date || today;
    if (!window.confirm(`Remove attendance for ${memberName} on ${recordDate}?`)) return;

    try {
      if (record?.cloudId) {
        await deleteRecord('attendance', record.cloudId);
      }

      setData((current) => ({
        ...current,
        attendance: (current.attendance || []).filter((item) =>
          (item.cloudId || item.id) !== (record.cloudId || record.id)
        ),
        members: (current.members || []).map((member) => {
          const sameMember = record.memberId
            ? member.id === record.memberId
            : member.name === memberName;
          return sameMember
            ? { ...member, visits: Math.max(0, Number(member.visits || 0) - 1) }
            : member;
        }),
      }));
      setToast(`Attendance removed for ${memberName}`);
    } catch (error) {
      console.error('Attendance removal failed:', error);
      setToast(error?.message || 'Unable to remove attendance. Please try again.');
    }
  };

  // Persist workout plans in the existing gym settings JSON so they survive
  // reloads and sync across devices without requiring a new Supabase table.
  const persistWorkoutPlans = async (nextPlans, successMessage) => {
    setData((current) => ({ ...current, workoutPlans: nextPlans }));
    try {
      await saveCloudSettings({ workoutPlans: nextPlans });
      setData((current) => ({
        ...current,
        settings: { ...(current.settings || {}), workoutPlans: nextPlans },
      }));
      setToast(successMessage);
    } catch (error) {
      console.error('Workout plan cloud save failed:', error);
      setToast(`Workout plan saved locally, but cloud save failed: ${error?.message || 'Please check connection/permissions'}`);
    }
  };

  const createWorkoutPlan = async (plan) => {
    const clean = {
      ...plan,
      id: `WP-${Date.now()}`,
      durationWeeks: Number(plan.durationWeeks || 1),
      assignedMemberIds: Array.isArray(plan.assignedMemberIds) ? plan.assignedMemberIds : [],
      exercises: (plan.exercises || []).map((exercise, index) => ({
        ...exercise,
        id: exercise.id || `EX-${Date.now()}-${index}`,
        sets: Number(exercise.sets || 1),
      })),
      createdAt: new Date().toISOString(),
    };

    const nextPlans = [clean, ...(data.workoutPlans || [])];
    setModal(null);
    await persistWorkoutPlans(nextPlans, 'Workout plan created and synced');
  };

  const updateWorkoutPlan = async (plan) => {
    const clean = {
      ...plan,
      durationWeeks: Number(plan.durationWeeks || 1),
      assignedMemberIds: Array.isArray(plan.assignedMemberIds) ? plan.assignedMemberIds : [],
      exercises: (plan.exercises || []).map((exercise, index) => ({
        ...exercise,
        id: exercise.id || `EX-${Date.now()}-${index}`,
        sets: Number(exercise.sets || 1),
      })),
    };

    const nextPlans = (data.workoutPlans || []).map((item) => item.id === clean.id ? clean : item);
    setModal(null);
    await persistWorkoutPlans(nextPlans, 'Workout plan updated and synced');
  };

  const deleteWorkoutPlan = async (id) => {
    if (!window.confirm('Delete this workout plan?')) return;
    const nextPlans = (data.workoutPlans || []).filter((plan) => plan.id !== id);
    await persistWorkoutPlans(nextPlans, 'Workout plan deleted');
  };

  const createDietPlan = (plan) => {
    const clean = {
      ...plan,
      id: `DP-${Date.now()}`,
      calories: Number(plan.calories || 0),
      protein: Number(plan.protein || 0),
      durationWeeks: Number(plan.durationWeeks || 1),
      assignedMemberIds: Array.isArray(plan.assignedMemberIds) ? plan.assignedMemberIds : [],
      meals: (plan.meals || []).map((meal, index) => ({
        ...meal,
        id: meal.id || `MEAL-${Date.now()}-${index}`,
        calories: Number(meal.calories || 0),
        protein: Number(meal.protein || 0),
      })),
      createdAt: new Date().toISOString(),
    };
    setData((d) => ({ ...d, dietPlans: [clean, ...(d.dietPlans || [])] }));
    setModal(null);
    setToast('Diet plan created');
  };

  const updateDietPlan = (plan) => {
    const clean = {
      ...plan,
      calories: Number(plan.calories || 0),
      protein: Number(plan.protein || 0),
      durationWeeks: Number(plan.durationWeeks || 1),
      assignedMemberIds: Array.isArray(plan.assignedMemberIds) ? plan.assignedMemberIds : [],
      meals: (plan.meals || []).map((meal, index) => ({
        ...meal,
        id: meal.id || `MEAL-${Date.now()}-${index}`,
        calories: Number(meal.calories || 0),
        protein: Number(meal.protein || 0),
      })),
    };
    setData((d) => ({ ...d, dietPlans: (d.dietPlans || []).map((item) => item.id === clean.id ? clean : item) }));
    setModal(null);
    setToast('Diet plan updated');
  };

  const deleteDietPlan = (id) => {
    if (!window.confirm('Delete this diet plan?')) return;
    setData((d) => ({ ...d, dietPlans: (d.dietPlans || []).filter((plan) => plan.id !== id) }));
    setToast('Diet plan deleted');
  };


  const addTrainer = async (trainer) => {
    const clean = {
      ...trainer,
      id: `TR-${Date.now()}`,
      experience: Number(trainer.experience || 0),
      monthlySalary: Number(trainer.monthlySalary || 0),
      status: trainer.status || 'Active',
    };

    try {
      const row = await insertRecord('trainers', {
        legacy_id: clean.id,
        name: clean.name || '',
        phone: clean.phone || '',
        specialization: clean.specialization || '',
        experience: Number(clean.experience || 0),
        status: clean.status || 'Active',
        monthly_salary: Number(clean.monthlySalary || 0),
        notes: clean.notes || '',
        tier: clean.tier || 'Silver',
        pt_pricing: clean.ptPricing || {},
      });

      const saved = { ...clean, cloudId: row.id };
      setData((d) => ({
        ...d,
        trainers: [saved, ...(d.trainers || [])],
      }));
      setModal(null);
      setToast('Trainer added successfully');
    } catch (error) {
      console.error('Supabase trainer insert failed:', error);
      setToast(error?.message || 'Unable to add trainer');
    }
  };

  const updateTrainer = async (trainer) => {
    const existing = (data.trainers || []).find((item) => item.id === trainer.id);
    if (!existing?.cloudId) {
      setToast('This trainer is not linked to Supabase yet');
      return;
    }

    const clean = {
      ...trainer,
      experience: Number(trainer.experience || 0),
      monthlySalary: Number(trainer.monthlySalary || 0),
    };

    try {
      await updateRecord('trainers', existing.cloudId, {
        name: clean.name || '',
        phone: clean.phone || '',
        specialization: clean.specialization || '',
        experience: Number(clean.experience || 0),
        status: clean.status || 'Active',
        monthly_salary: Number(clean.monthlySalary || 0),
        notes: clean.notes || '',
        tier: clean.tier || 'Silver',
        pt_pricing: clean.ptPricing || {},
      });

      setData((d) => ({
        ...d,
        trainers: (d.trainers || []).map((item) =>
          item.id === clean.id ? { ...clean, cloudId: existing.cloudId } : item
        ),
      }));
      setModal(null);
      setToast('Trainer updated successfully');
    } catch (error) {
      console.error('Supabase trainer update failed:', error);
      setToast(error?.message || 'Unable to update trainer');
    }
  };

  const deleteTrainer = async (id) => {
    const trainer = (data.trainers || []).find((item) => item.id === id);
    if (!trainer || !window.confirm(`Delete ${trainer.name}?`)) return;

    try {
      if (trainer.cloudId) await deleteRecord('trainers', trainer.cloudId);
      setData((d) => ({
        ...d,
        trainers: (d.trainers || []).filter((item) => item.id !== id),
        ptSessions: (d.ptSessions || []).filter((session) => session.trainerId !== id),
      }));
      setToast('Trainer deleted');
    } catch (error) {
      console.error('Supabase trainer delete failed:', error);
      setToast(error?.message || 'Unable to delete trainer');
    }
  };

  const addPTSession = async (session) => {
    const member = (data.members || []).find((item) => item.id === session.memberId);
    let trainer = (data.trainers || []).find((item) => item.id === session.trainerId);
    if (!member?.cloudId) { setToast('Please select a Supabase-linked member'); return; }
    if (!trainer) { setToast('Please select a trainer'); return; }
    const planName = session.planName || 'Monthly';
    const plan = session.planConfig || {};
    const totalSessions = Math.max(1, Number(plan.sessions || 22));
    const validityDays = Math.max(1, Number(plan.validityDays || 30));
    const startDate = session.date || today;
    const expiry = new Date(`${startDate}T12:00:00`);
    expiry.setDate(expiry.getDate() + validityDays - 1);
    const expiryDate = expiry.toISOString().slice(0, 10);
    const clean = { ...session, id: `PT-${Date.now()}`, planName, sessionsTotal: totalSessions, sessionsCompleted: 0, validityDays, expiryDate, fee: Number(session.fee || 0), status: 'Scheduled', date: startDate, type: 'Personal Training' };
    try {
      if (!trainer.cloudId) {
        const trainerRow = await insertRecord('trainers', { legacy_id: trainer.id || `TR-${Date.now()}`, name: trainer.name || '', phone: trainer.phone || '', specialization: trainer.specialization || '', experience: Number(trainer.experience || 0), status: trainer.status || 'Active', monthly_salary: Number(trainer.monthlySalary || 0), notes: trainer.notes || '', tier: trainer.tier || 'Silver', pt_pricing: trainer.ptPricing || {} });
        trainer = { ...trainer, cloudId: trainerRow.id };
        setData((d) => ({ ...d, trainers: (d.trainers || []).map((item) => item.id === trainer.id ? trainer : item) }));
      }
      const row = await insertRecord('pt_sessions', { legacy_id: clean.id, member_id: member.cloudId, trainer_id: trainer.cloudId, session_date: clean.date, start_time: null, end_time: null, duration_minutes: null, session_type: planName, status: clean.status, amount: clean.fee, notes: clean.notes || '', plan_name: planName, sessions_total: totalSessions, sessions_completed: 0, validity_days: validityDays, expiry_date: expiryDate });
      const saved = { ...clean, cloudId: row.id, trainer: trainer.name, member: member.name };
      setData((d) => ({ ...d, ptSessions: [saved, ...(d.ptSessions || [])] }));
      setModal(null); setToast('PT package assigned successfully');
    } catch (error) { console.error('Supabase PT package insert failed:', error); setToast(error?.message || 'Unable to assign PT package'); }
  };

  const updatePTSessionStatus = async (id, status) => {
    const session = (data.ptSessions || []).find((item) => item.id === id);
    if (!session?.cloudId) { setToast('This PT package is not linked to Supabase yet'); return; }
    const nextCount = status === 'Completed' ? Math.min(Number(session.sessionsTotal || 1), Number(session.sessionsCompleted || 0) + 1) : Number(session.sessionsCompleted || 0);
    const nextStatus = status === 'Completed' && nextCount >= Number(session.sessionsTotal || 1) ? 'Completed' : status === 'Completed' ? 'Scheduled' : status;
    const priorHistory = getPTSessionHistory(session.notes);
    const sessionHistory = status === 'Completed' ? [...priorHistory, { id: `PTH-${Date.now()}`, date: today, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), trainerId: session.trainerId, notes: cleanPTSessionNotes(session.notes), recordedBy: 'Gym staff', recordedAt: new Date().toISOString() }] : priorHistory;
    const nextNotes = withPTSessionHistory(session.notes, sessionHistory);
    try {
      await updateRecord('pt_sessions', session.cloudId, { status: nextStatus, sessions_completed: nextCount, notes: nextNotes });
      setData((d) => ({ ...d, ptSessions: (d.ptSessions || []).map((item) => item.id === id ? { ...item, status: nextStatus, sessionsCompleted: nextCount, notes: nextNotes } : item) }));
      setToast(status === 'Completed' ? `Session recorded · ${nextCount}/${session.sessionsTotal || 1} used` : `Package marked ${status.toLowerCase()}`);
    } catch (error) { console.error('Supabase PT package update failed:', error); setToast(error?.message || 'Unable to update PT package'); }
  };

  const deletePTSession = async (id) => {
    const session = (data.ptSessions || []).find((item) => item.id === id);
    if (!session || !window.confirm('Delete this PT session?')) return;

    try {
      if (session.cloudId) await deleteRecord('pt_sessions', session.cloudId);
      setData((d) => ({
        ...d,
        ptSessions: (d.ptSessions || []).filter((item) => item.id !== id),
      }));
      setToast('PT session deleted');
    } catch (error) {
      console.error('Supabase PT delete failed:', error);
      setToast(error?.message || 'Unable to delete PT session');
    }
  };

  const addCommunicationLog = (log) => {
    const clean = {
      ...log,
      id: `MSG-${Date.now()}`,
      date: log.date || today,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: log.status || 'Sent',
    };

    setData((d) => ({
      ...d,
      communicationLogs: [clean, ...(d.communicationLogs || [])],
    }));
    setModal(null);
    setToast('Communication logged');
  };

  const deleteCommunicationLog = (id) => {
    if (!window.confirm('Delete this communication record?')) return;
    setData((d) => ({
      ...d,
      communicationLogs: (d.communicationLogs || []).filter((item) => item.id !== id),
    }));
    setToast('Communication record deleted');
  };

  const addProgressRecord = (record) => {
    const clean = {
      ...record,
      id: `PR-${Date.now()}`,
      memberId: record.memberId,
      date: record.date || today,
      weight: Number(record.weight || 0),
      bodyFat: Number(record.bodyFat || 0),
      chest: Number(record.chest || 0),
      waist: Number(record.waist || 0),
      hips: Number(record.hips || 0),
      arms: Number(record.arms || 0),
      thighs: Number(record.thighs || 0),
      neck: Number(record.neck || 0),
      photos: record.photos || { front: '', side: '', back: '' },
    };

    setData((d) => ({
      ...d,
      progressRecords: [clean, ...(d.progressRecords || [])],
      members: d.members.map((member) =>
        member.id === clean.memberId
          ? { ...member, currentWeight: clean.weight }
          : member
      ),
    }));
    setModal(null);
    setToast('Progress record added');
  };

  const deleteProgressRecord = (id) => {
    if (!window.confirm('Delete this progress record?')) return;
    setData((d) => ({
      ...d,
      progressRecords: (d.progressRecords || []).filter((record) => record.id !== id),
    }));
    setToast('Progress record deleted');
  };

  const normalizeExcelHeader = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const parseExcelDate = (value) => {
    if (value === null || value === undefined || value === '') return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    const text = String(value).trim();
    if (!text) return '';
    // Excel serial dates may be returned as numbers when raw cell values are used.
    if (typeof value === 'number' && value > 20000 && value < 80000) {
      const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
      return date.toISOString().slice(0, 10);
    }
    const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, '0')}-${String(iso[3]).padStart(2, '0')}`;
    const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (dmy) {
      let year = Number(dmy[3]);
      if (year < 100) year += year < 50 ? 2000 : 1900;
      return `${year}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  };

  const mapExcelMemberRow = (row, sheetName) => {
    const normalized = {};
    Object.entries(row || {}).forEach(([key, value]) => { normalized[normalizeExcelHeader(key)] = value; });
    const pick = (...keys) => {
      for (const key of keys) {
        const value = normalized[normalizeExcelHeader(key)];
        if (value !== undefined && value !== null && String(value).trim() !== '') return value;
      }
      return '';
    };
    const name = String(pick('Member Name', 'Name', 'Customer Name', 'Full Name')).trim();
    const phone = String(pick('Phone', 'Mobile', 'Mobile Number', 'Phone Number', 'Contact')).trim();
    const sheetPlan = /half[ -]?year|6[ -]?month/i.test(sheetName) ? 'Half-yearly' : /quarter|3[ -]?month/i.test(sheetName) ? 'Quarterly' : /annual|yearly|12[ -]?month/i.test(sheetName) ? 'Annual' : /month/i.test(sheetName) ? 'Monthly' : sheetName;
    const plan = String(pick('Membership Plan', 'Plan', 'Membership', 'Package') || sheetPlan || 'Monthly').trim();
    const amount = Number(String(pick('Membership Amount', 'Amount', 'Total Amount', 'Fees', 'Fee') || 0).replace(/[₹,\s]/g, '')) || 0;
    const paid = Number(String(pick('Amount Paid', 'Paid Amount', 'Paid', 'Payment Received') || 0).replace(/[₹,\s]/g, '')) || 0;
    const explicitDue = pick('Due Amount', 'Outstanding Due', 'Due', 'Balance');
    const due = explicitDue === '' ? Math.max(0, amount - paid) : (Number(String(explicitDue).replace(/[₹,\s]/g, '')) || 0);
    return {
      id: String(pick('Member ID', 'Member Code', 'ID', 'Customer ID')).trim(),
      name,
      phone,
      email: String(pick('Email', 'Email Address')).trim(),
      plan,
      start: parseExcelDate(pick('Joining Date', 'Start Date', 'Date Joined', 'Membership Start')),
      expiry: parseExcelDate(pick('Expiry Date', 'End Date', 'Membership Expiry', 'Valid Until')),
      amount,
      paid,
      due,
      address: String(pick('Address')).trim(),
      gender: String(pick('Gender')).trim(),
      dob: parseExcelDate(pick('Date of Birth', 'DOB', 'Birthday')),
      emergencyContact: String(pick('Emergency Contact', 'Emergency Phone')).trim(),
      trainer: String(pick('Trainer', 'Trainer Name')).trim(),
      notes: String(pick('Notes', 'Remarks', 'Comments')).trim(),
      _sourceSheet: sheetName,
      _errors: [
        !name ? 'Member name is required' : '',
        !phone ? 'Phone number is required' : '',
        !plan ? 'Membership plan is required' : '',
      ].filter(Boolean),
    };
  };

  const handleExcelFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const XLSX = await import('xlsx');
      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(bytes, { type: 'array', cellDates: true });
      const rows = [];
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
        sheetRows.forEach((row) => {
          if (Object.values(row).every((value) => String(value ?? '').trim() === '')) return;
          rows.push(mapExcelMemberRow(row, sheetName));
        });
      });
      if (!rows.length) throw new Error('No member rows found. Please check the workbook headers and sheets.');
      const existingPhones = new Set((data.members || []).map((m) => String(m.phone || '').replace(/\D/g, '')).filter(Boolean));
      const existingIds = new Set((data.members || []).map((m) => String(m.id || '').trim().toLowerCase()).filter(Boolean));
      const seenPhones = new Set();
      const seenIds = new Set();
      const previewRows = rows.map((row, index) => {
        const errors = [...row._errors];
        const phoneKey = row.phone.replace(/\D/g, '');
        const idKey = row.id.trim().toLowerCase();
        if (phoneKey && (existingPhones.has(phoneKey) || seenPhones.has(phoneKey))) errors.push('Duplicate phone number');
        if (idKey && (existingIds.has(idKey) || seenIds.has(idKey))) errors.push('Duplicate member ID');
        if (phoneKey) seenPhones.add(phoneKey);
        if (idKey) seenIds.add(idKey);
        return { ...row, _rowNumber: index + 2, _errors: [...new Set(errors)], _skip: errors.length > 0 };
      });
      setExcelImportPreview({ fileName: file.name, rows: previewRows, sheetNames: workbook.SheetNames });
      setModal('excelImportPreview');
    } catch (error) {
      console.error('Excel import failed:', error);
      setToast(error?.message || 'Could not read this Excel file. Please use .xlsx or .xls.');
    }
  };

  const confirmExcelImport = async () => {
    if (!excelImportPreview || excelImportBusy) return;
    const rows = excelImportPreview.rows.filter((row) => !row._skip && !row._errors.length);
    if (!rows.length) { setToast('There are no valid rows to import. Fix the highlighted rows in Excel and upload again.'); return; }
    if (!window.confirm(`Import ${rows.length} member(s) into Preface Fitness? Duplicate/invalid rows will be skipped.`)) return;
    setExcelImportBusy(true);
    let importedMembers = [];
    let importedPayments = [];
    let skipped = excelImportPreview.rows.length - rows.length;
    const reservedIds = new Set((data.members || []).map((m) => String(m.id || '').toLowerCase()));
    // attendance_number has a UNIQUE constraint in Supabase. Never insert an empty
    // string for every imported member; allocate a distinct numeric value per member.
    const reservedAttendanceNumbers = new Set(
      (data.members || [])
        .map((m) => String(m.attendanceNumber ?? m.attendance_number ?? '').trim())
        .filter(Boolean)
    );
    let nextAttendanceNumber = (data.members || []).reduce((max, m) => {
      const n = Number(String(m.attendanceNumber ?? m.attendance_number ?? '').trim());
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;
    const allocateAttendanceNumber = () => {
      while (reservedAttendanceNumbers.has(String(nextAttendanceNumber))) nextAttendanceNumber += 1;
      const number = String(nextAttendanceNumber++);
      reservedAttendanceNumbers.add(number);
      return number;
    };
    try {
      for (const row of rows) {
        let memberId = String(row.id || '').trim();
        if (!memberId || reservedIds.has(memberId.toLowerCase())) {
          memberId = nextSystemMemberId([...(data.members || []), ...importedMembers]);
          while (reservedIds.has(memberId.toLowerCase())) memberId = nextSystemMemberId([...(data.members || []), ...importedMembers, { id: memberId }]);
        }
        reservedIds.add(memberId.toLowerCase());
        const planPrice = Number(planPrices[row.plan] || row.amount || 0);
        const amount = Number(row.amount || planPrice || 0);
        const paid = Math.max(0, Number(row.paid || 0));
        const due = Math.max(0, Number(row.due ?? (amount - paid)));
        const status = getMemberStatus(row.expiry);
        const attendanceNumber = allocateAttendanceNumber();
        const memberRow = await insertRecord('members', {
          member_code: memberId,
          name: row.name,
          phone: row.phone,
          email: row.email || '',
          dob: row.dob || null,
          gender: row.gender || '',
          address: row.address || '',
          emergency_contact: row.emergencyContact || '',
          plan_name: row.plan,
          start_date: row.start || null,
          expiry_date: row.expiry || null,
          status,
          visits: 0,
          due_amount: due,
          membership_amount: amount,
          paid_amount: paid,
          trainer_name: row.trainer || '',
          notes: row.notes || '',
          photo: '',
          diet_preference: '',
          attendance_number: attendanceNumber,
          referral_points: 0,
          referred_by_member_id: null,
        });
        const savedMember = {
          id: memberRow.member_code || memberId,
          cloudId: memberRow.id,
          name: row.name,
          phone: row.phone,
          email: row.email || '',
          dob: row.dob || '',
          birthday: row.dob || '',
          gender: row.gender || '',
          address: row.address || '',
          emergencyContact: row.emergencyContact || '',
          plan: row.plan,
          start: row.start || '',
          expiry: row.expiry || '',
          status,
          visits: 0,
          attendanceNumber: memberRow.attendance_number || attendanceNumber,
          due,
          amount,
          paid,
          trainer: row.trainer || '',
          notes: row.notes || '',
          createdAt: new Date().toISOString(),
        };
        importedMembers.push(savedMember);
        if (paid > 0) {
          const paymentId = `EXCEL-${Date.now()}-${importedPayments.length + 1}`;
          const paymentRow = await insertRecord('payments', {
            member_id: memberRow.id,
            legacy_id: paymentId,
            amount: paid,
            payment_type: 'Membership',
            payment_mode: 'Cash',
            payment_date: row.start || today,
            notes: `Imported from Excel | Plan: ${row.plan} | Joining: ${row.start || ''} | Expiry: ${row.expiry || ''}`,
            invoice_number: '',
            gst_applicable: false,
            gst_rate: 0,
            taxable_amount: paid,
            cgst_amount: 0,
            sgst_amount: 0,
            invoice_amount: amount,
            paid_amount_at_invoice: paid,
            balance_at_invoice: due,
            description: `${row.plan} membership (Excel import)`,
          });
          importedPayments.push({
            id: paymentRow.legacy_id || paymentId,
            cloudId: paymentRow.id,
            memberId: savedMember.id,
            member: savedMember.name,
            amount: paid,
            type: 'Membership',
            mode: 'Cash',
            date: row.start || today,
            notes: `Imported from Excel | Plan: ${row.plan}`,
            invoiceNumber: '',
            gstApplicable: false,
            gstRate: 0,
            taxableAmount: paid,
            cgstAmount: 0,
            sgstAmount: 0,
            invoiceAmount: amount,
            paidAmountAtInvoice: paid,
            balanceAtInvoice: due,
            description: `${row.plan} membership (Excel import)`,
          });
        }
      }
      setData((current) => ({
        ...current,
        members: [...importedMembers, ...(current.members || [])],
        payments: [...importedPayments, ...(current.payments || [])],
      }));
      setExcelImportPreview(null);
      setModal(null);
      setToast(`Excel import complete: ${importedMembers.length} member(s) imported, ${skipped} row(s) skipped.`);
    } catch (error) {
      console.error('Excel import stopped:', error);
      setData((current) => ({
        ...current,
        members: [...importedMembers, ...(current.members || [])],
        payments: [...importedPayments, ...(current.payments || [])],
      }));
      setToast(`Import stopped after ${importedMembers.length} member(s): ${error?.message || 'Supabase error'}. Successfully saved rows were kept.`);
    } finally {
      setExcelImportBusy(false);
    }
  };

  const exportMembersExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const members = data.members || [];
      const columns = ['Member ID', 'Member Name', 'Phone', 'Email', 'Membership Plan', 'Joining Date', 'Expiry Date', 'Membership Amount', 'Amount Paid', 'Due Amount', 'Gender', 'Date of Birth', 'Address', 'Emergency Contact', 'Trainer', 'Notes'];
      const toExcelRow = (member) => ({
        'Member ID': member.id || '',
        'Member Name': member.name || '',
        'Phone': member.phone || '',
        'Email': member.email || '',
        'Membership Plan': member.plan || '',
        'Joining Date': member.start || '',
        'Expiry Date': member.expiry || '',
        'Membership Amount': Number(member.amount || 0),
        'Amount Paid': Number(member.paid || 0),
        'Due Amount': Number(member.due || 0),
        'Gender': member.gender || '',
        'Date of Birth': member.dob || member.birthday || '',
        'Address': member.address || '',
        'Emergency Contact': member.emergencyContact || '',
        'Trainer': member.trainer || '',
        'Notes': member.notes || '',
      });
      const allRows = members.map(toExcelRow);
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(allRows, { header: columns }), 'All Members');
      const plans = [...new Set(members.map((m) => String(m.plan || 'Other').trim() || 'Other'))];
      plans.forEach((plan) => {
        const rows = members.filter((m) => (String(m.plan || 'Other').trim() || 'Other') === plan).map(toExcelRow);
        const safeSheetName = plan.replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31) || 'Members';
        if (workbook.SheetNames.includes(safeSheetName)) return;
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows, { header: columns }), safeSheetName);
      });
      XLSX.writeFile(workbook, `preface-fitness-members-${today}.xlsx`);
      setToast('Excel export downloaded successfully');
    } catch (error) {
      console.error('Excel export failed:', error);
      setToast('Excel export failed. Please install the xlsx package and try again.');
    }
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preface-fitness-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Backup downloaded');
  };

  const importBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported.members || !imported.leads || !imported.payments) throw new Error('Invalid backup');
        const normalizedImported = {
          ...imported,
          settings: {
            ...data.settings,
            ...(imported.settings || {}),
            auth: {
              ...(data.settings?.auth || {}),
              ...((imported.settings || {}).auth || {}),
            },
          },
        };
        setData(normalizedImported);
        setToast('Backup restored successfully');
      } catch {
        setToast('Invalid Preface Fitness backup');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const deleteMember = async (id) => {
    const member = data.members.find((m) => m.id === id);
    if (!member || !window.confirm(`Delete ${member.name}? This cannot be undone.`)) return;

    if (!member.cloudId) {
      setToast('This member is not linked to Supabase yet');
      return;
    }

    try {
      await deleteRecord('members', member.cloudId);
      setData((d) => ({ ...d, members: d.members.filter((m) => m.id !== id) }));
      setToast('Member deleted');
    } catch (error) {
      console.error('Supabase member delete failed:', error);
      setToast(error?.message || 'Could not delete member from Supabase');
    }
  };

  const updateLeadStage = (id, stage) => {
    setData((d) => ({ ...d, leads: d.leads.map((l) => l.id === id ? { ...l, stage } : l) }));
  };


  const updateLeadDetails = (lead) => {
    const clean = {
      ...lead,
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || 'Walk-in',
      stage: lead.stage || 'New',
      followUp: lead.followUp || today,
      notes: lead.notes || '',
      interestedPlan: lead.interestedPlan || '',
      lastContact: lead.lastContact || today,
    };

    setData((d) => ({
      ...d,
      leads: d.leads.map((item) => item.id === clean.id ? clean : item),
    }));
    setModal(null);
    setToast('Lead updated');
  };

  const deleteLead = (id) => {
    const lead = data.leads.find((item) => item.id === id);
    if (!lead || !window.confirm(`Delete ${lead.name}? This cannot be undone.`)) return;

    setData((d) => ({
      ...d,
      leads: d.leads.filter((item) => item.id !== id),
    }));
    setToast('Lead deleted');
  };

  const convertLeadToMember = (lead) => {
    if (!lead) return;

    const alreadyMember = data.members.some(
      (member) =>
        (lead.phone && member.phone === lead.phone) ||
        (lead.email && member.email === lead.email)
    );

    if (alreadyMember) {
      return setToast('This lead already exists as a member');
    }

    const newMember = {
      id: nextSystemMemberId(data.members),
      name: lead.name,
      phone: lead.phone || '',
      email: lead.email || '',
      plan: lead.interestedPlan || 'Monthly',
      start: today,
      expiry: addMonthsToDate(today, lead.interestedPlan === 'Quarterly' ? 3 : lead.interestedPlan === 'Half-yearly' ? 6 : lead.interestedPlan === 'Annual' ? 12 : 1),
      status: 'Active',
      visits: 0,
      due: 0,
      dietPreference: '',
      birthday: '',
      referral: lead.source || 'Walk-in',
      referredBy: '',
      referredClients: 0,
    };

    setData((d) => ({
      ...d,
      members: [newMember, ...d.members],
      leads: d.leads.map((item) =>
        item.id === lead.id
          ? { ...item, stage: 'Converted', convertedMemberId: newMember.id, convertedAt: today }
          : item
      ),
    }));

    setToast(`${lead.name} converted to member`);
  };

  const deletePayment = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;

    const payment = data.payments.find((item) => item.id === id);
    if (!payment) return;

    if (!payment.cloudId) {
      setToast('This payment is not linked to Supabase');
      return;
    }

    const member = data.members.find(
      (item) => item.id === payment.memberId || item.name === payment.member
    );

    try {
      await deleteRecord('payments', payment.cloudId);

      if (member?.cloudId && payment.type === 'Membership') {
        const paymentAmount = Number(payment.amount || 0);
        const nextPaid = Math.max(0, Number(member.paid || 0) - paymentAmount);
        const nextDue = Number(member.due || 0) + paymentAmount;

        await updateRecord('members', member.cloudId, {
          paid_amount: nextPaid,
          due_amount: nextDue,
        });

        setData((d) => ({
          ...d,
          payments: d.payments.filter((item) => item.id !== id),
          members: d.members.map((item) =>
            item.id === member.id
              ? { ...item, paid: nextPaid, due: nextDue }
              : item
          ),
        }));
      } else {
        setData((d) => ({
          ...d,
          payments: d.payments.filter((item) => item.id !== id),
        }));
      }

      setToast('Payment deleted from Supabase');
    } catch (error) {
      console.error('Supabase payment delete failed:', error);
      setToast(error?.message || 'Unable to delete payment from Supabase');
    }
  };


  // Public enquiries use the existing public_submit_feedback RPC and feedbacks table,
  // so no database migration or new table is required. Realtime is used when enabled;
  // polling is the fallback and also works when the feedbacks table is not in Realtime.
  useEffect(() => {
    if (!isAuthenticated || !access.gymId || cloudStatus !== 'connected') return undefined;
    let stopped = false;
    let refreshInProgress = false;

    const refreshWebsiteEnquiries = async (notify = false) => {
      if (refreshInProgress || stopped) return;
      refreshInProgress = true;
      try {
        const cloud = await loadCloudState();
        if (stopped || !cloud) return;
        const websiteEnquiries = Array.isArray(cloud.websiteEnquiries) ? cloud.websiteEnquiries : [];
        const regularFeedbacks = Array.isArray(cloud.feedbacks) ? cloud.feedbacks : [];
        const currentIds = new Set(websiteEnquiries.map((item) => String(item.cloudId || item.id)));

        if (seenWebsiteEnquiriesRef.current === null) {
          seenWebsiteEnquiriesRef.current = currentIds;
        } else {
          const previousIds = seenWebsiteEnquiriesRef.current;
          const hasNew = [...currentIds].some((id) => !previousIds.has(id));
          if (notify && hasNew) setToast('New customer enquiry received');
          seenWebsiteEnquiriesRef.current = currentIds;
        }

        setData((current) => ({
          ...current,
          // The feedback list deliberately excludes Website Enquiry records.
          feedbacks: regularFeedbacks,
          websiteEnquiries,
        }));
      } catch (error) {
        console.error('Unable to refresh website enquiries:', error);
      } finally {
        refreshInProgress = false;
      }
    };

    // Establish a baseline first so old enquiries do not trigger a notification.
    refreshWebsiteEnquiries(false);
    const pollId = window.setInterval(() => refreshWebsiteEnquiries(true), 30000);
    const channel = supabase
      .channel(`preface-website-enquiries-${access.gymId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'feedbacks',
        filter: `gym_id=eq.${access.gymId}`,
      }, () => refreshWebsiteEnquiries(true))
      .subscribe();

    return () => {
      stopped = true;
      window.clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, access.gymId, cloudStatus]);

  const nav = [
    { label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    { label: 'Performance', icon: BarChart3, permission: 'performance' },
    { label: 'Members', icon: Users, permission: 'members' },
    { label: 'Leads', icon: Target, permission: 'leads' },
    { label: 'Website Enquiries', icon: Mail, permission: 'enquiries' },
    { label: 'Memberships', icon: ShieldCheck, permission: 'memberships' },
    { label: 'Attendance', icon: CheckCircle2, permission: 'attendance' },
    { label: 'Payments', icon: CreditCard, permission: 'payments' },
    { label: 'Training', icon: Dumbbell, permission: 'training' },
    { label: 'Trainers & PT', icon: Users, permission: 'trainers' },
    { label: 'Progress', icon: TrendingUp, permission: 'progress' },
    { label: 'Diet & Nutrition', icon: Target, permission: 'diet' },
    { label: 'Communication', icon: MessageCircle, permission: 'communication' },
    { label: 'Customer Feedback', icon: MessageCircle, permission: 'feedback' },
    { label: 'Reports', icon: ClipboardList, permission: 'reports' },
    { label: 'Settings', icon: Settings, permission: 'settings' },
    ...(isOwner ? [{ label: 'Staff Access', icon: Users, permission: 'staff-access' }] : []),
  ];

  const visibleNav = nav.filter((item) =>
    item.permission === 'staff-access' ? isOwner : can(item.permission)
  );

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.members;
    return data.members.filter((m) => [m.name, m.phone, m.email, m.id, m.plan].join(' ').toLowerCase().includes(q));
  }, [data.members, query]);

  const navigate = (label) => {
    const requiredPermission = PERMISSION_FOR_PAGE[label];

    if (!isOwner && requiredPermission && !can(requiredPermission)) {
      setToast('You do not have access to this section.');
      return;
    }

    if (label === 'Staff Access' && !isOwner) {
      setToast('You do not have access to this section.');
      return;
    }

    setActive(label);
    setQuery('');
  };

  useEffect(() => {
    if (!isAuthenticated || isOwner) return;

    const requiredPermission = PERMISSION_FOR_PAGE[active];

    if (requiredPermission && !can(requiredPermission)) {
      const fallback = can('dashboard') ? 'Dashboard' : visibleNav[0]?.label;
      if (fallback && fallback !== active) setActive(fallback);
    }
  }, [active, isAuthenticated, isOwner, access]);


  const logout = async () => {
    try {
      await signOutOwner();
    } catch (error) {
      console.error('Supabase logout failed:', error);
      setToast(error?.message || 'Unable to sign out');
    }

    setIsAuthenticated(false);
    setActive('Dashboard');
    setSidebarOpen(false);
    setModal(null);
  };

  if (!dbReady) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <img src={LOGO_URL} alt="Preface Fitness" className="auth-logo" />
          <div className="auth-loading">Loading Preface Fitness…</div>
        </div>
      </div>
    );
  }

  const publicHash = window.location.hash;
  const isPublicCheckInRoute = publicHash === '#check-in';
  const isPublicGymRoute = publicHash === '#gym';

  if (isPublicCheckInRoute) {
    return <PublicAttendancePage data={data} setData={setData} />;
  }

  if (isPublicGymRoute) {
    let storedGymId = '';
    try { storedGymId = window.localStorage.getItem(PUBLIC_GYM_ID_STORAGE_KEY) || ''; } catch {}
    const publicGymId = new URLSearchParams(window.location.search).get('gym') || data.gym?.id || storedGymId || PRODUCTION_GYM_ID;
    return <PublicGymIntroPage settings={data.settings || {}} gymId={publicGymId} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={() => setIsAuthenticated(true)}
      />
    );
  }

  const activePermission = PERMISSION_FOR_PAGE[active];
  const activeAllowed = isOwner || active === 'Staff Access' || !activePermission || can(activePermission);

  return (
    <div
      className={`app-shell vibrant-app-shell ${sidebarOpen ? 'sidebar-is-open' : 'sidebar-is-collapsed'} ${isReadOnlyStaff ? 'staff-read-only' : ''}`}
      onClickCapture={blockStaffMutation}
      onSubmitCapture={blockStaffFormSubmit}
    >
      <style>{VIBRANT_THEME_CSS}</style>
      <style>{NOTICE_SETTINGS_CSS}</style>
      <style>{FINAL_UI_FIX_CSS}</style>
      <style>{FINAL_LAYOUT_CSS}</style>
      <style>{SIDEBAR_ONLY_NAV_CSS}</style>
      <style>{DEVELOPER_CONTACT_BAR_CSS}</style>
      {isReadOnlyStaff && (
        <div role="status" style={{ position: 'fixed', zIndex: 1200, right: '18px', bottom: '16px', padding: '9px 13px', borderRadius: '12px', background: '#20264a', color: '#fff', boxShadow: '0 8px 24px rgba(20,25,60,.22)', fontSize: '12px', fontWeight: 700, pointerEvents: 'none' }}>
          <ShieldCheck size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Staff Access
        </div>
      )}
      <aside className={`sidebar sidebar-compact ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="brand-block compact-brand">
          <div className="brand-logo"><img src={LOGO_URL} alt="Preface Fitness logo" /></div>
          <div className="compact-brand-copy">
            <div className="brand-name">Preface</div>
            <div className="brand-sub">FITNESS</div>
          </div>
        </div>
        <div className="compact-sidebar-label">QUICK ACCESS</div>
        <nav className="compact-sidebar-nav">
          {visibleNav.filter((item) => ['Dashboard', 'Members', 'Attendance', 'Payments', 'Settings', 'Staff Access'].includes(item.label)).slice(0, isOwner ? 6 : 5).map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => navigate(label)} title={label}>
              <Icon size={21} strokeWidth={2.1} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom compact-sidebar-bottom">
          {visibleNav.filter((item) => item.label === 'Reports').map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => navigate(label)} title={label}>
              <Icon size={20} strokeWidth={2.1} /><span>{label}</span>
            </button>
          ))}
          <button className="nav-item" onClick={() => openPublicGymPage(data.gym?.id || PRODUCTION_GYM_ID)}><Sparkles size={20} /><span>Public page</span></button>
          <div className="storage-card compact-storage-card">
            <div className="storage-icon"><ShieldCheck size={17} /></div>
            <div><strong>{cloudStatus === 'connected' ? 'Cloud connected' : cloudStatus === 'checking' ? 'Connecting…' : 'Cloud offline'}</strong></div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <main className="main">
        <header className="topbar vibrant-topbar">
          <div className="topbar-primary-row">
            <div className="topbar-left">
              <div className="vibrant-collapsed-brand" aria-label="Preface Fitness">
                <img src={LOGO_URL} alt="Preface Fitness logo" />
                <span>Preface Fitness</span>
              </div>
              <button className="icon-btn menu-btn" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"} title={sidebarOpen ? "Close sidebar" : "Open sidebar"}><Menu size={23} /></button>
            </div>
            <div className="topbar-actions">
              <button className="icon-btn vibrant-icon-btn" title="Logout" onClick={logout}><LogOut size={19} /></button>
              <button className="icon-btn vibrant-icon-btn" title="Website enquiries" onClick={() => navigate('Website Enquiries')}><Bell size={20} />{(data.websiteEnquiries || []).some((item) => !['Resolved', 'Closed'].includes(item.status)) && <span className="notification-dot" />}</button>
              <div className="admin-chip vibrant-admin-chip"><div className="avatar">{isOwner ? 'O' : 'S'}</div><div><strong>{isOwner ? 'Administrator' : 'Staff Member'}</strong><span>{isOwner ? 'Owner' : 'Staff'}</span></div><ChevronDown size={15} /></div>
            </div>
          </div>
          <div className="top-navigation-scroll" aria-label="Main navigation">
            {visibleNav
              .filter(({ label }) => !['Dashboard', 'Members', 'Attendance', 'Payments', 'Reports', 'Settings', 'Staff Access'].includes(label))
              .map(({ label, icon: Icon }) => (
                <button key={label} className={`top-navigation-item ${active === label ? 'active' : ''}`} onClick={() => navigate(label)}>
                  <Icon size={18} strokeWidth={2.2} /><span>{label}</span>
                </button>
              ))}
          </div>
        </header>

        {(data.settings?.notice?.dashboardEnabled ?? data.settings?.notice?.enabled) && data.settings?.notice?.text && (
          <div className={`global-notice global-notice-${data.settings.notice.priority || 'medium'}`}>
            <div className="global-notice-icon"><Bell size={18} /></div>
            <div className="global-notice-copy"><strong>{data.settings.notice.priority === 'high' ? 'Important notice' : 'Gym announcement'}</strong><span>{data.settings.notice.text}</span></div>
            <button className="global-notice-close" onClick={() => setData((d) => ({ ...d, settings: { ...(d.settings || {}), notice: { ...(d.settings?.notice || {}), dashboardEnabled: false } } }))} title="Hide on dashboard"><X size={16} /></button>
          </div>
        )}

        <div className="content">
          {!activeAllowed ? (
            <section className="card">
              <div className="card-header">
                <div>
                  <h3>Access restricted</h3>
                  <p>Your staff account does not have permission to open this section.</p>
                </div>
              </div>
            </section>
          ) : (
            <>
          {active === 'Performance' && <PerformancePage data={data} />}
          {active === 'Dashboard' && <Dashboard {...{ activeMembers, expiringMembers, overdue, revenue, data, navigate, setModal, markAttendance, isReadOnlyStaff }} />}
          {active === 'Members' && <MembersPage members={data.members} query={query} setQuery={setQuery} setModal={setModal} markAttendance={markAttendance} deleteMember={deleteMember} settings={data.settings || {}} payments={data.payments || []} ptSessions={data.ptSessions || []} trainers={data.trainers || []} workoutPlans={data.workoutPlans || []} />}
          {active === 'Leads' && <LeadsPage leads={data.leads} members={data.members} setModal={setModal} updateLeadStage={updateLeadStage} updateLeadDetails={updateLeadDetails} deleteLead={deleteLead} convertLeadToMember={convertLeadToMember} />}
          {active === 'Website Enquiries' && <WebsiteEnquiriesPage enquiries={data.websiteEnquiries || []} onUpdateStatus={updateWebsiteEnquiryStatus} />}
          {active === 'Memberships' && <MembershipsPage members={data.members} data={data} setModal={setModal} planPrices={planPrices} setData={setData} setToast={setToast} onRenewMembership={renewMembership} />}
          {active === 'Attendance' && <AttendancePage attendance={data.attendance} members={data.members} markAttendance={markAttendance} isOwner={isOwner} removeAttendanceRecord={removeAttendanceRecord} />}
          {active === 'Payments' && <PaymentsPage payments={data.payments} overdue={overdue} setModal={setModal} deletePayment={deletePayment} members={data.members} settings={data.settings || {}} />}
          {active === 'Progress' && <ProgressPage progressRecords={data.progressRecords || []} members={data.members} setModal={setModal} deleteProgressRecord={deleteProgressRecord} />}
          {active === 'Trainers & PT' && <TrainersPTPage trainers={data.trainers || []} sessions={data.ptSessions || []} members={data.members} setModal={setModal} updatePTSessionStatus={updatePTSessionStatus} deletePTSession={deletePTSession} deleteTrainer={deleteTrainer} />}
          {active === 'Training' && <TrainingPage plans={data.workoutPlans || []} members={data.members} setModal={setModal} deleteWorkoutPlan={deleteWorkoutPlan} updateWorkoutPlan={updateWorkoutPlan} />}
          {active === 'Diet & Nutrition' && <DietPage plans={data.dietPlans || []} members={data.members} setModal={setModal} deleteDietPlan={deleteDietPlan} />}
          {active === 'Communication' && <CommunicationPage members={data.members} logs={data.communicationLogs || []} setModal={setModal} deleteCommunicationLog={deleteCommunicationLog} />}
          {active === 'Customer Feedback' && <FeedbackPage feedbacks={data.feedbacks || []} members={data.members || []} setModal={setModal} deleteFeedback={deleteFeedback} />}
          {active === 'Reports' && <ReportsPage data={data} revenue={revenue} />}
          {active === 'Staff Access' && isOwner && <StaffAccessPage />}
          {active === 'Settings' && <SettingsPage exportBackup={exportBackup} importBackup={importBackup} onExportExcel={exportMembersExcel} onImportExcel={handleExcelFile} data={data} setData={setData} dbReady={dbReady} resetData={() => {
            if (window.confirm('Reset the local Preface Fitness database to demo data?')) {
              const auth = data.settings?.auth;
              clearState().then(() => {
                setData({
                  ...seed,
                  settings: { ...seed.settings, ...(auth ? { auth } : {}) },
                });
                setToast('Local database reset');
              });
            }
          }} />}
            </>
          )}
        </div>
        <DeveloperContactBar app />
      </main>

      {modal === 'member' && <MemberModal onClose={() => setModal(null)} onSave={addMember} planPrices={planPrices} members={data.members} trainers={data.trainers || []} existingMemberIds={data.members.map((m) => m.id)} isOwner={isOwner} />}
      {modal?.type === 'editMember' && <MemberModal member={modal.member} onClose={() => setModal(null)} onSave={updateMember} planPrices={planPrices} members={data.members} trainers={data.trainers || []} existingMemberIds={data.members.map((m) => m.id)} isOwner={isOwner} />}
      {modal === 'lead' && <LeadModal onClose={() => setModal(null)} onSave={addLead} />}
      {modal?.type === 'editLead' && <LeadModal lead={modal.lead} onClose={() => setModal(null)} onSave={updateLeadDetails} />}
      {modal === 'trainer' && <TrainerModal onClose={() => setModal(null)} onSave={addTrainer} />}
      {modal?.type === 'editTrainer' && <TrainerModal trainer={modal.trainer} onClose={() => setModal(null)} onSave={updateTrainer} />}
      {modal === 'ptSession' && <PTSessionModal trainers={data.trainers || []} members={data.members} onClose={() => setModal(null)} onSave={addPTSession} />}
      {modal === 'communication' && <CommunicationModal members={data.members} onClose={() => setModal(null)} onSave={addCommunicationLog} />}
      {modal === 'progress' && <ProgressModal members={data.members} onClose={() => setModal(null)} onSave={addProgressRecord} />}
      {modal === 'payment' && <PaymentModal members={data.members} settings={data.settings || {}} onClose={() => setModal(null)} onSave={addPayment} />}
      {(modal === 'workoutPlan' || modal?.type === 'editWorkoutPlan') && <WorkoutPlanModal members={data.members} muscleGroups={data.settings?.workoutMuscleGroups || []} onRemoveMuscleGroup={(group) => {
        const cleanGroup = String(group || '').trim();
        if (!cleanGroup) return;
        setData((d) => ({ ...d, settings: { ...(d.settings || {}), workoutMuscleGroups: (Array.isArray(d.settings?.workoutMuscleGroups) ? d.settings.workoutMuscleGroups : []).filter((item) => String(item).toLowerCase() !== cleanGroup.toLowerCase()) } }));
      }} onAddMuscleGroup={(group) => {
        const cleanGroup = String(group || '').trim();
        if (!cleanGroup) return;
        setData((d) => {
          const existing = Array.isArray(d.settings?.workoutMuscleGroups) ? d.settings.workoutMuscleGroups : [];
          if (existing.some((item) => String(item).toLowerCase() === cleanGroup.toLowerCase())) return d;
          return { ...d, settings: { ...(d.settings || {}), workoutMuscleGroups: [...existing, cleanGroup] } };
        });
      }} plan={modal?.type === 'editWorkoutPlan' ? modal.plan : null} onClose={() => setModal(null)} onSave={modal?.type === 'editWorkoutPlan' ? updateWorkoutPlan : createWorkoutPlan} />}
      {(modal === 'dietPlan' || modal?.type === 'editDietPlan') && <DietPlanModal members={data.members} plan={modal?.type === 'editDietPlan' ? modal.plan : null} onClose={() => setModal(null)} onSave={modal?.type === 'editDietPlan' ? updateDietPlan : createDietPlan} />}
      {modal === 'feedback' && <FeedbackModal members={data.members || []} onClose={() => setModal(null)} onSave={addFeedback} />}
      {modal?.type === 'invoiceOptions' && <InvoiceOptionsModal member={modal.member} payment={modal.payment} payments={data.payments || []} mode={modal.source === 'member' ? 'member' : 'single'} settings={data.settings || {}} onClose={() => setModal(null)} onPrint={(mode, rate, selected) => {
        try {
          const selectedPayment = { ...(selected || modal.payment || {}), gstApplicable: mode === 'gst', gstRate: Number(rate || 0) };
          const result = printPaymentInvoice(modal.member, selectedPayment, data.settings || {}, mode);
          if (result === false) throw new Error('The browser could not open the invoice print view.');
          setModal(null);
        } catch (error) {
          console.error('Invoice generation failed:', error);
          window.alert(`Invoice could not be generated: ${error?.message || 'Unknown error'}. Please check the browser Console.`);
        }
      }} />}
      {modal === 'excelImportPreview' && excelImportPreview && (
        <div className="modal-backdrop" onClick={() => !excelImportBusy && (setModal(null), setExcelImportPreview(null))}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()} style={{width:'min(1100px,96vw)',maxHeight:'88vh',overflow:'auto'}}>
            <div className="modal-header"><div><h2>Preview Excel import</h2><p>{excelImportPreview.fileName} · Sheets: {excelImportPreview.sheetNames.join(', ')}</p></div><button className="icon-button" disabled={excelImportBusy} onClick={() => { setModal(null); setExcelImportPreview(null); }}><X size={20}/></button></div>
            <div className="report-list" style={{marginBottom:14}}>
              <div><span>Total rows</span><strong>{excelImportPreview.rows.length}</strong></div>
              <div><span>Ready to import</span><strong>{excelImportPreview.rows.filter((row) => !row._skip && !row._errors.length).length}</strong></div>
              <div><span>Skipped / needs correction</span><strong>{excelImportPreview.rows.filter((row) => row._skip || row._errors.length).length}</strong></div>
            </div>
            <div style={{overflowX:'auto',border:'1px solid #e1e7ef',borderRadius:12}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:850}}>
                <thead><tr>{['Excel row','Member','Phone','Plan','Joining','Expiry','Amount','Paid','Due','Import status'].map((heading) => <th key={heading} style={{padding:'10px',textAlign:'left',background:'#f5f7fb',whiteSpace:'nowrap'}}>{heading}</th>)}</tr></thead>
                <tbody>{excelImportPreview.rows.map((row) => <tr key={`${row._sourceSheet}-${row._rowNumber}`} style={{borderTop:'1px solid #e7ebf1',background:row._errors.length?'#fff5f5':'#fff'}}>
                  <td style={{padding:10}}>{row._sourceSheet}!{row._rowNumber}</td><td style={{padding:10}}>{row.name || '—'}</td><td style={{padding:10}}>{row.phone || '—'}</td><td style={{padding:10}}>{row.plan}</td><td style={{padding:10}}>{row.start || '—'}</td><td style={{padding:10}}>{row.expiry || '—'}</td><td style={{padding:10}}>{row.amount}</td><td style={{padding:10}}>{row.paid}</td><td style={{padding:10}}>{row.due}</td><td style={{padding:10,color:row._errors.length?'#b42318':'#168451'}}>{row._errors.length ? row._errors.join(', ') : 'Ready'}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,flexWrap:'wrap',marginTop:18}}>
              <button className="btn btn-secondary" disabled={excelImportBusy} onClick={() => { setModal(null); setExcelImportPreview(null); }}>Cancel</button>
              <button className="btn btn-primary" disabled={excelImportBusy || !excelImportPreview.rows.some((row) => !row._skip && !row._errors.length)} onClick={confirmExcelImport}>{excelImportBusy ? 'Importing…' : `Import ${excelImportPreview.rows.filter((row) => !row._skip && !row._errors.length).length} members`}</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}




/* ===== DEVELOPER CONTACT BAR — FINAL AESTHETIC + SIDEBAR AWARE ===== */
const DEVELOPER_CONTACT_BAR_CSS = `
  .vibrant-app-shell.sidebar-is-open .pf-developer-bar.app{
    width:calc(100% - 18px) !important;
    margin-left:0 !important;
    margin-right:18px !important;
  }
  .vibrant-app-shell.sidebar-is-collapsed .pf-developer-bar.app{
    width:calc(100% - 36px) !important;
    margin-left:18px !important;
    margin-right:18px !important;
  }
  .vibrant-app-shell .pf-developer-bar.app {
    position:relative !important;
    isolation:isolate !important;
    width:calc(100% - 36px) !important;
    max-width:none !important;
    min-height:76px !important;
    margin:22px 18px 20px !important;
    padding:14px 16px !important;
    box-sizing:border-box !important;
    display:flex !important;
    align-items:center !important;
    justify-content:space-between !important;
    gap:18px !important;
    overflow:hidden !important;
    border:1px solid rgba(112,82,230,.20) !important;
    border-radius:20px !important;
    background:radial-gradient(circle at 8% 0%,rgba(112,82,230,.16),transparent 32%),radial-gradient(circle at 92% 100%,rgba(18,191,166,.12),transparent 34%),linear-gradient(135deg,rgba(255,255,255,.92),rgba(247,244,255,.88) 48%,rgba(239,250,249,.90)) !important;
    box-shadow:0 16px 42px rgba(53,43,122,.10),inset 0 1px 0 rgba(255,255,255,.95) !important;
  }
  .pf-developer-bar{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:74px;padding:13px 16px;box-sizing:border-box;border:1px solid rgba(109,74,255,.18);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(247,244,255,.92) 52%,rgba(239,250,249,.92));box-shadow:0 14px 34px rgba(42,36,94,.09),inset 0 1px 0 rgba(255,255,255,.95);overflow:hidden}
  .pf-developer-bar::before{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 5% 0%,rgba(109,74,255,.13),transparent 30%),radial-gradient(circle at 95% 100%,rgba(18,191,166,.11),transparent 32%);pointer-events:none}
  .pf-developer-brand{position:relative;z-index:1;display:flex;align-items:center;gap:12px;min-width:0;flex:1}
  .pf-developer-mark{width:42px;height:42px;min-width:42px;border-radius:13px;display:grid;place-items:center;color:#6d4aff;background:linear-gradient(135deg,#eee8ff,#dcfbf5);border:1px solid rgba(109,74,255,.16);box-shadow:0 8px 18px rgba(70,54,145,.10)}
  .pf-developer-copy{display:flex;flex-direction:column;gap:3px;min-width:0}
  .pf-developer-copy strong{font-size:14px;font-weight:900;letter-spacing:.1px;color:#172943}
  .pf-developer-copy span{font-size:11px;color:#718094;line-height:1.35}
  .pf-developer-copy b{color:#4e3aa9}
  .pf-developer-contact{position:relative;z-index:1;display:flex;align-items:center;gap:8px;padding-left:15px;border-left:1px solid rgba(103,91,176,.14)}
  .pf-developer-contact::before{content:'CONTACT';position:absolute;right:0;top:-15px;color:#8a94a7;font-size:7px;font-weight:900;letter-spacing:1.5px}
  .pf-developer-contact a{width:42px;height:42px;min-width:42px;display:grid;place-items:center;border-radius:12px;border:1px solid rgba(91,75,181,.14);background:rgba(255,255,255,.78);color:#4f3eb2;box-shadow:0 6px 16px rgba(45,41,93,.07);text-decoration:none;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
  .pf-developer-contact a:hover{transform:translateY(-2px);background:#fff;box-shadow:0 10px 22px rgba(75,57,165,.14)}
  .pf-developer-contact a:last-child{color:#128c75;border-color:rgba(18,191,166,.18)}
  .gym-public-dark-v2 .public-developer-footer .pf-developer-bar{border-color:rgba(143,119,255,.24);background:linear-gradient(135deg,rgba(20,23,42,.96),rgba(30,24,63,.94) 52%,rgba(13,48,48,.92));box-shadow:0 18px 45px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.08);color:#aeb7c8}
  .gym-public-dark-v2 .public-developer-footer .pf-developer-copy strong{color:#f7f4ff}
  .gym-public-dark-v2 .public-developer-footer .pf-developer-copy span{color:#9da9bc}
  .gym-public-dark-v2 .public-developer-footer .pf-developer-copy b{color:#d8caff}
  .gym-public-dark-v2 .public-developer-footer .pf-developer-contact{border-left-color:rgba(255,255,255,.10)}
  .gym-public-dark-v2 .public-developer-footer .pf-developer-contact a{color:#c9b9ff;background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}
  .gym-public-dark-v2 .public-developer-footer .pf-developer-contact a:last-child{color:#5ce0bf;border-color:rgba(92,224,191,.18)}
  @media(max-width:700px){
    .pf-developer-bar{min-height:0;padding:13px;align-items:flex-start;flex-direction:column;gap:12px}
    .pf-developer-brand{width:100%}.pf-developer-copy strong{font-size:13px}
    .pf-developer-contact{width:100%;padding:10px 0 0;border-left:0;border-top:1px solid rgba(103,91,176,.14)}
    .pf-developer-contact::before{display:none}.pf-developer-contact a{width:40px;height:40px;min-width:40px}
    .vibrant-app-shell .pf-developer-bar.app{width:calc(100% - 24px) !important;margin:16px 12px 16px !important}
    .public-developer-footer{padding:0 12px 18px !important}
  }
`;
function DeveloperContactBar({ app = false }) {
  return (
    <div className={`pf-developer-bar${app ? ' app' : ''}`} aria-label="Developer contact">
      <div className="pf-developer-brand">
        <div className="pf-developer-mark"><Dumbbell size={17} strokeWidth={2.4} /></div>
        <div className="pf-developer-copy">
          <strong>Powered by Navyexa Technologies</strong>
          <span>Developed by <b>Akash Gupta</b> · Preface Fitness Management System</span>
        </div>
      </div>
      <div className="pf-developer-contact">
        <a href="tel:7905572486" aria-label="Call developer" title="Call developer"><Phone size={17} /></a>
        <a href="https://wa.me/917905572486" target="_blank" rel="noreferrer" aria-label="WhatsApp developer" title="WhatsApp developer"><MessageCircle size={17} /></a>
      </div>
    </div>
  );
}


function readCachedPublicGymSettings(gymId, fallback = {}) {
  try {
    const key = `preface-public-gym-settings-${String(gymId || PRODUCTION_GYM_ID).trim()}`;
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.settings) return parsed.settings;
    }
  } catch (error) {
    // Cache is an optimization only; continue with supplied defaults.
  }
  return fallback && typeof fallback === 'object' ? fallback : {};
}

function cachePublicGymProfile(gymId, profile) {
  try {
    if (!profile?.settings) return;
    const key = `preface-public-gym-settings-${String(gymId || PRODUCTION_GYM_ID).trim()}`;
    window.localStorage.setItem(key, JSON.stringify({
      settings: profile.settings,
      membershipPlans: Array.isArray(profile.membershipPlans) ? profile.membershipPlans : [],
      cachedAt: Date.now(),
    }));
  } catch (error) {
    // Storage may be unavailable or full; live cloud loading still works.
  }
}

function PublicGymIntroPage({ settings = {}, gymId = PRODUCTION_GYM_ID }) {
  // Paint the last known public settings immediately from browser cache while
  // the fresh Supabase profile loads in the background.
  const [remoteSettings, setRemoteSettings] = useState(() => readCachedPublicGymSettings(gymId, settings || {}));
  const [remotePlans, setRemotePlans] = useState(() => {
    try {
      const raw = window.localStorage.getItem(`preface-public-gym-settings-${String(gymId || PRODUCTION_GYM_ID).trim()}`);
      const cached = raw ? JSON.parse(raw) : null;
      return Array.isArray(cached?.membershipPlans) ? cached.membershipPlans : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(() => {
    const initialSettings = readCachedPublicGymSettings(gymId, settings || {});
    const initialNotice = initialSettings?.notice || {};
    return Boolean(initialNotice.enabled && String(initialNotice.text || '').trim());
  });
  const [enquiryForm, setEnquiryForm] = useState({ name: '', phone: '', email: '', interestedPlan: '', message: '' });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryResult, setEnquiryResult] = useState(null);


  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    (async () => {
      try {
        const profile = await getPublicGymProfile(gymId);
        if (!cancelled) {
          const nextSettings = profile?.settings || {};
          // Keep a public-only cache so notices can appear on the first paint
          // on the next visit/reload instead of waiting for the network request.
          cachePublicGymProfile(gymId, profile);
          setRemoteSettings(nextSettings);
          setRemotePlans(Array.isArray(profile?.membershipPlans) ? profile.membershipPlans : []);
          const nextNotice = nextSettings?.notice || {};
          setNoticeOpen(Boolean(nextNotice?.enabled && String(nextNotice?.text || '').trim()));
        }
      } catch (error) {
        console.error('Public gym profile load failed:', error);
        if (!cancelled) setLoadError(error?.message || 'Unable to load the latest public gym data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gymId]);


  const submitEnquiry = async (event) => {
    event.preventDefault();
    setEnquiryResult(null);
    const name = String(enquiryForm.name || '').trim();
    const phone = String(enquiryForm.phone || '').trim();
    const email = String(enquiryForm.email || '').trim();
    const message = String(enquiryForm.message || '').trim();
    if (!gymId) {
      setEnquiryResult({ type: 'error', message: 'Gym details are not configured. Please contact the gym directly.' });
      return;
    }
    if (!name || !phone) {
      setEnquiryResult({ type: 'error', message: 'Please enter your name and phone number.' });
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setEnquiryResult({ type: 'error', message: 'Please enter a valid phone number.' });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEnquiryResult({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setEnquirySubmitting(true);
    try {
      await publicSubmitEnquiry({ gymId, name, phone, email, interestedPlan: enquiryForm.interestedPlan, message });
      setEnquiryForm({ name: '', phone: '', email: '', interestedPlan: '', message: '' });
      setEnquiryResult({ type: 'success', message: 'Thank you! Your enquiry has been sent to the Preface Fitness team. We will contact you soon.' });
    } catch (error) {
      console.error('Public enquiry submission failed:', error);
      setEnquiryResult({ type: 'error', message: error?.message || 'Unable to send your enquiry right now. Please try again.' });
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const publicSettings = remoteSettings || {};
  const gymName = publicSettings.gymName || 'Preface Fitness';
  const description = publicSettings.gymIntro?.description || 'A modern fitness destination focused on strength, conditioning, personal training and sustainable results.';
  const baseFacilities = Array.isArray(publicSettings.gymIntro?.facilities) && publicSettings.gymIntro.facilities.length
    ? publicSettings.gymIntro.facilities
    : ['Strength & cardio zone', 'Personal training', 'Functional training', 'Locker & changing facilities', 'Member progress tracking', 'Diet & nutrition guidance'];

  // Each built-in facility gets its own relevant image. If the administrator has
  // custom facility names, we match common names first and otherwise use a
  // rotating set of still-unique gym images.
  const facilityImageMap = {
    'strength & cardio zone': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85',
    'personal training': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=85',
    'functional training': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1000&q=85',
    'locker & changing facilities': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85',
    'member progress tracking': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=85',
    'diet & nutrition guidance': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=85',
  };

  const uniqueFacilityFallbacks = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=85',
  ];

  const additionalFacilities = [
    { name: 'Weight loss', description: 'Structured cardio and training support to help you burn fat and build sustainable habits.', image: 'https://images.unsplash.com/photo-1517964603305-11c0f6f66012?auto=format&fit=crop&w=1000&q=85' },
    { name: 'Weight gain', description: 'Strength-focused training and progressive workouts to support healthy muscle and weight gain.', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=85' },
    { name: 'Yoga', description: 'Improve mobility, flexibility, breathing and balance with guided yoga sessions.', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=85' },
    { name: 'Aerobics', description: 'Energetic group movement sessions designed to improve stamina, coordination and fitness.', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=85' },
    { name: 'Zumba', description: 'Fun, high-energy dance workouts that make cardio engaging and enjoyable.', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85' },
    { name: 'Steam Bath', description: 'Relax and unwind after training with a refreshing steam bath experience.', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=85' },
    { name: 'Shower', description: 'Clean, convenient shower facilities to freshen up before heading back to your day.', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=85' },
  ];

  const facilityNames = new Set(baseFacilities.map((item) => String(item || '').trim().toLowerCase()));
  const usedFacilityImages = new Set();
  const facilities = [
    ...baseFacilities.map((name, index) => {
      const cleanName = String(name || '').trim();
      const key = cleanName.toLowerCase();
      const mappedImage = facilityImageMap[key] || uniqueFacilityFallbacks.find((image) => !usedFacilityImages.has(image)) || uniqueFacilityFallbacks[index % uniqueFacilityFallbacks.length];
      usedFacilityImages.add(mappedImage);
      return {
        name: cleanName,
        description: 'Designed to make every training session simple, focused and effective.',
        image: mappedImage,
      };
    }),
    ...additionalFacilities.filter((item) => !facilityNames.has(item.name.toLowerCase())),
  ];
  const publicPage = publicSettings.publicPage || {};
  const publicNotice = publicSettings.notice || {};
  const publicNoticeText = String(publicNotice?.text || '').trim();
  const publicNoticePriority = publicNotice?.priority || 'medium';
  const trainers = Array.isArray(publicPage.trainers) ? publicPage.trainers.filter((t) => t && (t.name || t.photo || t.description)) : [];
  const remotePlanByName = Object.fromEntries((remotePlans || []).map((p) => [String(p?.name || '').trim().toLowerCase(), p]));
  const packageSource = Array.isArray(publicPage.packages) && publicPage.packages.length
    ? publicPage.packages
    : (remotePlans.length ? remotePlans : MEMBERSHIP_PLANS);
  const packages = packageSource.map((pkg) => {
    const key = String(pkg?.name || '').trim().toLowerCase();
    const standardPlan = MEMBERSHIP_PLANS.find((plan) => String(plan.name).trim().toLowerCase() === key);
    const remotePlan = remotePlanByName[key];
    // Public page prices are controlled only by Settings > Public Page packages.
    // Do not read internal Memberships page prices or remote plan prices here.
    const price = Number(pkg?.price ?? standardPlan?.price ?? 0);
    return {
      ...pkg,
      months: Number(remotePlan?.months ?? standardPlan?.months ?? pkg?.months ?? 1),
      price,
      description: pkg?.description || remotePlan?.description || standardPlan?.description || '',
    };
  });
  const reviews = Array.isArray(publicPage.reviews) ? publicPage.reviews.filter((r) => r && (r.name || r.text)) : [];
  const configuredGymPhone = String(publicSettings.gymPhone || '').trim();
  const phone = configuredGymPhone === '7905572486' ? '' : configuredGymPhone;
  const gymPhoneDigits = phone.replace(/\D/g, '');
  const whatsapp = gymPhoneDigits
    ? (gymPhoneDigits.length === 10 ? `91${gymPhoneDigits}` : gymPhoneDigits)
    : '';
  const email = String(publicSettings.gymEmail || '').trim();
  const instagram = String(publicPage.instagramUrl || '').trim();
  const facebook = String(publicPage.facebookUrl || '').trim();
  const website = String(publicPage.websiteUrl || '').trim();
  const mapsUrl = String(publicPage.googleMapsUrl || '').trim();
  const googleRating = publicPage.googleRating || '5.0';
  const googleReviewCount = String(publicPage.googleReviewCount || '').trim() === '2' ? '94' : (publicPage.googleReviewCount || '94');
  const googlePlaceName = publicPage.googlePlaceName || gymName;
  const googleAddress = publicPage.googleAddress || publicSettings.gymAddress || 'Preface Fitness, Nadan Mahal Rd. above Hdfc Bank, Yahiyaganj, Lucknow, Uttar Pradesh 226003';
  const googleMapsTarget = mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${googlePlaceName || gymName} ${googleAddress}`.trim())}`;
  const googlePhone = publicPage.googlePhone || '093692 79056';
  const hoursText = publicPage.hoursText || '6 AM - 11 PM';
  const openingDays = Array.isArray(publicPage.openingDays) ? publicPage.openingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const openingDaysText = openingDays.length === 7 ? 'Every day' : openingDays.length ? openingDays.join(', ') : 'Closed all week';
  const googleSearchUrl = publicPage.googleSearchUrl || 'https://www.google.com/search?q=preface+fitness';
  const gallery = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
  ];

  return (
    <div className="gym-public-page gym-public-dark-v2" style={{ background: '#080b12', color: '#eef2ff', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <style>{`
        .gym-public-dark-v2{background:#080b12;color:#eef2ff;min-height:100vh;overflow:hidden;font-family:Inter,system-ui,sans-serif}
        .gym-public-dark-v2 *{box-sizing:border-box}
        .gym-public-dark-v2 .gym-public-nav{position:sticky;top:0;z-index:20;background:rgba(8,11,18,.84);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.08);padding:18px clamp(20px,5vw,76px);display:flex;align-items:center;justify-content:space-between;gap:20px}
        .gym-public-dark-v2 .gym-public-brand{display:flex;align-items:center;gap:14px}.gym-public-dark-v2 .gym-public-brand img{width:58px;height:58px;object-fit:contain;border-radius:14px}.gym-public-dark-v2 .gym-public-brand strong{display:block;font-size:28px;line-height:1.05;font-weight:900;letter-spacing:-.6px;color:#ffffff;text-shadow:0 2px 18px rgba(112,71,255,.18)}.gym-public-dark-v2 .gym-public-brand span{display:block;color:#8e98ab;font-size:11px;letter-spacing:2px;margin-top:4px}
        
        .gym-public-dark-v2 .public-contact-icon{width:58px;height:48px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.035);color:#f2f4ff;transition:transform .2s ease,background .2s ease,border-color .2s ease,box-shadow .2s ease}
        .gym-public-dark-v2 .public-contact-icon:hover{transform:translateY(-2px);background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.25);box-shadow:0 10px 24px rgba(0,0,0,.22)}
        .gym-public-dark-v2 .public-contact-actions .public-contact-icon.primary{background:linear-gradient(135deg,#7650ff,#6541e9);border-color:transparent;color:#fff}
.gym-public-dark-v2 .public-contact-actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}.gym-public-dark-v2 .public-contact-actions a{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);border-radius:999px;padding:10px 14px;font-size:13px;font-weight:800}.gym-public-dark-v2 .public-contact-actions a.primary{background:#7047ff;border-color:#7047ff}
        .gym-public-dark-v2 .gym-hero{min-height:640px;padding:80px clamp(20px,7vw,110px);display:grid;grid-template-columns:1fr .92fr;gap:60px;align-items:center;background:radial-gradient(circle at 15% 20%,rgba(112,71,255,.22),transparent 38%),radial-gradient(circle at 90% 30%,rgba(16,185,129,.13),transparent 35%)}
        .gym-public-dark-v2 .gym-kicker,.gym-public-dark-v2 .gym-section-kicker{font-size:12px;font-weight:900;letter-spacing:2.2px;background:linear-gradient(90deg,#c78cff 0%,#7ea7ff 52%,#32e6d0 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 0 24px rgba(112,71,255,.12)}.gym-public-dark-v2 .gym-hero-rule{width:170px;height:4px;border-radius:999px;margin:14px 0 21px;background:linear-gradient(90deg,#8d4dff 0%,#b95cff 42%,#22d9c0 100%);box-shadow:0 0 24px rgba(139,77,255,.48),0 0 34px rgba(34,217,192,.18)}.gym-public-dark-v2 .gym-hero h1{font-size:clamp(48px,7vw,86px);line-height:1.10;margin:0 0 26px;letter-spacing:-4.5px;font-weight:950;overflow:visible;padding-bottom:.18em}.gym-public-dark-v2 .gym-hero h1 .hero-line{display:inline-block;line-height:1.10;padding-bottom:.18em;overflow:visible}.gym-public-dark-v2 .gym-hero h1 .hero-line{display:inline-block}.gym-public-dark-v2 .gym-hero h1 .hero-line-1{color:#f5f2ff;text-shadow:0 0 28px rgba(190,170,255,.16)}.gym-public-dark-v2 .gym-hero h1 .hero-line-2{background:linear-gradient(100deg,#ff6de7 0%,#bd68ff 48%,#8f7bff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}.gym-public-dark-v2 .gym-hero h1 .hero-line-3{background:linear-gradient(100deg,#69ddff 0%,#53cfff 38%,#52e5b0 100%);-webkit-background-clip:text;background-clip:text;color:transparent}.gym-public-dark-v2 .gym-hero p{max-width:650px;color:#d3d8e7;font-size:18px;line-height:1.72;text-shadow:0 2px 18px rgba(0,0,0,.22)}.gym-public-dark-v2 .gym-trust-row{display:flex;flex-wrap:wrap;gap:18px;margin-top:30px;color:#e9edf7;font-size:13px}.gym-public-dark-v2 .gym-trust-row span{display:flex;align-items:center;gap:8px;font-weight:700}.gym-public-dark-v2 .gym-trust-row b{color:#ffffff}.gym-public-dark-v2 .trust-icon{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-style:normal;background:#0d1420;border:1px solid rgba(255,255,255,.14);box-shadow:0 0 24px rgba(112,71,255,.10)}.gym-public-dark-v2 .trust-icon-1{color:#d26cff;border-color:rgba(210,108,255,.65);box-shadow:0 0 22px rgba(210,108,255,.18)}.gym-public-dark-v2 .trust-icon-2{color:#55aaff;border-color:rgba(85,170,255,.65);box-shadow:0 0 22px rgba(85,170,255,.16)}.gym-public-dark-v2 .trust-icon-3{color:#37e0bd;border-color:rgba(55,224,189,.65);box-shadow:0 0 22px rgba(55,224,189,.16)}.gym-public-dark-v2 .gym-hero-visual{position:relative}.gym-public-dark-v2 .gym-hero-visual img{width:100%;height:500px;object-fit:cover;border-radius:28px;border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 90px rgba(0,0,0,.42)}.gym-public-dark-v2 .gym-hero-float{position:absolute;left:-24px;bottom:26px;background:rgba(13,17,27,.9);border:1px solid rgba(255,255,255,.1);padding:16px 19px;border-radius:15px;box-shadow:0 15px 40px rgba(0,0,0,.35)}.gym-public-dark-v2 .gym-hero-float strong,.gym-public-dark-v2 .gym-hero-float span{display:block}.gym-public-dark-v2 .gym-hero-float span{color:#929db0;font-size:12px;margin-top:5px}
        .gym-public-dark-v2 .gym-public-section{padding:78px clamp(20px,7vw,110px)}.gym-public-dark-v2 .gym-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07)}.gym-public-dark-v2 h2{font-size:clamp(30px,4vw,48px);line-height:1.05;margin:12px 0 0;letter-spacing:-1.5px}.gym-public-dark-v2 .gym-about-grid p{color:#9da8bb;font-size:16px;line-height:1.8;margin:0 0 15px}
        .gym-public-dark-v2 .gym-section-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:28px}.gym-public-dark-v2 .gym-section-heading>span{color:#717d91;font-size:12px}.gym-public-dark-v2 .gym-facility-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.gym-public-dark-v2 .gym-facility-card{display:grid;grid-template-columns:118px minmax(0,1fr);align-items:start;gap:0;background:linear-gradient(135deg,rgba(20,29,46,.98),rgba(13,19,31,.98) 62%,rgba(36,27,69,.72));border:1px solid rgba(157,137,255,.16);border-radius:22px;overflow:hidden;min-height:0;padding:18px;box-shadow:0 16px 36px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.035);transition:transform .28s ease,border-color .28s ease,box-shadow .28s ease}.gym-public-dark-v2 .gym-facility-card:hover{transform:translateY(-4px);border-color:rgba(169,145,255,.42);box-shadow:0 22px 48px rgba(0,0,0,.32),0 0 28px rgba(112,71,255,.10)}.gym-public-dark-v2 .gym-facility-image-wrap{position:relative;height:176px;min-height:176px;overflow:hidden;background:#0b0f17;border-radius:13px}.gym-public-dark-v2 .gym-facility-image-wrap img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(1.02) contrast(1.03);transition:transform .55s ease,filter .35s ease}.gym-public-dark-v2 .gym-facility-card:hover .gym-facility-image-wrap img{transform:scale(1.06);filter:saturate(1.08) contrast(1.05)}.gym-public-dark-v2 .gym-facility-image-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,8,15,0) 45%,rgba(5,8,15,.12) 100%);pointer-events:none}.gym-public-dark-v2 .gym-facility-number{display:none}.gym-public-dark-v2 .gym-facility-card-body{padding:12px 0 8px 18px}.gym-public-dark-v2 .gym-facility-card h3{margin:0 0 8px;font-size:19px;color:#f5f7ff;font-weight:900;letter-spacing:-.2px}.gym-public-dark-v2 .gym-facility-card p{color:#aeb8c8;font-size:13px;line-height:1.6;margin:0}
        @media(max-width:1100px){.gym-public-dark-v2 .gym-facility-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gym-public-dark-v2 .gym-facility-card{grid-template-columns:120px minmax(0,1fr)}}
        @media(max-width:640px){.gym-public-dark-v2 .gym-facility-grid{grid-template-columns:1fr}.gym-public-dark-v2 .gym-facility-card{grid-template-columns:112px minmax(0,1fr);padding:13px;gap:0}.gym-public-dark-v2 .gym-facility-image-wrap{height:150px;min-height:150px}.gym-public-dark-v2 .gym-facility-card-body{padding:8px 0 6px 13px}.gym-public-dark-v2 .gym-facility-card h3{font-size:17px}.gym-public-dark-v2 .gym-facility-card p{font-size:12px}}
        .gym-public-dark-v2 .gym-trainer-list{display:flex;flex-direction:column;gap:26px}.gym-public-dark-v2 .public-trainer-card{width:min(900px,92%);display:grid;grid-template-columns:260px 1fr;gap:30px;align-items:center;background:linear-gradient(135deg,#111722,#0c1018);border:1px solid rgba(255,255,255,.09);border-radius:24px;padding:18px;box-shadow:0 18px 48px rgba(0,0,0,.22),0 0 26px rgba(112,71,255,.075),inset 0 1px 0 rgba(255,255,255,.025);transition:box-shadow .25s ease,border-color .25s ease,transform .25s ease}.gym-public-dark-v2 .public-trainer-card:hover{border-color:rgba(169,145,255,.25);box-shadow:0 22px 55px rgba(0,0,0,.3),0 0 34px rgba(112,71,255,.14),inset 0 1px 0 rgba(255,255,255,.035)}.gym-public-dark-v2 .public-trainer-card:nth-child(odd){align-self:flex-start;transform:translateX(0)}.gym-public-dark-v2 .public-trainer-card:nth-child(even){align-self:flex-end;transform:translateX(-2%)}.gym-public-dark-v2 .public-trainer-card img,.gym-public-dark-v2 .public-trainer-photo-placeholder{width:260px;height:280px;object-fit:cover;border-radius:18px;background:linear-gradient(135deg,#27203f,#111827);display:grid;place-items:center;color:#a991ff;font-size:48px;font-weight:900}.gym-public-dark-v2 .public-trainer-copy .eyebrow{color:#8e98ab;font-size:11px;letter-spacing:2px;font-weight:900}.gym-public-dark-v2 .public-trainer-copy h3{font-size:31px;margin:8px 0}.gym-public-dark-v2 .public-trainer-copy p{color:#9ea8ba;line-height:1.7}.gym-public-dark-v2 .public-trainer-meta{display:flex;flex-wrap:wrap;gap:8px}.gym-public-dark-v2 .public-trainer-meta span{border:1px solid rgba(112,71,255,.3);background:rgba(112,71,255,.09);padding:8px 11px;border-radius:999px;color:#c8bcff;font-size:12px;font-weight:800}
        .gym-public-dark-v2 .public-package-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.gym-public-dark-v2 .public-package-card{background:linear-gradient(145deg,#141a27,#0d111a);border:1px solid rgba(255,255,255,.09);border-radius:20px;padding:25px}.gym-public-dark-v2 .public-package-card.featured{border-color:rgba(255,255,255,.09);box-shadow:none}.gym-public-dark-v2 .public-package-card .package-tag{font-size:10px;letter-spacing:1.5px;color:#9d8bff;font-weight:900}.gym-public-dark-v2 .public-package-card h3{font-size:23px;margin:9px 0}.gym-public-dark-v2 .public-package-price{font-size:34px;font-weight:900}.gym-public-dark-v2 .public-package-price small{font-size:12px;color:#7e899b;font-weight:600}.gym-public-dark-v2 .public-package-card p{color:#8490a2;line-height:1.6;font-size:13px;min-height:43px}
        .gym-public-dark-v2 .gym-gallery{display:grid;grid-template-columns:1.25fr .75fr;grid-template-rows:245px 245px;gap:12px}.gym-public-dark-v2 .gym-gallery-item{overflow:hidden;border-radius:18px}.gym-public-dark-v2 .gym-gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s}.gym-public-dark-v2 .gym-gallery-item:hover img{transform:scale(1.04)}.gym-public-dark-v2 .gallery-1{grid-row:1/3}.gym-public-dark-v2 .gym-gallery-item img{filter:saturate(.88) contrast(1.05)}
        .gym-public-dark-v2 .public-google-card{display:grid;grid-template-columns:1.15fr .85fr;gap:20px;background:#10151f;border:1px solid rgba(255,255,255,.09);border-radius:24px;padding:28px}.gym-public-dark-v2 .google-rating{font-size:38px;font-weight:900}.gym-public-dark-v2 .stars{color:#ffc533;letter-spacing:2px;font-size:19px}.gym-public-dark-v2 .google-muted{color:#7f8a9d;font-size:13px}.gym-public-dark-v2 .google-map-box{min-height:180px;border-radius:17px;background:linear-gradient(135deg,#162133,#0c121c);display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}.gym-public-dark-v2 .google-map-box a{color:#b9aaff;text-decoration:none;font-weight:800}.gym-public-dark-v2 .google-map-box-link{position:relative;display:flex;overflow:hidden;isolation:isolate;min-height:300px;color:#fff;text-decoration:none!important;border:1px solid rgba(255,255,255,.12);background:#182131;cursor:pointer;box-shadow:0 12px 32px rgba(0,0,0,.18);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}.gym-public-dark-v2 .google-map-box-link:hover{transform:translateY(-2px);border-color:rgba(169,145,255,.45);box-shadow:0 18px 38px rgba(0,0,0,.28),0 0 22px rgba(112,71,255,.12)}.gym-public-dark-v2 .google-map-box-link iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;filter:saturate(.82) contrast(.94)}.gym-public-dark-v2 .google-map-open-label{position:absolute;z-index:2;top:12px;left:12px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.94);color:#2455a4!important;font-size:12px;box-shadow:0 3px 12px rgba(0,0,0,.15)}.gym-public-dark-v2 .google-map-overlay{position:relative;z-index:1;width:100%;align-self:center;margin:42px 4px 4px;padding:20px 18px;border:1px solid rgba(255,255,255,.12);border-radius:17px;background:rgba(12,17,28,.78);backdrop-filter:blur(5px);text-align:center;box-shadow:0 12px 30px rgba(0,0,0,.22);color:#f5f6ff;pointer-events:none}.gym-public-dark-v2 .google-map-overlay strong{display:block;font-size:17px;margin:3px 0 6px}.gym-public-dark-v2 .google-map-overlay div:not(.stars){color:#d0d6e2;font-size:12px;line-height:1.45}.gym-public-dark-v2 .google-map-overlay small{display:block;color:#c0c8d6;font-size:12px}
        .gym-public-dark-v2 .review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:22px}.gym-public-dark-v2 .public-review{background:#10151f;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:21px}.gym-public-dark-v2 .public-review-head{display:flex;gap:11px;align-items:center}.gym-public-dark-v2 .public-review-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#27203f;display:grid;place-items:center;color:#b6a5ff;font-weight:900}.gym-public-dark-v2 .public-review strong{display:block}.gym-public-dark-v2 .public-review small{color:#758196}.gym-public-dark-v2 .public-review p{color:#a6afbf;line-height:1.6;font-size:13px}
        .gym-public-dark-v2 .gym-cta{padding:75px clamp(20px,7vw,110px);background:linear-gradient(110deg,#211348,#0c1020);border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)}.gym-public-dark-v2 .public-contact-panel{display:flex;justify-content:space-between;gap:30px;align-items:center}.gym-public-dark-v2 .public-contact-panel p{color:#8d98ab}.gym-public-dark-v2 .public-socials{display:flex;flex-wrap:wrap;gap:10px}.gym-public-dark-v2 .public-socials a{color:#fff;text-decoration:none;padding:12px 15px;border-radius:12px;background:#151b29;border:1px solid rgba(255,255,255,.09);font-weight:800;font-size:13px}.gym-public-dark-v2 .public-socials .social-icon-btn{width:52px;height:52px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:14px;font-size:0}.gym-public-dark-v2 .public-socials .social-icon-btn svg{width:23px;height:23px;display:block}.gym-public-dark-v2 .public-socials .social-icon-btn:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.24);background:#1c2435}
        /* Public page readability upgrade */
        .gym-public-dark-v2 h2{color:#ffffff;text-shadow:0 2px 18px rgba(0,0,0,.18)}
        .gym-public-dark-v2 .gym-section-kicker,.gym-public-dark-v2 .gym-kicker{color:#b9a7ff;text-shadow:0 0 18px rgba(112,71,255,.18)}
        .gym-public-dark-v2 .gym-about-grid p{color:#c3cada}
        .gym-public-dark-v2 .gym-section-heading>span{color:#aab4c5}
        .gym-public-dark-v2 .gym-facility-card h3{color:#f4f7ff;font-weight:850}
        .gym-public-dark-v2 .gym-facility-card p{color:#aeb8c8}
        .gym-public-dark-v2 .public-trainer-copy .eyebrow{color:#aaa0d5}
        .gym-public-dark-v2 .public-trainer-copy h3{color:#ffffff;font-weight:900}
        .gym-public-dark-v2 .public-trainer-copy p{color:#c0c8d6}
        .gym-public-dark-v2 .public-package-card .package-tag{color:#b7a8ff}
        .gym-public-dark-v2 .public-package-card h3{color:#ffffff;font-weight:900}
        .gym-public-dark-v2 .public-package-price{color:#f7f8ff}
        .gym-public-dark-v2 .public-package-price small{color:#aeb8c8}
        .gym-public-dark-v2 .public-package-card p{color:#adb7c7}
        .gym-public-dark-v2 .public-google-card h3{color:#ffffff}
        .gym-public-dark-v2 .google-muted{color:#aeb8c8}
        .gym-public-dark-v2 .public-review strong{color:#f5f7ff}
        .gym-public-dark-v2 .public-review small{color:#9da8ba}
        .gym-public-dark-v2 .public-review p{color:#c0c8d6}
        .gym-public-dark-v2 .gym-cta h2{color:#ffffff}
        .gym-public-dark-v2 .gym-cta p{color:#c0c8d6}
        .gym-public-dark-v2 .gym-hero p{color:#c5ccda}
        .gym-public-dark-v2 .gym-trust-row{color:#edf1f8}
        .gym-public-dark-v2 .gym-hero-float{color:#f4f7ff}
        .gym-public-dark-v2 .gym-hero-float span{color:#aeb8c8}
        .gym-public-dark-v2 .gym-public-notice-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:28px;background:rgba(2,4,10,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);animation:gymNoticeOverlayIn .28s ease-out both}.gym-public-dark-v2 .gym-public-notice-overlay:before,.gym-public-dark-v2 .gym-public-notice-overlay:after{content:'';position:absolute;border-radius:999px;filter:blur(4px);pointer-events:none}.gym-public-dark-v2 .gym-public-notice-overlay:before{width:420px;height:420px;left:-130px;top:-150px;background:radial-gradient(circle,rgba(112,71,255,.32),transparent 68%);animation:gymNoticeFloat 7s ease-in-out infinite}.gym-public-dark-v2 .gym-public-notice-overlay:after{width:360px;height:360px;right:-100px;bottom:-130px;background:radial-gradient(circle,rgba(16,185,129,.20),transparent 68%);animation:gymNoticeFloat 8s ease-in-out infinite reverse}.gym-public-dark-v2 .gym-public-notice-modal{position:relative;width:min(680px,100%);max-height:min(78vh,720px);overflow:auto;border-radius:30px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(145deg,rgba(25,29,47,.98),rgba(8,11,18,.99) 58%,rgba(14,24,27,.98));box-shadow:0 35px 120px rgba(0,0,0,.70),0 0 0 1px rgba(112,71,255,.10),0 0 90px rgba(112,71,255,.16);padding:42px 42px 38px;animation:gymNoticeModalIn .38s cubic-bezier(.18,.8,.24,1) both;isolation:isolate}.gym-public-dark-v2 .gym-public-notice-modal:before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(120deg,rgba(169,145,255,.55),rgba(255,255,255,.06) 38%,rgba(97,230,168,.42));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}.gym-public-dark-v2 .gym-public-notice-modal:after{content:'';position:absolute;width:330px;height:170px;left:50%;top:-90px;transform:translateX(-50%);background:radial-gradient(circle,rgba(112,71,255,.26),transparent 70%);filter:blur(12px);z-index:-1;pointer-events:none}.gym-public-dark-v2 .gym-public-notice-close{position:absolute;right:16px;top:16px;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.07);color:#eef2ff;cursor:pointer;transition:transform .18s ease,background .18s ease,border-color .18s ease;z-index:4}.gym-public-dark-v2 .gym-public-notice-close:hover{transform:rotate(90deg) scale(1.05);background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.28)}.gym-public-dark-v2 .gym-public-notice-badge{width:max-content;max-width:100%;display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:999px;background:rgba(112,71,255,.13);border:1px solid rgba(169,145,255,.24);color:#bcaeff;font-size:10px;font-weight:900;letter-spacing:1.8px}.gym-public-dark-v2 .gym-public-notice-badge-dot{width:8px;height:8px;border-radius:50%;background:#61e6a8;box-shadow:0 0 0 0 rgba(97,230,168,.55);animation:gymNoticePulse 1.8s infinite;flex:0 0 auto}.gym-public-dark-v2 .gym-public-notice-modal h3{margin:20px 48px 12px 0;font-size:clamp(28px,5vw,48px);line-height:1.02;letter-spacing:-2px;color:#fff}.gym-public-dark-v2 .gym-public-notice-modal-copy{color:#d8deea;font-size:clamp(16px,2vw,20px);line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}.gym-public-dark-v2 .gym-public-notice-divider{height:1px;background:linear-gradient(90deg,rgba(255,255,255,.16),rgba(255,255,255,.03));margin:26px 0 20px}.gym-public-dark-v2 .gym-public-notice-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;color:#7f8b9e;font-size:11px}.gym-public-dark-v2 .gym-public-notice-continue{display:inline-flex;align-items:center;gap:8px;color:#fff;background:#7047ff;border:1px solid #805cff;border-radius:999px;padding:11px 17px;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 10px 30px rgba(112,71,255,.25)}.gym-public-dark-v2 .gym-public-notice-high .gym-public-notice-modal{border-color:rgba(255,96,128,.28);box-shadow:0 35px 120px rgba(0,0,0,.70),0 0 80px rgba(239,71,111,.14)}.gym-public-dark-v2 .gym-public-notice-high .gym-public-notice-badge{background:rgba(239,71,111,.12);border-color:rgba(255,96,128,.28);color:#ff9fb2}.gym-public-dark-v2 .gym-public-notice-high .gym-public-notice-badge-dot{background:#ff6686;box-shadow:0 0 0 0 rgba(255,102,134,.55)}.gym-public-dark-v2 .gym-public-notice-high .gym-public-notice-continue{background:#e83f68;border-color:#f15b7c;box-shadow:0 10px 30px rgba(232,63,104,.25)}.gym-public-dark-v2 .gym-public-notice-low .gym-public-notice-modal{border-color:rgba(18,191,166,.22)}.gym-public-dark-v2 .gym-public-notice-low .gym-public-notice-badge{background:rgba(18,191,166,.10);border-color:rgba(18,191,166,.24);color:#72e6d2}.gym-public-dark-v2 .gym-public-notice-low .gym-public-notice-badge-dot{background:#72e6d2;box-shadow:0 0 0 0 rgba(114,230,210,.50)}.gym-public-dark-v2 .gym-public-notice-text{white-space:pre-wrap}@keyframes gymNoticeOverlayIn{from{opacity:0}to{opacity:1}}@keyframes gymNoticeModalIn{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes gymNoticeFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(18px,14px,0)}}@keyframes gymNoticePulse{0%{box-shadow:0 0 0 0 rgba(97,230,168,.5)}70%{box-shadow:0 0 0 9px rgba(97,230,168,0)}100%{box-shadow:0 0 0 0 rgba(97,230,168,0)}}
        .gym-public-dark-v2 h2{color:#f4f1ff;text-shadow:0 2px 20px rgba(112,71,255,.10)}
        .gym-public-dark-v2 .gym-section-heading>span{color:#aeb9ca}
        .gym-public-dark-v2 .gym-facility-card h3,.gym-public-dark-v2 .public-trainer-copy h3,.gym-public-dark-v2 .public-package-card h3{color:#f1f3fb}
        .gym-public-dark-v2 .gym-facility-card p,.gym-public-dark-v2 .public-trainer-copy p,.gym-public-dark-v2 .public-package-card p{color:#b3bdcd}
        .gym-public-dark-v2 .public-package-price{color:#ffffff}
        .gym-public-dark-v2 .gym-about-grid p{color:#b9c3d2}
        .gym-public-dark-v2 .public-trainer-copy .eyebrow{color:#a998ff}
        .gym-public-dark-v2 .gym-public-footer{display:flex;justify-content:space-between;gap:20px;padding:28px clamp(20px,7vw,110px);background:#05070b;color:#818b9c}.gym-public-dark-v2 .gym-public-footer strong{display:block;color:#f2f4f8}.gym-public-dark-v2 .gym-public-footer span{display:block;margin-top:5px}.gym-public-dark-v2 .public-developer-footer{padding:14px clamp(18px,5vw,70px);border-top:1px solid rgba(168,151,255,.16);background:linear-gradient(180deg,#090b13,#06080d);color:#8792a6;font-size:12px}.gym-public-dark-v2 .public-developer-footer .pf-developer-bar{max-width:1180px;margin:0 auto}.gym-public-dark-v2 .public-developer-footer strong{color:#e7e9f2}.gym-public-dark-v2 .public-developer-footer a{color:#fff;text-decoration:none;font-weight:800}.pf-developer-bar{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:14px 18px;border:1px solid rgba(120,105,255,.18);border-radius:16px;background:linear-gradient(135deg,rgba(109,74,255,.12),rgba(18,191,166,.07));box-shadow:0 10px 28px rgba(0,0,0,.12)}.pf-developer-brand{display:flex;align-items:center;gap:12px;min-width:0}.pf-developer-mark{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#6d4aff,#12bfa6);color:#fff;box-shadow:0 7px 18px rgba(109,74,255,.25);flex:0 0 auto}.pf-developer-copy{min-width:0;line-height:1.35}.pf-developer-copy strong{display:block;font-size:12px;letter-spacing:.01em}.pf-developer-copy span{display:block;margin-top:2px;color:#7e899b;font-size:11px}.pf-developer-contact{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pf-developer-contact a{display:inline-flex;align-items:center;gap:7px;width:38px;height:38px;padding:0;border-radius:10px;justify-content:center;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);color:#e7e9f2!important;text-decoration:none;font-weight:800;transition:.18s ease}.pf-developer-contact a:hover{transform:translateY(-1px);background:rgba(255,255,255,.09);border-color:rgba(169,145,255,.35)}.pf-developer-contact svg{width:16px;height:16px}.pf-developer-bar.app{margin:24px 24px 18px;width:calc(100% - 48px);background:linear-gradient(135deg,rgba(109,74,255,.08),rgba(18,191,166,.06));border-color:rgba(92,76,170,.15);box-shadow:0 8px 24px rgba(32,30,73,.07)}.pf-developer-bar.app .pf-developer-copy strong{color:#24344b}.pf-developer-bar.app .pf-developer-copy span{color:#7b8998}.pf-developer-bar.app .pf-developer-contact a{background:#fff;border-color:#dce5ec;color:#26364b!important}.pf-developer-bar.app .pf-developer-contact a:hover{background:#f5f2ff;border-color:#d9d0ff}.pf-developer-bar.app .pf-developer-mark{box-shadow:0 7px 18px rgba(109,74,255,.18)}@media(max-width:650px){.pf-developer-bar{align-items:flex-start;flex-direction:column}.pf-developer-contact{width:100%;justify-content:flex-start}.pf-developer-contact a{flex:1 1 auto;justify-content:center}}.gym-public-dark-v2 .public-loading{min-height:100vh;display:grid;place-items:center;color:#aeb7c8}
        @media(max-width:900px){.gym-public-dark-v2 .gym-hero,.gym-public-dark-v2 .gym-about-grid,.gym-public-dark-v2 .public-google-card{grid-template-columns:1fr}.gym-public-dark-v2 .gym-facility-grid,.gym-public-dark-v2 .public-package-grid,.gym-public-dark-v2 .review-grid{grid-template-columns:1fr 1fr}.gym-public-dark-v2 .public-trainer-card{width:100%;grid-template-columns:180px 1fr}.gym-public-dark-v2 .public-trainer-card img,.gym-public-dark-v2 .public-trainer-photo-placeholder{width:180px;height:210px}}
        @media(max-width:620px){.gym-public-dark-v2 .gym-public-notice-overlay{padding:14px}.gym-public-dark-v2 .gym-public-notice-modal{max-height:86vh;border-radius:24px;padding:34px 22px 24px}.gym-public-dark-v2 .gym-public-notice-close{right:11px;top:11px;width:38px;height:38px}.gym-public-dark-v2 .gym-public-notice-modal h3{font-size:32px;letter-spacing:-1.2px;margin-right:40px}.gym-public-dark-v2 .gym-public-notice-modal-copy{font-size:15px;line-height:1.65}.gym-public-dark-v2 .gym-public-notice-footer{align-items:flex-start;flex-direction:column}.gym-public-dark-v2 .gym-public-notice-continue{width:100%;justify-content:center}.gym-public-dark-v2 .gym-public-nav{align-items:flex-start;flex-direction:column}.gym-public-dark-v2 .public-contact-actions{justify-content:flex-start}.gym-public-dark-v2 .gym-hero{padding-top:55px}.gym-public-dark-v2 .gym-hero-rule{width:125px;height:3px}.gym-public-dark-v2 .gym-hero h1{letter-spacing:-2px;line-height:1.10;padding-bottom:.18em}.gym-public-dark-v2 .gym-hero h1 .hero-line{line-height:1.10;padding-bottom:.18em}.gym-public-dark-v2 .gym-hero-visual img{height:360px}.gym-public-dark-v2 .gym-facility-grid,.gym-public-dark-v2 .public-package-grid,.gym-public-dark-v2 .review-grid{grid-template-columns:1fr}.gym-public-dark-v2 .public-trainer-card{grid-template-columns:1fr}.gym-public-dark-v2 .public-trainer-card:nth-child(even){transform:none}.gym-public-dark-v2 .public-trainer-card img,.gym-public-dark-v2 .public-trainer-photo-placeholder{width:100%;height:300px}.gym-public-dark-v2 .gym-gallery{grid-template-columns:1fr;grid-template-rows:280px 180px 180px 180px}.gym-public-dark-v2 .gallery-1{grid-row:auto}.gym-public-dark-v2 .public-contact-panel,.gym-public-dark-v2 .gym-public-footer{flex-direction:column;align-items:flex-start}}
        .gym-enquiry-section{max-width:1240px;margin:20px auto 64px;padding:0 24px;scroll-margin-top:24px}
        .gym-enquiry-card{display:grid;grid-template-columns:.9fr 1.1fr;gap:34px;padding:clamp(22px,4vw,48px);border:1px solid rgba(155,132,255,.24);border-radius:28px;background:radial-gradient(circle at 12% 10%,rgba(112,78,255,.18),transparent 42%),linear-gradient(135deg,#151b2a,#111827 60%,#1d1935);box-shadow:0 24px 60px rgba(0,0,0,.24)}
        .gym-enquiry-copy{align-self:center}.gym-enquiry-eyebrow{font-size:11px;font-weight:900;letter-spacing:2px;color:#a997ff}.gym-public-dark-v2 .gym-enquiry-copy h2{font-size:clamp(30px,4vw,46px);line-height:1.08;letter-spacing:-1.2px;margin:14px 0}.gym-enquiry-copy p{color:#a7b1c3;line-height:1.8;font-size:15px;max-width:420px}.gym-enquiry-points{display:grid;gap:12px;margin-top:24px;color:#d7deea;font-size:13px;font-weight:700}.gym-enquiry-points span{display:flex;align-items:center;gap:9px}.gym-enquiry-points svg{color:#5ce0bf}
        .gym-enquiry-form{padding:24px;border:1px solid rgba(255,255,255,.09);border-radius:20px;background:rgba(255,255,255,.045)}.gym-enquiry-form-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}.gym-enquiry-form-heading strong{font-size:20px;color:#fff}.gym-enquiry-form-heading span{font-size:11px;color:#8793a8}.gym-enquiry-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}.gym-enquiry-fields label{display:grid;gap:7px;color:#cbd4e3;font-size:12px;font-weight:750}.gym-enquiry-fields input,.gym-enquiry-fields select,.gym-enquiry-fields textarea{box-sizing:border-box;width:100%;min-width:0;padding:12px 13px;border:1px solid rgba(185,195,215,.2);border-radius:11px;background:#0e1421;color:#f8fafc;font:inherit;font-size:13px;outline:none}.gym-enquiry-fields input:focus,.gym-enquiry-fields select:focus,.gym-enquiry-fields textarea:focus{border-color:#8e78ff;box-shadow:0 0 0 3px rgba(126,98,255,.14)}.gym-enquiry-fields input::placeholder,.gym-enquiry-fields textarea::placeholder{color:#657187}.gym-enquiry-message{grid-column:1/-1}.gym-enquiry-fields textarea{resize:vertical}.gym-enquiry-submit{width:100%;display:flex;align-items:center;justify-content:center;gap:9px;margin-top:16px;padding:14px 18px;border:0;border-radius:12px;background:linear-gradient(110deg,#7958ff,#9a59ff);color:#fff;font-weight:850;cursor:pointer}.gym-enquiry-submit:disabled{opacity:.65;cursor:wait}.gym-enquiry-privacy{display:block;margin-top:11px;color:#7f8ba0;font-size:10px;line-height:1.5}.gym-enquiry-result{margin-top:14px;padding:12px 14px;border-radius:10px;font-size:12px;line-height:1.6}.gym-enquiry-result.success{background:rgba(31,190,137,.12);border:1px solid rgba(31,190,137,.3);color:#8af0c7}.gym-enquiry-result.error{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);color:#ffb5c0}
        @media(max-width:760px){.gym-enquiry-section{padding:0 14px;margin-bottom:40px}.gym-enquiry-card{grid-template-columns:1fr;gap:24px;padding:20px}.gym-enquiry-form{padding:16px}.gym-enquiry-fields{grid-template-columns:1fr}.gym-enquiry-message{grid-column:auto}.gym-enquiry-form-heading{align-items:flex-start;flex-direction:column;gap:5px}}
      `}</style>
      {!loading && noticeOpen && publicNoticeText && publicNotice?.enabled && <div className={`gym-public-notice-overlay gym-public-notice-${publicNoticePriority}`} role="dialog" aria-modal="true" aria-label="Gym notice">
        <div className="gym-public-notice-modal">
          <button className="gym-public-notice-close" onClick={() => setNoticeOpen(false)} aria-label="Close notice" title="Close notice"><X size={20} /></button>
          <div className="gym-public-notice-badge"><span className="gym-public-notice-badge-dot" aria-hidden="true" />{publicNoticePriority === 'high' ? 'IMPORTANT NOTICE' : publicNoticePriority === 'low' ? 'GYM UPDATE' : 'GYM NOTICE'}</div>
          <h3>{publicNoticePriority === 'high' ? 'Important announcement' : publicNoticePriority === 'low' ? 'A quick update for you' : 'Something you should know'}</h3>
          <div className="gym-public-notice-modal-copy">{publicNoticeText}</div>
          <div className="gym-public-notice-divider" />
          <div className="gym-public-notice-footer">
            <span>Close this notice to continue to the website.</span>
            <button className="gym-public-notice-continue" onClick={() => setNoticeOpen(false)}><span>Continue to website</span><ArrowDownRight size={15} /></button>
          </div>
        </div>
      </div>}
      <header className="gym-public-nav">
        <div className="gym-public-brand"><img src={LOGO_URL} alt={gymName} /><div><strong>{gymName}</strong><span>FITNESS • STRENGTH • WELLNESS</span></div></div>
        <div className="public-contact-actions" aria-label="Gym contact links">
          {phone && (
            <a className="primary public-contact-icon" href={`tel:${phone}`} aria-label="Call gym" title="Call gym">
              <Phone size={21} strokeWidth={2.2} />
            </a>
          )}
          {whatsapp && (
            <a className="public-contact-icon" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp gym" title="WhatsApp gym">
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true">
                <path d="M20.5 11.5a8.45 8.45 0 0 1-12.6 7.36L4 20l1.18-3.78A8.45 8.45 0 1 1 20.5 11.5Z" stroke="currentColor" strokeWidth="1.9"/>
                <path d="M8.5 8.2c.22-.5.45-.51.82-.51h.38c.18 0 .31.04.4.27l.55 1.35c.08.2.06.35-.06.51l-.42.53c-.11.14-.12.27-.04.42.3.57.77 1.12 1.28 1.53.44.35.96.66 1.56.89.17.07.3.05.41-.08l.57-.68c.13-.15.27-.18.46-.1l1.3.62c.2.1.3.2.29.39-.03.62-.29 1.1-.78 1.32-.4.18-.9.21-1.39.09-1.05-.25-2.35-1.04-3.44-2.02-1.1-.99-1.91-2.18-2.08-3.2-.08-.48-.04-.95.19-1.32Z" fill="currentColor"/>
              </svg>
            </a>
          )}
          {email && (
            <a className="public-contact-icon" href={`mailto:${email}`} aria-label="Email gym" title="Email gym">
              <Mail size={21} strokeWidth={2.2} />
            </a>
          )}
          {instagram && (
            <a className="public-contact-icon" href={normalizeExternalUrl(instagram)} target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
              <Instagram size={21} strokeWidth={2.1} />
            </a>
          )}
        </div>
      </header>
      {loading && !publicSettings.publicPage ? <div className="public-loading">Loading gym profile…</div> : <>
      <section className="gym-hero"><div className="gym-hero-copy"><div className="gym-kicker">YOUR FITNESS. YOUR PROGRESS. YOUR SPACE.</div><div className="gym-hero-rule" aria-hidden="true" /><h1><span className="hero-line hero-line-1">Train</span><br /><span className="hero-line hero-line-2">stronger.</span><br /><span className="hero-line hero-line-3">Live better.</span></h1><p>{description}</p><div className="gym-trust-row"><span><i className="trust-icon trust-icon-1"><Dumbbell size={17} /></i><b>Professional</b> training</span><span><i className="trust-icon trust-icon-2"><TrendingUp size={17} /></i><b>Progress</b> focused</span><span><i className="trust-icon trust-icon-3"><Users size={17} /></i><b>Member</b> first</span></div></div><div className="gym-hero-visual"><img src={gallery[0]} alt="Fitness training area" /><div className="gym-hero-float"><strong>Built for consistency</strong><span>Strength • Conditioning • Results</span></div></div></section>
      <section className="gym-public-section gym-about-grid"><div><div className="gym-section-kicker">ABOUT THE GYM</div><h2>A focused environment for people who want to make progress.</h2></div><div><p>{description}</p><p>Whether your goal is fat loss, strength, muscle development or simply becoming more active, the space is designed to keep your training structured, measurable and sustainable.</p></div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">FACILITIES</div><h2>Everything you need to train with purpose.</h2></div></div><div className="gym-facility-grid">{facilities.map((item,index)=><article className="gym-facility-card" key={`${item.name}-${index}`}><div className="gym-facility-image-wrap"><img src={item.image} alt={item.name} loading="lazy" /><div className="gym-facility-image-overlay" /></div><div className="gym-facility-card-body"><h3>{item.name}</h3><p>{item.description}</p></div></article>)}</div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">OUR TRAINERS</div><h2>Meet the people behind the progress.</h2></div></div>{trainers.length ? <div className="gym-trainer-list">{trainers.map((trainer,index)=><article className="public-trainer-card" key={`${trainer.name}-${index}`}>{trainer.photo ? <img src={trainer.photo} alt={trainer.name || 'Trainer'} /> : <div className="public-trainer-photo-placeholder">{initials(trainer.name || 'Trainer')}</div>}<div className="public-trainer-copy"><div className="eyebrow">{trainer.role || 'FITNESS TRAINER'}</div><h3>{trainer.name || 'Trainer'}</h3><div className="public-trainer-meta">{trainer.experience && <span>{trainer.experience} years experience</span>}{trainer.forte && <span>Forte: {trainer.forte}</span>}{trainer.specialization && <span>{trainer.specialization}</span>}{trainer.certification && <span>{trainer.certification}</span>}</div><p>{trainer.description || 'Focused on structured training, safe technique and measurable member progress.'}</p></div></article>)}</div> : <div className="public-review"><strong>Trainer profiles coming soon</strong><p>Trainer details will appear here as the administrator adds them.</p></div>}</section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">MEMBERSHIP PACKAGES</div><h2>Choose the plan that fits your routine.</h2></div></div><div className="public-package-grid">{packages.map((pkg,index)=><article className={`public-package-card ${index===packages.length-1?'featured':''}`} key={`${pkg.name}-${index}`}><div className="package-tag">MEMBERSHIP</div><h3>{pkg.name}</h3><div className="public-package-price">₹{Number(pkg.price||0).toLocaleString('en-IN')} <small>/ {Number(pkg.months||1)} month{Number(pkg.months||1)>1?'s':''}</small></div><p>{pkg.description || 'Flexible membership for your fitness goals.'}</p></article>)}</div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">THE SPACE</div><h2>Train in a space built around movement.</h2></div><span>Swipe / scroll through the gallery</span></div><div className="gym-gallery">{gallery.map((src,index)=><div className={`gym-gallery-item gallery-${index+1}`} key={src}><img src={src} alt={`Gym training ${index+1}`} /></div>)}</div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">GOOGLE BUSINESS</div><h2>Find us. See what members say.</h2></div></div><div className="public-google-card"><div><div className="google-rating">{googleRating} <span className="stars">★★★★★</span></div><div className="google-muted">{googleReviewCount} Google reviews</div><h3 style={{fontSize:'22px',margin:'25px 0 6px'}}>{googlePlaceName}</h3><div className="google-muted">{googleAddress}</div><div style={{marginTop:'10px',color:'#ffbf36',fontWeight:800}}>Hours · {hoursText}</div><div className="google-muted" style={{marginTop:'6px'}}>Opening days · {openingDaysText}</div><div className="google-muted" style={{marginTop:'10px'}}>Google phone · {googlePhone}</div><div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'18px'}}>{(mapsUrl || googleSearchUrl) && <a href={mapsUrl || googleSearchUrl} target="_blank" rel="noreferrer" style={{color:'#a991ff',textDecoration:'none',fontWeight:800}}>Open Google →</a>}<a href={googleSearchUrl} target="_blank" rel="noreferrer" style={{color:'#d9d2ff',textDecoration:'none',fontWeight:800}}>View Google listing</a></div></div><a className="google-map-box google-map-box-link" href={googleMapsTarget} target="_blank" rel="noopener noreferrer" aria-label={`Open ${googlePlaceName} in Google Maps`}><iframe title={`${googlePlaceName} map`} src={`https://maps.google.com/maps?q=${encodeURIComponent(`${googlePlaceName} ${googleAddress}`)}&output=embed`} loading="lazy" aria-hidden="true" tabIndex={-1} /><span className="google-map-open-label">Open in Google Maps ↗</span><div className="google-map-overlay"><div style={{fontSize:'30px'}}>📍</div><strong>{googlePlaceName}</strong><div>{googleAddress || 'Google business location'}</div><div className="stars" style={{marginTop:'10px'}}>★★★★★</div><small>{googleRating}/5 · {googleReviewCount} reviews</small></div></a></div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">MEMBER REVIEWS</div><h2>What our customers say.</h2></div></div>{reviews.length ? <div className="review-grid">{reviews.map((review,index)=><article className="public-review" key={`${review.name}-${index}`}><div className="public-review-head">{review.photo ? <img className="public-review-avatar" src={review.photo} alt="" /> : <div className="public-review-avatar">{initials(review.name || 'C')}</div>}<div><strong>{review.name || 'Customer'}</strong><small>{review.date || 'Verified customer'}</small></div></div><div className="stars" style={{marginTop:'13px'}}>★★★★★</div><p>{review.text}</p></article>)}</div> : <div className="public-review"><strong>No reviews added yet.</strong><p>Customer reviews added from Administrator → Settings will appear here.</p></div>}</section>
      <section className="gym-cta"><div className="public-contact-panel"><div><div className="gym-section-kicker">READY TO START?</div><h2>Show up. Put in the work. Track the progress.</h2><p>Contact the gym using your preferred channel.</p></div><div className="public-socials">
        {phone&&<a className="social-icon-btn" href={`tel:${phone}`} aria-label="Call gym" title="Call gym"><Phone size={23} /></a>}
        {getWhatsAppNumberFromGymPhone(phone)&&<a className="social-icon-btn" href={`https://wa.me/${getWhatsAppNumberFromGymPhone(phone)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp gym" title="WhatsApp gym"><MessageCircle size={23} /></a>}
        {instagram&&<a className="social-icon-btn" href={normalizeExternalUrl(instagram)} target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg></a>}
        {facebook&&<a className="social-icon-btn" href={normalizeExternalUrl(facebook)} target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.4 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.7v8h3.4Z"/></svg></a>}
        {website&&<a className="social-icon-btn" href={normalizeExternalUrl(website)} target="_blank" rel="noreferrer" aria-label="Website" title="Website"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z" stroke="currentColor" strokeWidth="2"/></svg></a>}
      </div></div></section>
      <section className="gym-enquiry-section" id="contact-enquiry">
        <div className="gym-enquiry-card">
          <div className="gym-enquiry-copy">
            <span className="gym-enquiry-eyebrow">LET'S GET YOU STARTED</span>
            <h2>Have questions? Talk to our team.</h2>
            <p>Share your details and what you are looking for. Our team will get in touch with you soon.</p>
            <div className="gym-enquiry-points"><span><CheckCircle2 size={17}/> Membership guidance</span><span><CheckCircle2 size={17}/> Personal training options</span><span><CheckCircle2 size={17}/> No obligation to join</span></div>
          </div>
          <form className="gym-enquiry-form" onSubmit={submitEnquiry}>
            <div className="gym-enquiry-form-heading"><strong>Send an enquiry</strong><span>Fields marked * are required</span></div>
            <div className="gym-enquiry-fields">
              <label>Full name *<input required maxLength={100} autoComplete="name" value={enquiryForm.name} onChange={(e) => setEnquiryForm((f) => ({...f, name:e.target.value}))} placeholder="Your name"/></label>
              <label>Phone number *<input required maxLength={20} inputMode="tel" autoComplete="tel" value={enquiryForm.phone} onChange={(e) => setEnquiryForm((f) => ({...f, phone:e.target.value}))} placeholder="Your contact number"/></label>
              <label>Email address<input type="email" maxLength={160} autoComplete="email" value={enquiryForm.email} onChange={(e) => setEnquiryForm((f) => ({...f, email:e.target.value}))} placeholder="you@example.com"/></label>
              <label>Interested in<select value={enquiryForm.interestedPlan} onChange={(e) => setEnquiryForm((f) => ({...f, interestedPlan:e.target.value}))}><option value="">Select an option</option>{packages.map((pkg, index) => <option key={`${pkg.name}-${index}`} value={pkg.name}>{pkg.name} membership</option>)}<option value="Personal Training">Personal training</option><option value="General Enquiry">General enquiry</option></select></label>
              <label className="gym-enquiry-message">Message<textarea rows={3} maxLength={1500} value={enquiryForm.message} onChange={(e) => setEnquiryForm((f) => ({...f, message:e.target.value}))} placeholder="Tell us what you would like to know (optional)"/></label>
            </div>
            {enquiryResult && <div className={`gym-enquiry-result ${enquiryResult.type}`} role="status" aria-live="polite">{enquiryResult.message}</div>}
            <button className="gym-enquiry-submit" type="submit" disabled={enquirySubmitting}>{enquirySubmitting ? 'Sending enquiry…' : 'Submit enquiry'} <ArrowUpRight size={18}/></button>
            <small className="gym-enquiry-privacy">Your details will only be used by the gym team to respond to this enquiry.</small>
          </form>
        </div>
      </section>
      <footer className="gym-public-footer"><div><strong>{gymName}</strong><span>{publicSettings.gymAddress || 'Fitness • Strength • Wellness'}</span></div><div>{phone}{email ? ` • ${email}` : ''}</div></footer>
      <div className="public-developer-footer"><DeveloperContactBar /></div>
      </>}
    </div>
  );
}


function parseWebsiteEnquiry(item) {
  const raw = String(item?.feedback || '');
  const readLine = (label) => {
    const match = raw.match(new RegExp('(?:^|\\n)' + label + ':\\s*([^\\n]*)', 'i'));
    return match ? match[1].trim() : '';
  };
  const messageMatch = raw.match(/(?:^|\n)Message:\s*([\s\S]*)$/i);
  return {
    name: item?.memberName || 'Website visitor',
    phone: readLine('Phone'),
    email: readLine('Email'),
    interestedPlan: readLine('Interested in'),
    message: messageMatch ? messageMatch[1].trim() : raw,
  };
}

function WebsiteEnquiriesPage({ enquiries: websiteEnquiries = [], onUpdateStatus }) {
  const [search, setSearch] = useState('');
  const enquiries = websiteEnquiries
    .map((item) => ({ ...item, details: parseWebsiteEnquiry(item) }))
    .filter((item) => {
      const q = search.trim().toLowerCase();
      return !q || [item.details.name, item.details.phone, item.details.email, item.details.interestedPlan, item.details.message].join(' ').toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
  const allEnquiries = websiteEnquiries;
  const todayCount = allEnquiries.filter((item) => String(item.createdAt || item.date || '').slice(0, 10) === today).length;
  const openCount = allEnquiries.filter((item) => !['Resolved', 'Closed'].includes(item.status)).length;

  return (
    <div className="page website-enquiries-page">
      <PageTitle title="Website Enquiries" subtitle="Customer enquiries submitted through the public Preface Fitness website." />
      <div className="member-summary">
        <MetricBox label="Total enquiries" value={allEnquiries.length} tone="green" />
        <MetricBox label="Needs follow-up" value={openCount} tone="amber" />
        <MetricBox label="Received today" value={todayCount} tone="teal" />
      </div>
      <section className="panel">
        <div className="panel-header">
          <div><div className="panel-title"><div className="panel-icon"><Mail size={17} /></div><div><h3>Customer enquiry inbox</h3><span>Contact customers and follow up on membership or training questions.</span></div></div></div>
          <div className="search-box compact-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, email..." /></div>
        </div>
        {enquiries.length === 0 ? (
          <div className="feedback-empty"><Mail size={30} /><strong>{allEnquiries.length ? 'No matching enquiries' : 'No website enquiries yet'}</strong><span>When a customer submits the public website contact form, their enquiry will appear here.</span></div>
        ) : (
          <div className="website-enquiry-list">
            {enquiries.map((item) => {
              const dateLabel = item.createdAt || item.date ? new Date(item.createdAt || item.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date unavailable';
              const digits = item.details.phone.replace(/\D/g, '');
              return (
                <article className="website-enquiry-card" key={item.cloudId || item.id}>
                  <div className="website-enquiry-card-head"><div><strong>{item.details.name}</strong><span>{dateLabel}</span></div><label className="website-enquiry-status-control"><span>Status</span><select value={item.status || 'Open'} onChange={(event) => onUpdateStatus?.(item, event.target.value)}><option>Open</option><option>In progress</option><option>Resolved</option></select></label></div>
                  <div className="website-enquiry-contact">
                    {item.details.phone && <a href={`tel:${item.details.phone}`}><Phone size={15} />{item.details.phone}</a>}
                    {item.details.email && <a href={`mailto:${item.details.email}`}><Mail size={15} />{item.details.email}</a>}
                    {digits.length >= 10 && <a href={`https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp</a>}
                  </div>
                  {item.details.interestedPlan && <p className="website-enquiry-interest"><strong>Interested in:</strong> {item.details.interestedPlan}</p>}
                  {item.details.message && <p className="website-enquiry-message-text">{item.details.message}</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <style>{`.website-enquiries-page .website-enquiry-list{display:grid;gap:12px;padding:18px}.website-enquiries-page .website-enquiry-card{border:1px solid #e6e9f2;border-radius:16px;padding:17px;background:linear-gradient(135deg,#fff,#faf9ff);box-shadow:0 5px 18px rgba(49,43,96,.045)}.website-enquiries-page .website-enquiry-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.website-enquiries-page .website-enquiry-card-head strong{display:block;color:#1d2940;font-size:16px;font-weight:850}.website-enquiries-page .website-enquiry-card-head span{display:block;margin-top:4px;color:#7b879a;font-size:11px}.website-enquiries-page .website-enquiry-status-control{display:flex;align-items:center;gap:7px;color:#7b879a;font-size:11px;font-weight:750}.website-enquiries-page .website-enquiry-status-control select{border:1px solid #e2e5ef;border-radius:9px;padding:7px 9px;background:#fff;color:#5744bc;font-size:11px;font-weight:800}.website-enquiries-page .website-enquiry-contact{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}.website-enquiries-page .website-enquiry-contact a{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #e5e8f1;border-radius:9px;background:#fff;color:#5542bd;text-decoration:none;font-size:12px;font-weight:750}.website-enquiries-page .website-enquiry-interest{margin:13px 0 0;color:#354158;font-size:13px}.website-enquiries-page .website-enquiry-message-text{margin:10px 0 0;padding:11px 12px;border-radius:10px;background:#f4f5fa;color:#4b566b;font-size:13px;white-space:pre-wrap;line-height:1.6}@media(max-width:650px){.website-enquiries-page .website-enquiry-card-head{flex-direction:column}.website-enquiries-page .panel-header{align-items:stretch;flex-direction:column}}`}</style>
    </div>
  );
}

function FeedbackPage({ feedbacks, members, setModal, deleteFeedback }) {
  const counts = { high: feedbacks.filter((f) => f.priority === 'high').length, medium: feedbacks.filter((f) => f.priority === 'medium').length, low: feedbacks.filter((f) => f.priority === 'low').length };
  return (
    <div className="page feedback-page">
      <PageTitle title="Customer Feedback" subtitle="Capture member feedback, identify urgency and keep follow-up visible." action={<button className="btn btn-primary" onClick={() => setModal('feedback')}><Plus size={17} /> Record feedback</button>} />
      <div className="feedback-summary"><div className="feedback-stat"><span>Total feedback</span><strong>{feedbacks.length}</strong></div><div className="feedback-stat high"><span>High priority</span><strong>{counts.high}</strong></div><div className="feedback-stat medium"><span>Medium priority</span><strong>{counts.medium}</strong></div><div className="feedback-stat low"><span>Low priority</span><strong>{counts.low}</strong></div></div>
      <section className="card feedback-board"><div className="card-header"><div><h3>Member feedback log</h3><p>Use priority to decide what needs attention first.</p></div></div>{feedbacks.length === 0 ? <div className="feedback-empty"><MessageCircle size={30} /><strong>No feedback recorded yet</strong><span>Start by recording a member's suggestion, complaint or appreciation.</span></div> : <div className="feedback-list">{feedbacks.map((item) => <article className={`feedback-item priority-${item.priority}`} key={item.id}><div className="feedback-priority"><span>{item.priority}</span></div><div className="feedback-body"><div className="feedback-meta"><strong>{item.memberName || 'Anonymous member'}</strong><span>{item.category}</span><span>{formatDate(item.date)}</span><span className={`feedback-status status-${String(item.status || 'Open').toLowerCase().replace(/\s+/g, '-')}`}>{item.status || 'Open'}</span></div><p>{item.feedback}</p>{item.notes && <small>{item.notes}</small>}</div><button className="icon-btn danger" onClick={() => deleteFeedback(item)} title="Delete feedback"><Trash2 size={16} /></button></article>)}</div>}</section>
    </div>
  );
}

function FeedbackModal({ members, onClose, onSave }) {
  const [form, setForm] = useState({ memberId: '', memberName: '', category: 'General', priority: 'medium', feedback: '', status: 'Open', date: today, notes: '' });
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return <Modal title="Record customer feedback" onClose={onClose} wide>
    <div className="feedback-modal-intro"><div><MessageCircle size={22} /><strong>Capture the customer's voice</strong></div><span>Record the feedback clearly and assign an urgency level so the team knows what needs attention first.</span></div>
    <div className="form-grid two">
      <FormField label="Member"><select value={form.memberId} onChange={(e) => { const id = e.target.value; const member = members.find((m) => m.id === id); setForm((f) => ({ ...f, memberId: id, memberName: member?.name || '' })); }}><option value="">Anonymous / walk-in</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.id}</option>)}</select></FormField>
      <FormField label="Date"><input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} /></FormField>
    </div>


    <div className="form-grid three"><FormField label="Category"><select value={form.category} onChange={(e) => update('category', e.target.value)}><option>General</option><option>Service</option><option>Trainer</option><option>Facility</option><option>Cleanliness</option><option>Billing</option><option>Membership</option><option>Suggestion</option><option>Appreciation</option></select></FormField><FormField label="Urgency level"><select value={form.priority} onChange={(e) => update('priority', e.target.value)}><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option></select></FormField><FormField label="Status"><select value={form.status} onChange={(e) => update('status', e.target.value)}><option>Open</option><option>In progress</option><option>Resolved</option></select></FormField></div>
    <FormField label="Customer feedback"><textarea rows="6" autoFocus value={form.feedback} onChange={(e) => update('feedback', e.target.value)} placeholder="Write the customer's feedback in their own words..." /></FormField>
    <FormField label="Internal follow-up notes"><textarea rows="3" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Action required, staff member responsible, follow-up date, etc." /></FormField>
    <ModalActions onClose={onClose} disabled={!form.feedback.trim()} onSave={() => onSave(form)} saveLabel="Save feedback" />
  </Modal>;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await signInOwner(email, password);
      onLogin();
    } catch (loginError) {
      setError(loginError?.message || 'Invalid email or password.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    height: '46px',
    border: '1px solid #dce5ea',
    borderRadius: '10px',
    padding: '0 13px',
    fontSize: '14px',
    color: '#203246',
    background: '#fff',
    outline: 'none',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #f5f9fb 0%, #edf5f5 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#fff',
          border: '1px solid #e2eaee',
          borderRadius: '20px',
          padding: '34px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 60px rgba(28, 52, 68, 0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '82px',
              height: '82px',
              margin: '0 auto 18px',
              borderRadius: '18px',
              display: 'grid',
              placeItems: 'center',
              background: '#f7fafb',
              border: '1px solid #e2eaee',
              overflow: 'hidden',
            }}
          >
            <img
              src={LOGO_URL}
              alt="Preface Fitness"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              color: '#14958f',
              marginBottom: '8px',
            }}
          >
            SECURE LOGIN
          </div>

          <h1
            style={{
              margin: 0,
              color: '#1d3044',
              fontSize: '28px',
              lineHeight: 1.2,
            }}
          >
            Welcome back
          </h1>

          <p
            style={{
              margin: '9px 0 0',
              color: '#718096',
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            Sign in to access your Preface Fitness dashboard.
          </p>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#34475a', marginBottom: '7px' }}>
              Email
            </label>
            <input
              autoFocus
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#34475a', marginBottom: '7px' }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '14px',
                padding: '11px 13px',
                borderRadius: '9px',
                background: '#fff3f3',
                border: '1px solid #ffd5d5',
                color: '#c53d4a',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              height: '46px',
              border: 0,
              borderRadius: '10px',
              background: '#159b94',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div
          style={{
            marginTop: '18px',
            textAlign: 'center',
            color: '#8996a3',
            fontSize: '11px',
            lineHeight: 1.5,
          }}
        >
          Sign in using your Preface Fitness owner account.
        </div>
        <button className="public-link-button" type="button" onClick={openPublicGymPage}>View Preface Fitness <ArrowUpRight size={15} /></button>
      </div>
    </div>
  );
}

function CommunicationPage({ members, logs, setModal, deleteCommunicationLog }) {
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('All');
  const [selectedMemberId, setSelectedMemberId] = useState('All');

  const filteredLogs = logs.filter((log) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [log.message, log.template, log.memberId, log.channel, log.status]
        .join(' ')
        .toLowerCase()
        .includes(q);

    const matchesChannel = channel === 'All' || log.channel === channel;
    const matchesMember =
      selectedMemberId === 'All' || log.memberId === selectedMemberId;

    return matchesSearch && matchesChannel && matchesMember;
  });

  const outgoing = logs.filter((log) => log.direction === 'Outgoing').length;
  const incoming = logs.filter((log) => log.direction === 'Incoming').length;
  const whatsapp = logs.filter((log) => log.channel === 'WhatsApp').length;
  const sms = logs.filter((log) => log.channel === 'SMS').length;

  return (
    <div className="page">
      <PageTitle
        title="Communication"
        subtitle="Manage member messages and keep a complete communication timeline."
        action={
          <button className="btn btn-primary" onClick={() => setModal('communication')}>
            <Plus size={16} />
            Log communication
          </button>
        }
      />

      <div className="member-summary">
        <MetricBox label="Total messages" value={logs.length} tone="green" />
        <MetricBox label="Outgoing" value={outgoing} />
        <MetricBox label="Incoming" value={incoming} tone="teal" />
        <MetricBox label="WhatsApp" value={whatsapp} tone="amber" />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <div className="panel-icon"><MessageCircle size={17} /></div>
              <div>
                <h3>Communication timeline</h3>
                <span>Search and filter member communication.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-box compact-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
              />
            </div>

            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="All">All channels</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="Email">Email</option>
              <option value="Call">Call</option>
            </select>

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <option value="All">All members</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Channel</th>
                <th>Direction</th>
                <th>Template</th>
                <th>Message</th>
                <th>Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const member = members.find((item) => item.id === log.memberId);

                return (
                  <tr key={log.id}>
                    <td>
                      <div className="member-cell">
                        <div className="avatar soft">{initials(member?.name || log.memberId)}</div>
                        <div>
                          <strong>{member?.name || log.memberId}</strong>
                          <span>{log.memberId}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="data-pill"><MessageCircle size={13} />{log.channel}</span></td>
                    <td>{log.direction}</td>
                    <td>{log.template || 'Custom message'}</td>
                    <td>
                      <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.message}>
                        {log.message}
                      </div>
                    </td>
                    <td>
                      {formatDate(log.date)}
                      <div style={{ color: '#8a959f', fontSize: '12px' }}>{log.time}</div>
                    </td>
                    <td><StatusBadge status={log.status || 'Sent'} /></td>
                    <td>
                      <button className="icon-btn" title="Delete" onClick={() => deleteCommunicationLog(log.id)}>
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filteredLogs.length && (
            <EmptyState
              title="No communication found"
              text="Try another filter or log a new communication."
            />
          )}
        </div>
      </section>

      <section className="panel">
        <PanelHeader title="Channel overview" subtitle="Communication activity by channel." icon={Sparkles} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', padding: '20px' }}>
          {[
            ['WhatsApp', whatsapp],
            ['SMS', sms],
            ['Email', logs.filter((log) => log.channel === 'Email').length],
            ['Calls', logs.filter((log) => log.channel === 'Call').length],
          ].map(([name, count]) => (
            <div key={name} style={{ border: '1px solid #e7ebee', borderRadius: '12px', padding: '18px' }}>
              <div style={{ color: '#7b8794', fontSize: '13px' }}>{name}</div>
              <strong style={{ fontSize: '24px', display: 'block', marginTop: '5px' }}>{count}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CommunicationModal({ members, onClose, onSave }) {
  const [form, setForm] = useState({
    memberId: members[0]?.id || '',
    channel: 'WhatsApp',
    direction: 'Outgoing',
    template: 'Custom message',
    message: '',
    status: 'Sent',
    date: today,
  });

  const templates = {
    'Custom message': '',
    'Membership renewal reminder': 'Hi {{name}}, your Preface Fitness membership is due for renewal soon. Please contact us to renew.',
    'Payment reminder': 'Hi {{name}}, this is a reminder from Preface Fitness regarding your pending payment of ₹{{due}}.',
    'Birthday greeting': 'Happy Birthday {{name}}! 🎉 Wishing you a fantastic year ahead from the Preface Fitness team.',
    'Welcome message': 'Welcome to Preface Fitness, {{name}}! We are excited to have you as a member.',
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const applyTemplate = (template) => {
    const member = members.find((item) => item.id === form.memberId);
    const message = (templates[template] || '')
      .replaceAll('{{name}}', member?.name || '')
      .replaceAll('{{due}}', String(member?.due || 0));

    setForm((current) => ({ ...current, template, message }));
  };

  const save = () => {
    if (!form.memberId || !form.message.trim()) return;
    onSave({ ...form, message: form.message.trim() });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>Log communication</h3>
            <span>Record a WhatsApp, SMS, email or call interaction.</span>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <label>
              Member
              <select value={form.memberId} onChange={(e) => update('memberId', e.target.value)}>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name} · {member.id}</option>
                ))}
              </select>
            </label>

            <label>
              Channel
              <select value={form.channel} onChange={(e) => update('channel', e.target.value)}>
                <option>WhatsApp</option>
                <option>SMS</option>
                <option>Email</option>
                <option>Call</option>
              </select>
            </label>

            <label>
              Direction
              <select value={form.direction} onChange={(e) => update('direction', e.target.value)}>
                <option>Outgoing</option>
                <option>Incoming</option>
              </select>
            </label>

            <label>
              Date
              <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Template
              <select value={form.template} onChange={(e) => applyTemplate(e.target.value)}>
                {Object.keys(templates).map((template) => (
                  <option key={template}>{template}</option>
                ))}
              </select>
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Message
              <textarea
                rows="5"
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Write the communication..."
              />
            </label>

            <label>
              Status
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option>Sent</option>
                <option>Delivered</option>
                <option>Read</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!form.memberId || !form.message.trim()}>
            Save communication
          </button>
        </div>
      </div>
    </div>
  );
}


function PTMasterRecordModal({ member, sessions, trainers, onClose }) {
  const history = (sessions || []).flatMap((pkg) => getPTSessionHistory(pkg.notes).map((entry) => ({ ...entry, pkg, trainerName: trainers.find((t) => t.id === pkg.trainerId)?.name || pkg.trainer || '—' }))).sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')) || String(b.time||'').localeCompare(String(a.time||'')));
  const completed = history.length;
  const remaining = (sessions || []).reduce((n,p) => n + Math.max(0, Number(p.sessionsTotal||1)-Number(p.sessionsCompleted||0)), 0);
  return <div className="modal-backdrop" onClick={onClose}><div className="modal modal-wide" onClick={(e)=>e.stopPropagation()} style={{padding:24}}>
    <div className="modal-header"><div><h2>PT Master Record</h2><p>{member.name} · {member.id || 'Member'}</p></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12,margin:'18px 0'}}>
      <div className="card" style={{padding:14}}><span style={{color:'#64748b',fontSize:12}}>Completed sessions</span><h2 style={{margin:'6px 0 0'}}>{completed}</h2></div>
      <div className="card" style={{padding:14}}><span style={{color:'#64748b',fontSize:12}}>Packages</span><h2 style={{margin:'6px 0 0'}}>{sessions.length}</h2></div>
      <div className="card" style={{padding:14}}><span style={{color:'#64748b',fontSize:12}}>Remaining sessions</span><h2 style={{margin:'6px 0 0'}}>{remaining}</h2></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:12}}><h3 style={{margin:0}}>Completed session timeline</h3><button className="btn btn-primary" onClick={()=>printPTMasterRecord({member,sessions,trainers})}><Printer size={16}/> Print PT record</button></div>
    {history.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Trainer</th><th>Package</th><th>Session notes</th></tr></thead><tbody>{history.map((item,i)=><tr key={item.id||`${item.date}-${i}`}><td><strong>{formatDate(item.date)}</strong></td><td>{item.time||'—'}</td><td>{item.trainerName}</td><td>{item.pkg.planName||item.pkg.type||'Personal Training'}</td><td>{cleanPTSessionNotes(item.notes)||'—'}</td></tr>)}</tbody></table></div> : <div className="empty-state" style={{padding:22,textAlign:'center'}}><History size={25}/><strong>No dated session history yet</strong><p>New sessions will appear here automatically when staff click Complete. Previously completed counts may not have individual dates recorded.</p></div>}
    <h3 style={{marginTop:22}}>Assigned PT packages</h3><div className="table-wrap"><table><thead><tr><th>Start date</th><th>Plan</th><th>Trainer</th><th>Sessions</th><th>Expiry</th><th>Status</th></tr></thead><tbody>{sessions.map((pkg)=><tr key={pkg.id}><td>{formatDate(pkg.date)}</td><td>{pkg.planName||pkg.type||'Personal Training'}</td><td>{trainers.find(t=>t.id===pkg.trainerId)?.name||pkg.trainer||'—'}</td><td>{Number(pkg.sessionsCompleted||0)} / {Number(pkg.sessionsTotal||1)}</td><td>{formatDate(pkg.expiryDate)}</td><td><StatusBadge status={pkg.status}/></td></tr>)}</tbody></table></div>
  </div></div>;
}

function TrainersPTPage({
  trainers,
  sessions,
  members,
  setModal,
  updatePTSessionStatus,
  deletePTSession,
  deleteTrainer,
}) {
  const [tab, setTab] = useState('sessions');
  const [search, setSearch] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('All');
  const [profileTrainer, setProfileTrainer] = useState(null);
  const [profileMember, setProfileMember] = useState(null);
  const tierStyle = (tier) => {
    const styles = {
      Silver: { background: 'linear-gradient(135deg,#f8fafc,#cbd5e1)', color: '#334155', border: '#94a3b8' },
      Gold: { background: 'linear-gradient(135deg,#fff4bf,#e9b949)', color: '#754c00', border: '#d4a72c' },
      Platinum: { background: 'linear-gradient(135deg,#effcff,#8ed0dc)', color: '#155e75', border: '#67b9c9' },
    };
    const selected = styles[tier] || styles.Silver;
    return {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '8px 13px', minHeight: 36, borderRadius: '10px 10px 14px 14px',
      fontWeight: 900, fontSize: 13, letterSpacing: '.2px',
      background: selected.background, color: selected.color,
      border: `1px solid ${selected.border}`,
      boxShadow: '0 4px 10px rgba(31,41,55,.15)',
      textShadow: '0 1px 0 rgba(255,255,255,.55)',
    };
  };

  const todaySessions = sessions.filter((session) => session.date === today);
  const completed = sessions.filter((session) => session.status === 'Completed').length;
  const scheduled = sessions.filter((session) => session.status === 'Scheduled').length;
  const revenue = sessions
    .filter((session) => session.status === 'Completed')
    .reduce((sum, session) => sum + Number(session.fee || 0), 0);

  const filteredSessions = sessions.filter((session) => {
    const trainer = trainers.find((item) => item.id === session.trainerId);
    const member = members.find((item) => item.id === session.memberId);
    const q = search.trim().toLowerCase();

    const matchesSearch =
      !q ||
      [trainer?.name, member?.name, session.type, session.notes, session.status]
        .join(' ')
        .toLowerCase()
        .includes(q);

    const matchesTrainer =
      trainerFilter === 'All' || session.trainerId === trainerFilter;

    return matchesSearch && matchesTrainer;
  });

  return (
    <div className="page">
      <PageTitle
        title="Trainers & Personal Training"
        subtitle="Manage trainers, PT schedules, sessions and trainer revenue."
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setModal('trainer')}>
              <Plus size={16} />
              Add trainer
            </button>
            <button className="btn btn-primary" onClick={() => setModal('ptSession')}>
              <Plus size={16} />
              Schedule PT
            </button>
          </div>
        }
      />

      <div className="member-summary">
        <MetricBox label="Trainers" value={trainers.length} tone="green" />
        <MetricBox label="Today's sessions" value={todaySessions.length} />
        <MetricBox label="Completed sessions" value={completed} tone="teal" />
        <MetricBox label="PT revenue" value={`₹${revenue.toLocaleString('en-IN')}`} tone="amber" />
      </div>

      <section className="panel">
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '16px 20px 0',
            borderBottom: '1px solid #edf0f2',
          }}
        >
          <button
            className={`btn ${tab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('sessions')}
          >
            PT Sessions
          </button>
          <button
            className={`btn ${tab === 'trainers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('trainers')}
          >
            Trainers
          </button>
        </div>

        {tab === 'sessions' ? (
          <>
            <div className="panel-header">
              <div>
                <div className="panel-title">
                  <div className="panel-icon"><CalendarDays size={17} /></div>
                  <div>
                    <h3>PT session schedule</h3>
                    <span>Schedule and manage one-to-one training sessions.</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div className="search-box compact-search">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search sessions..."
                  />
                </div>

                <select
                  value={trainerFilter}
                  onChange={(e) => setTrainerFilter(e.target.value)}
                >
                  <option value="All">All trainers</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Package start</th>
                    <th>Member</th>
                    <th>Trainer</th>
                    <th>Plan</th>
                    <th>Sessions</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => {
                    const trainer = trainers.find((item) => item.id === session.trainerId);
                    const member = members.find((item) => item.id === session.memberId);

                    return (
                      <tr key={session.id}>
                        <td>
                          <strong>{formatDate(session.date)}</strong>
                          <div style={{ color: '#8a959f', fontSize: '12px' }}>Expires {formatDate(session.expiryDate || session.date)}</div>
                        </td>
                        <td>
                          <div className="member-cell">
                            <div className="avatar soft">{initials(member?.name || 'Member')}</div>
                            <div>
                              <button type="button" onClick={() => setProfileMember(member || { id: session.memberId, name: 'Unknown member' })} style={{ border:0, padding:0, background:'transparent', color:'#5d45d8', fontWeight:900, cursor:'pointer', textAlign:'left' }} title="Open PT Master Record">{member?.name || 'Unknown member'}</button>
                              <span>{member?.id || '—'} · <button type="button" onClick={() => setProfileMember(member || { id: session.memberId, name: 'Unknown member' })} style={{ border:0, padding:0, background:'transparent', color:'#64748b', cursor:'pointer', fontSize:11 }}>View PT history</button></span>
                            </div>
                          </div>
                        </td>
                        <td>{trainer?.name || '—'}</td>
                        <td>{session.planName || session.type || 'Monthly'}</td>
                        <td>{Number(session.sessionsCompleted || 0)} / {Number(session.sessionsTotal || 1)} used <div style={{fontSize:12,color:"#8792a2"}}>{Math.max(0,Number(session.sessionsTotal || 1)-Number(session.sessionsCompleted || 0))} remaining</div></td>
                        <td>₹{Number(session.fee || 0).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={session.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {session.status === 'Scheduled' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => updatePTSessionStatus(session.id, 'Completed')}
                              >
                                Complete
                              </button>
                            )}
                            {session.status !== 'Cancelled' && session.status !== 'Completed' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => updatePTSessionStatus(session.id, 'Cancelled')}
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              className="icon-btn"
                              title="Delete"
                              onClick={() => deletePTSession(session.id)}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!filteredSessions.length && (
                <EmptyState title="No PT sessions" text="Schedule a personal training session to get started." />
              )}
            </div>
          </>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trainer</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Sessions</th>
                  <th>Completed</th>
                  <th>PT revenue</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {trainers.map((trainer) => {
                  const trainerSessions = sessions.filter((session) => session.trainerId === trainer.id);
                  const completedSessions = trainerSessions.filter((session) => session.status === 'Completed');
                  const trainerRevenue = completedSessions.reduce(
                    (sum, session) => sum + Number(session.fee || 0),
                    0
                  );

                  return (
                    <tr key={trainer.id}>
                      <td>
                        <div className="member-cell">
                          <div className="avatar soft" style={{ width: 46, height: 46, minWidth: 46, overflow: 'hidden', padding: 0, borderRadius: 14 }}>
                            {(trainer.photo || trainer.ptPricing?._trainerPhoto) ? (
                              <img src={trainer.photo || trainer.ptPricing?._trainerPhoto} alt={trainer.name || 'Trainer'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            ) : initials(trainer.name)}
                          </div>
                          <div>
                            <button type="button" onClick={() => setProfileTrainer(trainer)} style={{border:0,background:"transparent",padding:0,fontWeight:800,color:"#18243b",cursor:"pointer",textAlign:"left"}}>{trainer.name}</button>
                            <span>{trainer.phone || 'No phone'} · <span style={tierStyle(trainer.tier || 'Silver')}>{trainer.tier || 'Silver'} ✦</span></span>
                          </div>
                        </div>
                      </td>
                      <td>{trainer.specialization}</td>
                      <td>{trainer.experience} yrs</td>
                      <td>{trainerSessions.length}</td>
                      <td>{completedSessions.length}</td>
                      <td>₹{trainerRevenue.toLocaleString('en-IN')}</td>
                      <td><StatusBadge status={trainer.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setModal({ type: 'editTrainer', trainer })}
                          >
                            Edit
                          </button>
                          <button
                            className="icon-btn"
                            title="Delete"
                            onClick={() => deleteTrainer(trainer.id)}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!trainers.length && (
              <EmptyState title="No trainers" text="Add your first trainer." />
            )}
          </div>
        )}
      </section>
      {profileTrainer && <div className="modal-backdrop" onClick={() => setProfileTrainer(null)}>
        <div className="modal modal-wide trainer-profile-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(1120px, 100%)', maxWidth: 1120, borderRadius: 26, overflow: 'hidden', background: 'linear-gradient(145deg,#ffffff 0%,#fcfdff 72%,#f8f7ff 100%)', boxShadow: '0 28px 90px rgba(17,24,39,.25)' }}>
          <div style={{ padding: '28px 32px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -6 }}>
              <button className="icon-btn" aria-label="Close trainer profile" onClick={() => setProfileTrainer(null)}><X size={21}/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '232px minmax(0,1fr)', gap: 30, alignItems: 'center', paddingBottom: 28, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ width: 232, height: 232, borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(135deg,#eeecff,#dbeafe)', border: '1px solid #e4e7f3', boxShadow: '0 12px 30px rgba(52,64,120,.17)', display: 'grid', placeItems: 'center', color: '#6553d9', fontSize: 48, fontWeight: 900 }}>
                {(profileTrainer.photo || profileTrainer.ptPricing?._trainerPhoto) ?
                  <img src={profileTrainer.photo || profileTrainer.ptPricing?._trainerPhoto} alt={profileTrainer.name || 'Trainer'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> :
                  initials(profileTrainer.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 15px', marginBottom: 12, borderRadius: 999, background: profileTrainer.tier === 'Platinum' ? 'linear-gradient(110deg,#f4e8ff,#e0f2fe)' : profileTrainer.tier === 'Gold' ? 'linear-gradient(110deg,#fff4cf,#ffebaa)' : 'linear-gradient(110deg,#f1f5f9,#e2e8f0)', color: profileTrainer.tier === 'Platinum' ? '#6741c8' : profileTrainer.tier === 'Gold' ? '#946200' : '#475569', border: `1px solid ${profileTrainer.tier === 'Platinum' ? '#d8c1ff' : profileTrainer.tier === 'Gold' ? '#f1d27a' : '#cbd5e1'}`, boxShadow: '0 5px 14px rgba(91,72,180,.13)', fontWeight: 900, fontSize: 15 }}>
                  <span aria-hidden="true" style={{ fontSize: 21, lineHeight: 1 }}>{profileTrainer.tier === 'Platinum' ? '♛' : profileTrainer.tier === 'Gold' ? '♛' : '✥'}</span>
                  {['Silver','Gold','Platinum'].includes(profileTrainer.tier) ? profileTrainer.tier : 'Silver'}
                  <span aria-hidden="true" style={{ letterSpacing: 2, fontSize: 16 }}>{profileTrainer.tier === 'Platinum' ? '✦✦✦' : profileTrainer.tier === 'Gold' ? '✦✦' : '✦'}</span>
                </div>
                <h2 style={{ margin: '0 0 5px', color: '#14213d', fontSize: 'clamp(30px,3vw,42px)', lineHeight: 1.12, fontWeight: 950, letterSpacing: '-.8px' }}>{profileTrainer.name}</h2>
                <p style={{ margin: '0 0 17px', color: '#64748b', fontSize: 19, fontWeight: 550 }}>{profileTrainer.specialization || 'Fitness Trainer'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 13, padding: '10px 14px', background: '#f1eaff', color: '#6438d7', fontWeight: 850 }}><Dumbbell size={19}/> Strength Training</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 13, padding: '10px 14px', background: '#e8fbf2', color: '#07825f', fontWeight: 850 }}><Activity size={19}/> Muscle Building</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 13, padding: '10px 14px', background: '#ffe9ed', color: '#c52248', fontWeight: 850 }}><Target size={19}/> Fat Loss</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '24px 34px', padding: '28px 0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ width: 66, height: 66, flex: '0 0 66px', borderRadius: '50%', background: '#f0eaff', color: '#7046e8', display: 'grid', placeItems: 'center' }}><Phone size={29}/></span>
                <div><strong style={{ display: 'block', color: '#182640', fontSize: 20, marginBottom: 5 }}>Phone</strong><span style={{ color: '#334155', fontSize: 18 }}>{profileTrainer.phone || '—'}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ width: 66, height: 66, flex: '0 0 66px', borderRadius: '50%', background: '#fff3e5', color: '#b96a0b', display: 'grid', placeItems: 'center' }}><CalendarDays size={29}/></span>
                <div><strong style={{ display: 'block', color: '#182640', fontSize: 20, marginBottom: 5 }}>Experience</strong><span style={{ color: '#334155', fontSize: 18 }}>{profileTrainer.experience || 0} years</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ width: 66, height: 66, flex: '0 0 66px', borderRadius: '50%', background: '#e7fbf1', color: '#11945c', display: 'grid', placeItems: 'center' }}><ShieldCheck size={29}/></span>
                <div><strong style={{ display: 'block', color: '#182640', fontSize: 20, marginBottom: 7 }}>Status</strong><span style={{ display: 'inline-block', padding: '7px 17px', borderRadius: 999, background: (profileTrainer.status || 'Active') === 'Active' ? '#d7fae8' : '#f1f5f9', color: (profileTrainer.status || 'Active') === 'Active' ? '#08784d' : '#475569', fontWeight: 850 }}>{profileTrainer.status || 'Active'}</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0 15px' }}>
              <span style={{ width: 46, height: 46, borderRadius: '50%', background: '#f0eaff', color: '#7046e8', display: 'grid', placeItems: 'center' }}><Dumbbell size={25}/></span>
              <h3 style={{ margin: 0, fontSize: 22, color: '#182640', fontWeight: 950 }}>PT plan pricing</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }}>
              {[
                { label: 'Monthly', key: 'Monthly', color: '#7543df', bg: 'linear-gradient(135deg,#faf5ff,#f7f3ff)', border: '#e5d5ff', iconBg: '#eee5ff', days: 30, sessions: 22 },
                { label: 'Quarterly', key: 'Quarterly', color: '#1671d9', bg: 'linear-gradient(135deg,#f2f8ff,#f5faff)', border: '#cfe4ff', iconBg: '#e0efff', days: 90, sessions: 66 },
                { label: 'Half-yearly', key: 'Half-yearly', color: '#07856f', bg: 'linear-gradient(135deg,#f0fdf8,#f3fcf9)', border: '#b9f1e3', iconBg: '#d9f9eb', days: 180, sessions: 132 },
                { label: 'Annual', key: 'Annual', color: '#b45309', bg: 'linear-gradient(135deg,#fff8eb,#fffbf2)', border: '#f4d6a2', iconBg: '#ffedc7', days: 365, sessions: 264 }
              ].map((plan) => {
                const entry = profileTrainer.ptPricing?.[plan.key] || {};
                const fee = Number(entry.fee || 0);
                const sessions = Number(entry.sessions || plan.sessions);
                const days = Number(entry.validityDays || plan.days);
                return <div key={plan.key} style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '17px 16px', borderRadius: 17, border: `1px solid ${plan.border}`, background: plan.bg }}>
                  <span style={{ width: 68, height: 68, flex: '0 0 68px', borderRadius: 20, background: plan.iconBg, color: plan.color, display: 'grid', placeItems: 'center' }}><CalendarDays size={32}/></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: 'block', color: plan.color, fontSize: 17, marginBottom: 6 }}>{plan.label}</strong>
                    <span style={{ display: 'block', color: '#17243b', fontSize: 21, fontWeight: 950 }}>₹{fee.toLocaleString('en-IN')}</span>
                    <div style={{ borderTop: '1px solid #dfe5ee', marginTop: 9, paddingTop: 8, color: '#64748b', fontSize: 13 }}>{sessions} sessions / {days} days</div>
                  </div>
                </div>;
              })}
            </div>
            {profileTrainer.notes && <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong style={{ display: 'block', marginBottom: 5, color: '#334155' }}>Notes</strong><p style={{ margin: 0, color: '#64748b' }}>{profileTrainer.notes}</p></div>}
          </div>
        </div>
      </div>}
      {profileMember && <PTMasterRecordModal member={profileMember} sessions={sessions.filter((item) => item.memberId === profileMember.id)} trainers={trainers} onClose={() => setProfileMember(null)} />}
    </div>
  );
}

function TrainerModal({ onClose, onSave, trainer }) {
  const [form, setForm] = useState(() => trainer ? {
    ...trainer,
    phone: trainer.phone || '',
    specialization: trainer.specialization || '',
    experience: trainer.experience || 0,
    monthlySalary: trainer.monthlySalary || 0,
    status: trainer.status || 'Active',
    tier: trainer.tier || 'Silver',
    ptPricing: {
      Monthly: { fee: 10000, sessions: 22, validityDays: 30 },
      Quarterly: { fee: 27000, sessions: 66, validityDays: 90 },
      'Half-yearly': { fee: 50000, sessions: 132, validityDays: 180 },
      Annual: { fee: 100000, sessions: 264, validityDays: 365 },
      ...(trainer.ptPricing || {}),
    },
    notes: trainer.notes || '',
    photo: trainer.photo || trainer.ptPricing?._trainerPhoto || '',
  } : {
    name: '',
    phone: '',
    specialization: '',
    experience: 1,
    monthlySalary: 0,
    status: 'Active',
    tier: 'Silver',
    ptPricing: {
      Monthly: { fee: 10000, sessions: 22, validityDays: 30 },
      Quarterly: { fee: 27000, sessions: 66, validityDays: 90 },
      'Half-yearly': { fee: 50000, sessions: 132, validityDays: 180 },
      Annual: { fee: 100000, sessions: 264, validityDays: 365 },
    },
    notes: '',
    photo: '',
  });

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.name.trim() || !form.specialization.trim()) return;
    onSave({
      ...form,
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      ptPricing: { ...(form.ptPricing || {}), _trainerPhoto: form.photo || '' },
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>{trainer ? 'Edit trainer' : 'Add trainer'}</h3>
            <span>Maintain trainer information and employment details.</span>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid professional-form-grid">
            <label className="professional-field">
              Name *
              <input value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>

            <label className="professional-field">
              Phone
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>

            <label className="professional-field">
              Specialization *
              <input
                value={form.specialization}
                onChange={(e) => update('specialization', e.target.value)}
                placeholder="e.g. Strength & Conditioning"
              />
            </label>

            <div className="professional-field" style={{ gridColumn: '1 / -1', border: '1px solid #e4e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Trainer photo</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {form.photo ? <img src={form.photo} alt="Trainer preview" style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 12, border: '1px solid #dbe3ef' }} /> : <div style={{ width: 92, height: 92, borderRadius: 12, background: '#f1f5f9', color: '#64748b', display: 'grid', placeItems: 'center' }}><Users size={28} /></div>}
                <div style={{ display: 'grid', gap: 8 }}>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 12 * 1024 * 1024) throw new Error('Please choose an image smaller than 12 MB.');
                      const photo = await resizePublicImage(file, 520, 0.68);
                      update('photo', photo);
                    } catch (error) {
                      window.alert(error?.message || 'Unable to use this trainer photo.');
                    } finally { e.target.value = ''; }
                  }} />
                  <span style={{ color: '#718096', fontSize: 12 }}>JPG, PNG or WebP. Image is resized before saving.</span>
                  {form.photo && <button type="button" className="btn btn-secondary" style={{ width: 'fit-content' }} onClick={() => update('photo', '')}>Remove photo</button>}
                </div>
              </div>
            </div>

            <label className="professional-field">
              Experience (years)
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={form.experience}
                onChange={(e) => update('experience', e.target.value)}
              />
            </label>

            <label className="professional-field">
              Monthly salary
              <input
                type="number"
                min="0"
                value={form.monthlySalary}
                onChange={(e) => update('monthlySalary', e.target.value)}
              />
            </label>

            <label className="professional-field">
              Status
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
                <option>On Leave</option>
              </select>
            </label>

            <label className="professional-field">Trainer tier / badge
              <select value={form.tier || 'Silver'} onChange={(e) => update('tier', e.target.value)}><option>Silver</option><option>Gold</option><option>Platinum</option></select>
            </label>
            <div style={{gridColumn:'1 / -1',border:'1px solid #e4e8f0',borderRadius:12,padding:14}}><strong>PT plan pricing & limits</strong><p style={{color:'#718096',fontSize:12,marginTop:4}}>Administrator can set individual trainer fees, session count and validity.</p>{['Monthly','Quarterly','Half-yearly','Annual'].map((plan) => { const defaults = { Monthly:{fee:10000,sessions:22,validityDays:30}, Quarterly:{fee:27000,sessions:66,validityDays:90}, 'Half-yearly':{fee:50000,sessions:132,validityDays:180}, Annual:{fee:100000,sessions:264,validityDays:365} }; const cfg={...defaults[plan],...(form.ptPricing?.[plan] || {})}; return <div key={plan} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,alignItems:'end',marginTop:10}}><strong>{plan}</strong><label className="professional-field">Fee (₹)<input type="number" min="0" value={cfg.fee ?? 0} onChange={(e)=>update('ptPricing',{...(form.ptPricing||{}),[plan]:{...cfg,fee:e.target.value}})}/></label><label className="professional-field">Sessions<input type="number" min="1" value={cfg.sessions ?? defaults[plan].sessions} onChange={(e)=>update('ptPricing',{...(form.ptPricing||{}),[plan]:{...cfg,sessions:e.target.value}})}/></label><label className="professional-field">Validity days<input type="number" min="1" value={cfg.validityDays ?? defaults[plan].validityDays} onChange={(e)=>update('ptPricing',{...(form.ptPricing||{}),[plan]:{...cfg,validityDays:e.target.value}})}/></label></div>})}</div>
            <label style={{ gridColumn: '1 / -1' }}>
              Notes
              <textarea
                rows="4"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Trainer notes..."
              />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={!form.name.trim() || !form.specialization.trim()}
          >
            {trainer ? 'Save changes' : 'Add trainer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PTSessionModal({ trainers, members, onClose, onSave }) {
  const [form, setForm] = useState({ trainerId: trainers[0]?.id || '', memberId: members[0]?.id || '', date: today, planName: 'Monthly', notes: '' });
  const trainer = trainers.find((t) => t.id === form.trainerId);
  const cfg = trainer?.ptPricing?.[form.planName] || { fee: 0, sessions: 22, validityDays: 30 };
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => { if (!form.trainerId || !form.memberId || !form.date) return; onSave({ ...form, fee: Number(cfg.fee || 0), planConfig: { sessions: Number(cfg.sessions || 22), validityDays: Number(cfg.validityDays || 30) } }); };
  return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><div><h3>Assign PT package</h3><span>Select trainer, member and a configured PT plan.</span></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div><div className="modal-body"><div className="form-grid professional-form-grid"><label className="professional-field">Trainer<select value={form.trainerId} onChange={(e)=>update('trainerId',e.target.value)}>{trainers.map((t)=><option key={t.id} value={t.id}>{t.name} — {t.tier || 'Silver'}</option>)}</select></label><label className="professional-field">Member<select value={form.memberId} onChange={(e)=>update('memberId',e.target.value)}>{members.map((m)=><option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}</select></label><label className="professional-field">Package start date<input type="date" value={form.date} onChange={(e)=>update('date',e.target.value)}/></label><label className="professional-field">PT plan<select value={form.planName} onChange={(e)=>update('planName',e.target.value)}><option>Monthly</option><option>Half-yearly</option><option>Annual</option></select></label><div style={{gridColumn:'1 / -1',background:'#f5f7ff',padding:14,borderRadius:12}}><div style={{fontWeight:800,fontSize:20}}>₹{Number(cfg.fee || 0).toLocaleString('en-IN')}</div><div>{Number(cfg.sessions || 22)} sessions · valid for {Number(cfg.validityDays || 30)} days · {trainer?.tier || 'Silver'} tier</div><small style={{color:'#68758a'}}>Plan price and limits are configured in the trainer profile.</small></div><label style={{gridColumn:'1 / -1'}}>Notes<textarea rows="3" value={form.notes} onChange={(e)=>update('notes',e.target.value)}/></label></div></div><div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={!form.trainerId || !form.memberId || !form.date}>Assign package</button></div></div></div>;
}

function Dashboard({ activeMembers, expiringMembers, overdue, revenue, data, navigate, setModal, markAttendance, isReadOnlyStaff }) {
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [activityFrom, setActivityFrom] = useState(today);
  const [activityTo, setActivityTo] = useState(today);

  const safeFrom = fromDate || today;
  const safeTo = toDate || safeFrom;
  const rangeStart = safeFrom <= safeTo ? safeFrom : safeTo;
  const rangeEnd = safeFrom <= safeTo ? safeTo : safeFrom;

  const inRange = (value) => {
    if (!value) return false;
    const date = String(value).slice(0, 10);
    return date >= rangeStart && date <= rangeEnd;
  };

  const rangeMembers = data.members.filter((member) => inRange(member.createdAt || member.start));
  const rangePayments = data.payments.filter((payment) => inRange(payment.date));
  const rangeAttendance = data.attendance.filter((record) => inRange(record.date));
  const rangePTSessions = (data.ptSessions || []).filter((session) => inRange(session.date));
  const rangeLeads = data.leads.filter((lead) => inRange(lead.followUp || lead.lastContact));

  const newClients = rangeMembers.length;
  const totalCollection = rangePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalExpenses = 0;
  const ptCollection = rangePayments
    .filter((payment) => String(payment.type || '').toLowerCase().includes('pt'))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const profitLoss = totalCollection - totalExpenses;
  const pendingInquiries = data.leads.filter((lead) => !['Converted', 'Closed', 'Lost'].includes(lead.stage)).length;
  const inactiveClients = data.members.filter((member) => getMembershipStatus(member.expiry) === 'Expired').length;
  const profileCreated = data.members.filter((member) => Boolean(member.photo)).length;
  const bookedPT = rangePTSessions.filter((session) => !['Cancelled', 'Completed'].includes(session.status)).length;
  const followUps = data.leads.filter((lead) => lead.followUp && lead.followUp <= rangeEnd && !['Converted', 'Closed', 'Lost'].includes(lead.stage)).length;
  const todayPresent = new Set(rangeAttendance.map((item) => item.memberId || item.member)).size;
  const bookedGroupClass = 0;

  const totalMembers = Math.max(data.members.length, 0);
  const totalLeads = Math.max(data.leads.length, 0);
  const totalSessions = Math.max((data.ptSessions || []).length, 0);
  const collectionBase = totalCollection + Math.max(Number(overdue || 0), 0);
  const pct = (value, base) => base > 0 ? Math.max(0, Math.min(100, (Number(value || 0) / base) * 100)) : 0;

  const tiles = [
    { label: 'Memberships expiring', value: expiringMembers, progress: pct(expiringMembers, totalMembers), icon: ShieldCheck, tone: 'violet', onClick: () => navigate('Memberships') },
    { label: 'New clients', value: newClients, progress: pct(newClients, totalMembers), icon: UserPlus, tone: 'mint', onClick: () => navigate('Members') },
    { label: 'Total collection', value: `₹${totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, progress: collectionBase ? pct(totalCollection, collectionBase) : 0, icon: CircleDollarSign, tone: 'violet', onClick: () => navigate('Payments') },
    { label: 'Total expenses', value: `₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, progress: totalCollection > 0 ? Math.max(0, 100 - pct(totalExpenses, totalCollection)) : 0, icon: CreditCard, tone: 'pink', onClick: () => navigate('Reports') },
    { label: 'Total PT collection', value: `₹${ptCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, progress: pct(ptCollection, totalCollection), icon: Dumbbell, tone: 'gold', onClick: () => navigate('Trainers & PT') },
    { label: 'Profit / Loss', value: `₹${profitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, progress: totalCollection > 0 ? pct(Math.max(profitLoss, 0), totalCollection) : 0, icon: TrendingUp, tone: 'orange', onClick: () => navigate('Reports') },
    { label: 'Pending inquiry(s)', value: pendingInquiries, progress: pct(pendingInquiries, totalLeads), icon: Target, tone: 'green', onClick: () => navigate('Leads') },
    { label: 'Active clients', value: activeMembers, progress: pct(activeMembers, totalMembers), icon: Activity, tone: 'teal', onClick: () => navigate('Members') },
    { label: 'Inactive clients', value: inactiveClients, progress: pct(inactiveClients, totalMembers), icon: UserCheck, tone: 'slate', onClick: () => navigate('Members') },
    { label: 'Profile created clients', value: profileCreated, progress: pct(profileCreated, totalMembers), icon: Users, tone: 'blue', onClick: () => navigate('Members') },
    { label: 'PT expiring soon', value: (data.ptSessions || []).filter((p) => !['Cancelled','Completed','Expired'].includes(p.status) && p.expiryDate && p.expiryDate >= today && p.expiryDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10)).length, progress: 0, icon: CalendarDays, tone: 'orange', onClick: () => navigate('Trainers & PT') },
    { label: 'Booked PT sessions', value: bookedPT, progress: pct(bookedPT, totalSessions), icon: Dumbbell, tone: 'cyan', onClick: () => navigate('Trainers & PT') },
    { label: 'Follow-ups', value: followUps, progress: pct(followUps, totalLeads), icon: Bell, tone: 'orange', onClick: () => navigate('Leads') },
    { label: 'Today present clients', value: todayPresent, progress: pct(todayPresent, activeMembers), icon: CheckCircle2, tone: 'indigo', onClick: () => navigate('Attendance') },
    { label: 'Booked group class', value: bookedGroupClass, progress: 0, icon: Users, tone: 'purple', onClick: () => navigate('Training') },
    { label: 'Pending payments', value: `₹${Number(overdue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, progress: collectionBase ? pct(overdue, collectionBase) : 0, icon: CreditCard, tone: 'pink', onClick: () => navigate('Payments') },
    { label: 'Record payment', value: 'Open', progress: 100, icon: CreditCard, tone: 'teal', onClick: () => setModal('payment') },
    { label: 'Mark attendance', value: 'Open', progress: 100, icon: CheckCircle2, tone: 'blue', onClick: () => navigate('Attendance') },
  ];

  const rangeLabel = rangeStart === rangeEnd
    ? formatDate(rangeStart)
    : `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`;


  const activityStart = activityFrom <= activityTo ? activityFrom : activityTo;
  const activityEnd = activityFrom <= activityTo ? activityTo : activityFrom;
  const activityInRange = (value) => {
    if (!value) return false;
    const d = String(value).slice(0, 10);
    return d >= activityStart && d <= activityEnd;
  };
  const activityMembersEnrolled = data.members.filter(m => activityInRange(m.createdAt || m.start || m.joinDate));
  const activityExpiring = data.members.filter(m => m.expiry && activityInRange(m.expiry))
    .sort((a,b) => String(a.expiry).localeCompare(String(b.expiry)));
  const activityExpired = activityExpiring.filter(m => String(m.expiry) < today);
  const activityPayments = data.payments.filter(p => activityInRange(p.date));
  const activityCollection = activityPayments.reduce((sum,p) => sum + Number(p.amount || 0), 0);
  const activityAttendance = data.attendance.filter(a => activityInRange(a.date));
  const activityLeads = data.leads.filter(l => activityInRange(l.createdAt || l.date || l.followUp || l.lastContact));
  const activityPT = (data.ptSessions || []).filter(p => activityInRange(p.date));
  const activityActive = data.members.filter(m => {
    const joined=String(m.createdAt || m.start || m.joinDate || '').slice(0,10);
    const expiry=String(m.expiry || '').slice(0,10);
    return (!joined || joined <= activityEnd) && (!expiry || expiry >= activityEnd);
  });

  return (
    <div className="vibrant-dashboard">
      <div className="vibrant-dashboard-hero">
        <div>
          <div className="eyebrow">PREFACE FITNESS · COMMAND CENTER</div>
          <h1>Good day, {isReadOnlyStaff ? 'Staff' : 'Administrator'} <span>👋</span></h1>
          <p>Everything important about your gym, at a glance.</p>
        </div>
        <div className="vibrant-dashboard-actions">
          <button className="btn btn-secondary" onClick={() => setModal('lead')}><Target size={18} /> New lead</button>
          <button className="btn btn-primary" onClick={() => setModal('member')}><Plus size={19} /> Add member</button>
        </div>
      </div>

      <section className="dashboard-filter-card">
        <div className="dashboard-filter-heading">
          <div><strong>Summary statistics</strong><span>Showing live data for {rangeLabel}</span></div>
          <div className="dashboard-filter-badge"><Activity size={16} /> Live</div>
        </div>
        <div className="dashboard-date-controls">
          <label><span>From</span><div className="date-input-wrap"><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /><CalendarDays size={18} /></div></label>
          <label><span>To</span><div className="date-input-wrap"><input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} /><CalendarDays size={18} /></div></label>
          <button className="dashboard-filter-btn" onClick={() => { setFromDate(today); setToDate(today); }}><CalendarDays size={18} /> Today</button>
        </div>
      </section>

      <section className="vibrant-tile-grid">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button key={tile.label} className={`vibrant-stat-tile tone-${tile.tone}`} onClick={tile.onClick}>
              <div className="vibrant-stat-icon"><Icon size={25} strokeWidth={2.2} /></div>
              <div className="vibrant-stat-copy">
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
              </div>
              <div className="vibrant-stat-arrow"><ArrowUpRight size={17} /></div>
              <div className="vibrant-stat-progress" aria-hidden="true"><span style={{ width: `${Math.round(tile.progress || 0)}%` }} /></div>
            </button>
          );
        })}
      </section>

      <section className="membership-activity-panel">
        <div className="membership-activity-head">
          <div>
            <div className="eyebrow">MEMBERSHIP CENTER</div>
            <h2>Membership Activity & Timeline</h2>
            <p>Track enrollment, expiry, payments, attendance and other activity for any selected period.</p>
          </div>
          <div className="membership-activity-range">
            <label><span>From</span><div className="membership-date-input"><input type="date" value={activityFrom} onChange={e=>setActivityFrom(e.target.value)} /><CalendarDays size={18}/></div></label>
            <span className="membership-range-arrow">→</span>
            <label><span>To</span><div className="membership-date-input"><input type="date" value={activityTo} min={activityFrom} onChange={e=>setActivityTo(e.target.value)} /><CalendarDays size={18}/></div></label>
          </div>
        </div>
        <div className="membership-activity-stats">
          <div className="membership-activity-stat stat-purple"><span>Members enrolled</span><strong>{activityMembersEnrolled.length}</strong><small>Joined in selected period</small></div>
          <div className="membership-activity-stat stat-orange"><span>Memberships expiring</span><strong>{activityExpiring.length}</strong><small>Expiry falls in period</small></div>
          <div className="membership-activity-stat stat-red"><span>Expired in period</span><strong>{activityExpired.length}</strong><small>Already crossed expiry</small></div>
          <div className="membership-activity-stat stat-green"><span>Collection</span><strong>₹{activityCollection.toLocaleString('en-IN',{maximumFractionDigits:2})}</strong><small>Payments in period</small></div>
          <div className="membership-activity-stat stat-blue"><span>Attendance visits</span><strong>{activityAttendance.length}</strong><small>Check-ins in period</small></div>
          <div className="membership-activity-stat stat-cyan"><span>Lead activity</span><strong>{activityLeads.length}</strong><small>Lead records in period</small></div>
          <div className="membership-activity-stat stat-pink"><span>PT sessions</span><strong>{activityPT.length}</strong><small>Sessions in period</small></div>
          <div className="membership-activity-stat stat-indigo"><span>Active at period end</span><strong>{activityActive.length}</strong><small>Active on {formatDate(activityEnd)}</small></div>
        </div>
        <div className="membership-activity-columns">
          <div className="membership-activity-list-card">
            <div className="membership-activity-list-head"><div><strong>Expiring memberships</strong><span>{activityExpiring.length} member(s)</span></div><button className="btn btn-secondary btn-sm" onClick={()=>navigate('Members')}>View members</button></div>
            {activityExpiring.length ? <div className="membership-activity-list">{activityExpiring.slice(0,6).map(member=>{
              const expiry=String(member.expiry).slice(0,10);
              const days=Math.ceil((new Date(`${expiry}T00:00:00`)-new Date(`${today}T00:00:00`))/86400000);
              return <div className="membership-activity-row" key={member.id}><div><strong>{member.name||'Member'}</strong><span>{member.plan||'Membership'} · Expires {formatDate(expiry)}</span></div><b className={days<0?'expired':days<=7?'soon':'upcoming'}>{days<0?'Expired':days===0?'Today':`${days}d left`}</b></div>;
            })}</div> : <div className="membership-activity-empty">No memberships expire in this period.</div>}
          </div>
          <div className="membership-activity-list-card">
            <div className="membership-activity-list-head"><div><strong>Members enrolled</strong><span>{activityMembersEnrolled.length} new member(s)</span></div><button className="btn btn-secondary btn-sm" onClick={()=>setModal('member')}>Add member</button></div>
            {activityMembersEnrolled.length ? <div className="membership-activity-list">{activityMembersEnrolled.slice(0,6).map(member=><div className="membership-activity-row" key={member.id}><div><strong>{member.name||'Member'}</strong><span>{member.plan||'Membership'} · Joined {formatDate(member.createdAt||member.start||member.joinDate)}</span></div><b className="enrolled">New</b></div>)}</div> : <div className="membership-activity-empty">No members were enrolled in this period.</div>}
          </div>
        </div>
      </section>

    </div>
  );
}
function MembersPage({ members, query, setQuery, setModal, markAttendance, deleteMember, settings, payments = [], ptSessions = [], trainers = [], workoutPlans = [] }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState(null);

  const filtered = members.filter((member) => {
    const q = query.toLowerCase();
    const matchesSearch = [member.name, member.phone, member.email, member.id, member.plan]
      .join(' ').toLowerCase().includes(q);
    return matchesSearch && (statusFilter === 'All' || member.status === statusFilter);
  });

  if (selectedMember) {
    const member = members.find((m) => m.id === selectedMember);
    if (!member) {
      setSelectedMember(null);
      return null;
    }

    const memberPTPackages = ptSessions.filter((item) => item.memberId === member.id).sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
    const memberWorkoutPlans = workoutPlans.filter((plan) => (plan.assignedMemberIds || []).some((id) => String(id) === String(member.id)));
    const memberPTHistory = memberPTPackages.flatMap((pkg) => getPTSessionHistory(pkg.notes).map((entry) => ({ ...entry, pkg, trainerName: trainers.find((t) => t.id === pkg.trainerId)?.name || pkg.trainer || '—' }))).sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.time || '').localeCompare(String(a.time || '')));
    const referralCount = members.filter((item) => item.referredBy === member.id).length;
    const referralPointsPerClient = Number(settings?.referralPointsPerReferral || 0);
    const referralPoints = referralCount * referralPointsPerClient;
    const memberMembershipPayments = payments
      .filter((payment) =>
        (payment.memberId === member.id || payment.member === member.name) &&
        String(payment.type || '').toLowerCase() === 'membership'
      )
      .sort((a, b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        String(a.id || '').localeCompare(String(b.id || ''))
      );

    const historyValue = (text, key) => {
      const match = String(text || '').match(new RegExp(`${key}:\\s*([^|]+)`, 'i'));
      return match ? String(match[1]).trim() : '';
    };

    const historyPlan = (payment) => {
      const notes = String(payment.notes || '');
      const description = String(payment.description || '');
      const renewal = notes.match(/Membership renewal - ([^|]+)/i);
      if (renewal?.[1]) return renewal[1].trim();
      const described = description.match(/^(.+?)\\s+membership$/i);
      return described?.[1]?.trim() || member.plan || 'Membership';
    };

    const membershipHistory = memberMembershipPayments.map((payment, index, all) => {
      const notes = String(payment.notes || '');
      const nextPayment = all[index + 1] || null;
      const previousPayment = all[index - 1] || null;
      const start = historyValue(notes, 'New plan start') || historyValue(notes, 'Start');
      const expiry = historyValue(notes, 'New expiry') || historyValue(notes, 'Expiry');
      const previousExpiry = historyValue(notes, 'Previous expiry');

      return {
        ...payment,
        historyPlan: historyPlan(payment),
        historyStart: start,
        historyExpiry: expiry,
        previousPlan: previousPayment ? historyPlan(previousPayment) : '',
        previousExpiry,
        nextPaymentDate: nextPayment?.date || '',
        isRenewal: /membership renewal/i.test(notes),
      };
    });

    if (membershipHistory.length) {
      const last = membershipHistory[membershipHistory.length - 1];
      if (!last.historyStart && last.historyPlan === member.plan) last.historyStart = member.start || '';
      if (!last.historyExpiry && last.historyPlan === member.plan) last.historyExpiry = member.expiry || '';
    }


    const cardStyle = {
      background: 'linear-gradient(180deg,#ffffff 0%,#fbfdff 100%)',
      border: '1px solid #e4edf3',
      borderRadius: '22px',
      padding: '20px',
      boxShadow: '0 10px 28px rgba(15,23,42,.055)',
      minWidth: 0,
      transition: 'transform .22s ease, box-shadow .22s ease, border-color .22s ease',
    };

    return <>
      <style>{`
        .member-profile-premium { max-width:1180px; margin:0 auto; animation:profileIn .35s ease both; }
        .members-list-table th,.members-list-table td{font-size:14px}.members-list-table td{padding-top:14px;padding-bottom:14px}.members-list-table .contact-cell strong{font-size:14px}.members-list-table .member-cell strong{font-size:14px}.member-profile-premium .profile-hero { position:relative; overflow:hidden; padding:26px; border:1px solid #e4edf3; border-radius:24px; background:linear-gradient(135deg,#ffffff 0%,#f6fbff 100%); box-shadow:0 14px 36px rgba(15,23,42,.07); }
        .member-profile-premium .profile-hero:after { content:""; position:absolute; width:230px; height:230px; right:-80px; top:-120px; border-radius:50%; background:rgba(20,184,166,.08); pointer-events:none; }
        .member-profile-premium .profile-avatar { width:84px;height:84px;min-width:84px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:linear-gradient(145deg,#dff8f4,#dcecff);border:4px solid #fff;box-shadow:0 10px 26px rgba(15,118,110,.14);font-size:27px;font-weight:800;color:#12877f; }
        .member-profile-premium .profile-name { margin:3px 0 5px !important;font-size:clamp(30px,3vw,43px) !important;line-height:1.04 !important;letter-spacing:-.045em;font-weight:800 !important;color:#0b1f3a; }
        .member-profile-premium .profile-meta { margin:0;color:#738298;font-size:14px;font-weight:600; }
        .member-profile-premium .profile-summary { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:22px; }
        .member-profile-premium .summary-card { position:relative;overflow:hidden;padding:16px 17px;border:1px solid #e5edf2;border-radius:17px;background:rgba(255,255,255,.88);box-shadow:0 7px 22px rgba(15,23,42,.04);transition:transform .22s ease,box-shadow .22s ease; }
        .member-profile-premium .summary-card:hover { transform:translateY(-4px);box-shadow:0 15px 30px rgba(15,23,42,.09); }
        .member-profile-premium .summary-card span { display:block;color:#8290a3;font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px; }
        .member-profile-premium .summary-card strong { color:#10233f;font-size:17px;font-weight:800; }
        .member-profile-premium .profile-cards { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:18px; }
        .member-profile-premium .profile-card:hover { transform:translateY(-4px);box-shadow:0 20px 42px rgba(15,23,42,.10);border-color:#d2e5ec; }
        .member-profile-premium .detail-list { display:grid;gap:0; }
        .member-profile-premium .detail-list > div { display:grid;grid-template-columns:minmax(125px,38%) minmax(0,1fr);align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #edf2f6; }
        .member-profile-premium .detail-list > div:last-child { border-bottom:0; }
        .member-profile-premium .detail-list span { color:#8794a6;font-size:12px;font-weight:650;letter-spacing:.02em; }
        .member-profile-premium .documents-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px; }
        .member-profile-premium .documents-grid .quick-action { min-height:52px; }
        .member-profile-premium .detail-list strong { min-width:0;color:#172b46;font-size:14px;font-weight:750;line-height:1.45;overflow-wrap:anywhere;text-align:right; }
        .member-profile-premium .profile-actions { display:grid;gap:9px; }
        .member-profile-premium .profile-actions .quick-action { min-height:52px;border:1px solid #e7edf2;border-radius:14px;background:#fff;transition:all .2s ease; }
        .member-profile-premium .profile-actions .quick-action:hover { transform:translateX(4px);border-color:#bfe7e2;background:#f7fffd;box-shadow:0 8px 18px rgba(15,118,110,.08); }
        .member-profile-premium .member-notes { margin:0;color:#63748a;font-size:14px;line-height:1.75; }

        /* Package & Membership History — contained, full-width profile section */
        .member-profile-premium .membership-history-card {
          grid-column: 1 / -1;
          width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .member-profile-premium .membership-history-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }
        .member-profile-premium .membership-history-summary > div {
          min-width: 0;
          padding: 14px 16px;
          border: 1px solid #e7edf2;
          border-radius: 15px;
          background: #f9fbfc;
        }
        .member-profile-premium .membership-history-summary span {
          display: block;
          color: #8794a6;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 6px;
        }
        .member-profile-premium .membership-history-summary strong {
          display: block;
          color: #172b46;
          font-size: 17px;
          font-weight: 850;
          overflow-wrap: anywhere;
        }
        .member-profile-premium .membership-history-table {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          border: 1px solid #e7edf2;
          border-radius: 16px;
          background: #fff;
          -webkit-overflow-scrolling: touch;
        }
        .member-profile-premium .membership-history-table table {
          width: 100%;
          min-width: 920px;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
        }
        .member-profile-premium .membership-history-table th,
        .member-profile-premium .membership-history-table td {
          box-sizing: border-box;
          overflow-wrap: anywhere;
        }
        .member-profile-premium .membership-history-table th {
          padding: 13px 12px;
          text-align: left;
          background: #f7fafc;
          color: #718096;
          font-size: 11px;
          line-height: 1.25;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: .055em;
          border-bottom: 1px solid #e7edf2;
          vertical-align: middle;
        }
        .member-profile-premium .membership-history-table td {
          padding: 14px 12px;
          color: #334155;
          font-size: 13px;
          line-height: 1.35;
          vertical-align: middle;
          border-bottom: 1px solid #edf2f6;
        }
        .member-profile-premium .membership-history-table tr:last-child td {
          border-bottom: 0;
        }
        .member-profile-premium .membership-history-table th:nth-child(1),
        .member-profile-premium .membership-history-table td:nth-child(1) { width: 12%; }
        .member-profile-premium .membership-history-table th:nth-child(2),
        .member-profile-premium .membership-history-table td:nth-child(2) { width: 14%; }
        .member-profile-premium .membership-history-table th:nth-child(3),
        .member-profile-premium .membership-history-table td:nth-child(3) { width: 13%; }
        .member-profile-premium .membership-history-table th:nth-child(4),
        .member-profile-premium .membership-history-table td:nth-child(4) { width: 13%; }
        .member-profile-premium .membership-history-table th:nth-child(5),
        .member-profile-premium .membership-history-table td:nth-child(5) { width: 12%; }
        .member-profile-premium .membership-history-table th:nth-child(6),
        .member-profile-premium .membership-history-table td:nth-child(6) { width: 12%; }
        .member-profile-premium .membership-history-table th:nth-child(7),
        .member-profile-premium .membership-history-table td:nth-child(7) { width: 11%; }
        .member-profile-premium .membership-history-table th:nth-child(8),
        .member-profile-premium .membership-history-table td:nth-child(8) { width: 13%; }
        .member-profile-premium .history-plan {
          display: block;
          font-weight: 850;
          color: #172b46;
        }
        .member-profile-premium .history-sub {
          display: block;
          margin-top: 4px;
          color: #8a96a7;
          font-size: 10px;
        }
        .member-profile-premium .history-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 999px;
          background: #e9f8f4;
          color: #10836f;
          font-size: 10px;
          font-weight: 850;
          white-space: nowrap;
        }
        .member-profile-premium .history-pill.initial {
          background: #ece9ff;
          color: #6048d8;
        }
        @media (max-width: 900px) {
          .member-profile-premium .membership-history-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 620px) {
          .member-profile-premium .membership-history-summary {
            grid-template-columns: 1fr;
          }
          .member-profile-premium .membership-history-table table {
            min-width: 820px;
          }
        }

        .member-profile-premium .activity-highlight { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
        .member-profile-premium .activity-highlight > div { padding:14px;border-radius:15px;background:#f7fafc;border:1px solid #edf2f6; }
        .member-profile-premium .activity-highlight span { display:block;color:#8996a7;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px; }
        .member-profile-premium .activity-highlight strong { color:#152a46;font-size:20px;font-weight:800; }
        @keyframes profileIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @media(max-width:900px){.member-profile-premium .profile-summary{grid-template-columns:repeat(2,minmax(0,1fr));}.member-profile-premium .profile-cards{grid-template-columns:1fr;}}
        @media(max-width:620px){.member-profile-premium .documents-grid{grid-template-columns:1fr}.member-profile-premium .profile-hero{padding:20px 18px}.member-profile-premium .profile-avatar{width:70px;height:70px;min-width:70px}.member-profile-premium .detail-list > div{grid-template-columns:1fr;gap:4px}.member-profile-premium .detail-list strong{text-align:left}.member-profile-premium .activity-highlight{grid-template-columns:1fr;}}

        /* Member profile: readable, slightly larger typography */
        .member-profile-premium .profile-name {
          font-size:clamp(36px,3vw,48px) !important;
          line-height:1.08 !important;
        }
        .member-profile-premium .profile-meta {
          font-size:18px !important;
        }
        .member-profile-premium .summary-card span {
          font-size:14px !important;
        }
        .member-profile-premium .summary-card strong {
          font-size:20px !important;
        }
        .member-profile-premium .panel-title h3 {
          font-size:22px !important;
        }
        .member-profile-premium .panel-title span {
          font-size:14px !important;
        }
        .member-profile-premium .detail-list > div {
          padding:15px 0 !important;
        }
        .member-profile-premium .detail-list span {
          font-size:16px !important;
        }
        .member-profile-premium .detail-list strong {
          font-size:18px !important;
          line-height:1.45 !important;
        }
        .member-profile-premium .member-notes {
          font-size:17px !important;
        }
      `}</style>

      <div className="member-profile-premium">
        <div style={{ marginBottom: '18px' }}>
          <button className="btn btn-secondary" onClick={() => setSelectedMember(null)}>← Back to members</button>
        </div>

        <div className="profile-hero">
          <div style={{ display:'flex', alignItems:'center', gap:'18px', flexWrap:'wrap', position:'relative', zIndex:1 }}>
            <div style={{ flex:'1 1 420px', minWidth:0, display:'flex', alignItems:'center', gap:'16px' }}>
              <div className="profile-avatar">
                {member.photo ? <img src={member.photo} alt={member.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : initials(member.name)}
              </div>
              <div style={{ minWidth:0 }}>
                <div className="eyebrow" style={{ color:'#0f8f87',fontWeight:800,letterSpacing:'.15em' }}>MEMBER PROFILE</div>
                <h1 className="profile-name">{member.name}</h1>
                <p className="profile-meta">{member.id} · {member.phone}</p>
              </div>
            </div>
            <div style={{ marginLeft:'auto' }}><StatusBadge status={member.status} /></div>
          </div>

          <div className="profile-summary">
            {[
              ['Membership', member.plan],
              ['Expires', formatDate(member.expiry)],
              ['Visits', member.visits],
              ['Outstanding', `₹${Number(member.due || 0).toLocaleString('en-IN')}`],
            ].map(([label, value]) => (
              <div key={label} className="summary-card"><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </div>

        <div className="profile-cards">
          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Member information" subtitle="Personal and contact details" icon={Users} />
            <div className="detail-list">
              <div><span>Member ID</span><strong>{member.id}</strong></div>
              <div><span>Full name</span><strong>{member.name}</strong></div>
              <div><span>Phone</span><strong>{member.phone}</strong></div>
              <div><span>Email</span><strong>{member.email || 'Not provided'}</strong></div>
              <div><span>Birthday</span><strong>{formatDate(member.dob)}</strong></div>
              <div><span>Diet preference</span><strong>{member.dietPreference || 'Not provided'}</strong></div>
              <div><span>Gender</span><strong>{member.gender || 'Not provided'}</strong></div>
              <div><span>Emergency contact</span><strong>{member.emergencyContact || 'Not provided'}</strong></div>
              <div><span>Address</span><strong>{member.address || 'Not provided'}</strong></div>
            </div>
          </div>

          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Membership & billing" subtitle="Current plan and payment information" icon={ShieldCheck} />
            <div className="detail-list">
              <div><span>Plan</span><strong>{member.plan}</strong></div>
              <div><span>Start date</span><strong>{formatDate(member.start)}</strong></div>
              <div><span>Expiry date</span><strong>{formatDate(member.expiry)}</strong></div>
              <div><span>Total amount</span><strong>₹{Number(member.amount || 0).toLocaleString('en-IN')}</strong></div>
              <div><span>Paid</span><strong>₹{Number(member.paid || 0).toLocaleString('en-IN')}</strong></div>
              <div><span>Due</span><strong>₹{Number(member.due || 0).toLocaleString('en-IN')}</strong></div>
            </div>
          </div>

          <div className="profile-card membership-history-card" style={cardStyle}>
            <PanelHeader title="Package & Membership History" subtitle="Complete recorded membership journey" icon={CalendarDays} />

            <div className="membership-history-summary">
              <div><span>Current package</span><strong>{member.plan || '—'}</strong></div>
              <div><span>Current start</span><strong>{formatDate(member.start)}</strong></div>
              <div><span>Current expiry</span><strong>{formatDate(member.expiry)}</strong></div>
              <div><span>Recorded payments</span><strong>{memberMembershipPayments.length}</strong></div>
            </div>

            {membershipHistory.length ? (
              <div className="membership-history-table">
                <table>
                  <thead><tr>
                    <th>Event</th><th>Package</th><th>Previous plan</th><th>Previous expiry</th>
                    <th>Plan started</th><th>Plan expires</th><th>Payment</th><th>Next recorded payment</th>
                  </tr></thead>
                  <tbody>
                    {membershipHistory.map((item, index) => (
                      <tr key={item.id || `${item.date}-${index}`}>
                        <td>
                          <span className={`history-pill ${item.isRenewal ? '' : 'initial'}`}>{item.isRenewal ? 'Renewal' : 'Joined'}</span>
                          <span className="history-sub">{formatDate(item.date)}</span>
                        </td>
                        <td><strong className="history-plan">{item.historyPlan}</strong></td>
                        <td>{item.previousPlan || '—'}</td>
                        <td>{item.previousExpiry ? formatDate(item.previousExpiry) : '—'}</td>
                        <td>{item.historyStart ? formatDate(item.historyStart) : 'Not recorded'}</td>
                        <td>{item.historyExpiry ? formatDate(item.historyExpiry) : 'Not recorded'}</td>
                        <td><strong>₹{Number(item.amount || 0).toLocaleString('en-IN')}</strong><span className="history-sub">{item.mode || 'Payment'}</span></td>
                        <td>{item.nextPaymentDate ? formatDate(item.nextPaymentDate) : 'No later payment recorded'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="membership-activity-empty">No membership payment history has been recorded for this member yet.</div>
            )}

          </div>

          <div className="profile-card pt-profile-history-card" style={cardStyle}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
              <PanelHeader title="Personal Training Session History" subtitle="Detailed PT attendance and assigned package record" icon={Dumbbell} />
              <button type="button" className="btn btn-secondary" onClick={() => printPTMasterRecord({ member, sessions: memberPTPackages, trainers, settings })} style={{display:'inline-flex',alignItems:'center',gap:7,flexShrink:0}}><Printer size={17}/> Print PT record</button>
            </div>
            <div className="membership-history-summary" style={{marginTop:16}}>
              <div><span>Completed sessions</span><strong>{memberPTHistory.length}</strong></div>
              <div><span>PT packages</span><strong>{memberPTPackages.length}</strong></div>
              <div><span>Sessions assigned</span><strong>{memberPTPackages.reduce((n,p)=>n+Number(p.sessionsTotal||1),0)}</strong></div>
              <div><span>Sessions remaining</span><strong>{memberPTPackages.reduce((n,p)=>n+Math.max(0,Number(p.sessionsTotal||1)-Number(p.sessionsCompleted||0)),0)}</strong></div>
            </div>
            <h3 style={{margin:'20px 0 10px',color:'#1b2942'}}>Completed session timeline</h3>
            {memberPTHistory.length ? <div className="membership-history-table"><table><thead><tr><th>Date</th><th>Time</th><th>Trainer</th><th>Package</th><th>Session notes</th></tr></thead><tbody>{memberPTHistory.map((item,index)=><tr key={item.id||`${item.date}-${index}`}><td><strong>{formatDate(item.date)}</strong></td><td>{item.time||'—'}</td><td>{item.trainerName}</td><td>{item.pkg.planName||item.pkg.type||'Personal Training'}</td><td>{cleanPTSessionNotes(item.notes)||'—'}</td></tr>)}</tbody></table></div> : <div className="membership-activity-empty">No individual dated PT sessions recorded yet. Future sessions will appear here after staff mark them Complete.</div>}
            <h3 style={{margin:'22px 0 10px',color:'#1b2942'}}>PT package history</h3>
            {memberPTPackages.length ? <div className="membership-history-table"><table><thead><tr><th>Start date</th><th>Plan</th><th>Trainer</th><th>Sessions used</th><th>Expiry</th><th>Fee</th><th>Status</th></tr></thead><tbody>{memberPTPackages.map((pkg)=><tr key={pkg.id}><td>{formatDate(pkg.date)}</td><td><strong>{pkg.planName||pkg.type||'Personal Training'}</strong></td><td>{trainers.find(t=>t.id===pkg.trainerId)?.name||pkg.trainer||'—'}</td><td>{Number(pkg.sessionsCompleted||0)} / {Number(pkg.sessionsTotal||1)}</td><td>{formatDate(pkg.expiryDate)}</td><td>₹{Number(pkg.fee||0).toLocaleString('en-IN')}</td><td><StatusBadge status={pkg.status}/></td></tr>)}</tbody></table></div> : <div className="membership-activity-empty">No PT packages assigned to this member yet.</div>}
          </div>

          <div className="profile-card" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <PanelHeader title="Fitness, measurements & medical history" subtitle="Training baseline and health information reported by the member" icon={Activity} />
              <button type="button" className="btn btn-secondary" onClick={() => printMemberFitnessMedical(member, settings, memberWorkoutPlans)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
                <FileDown size={17} /> Print profile
              </button>
            </div>
            {(() => {
              const meta = readMemberMeta(member.notes);
              const conditions = Array.isArray(meta.medicalConditions) ? meta.medicalConditions : (Array.isArray(member.medicalConditions) ? member.medicalConditions : []);
              const measurements = [
                ['Chest', meta.chest ?? member.chest], ['Shoulder', meta.shoulder ?? member.shoulder],
                ['Biceps', meta.biceps ?? member.biceps], ['Forearms', meta.forearms ?? member.forearms],
                ['Waist', meta.waist ?? member.waist], ['Hips', meta.hips ?? member.hips],
                ['Thighs', meta.thighs ?? member.thighs], ['Calves', meta.calves ?? member.calves],
                ['Neck', meta.neck ?? member.neck]
              ];
              return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '18px', marginTop: '8px' }}>
                <section>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>Fitness profile</h4>
                  <div className="detail-list">
                    <div><span>Height</span><strong>{member.height ? `${member.height} cm` : 'Not provided'}</strong></div>
                    <div><span>Weight</span><strong>{member.weight ? `${member.weight} kg` : 'Not provided'}</strong></div>
                    <div><span>Body fat</span><strong>{member.bodyFat ? `${member.bodyFat}%` : 'Not provided'}</strong></div>
                    <div><span>Trainer</span><strong>{member.trainer || 'Not assigned'}</strong></div>
                    <div><span>Referral type</span><strong>{String(member.referral || 'None / Walk-In').startsWith('Others:') ? 'Others' : (member.referredBy ? 'Customer' : (member.referral || 'None / Walk-In'))}</strong></div>
                    {String(member.referral || '').startsWith('Others:') && <div><span>Referral details</span><strong>{String(member.referral).slice(7).trim()}</strong></div>}
                  </div>
                  <h4 style={{ margin: '18px 0 8px', fontSize: '14px', color: '#64748b' }}>Body measurements (cm)</h4>
                  {measurements.some(([, value]) => value !== undefined && value !== null && String(value).trim() !== '') ?
                    <div className="detail-list">{measurements.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '').map(([label, value]) => <div key={label}><span>{label}</span><strong>{value} cm</strong></div>)}</div> :
                    <p style={{ margin: 0, color: '#718096' }}>No body measurements recorded.</p>}
                </section>
                <section>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>Medical conditions & injuries</h4>
                  {conditions.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>{conditions.map((condition) => <span key={condition} style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 700 }}>{condition}</span>)}</div> : <p style={{ margin: '0 0 10px', color: '#718096' }}>No medical conditions or injuries recorded.</p>}
                  {conditions.includes('Other') && meta.medicalOther && <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.6 }}><strong>Other condition:</strong> {meta.medicalOther}</p>}
                  {meta.surgeryDetails && <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.6 }}><strong>Surgery (last 5 years):</strong> {meta.surgeryDetails}</p>}
                  {meta.additionalMedicalNotes && <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.6 }}><strong>Additional details:</strong> {meta.additionalMedicalNotes}</p>}
                </section>
                <section style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                  <h4 style={{ margin: '4px 0 10px', fontSize: '14px', color: '#64748b' }}>Assigned workout plans & exercises</h4>
                  {memberWorkoutPlans.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
                    {memberWorkoutPlans.map((plan) => <div key={plan.id} style={{ border: '1px solid #dce7f1', borderRadius: 12, padding: 13, background: '#f8fbff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}><strong style={{ color: '#17365a', fontSize: 14 }}>{plan.name || 'Workout plan'}</strong><span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{Number(plan.durationWeeks || 0)} weeks</span></div>
                      <div style={{ fontSize: 12, color: '#64748b', margin: '5px 0 10px' }}>{plan.goal || 'General Fitness'} · {plan.level || 'Beginner'}{plan.trainer ? ` · ${plan.trainer}` : ''}</div>
                      {(plan.exercises || []).length ? <div style={{ display: 'grid', gap: 7 }}>{plan.exercises.map((exercise, index) => <div key={exercise.id || `${plan.id}-ex-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, borderTop: '1px solid #e6edf5', paddingTop: 7 }}><div><strong style={{ color: '#243b53', fontSize: 12 }}>{index + 1}. {exercise.name || 'Exercise'}</strong><div style={{ fontSize: 11, color: '#718096', marginTop: 3 }}>{exercise.muscleGroup || exercise.muscle || 'Full Body'} · {exercise.sets || 3} sets · {exercise.reps || 15} reps · {exercise.rest || '60 sec'} rest</div></div></div>)}</div> : <span style={{ fontSize: 12, color: '#718096' }}>No exercises added to this plan.</span>}
                      {plan.notes && <p style={{ margin: '9px 0 0', fontSize: 12, color: '#64748b' }}><strong>Notes:</strong> {plan.notes}</p>}
                    </div>)}
                  </div> : <p style={{ margin: 0, color: '#718096' }}>No workout plans have been assigned to this member.</p>}
                </section>
              </div>;
            })()}
          </div>

          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Referral & loyalty" subtitle="Member referral activity and points" icon={Users} />
            <div className="detail-list">
              <div><span>Referred clients</span><strong>{referralCount}</strong></div>
              <div><span>Points per referral</span><strong>{referralPointsPerClient}</strong></div>
              <div><span>Referral points</span><strong>{referralPoints}</strong></div>
              <div><span>Referred by</span><strong>{members.find((item) => item.id === member.referredBy)?.name || 'Direct / Walk-in'}</strong></div>
            </div>
          </div>

          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Documents" subtitle="Print, save as PDF or share member documents" icon={FileDown} />
            <div className="documents-grid">
              <button className="quick-action" onClick={() => printMemberIdCard(member, settings)}><span><FileDown size={18} /></span><strong>ID card / PDF</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => shareMemberWhatsApp(member)}><span><MessageCircle size={18} /></span><strong>Share ID on WhatsApp</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => { const payment = getInvoicePaymentForMember(member, payments); setModal({ type:'invoiceOptions', source:'member', member, payment }); }}><span><CreditCard size={18} /></span><strong>Bill / PDF</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => { const payment = getInvoicePaymentForMember(member, payments); shareBillWhatsApp(member, settings, payment); }}><span><MessageCircle size={18} /></span><strong>Share bill on WhatsApp</strong><ArrowUpRight size={15} /></button>
            </div>
          </div>

          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Quick actions" subtitle="Common front-desk actions" icon={Sparkles} />
            <div className="profile-actions">
              <button className="quick-action" onClick={() => setModal({ type:'editMember', member })}><span><Settings size={18} /></span><strong>Edit member</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => markAttendance(member.id)}><span><CheckCircle2 size={18} /></span><strong>Mark attendance</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => window.open(`https://wa.me/91${member.phone}`, '_blank')}><span><MessageCircle size={18} /></span><strong>WhatsApp member</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => window.location.href = `mailto:${member.email || ''}`}><span><MessageCircle size={18} /></span><strong>Send email</strong><ArrowUpRight size={15} /></button>
            </div>
          </div>

          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Member activity" subtitle="Current engagement snapshot" icon={Activity} />
            <div className="activity-highlight">
              <div><span>Total gym visits</span><strong>{member.visits}</strong></div>
              <div><span>Outstanding</span><strong>₹{Number(member.due || 0).toLocaleString('en-IN')}</strong></div>
            </div>
            {member.visits < 8 && <div className="warning-box" style={{ marginTop:'14px' }}><AlertCircle size={18} /><div><strong>Low attendance detected</strong><p>This member may need a follow-up to improve engagement.</p></div></div>}
          </div>
        </div>
      </div>
    </>;
  }

  return <>
    <PageTitle title="Members" subtitle="Manage your member database, memberships and activity." action={<button className="btn btn-primary" onClick={() => setModal('member')}><Plus size={18} /> Add member</button>} />
    <div className="member-summary">
      <MetricBox label="Total members" value={members.length} tone="green" />
      <MetricBox label="Active" value={members.filter((m) => m.status === 'Active').length} tone="green" />
      <MetricBox label="Expiring soon" value={members.filter((m) => m.status === 'Expiring').length} tone="amber" />
      <MetricBox label="Expired" value={members.filter((m) => m.status === 'Expired').length} tone="red" />
    </div>
    <div className="panel">
      <div className="member-toolbar">
        <div className="search-box member-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone, email or member ID..." /></div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option><option>Active</option><option>Expiring</option><option>Expired</option></select>
      </div>
      <div className="table-wrap"><table className="members-list-table"><thead><tr><th>Member</th><th>Contact</th><th>Membership</th><th>Expiry</th><th>Visits</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>
        {filtered.map((member) => <tr key={member.id}>
          <td><button className="member-name-button" onClick={() => setSelectedMember(member.id)}><div className="member-cell"><div className="avatar soft" style={{ overflow: 'hidden' }}>
            {member.photo ? (
              <img src={member.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials(member.name)
            )}
          </div><div><strong>{member.name}</strong><span>{member.id}</span></div></div></button></td>
          <td><div className="contact-cell"><strong>{member.phone}</strong><span>{member.email || 'No email'}</span></div></td>
          <td>{member.plan}</td><td>{formatDate(member.expiry)}</td><td><span className="data-pill"><Activity size={13} />{member.visits}</span></td>
          <td>{Number(member.due || 0) > 0 ? <strong className="danger-text">₹{Number(member.due).toLocaleString('en-IN')}</strong> : <span className="paid-text">Paid</span>}</td>
          <td><StatusBadge status={member.status} /></td>
          <td><div className="row-actions"><button className="table-action" onClick={() => setSelectedMember(member.id)}>View</button><button className="table-action" onClick={() => setModal({ type:'editMember', member })}>Edit</button><button className="table-action danger-text" onClick={() => deleteMember(member.id)}>Delete</button></div></td>
        </tr>)}
        {!filtered.length && <tr><td colSpan="8"><EmptyState title="No members found" text="Try another search or add a new member." /></td></tr>}
      </tbody></table></div>
    </div>
  </>;
}

function PublicAttendancePage({ data, setData }) {
  const settings = data.settings || {};
  const params = new URLSearchParams(window.location.search);
  const gymId = params.get('gym') || data.gym?.id || PRODUCTION_GYM_ID;
  const qrGymLat = params.get('lat');
  const qrGymLng = params.get('lng');

  // The permanent QR carries the gym id + coordinates so the public page
  // can validate the member's location even though the member is not logged in.
  const gymLat = Number(qrGymLat ?? settings.gymLatitude);
  const gymLng = Number(qrGymLng ?? settings.gymLongitude);
  const hasGymLocation = Number.isFinite(gymLat) && Number.isFinite(gymLng)
    && String(qrGymLat ?? settings.gymLatitude) !== ''
    && String(qrGymLng ?? settings.gymLongitude) !== '';

  const [memberNumber, setMemberNumber] = useState('');
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Requesting your location…');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // One public attendance submission per device, per gym, per calendar day.
  // This prevents the same phone/browser from being passed around to mark
  // attendance for multiple members on the same day.
  const deviceAttendanceKey = `preface-attendance-lock:${gymId || 'unknown'}:${today}`;
  const getDeviceAttendanceLock = () => {
    try {
      const raw = localStorage.getItem(deviceAttendanceKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const setDeviceAttendanceLock = (payload) => {
    try {
      localStorage.setItem(deviceAttendanceKey, JSON.stringify(payload));
    } catch {
      // Attendance has already been accepted by the server; storage failure
      // should not turn a successful check-in into an error.
    }
  };

  const requestLocation = () => {
    setResult(null);
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported by this browser.');
      return;
    }
    setLocationStatus('Requesting your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus(`Location detected (accuracy ±${Math.round(position.coords.accuracy || 0)} m)`);
      },
      (error) => {
        const message = error.code === 1
          ? 'Location permission was denied. Please allow location access and try again.'
          : 'Could not detect your location. Please try again.';
        setLocationStatus(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  const markPresent = async () => {
    setResult(null);
    const number = String(memberNumber || '').trim();

    if (!number) {
      setResult({ type: 'error', message: 'Enter your member number.' });
      return;
    }

    const existingDeviceCheckIn = getDeviceAttendanceLock();
    if (existingDeviceCheckIn) {
      const checkedInMember = existingDeviceCheckIn.memberName || existingDeviceCheckIn.memberNumber || 'a member';
      setResult({
        type: 'warning',
        message: `Attendance has already been marked from this device today for ${checkedInMember}. Only one attendance can be marked from one device per day.`,
      });
      return;
    }

    if (!gymId) {
      setResult({ type: 'error', message: 'This attendance QR is not linked to a gym.' });
      return;
    }
    if (!hasGymLocation) {
      setResult({ type: 'error', message: 'Gym location has not been configured by the owner yet.' });
      return;
    }
    if (!location) {
      setResult({ type: 'error', message: 'Your location is not available yet. Allow location access and try again.' });
      requestLocation();
      return;
    }

    const distance = distanceInMeters(location.latitude, location.longitude, gymLat, gymLng);
    if (distance > 50) {
      setResult({ type: 'error', message: `Attendance denied. You are approximately ${Math.round(distance)} m from the gym. You must be within 50 m.` });
      return;
    }

    setSubmitting(true);
    try {
      const response = await publicCheckIn({
        gymId,
        memberNumber: number,
        latitude: location.latitude,
        longitude: location.longitude,
        gymLatitude: gymLat,
        gymLongitude: gymLng,
      });

      if (!response?.success) {
        setResult({ type: 'error', message: response?.message || 'Attendance could not be marked.' });
        return;
      }

      if (response?.already_present) {
        setResult({
          type: 'warning',
          message: response?.message || 'Attendance already marked today.',
        });
        return;
      }

      const member = response.member;
      const now = new Date();
      const record = {
        id: response.attendance?.legacy_id || response.attendance?.id || `A-${Date.now()}`,
        cloudId: response.attendance?.id,
        member: member?.name || '',
        memberId: member?.member_code || member?.id || '',
        memberNumber: member?.attendance_number || number,
        date: today,
        time: response.attendance?.check_in_time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'QR check-in',
        latitude: location.latitude,
        longitude: location.longitude,
        distance: Math.round(distance),
      };

      setData((current) => ({
        ...current,
        attendance: [record, ...(current.attendance || [])],
        members: (current.members || []).map((item) =>
          item.id === record.memberId
            ? { ...item, visits: Number(item.visits || 0) + 1 }
            : item
        ),
      }));

      setDeviceAttendanceLock({
        memberNumber: number,
        memberName: member?.name || '',
        memberId: member?.member_code || member?.id || '',
        markedAt: new Date().toISOString(),
      });

      setResult({ type: 'success', message: `${member?.name || 'Member'} — attendance marked successfully.` });
      setMemberNumber('');
    } catch (error) {
      console.error('Public attendance failed:', error);
      setResult({ type: 'error', message: error?.message || 'Unable to mark attendance.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-checkin-screen">
      <div className="public-checkin-card">
        <img src={LOGO_URL} alt="Preface Fitness" className="public-checkin-logo" />
        <div className="public-checkin-heading">
          <div className="eyebrow">PREFACE FITNESS</div>
          <h2 style={{ margin: '6px 0 8px' }}>Mark Attendance</h2>
          <p style={{ color: '#718096', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
            Scan the QR at the gym entrance, enter your member number and allow location access.
          </p>
        </div>

        <div className={`public-location-status ${location ? 'is-ready' : 'is-pending'}`}>
          <strong>{location ? '✓ Location detected' : 'Location required'}</strong>
          <div style={{ marginTop: '3px' }}>{locationStatus}</div>
        </div>

        <div className="public-member-field">
          <label className="public-member-label">Member number</label>
          <input
            value={memberNumber}
            onChange={(e) => setMemberNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
            onKeyDown={(e) => { if (e.key === 'Enter') markPresent(); }}
            inputMode="numeric"
            autoFocus
            placeholder="e.g. 23"
            className="public-member-input"
          />
        </div>

        <button className="btn btn-primary public-submit-button" onClick={markPresent} disabled={submitting}>
          <CheckCircle2 size={18} /> {submitting ? 'Checking…' : 'Mark Present'}
        </button>

        <button className="link-btn public-refresh-button" onClick={requestLocation}>Refresh location</button>

        {result && (
          <div className={`public-result ${result.type === 'success' ? 'is-success' : result.type === 'warning' ? 'is-warning' : 'is-error'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

function AttendancePage({ attendance, members, markAttendance, isOwner = false, removeAttendanceRecord }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');

  const dayAttendance = attendance.filter(
    (record) => record.date === selectedDate
  );

  const isMemberPresent = (member) => dayAttendance.some((record) => {
    if (record.memberId !== undefined && record.memberId !== null && record.memberId !== '') {
      return String(record.memberId) === String(member.id);
    }
    // Legacy records without an ID can only be safely matched by name when that name is unique.
    const sameNameMembers = members.filter((item) =>
      String(item.name || '').trim().toLowerCase() === String(member.name || '').trim().toLowerCase()
    );
    return sameNameMembers.length === 1 &&
      String(record.member || '').trim().toLowerCase() === String(member.name || '').trim().toLowerCase();
  });

  const filteredMembers = members.filter((member) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return [
      member.name,
      member.phone,
      member.id,
      member.plan,
    ]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const activeCount = members.filter(
    (member) => getMembershipStatus(member.expiry) === 'Active'
  ).length;

  const attendanceRate = activeCount
    ? Math.round((dayAttendance.length / activeCount) * 100)
    : 0;

  const selectedRecords = [...dayAttendance].sort((a, b) =>
    String(b.time).localeCompare(String(a.time))
  );

  return (
    <div className="page">
      <PageTitle
        title="Attendance"
        subtitle="Track daily check-ins and member attendance history."
      />

      <div className="member-summary">
        <MetricBox
          label="Today's check-ins"
          value={dayAttendance.length}
          tone="green"
        />
        <MetricBox
          label="Total members"
          value={members.length}
        />
        <MetricBox
          label="Active members"
          value={activeCount}
          tone="teal"
        />
        <MetricBox
          label="Attendance rate"
          value={`${Math.min(attendanceRate, 100)}%`}
          tone="amber"
        />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <div className="panel-icon">
                <CheckCircle2 size={17} />
              </div>
              <div>
                <h3>Daily check-in</h3>
                <span>
                  Select a date and mark members present.
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div className="search-box compact-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member..."
              />
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership</th>
                <th>Phone</th>
                <th>Visits</th>
                <th>Status</th>
                <th>Check-in</th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.map((member) => {
                const present = isMemberPresent(member);

                return (
                  <tr key={member.id}>
                    <td>
                      <div className="member-cell">
                        <div className="avatar soft">
                          {initials(member.name)}
                        </div>
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{member.plan || '—'}</td>
                    <td>{member.phone || '—'}</td>

                    <td>
                      <span className="data-pill">
                        <Activity size={13} />
                        {member.visits || 0}
                      </span>
                    </td>

                    <td>
                      <StatusBadge
                        status={getMembershipStatus(member.expiry)}
                      />
                    </td>

                    <td>
                      {present ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 700,
                              color: '#159b8d',
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Present
                          </span>
                          {isOwner && (() => {
                            const attendanceRecord = dayAttendance.find((record) => {
                              if (record.memberId !== undefined && record.memberId !== null && record.memberId !== '') {
                                return String(record.memberId) === String(member.id);
                              }
                              const sameNameMembers = members.filter((item) =>
                                String(item.name || '').trim().toLowerCase() === String(member.name || '').trim().toLowerCase()
                              );
                              return sameNameMembers.length === 1 &&
                                String(record.member || '').trim().toLowerCase() === String(member.name || '').trim().toLowerCase();
                            });
                            return attendanceRecord ? (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeAttendanceRecord?.(attendanceRecord)}
                                title={`Remove attendance for ${member.name}`}
                                aria-label={`Remove attendance for ${member.name}`}
                                style={{
                                  marginLeft: 12,
                                  width: 36,
                                  minWidth: 36,
                                  height: 36,
                                  padding: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 10,
                                  flexShrink: 0,
                                }}
                              >
                                <X size={17} />
                              </button>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            markAttendance(
                              member.id,
                              selectedDate
                            )
                          }
                        >
                          Mark present
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filteredMembers.length && (
            <EmptyState
              title="No members found"
              text="Try another search."
            />
          )}
        </div>
      </section>

      <section className="panel">
        <PanelHeader
          title="Check-in history"
          subtitle={`Attendance recorded for ${formatDate(
            selectedDate
          )}`}
          icon={CalendarDays}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Member ID</th>
                <th>Date</th>
                <th>Check-in time</th>
              </tr>
            </thead>

            <tbody>
              {selectedRecords.map((record) => {
                const member = members.find(
                  (m) => m.name === record.member
                );

                return (
                  <tr key={record.id}>
                    <td>
                      <div className="member-cell">
                        <div className="avatar soft">
                          {initials(record.member)}
                        </div>
                        <div>
                          <strong>{record.member}</strong>
                          <span>
                            {member?.plan || 'Member'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{record.memberId || member?.id || '—'}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <strong>{record.time}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!selectedRecords.length && (
            <EmptyState
              title="No check-ins"
              text="No attendance has been recorded for this date."
            />
          )}
        </div>
      </section>
    </div>
  );
}


function ProgressPage({ progressRecords, members, setModal, deleteProgressRecord }) {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [search, setSearch] = useState('');

  const selectedMember = members.find((member) => member.id === selectedMemberId);

  const memberRecords = [...progressRecords]
    .filter((record) => record.memberId === selectedMemberId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const latest = memberRecords[0];
  const oldest = memberRecords[memberRecords.length - 1];

  const filteredMembers = members.filter((member) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [member.name, member.id, member.phone, member.plan]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const weightChange =
    latest && oldest && latest.weight && oldest.weight
      ? Number((latest.weight - oldest.weight).toFixed(1))
      : 0;

  const bodyFatChange =
    latest && oldest && latest.bodyFat && oldest.bodyFat
      ? Number((latest.bodyFat - oldest.bodyFat).toFixed(1))
      : 0;

  const bmi =
    latest?.weight && selectedMember?.height
      ? Number(
          (
            latest.weight /
            Math.pow(Number(selectedMember.height) / 100, 2)
          ).toFixed(1)
        )
      : null;

  return (
    <div className="page">
      <PageTitle
        title="Progress & Measurements"
        subtitle="Track body composition, measurements and physical progress."
        action={
          <button
            className="btn btn-primary"
            onClick={() => setModal('progress')}
          >
            <Plus size={16} />
            Add measurement
          </button>
        }
      />

      <div className="member-summary">
        <MetricBox
          label="Members tracked"
          value={new Set(progressRecords.map((record) => record.memberId)).size}
          tone="green"
        />
        <MetricBox
          label="Records"
          value={progressRecords.length}
        />
        <MetricBox
          label="Latest weight"
          value={latest?.weight ? `${latest.weight} kg` : '—'}
          tone="teal"
        />
        <MetricBox
          label="Weight change"
          value={
            weightChange
              ? `${weightChange > 0 ? '+' : ''}${weightChange} kg`
              : '—'
          }
          tone={weightChange <= 0 ? 'green' : 'amber'}
        />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <div className="panel-icon">
                <TrendingUp size={17} />
              </div>
              <div>
                <h3>Member progress</h3>
                <span>Select a member to view their complete progress history.</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div className="search-box compact-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member..."
              />
            </div>

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              {filteredMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedMember ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '18px 20px',
                borderBottom: '1px solid #edf0f2',
              }}
            >
              <div className="avatar soft">{initials(selectedMember.name)}</div>
              <div>
                <strong>{selectedMember.name}</strong>
                <div style={{ color: '#7b8794', fontSize: '13px' }}>
                  {selectedMember.id} · {selectedMember.plan || 'Member'}
                </div>
              </div>
            </div>

            <div className="member-summary" style={{ padding: '18px 20px', margin: 0 }}>
              <MetricBox
                label="Current weight"
                value={latest?.weight ? `${latest.weight} kg` : '—'}
              />
              <MetricBox
                label="Body fat"
                value={latest?.bodyFat ? `${latest.bodyFat}%` : '—'}
              />
              <MetricBox
                label="BMI"
                value={bmi || '—'}
                tone="teal"
              />
              <MetricBox
                label="Body-fat change"
                value={
                  bodyFatChange
                    ? `${bodyFatChange > 0 ? '+' : ''}${bodyFatChange}%`
                    : '—'
                }
                tone={bodyFatChange <= 0 ? 'green' : 'amber'}
              />
            </div>
          </>
        ) : (
          <EmptyState title="No member selected" text="Select a member to view progress." />
        )}
      </section>

      <section className="panel">
        <PanelHeader
          title="Measurement history"
          subtitle={selectedMember ? `Progress records for ${selectedMember.name}` : 'Select a member first'}
          icon={CalendarDays}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight</th>
                <th>Body fat</th>
                <th>Chest</th>
                <th>Waist</th>
                <th>Hips</th>
                <th>Arms</th>
                <th>Thighs</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {memberRecords.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.date)}</td>
                  <td><strong>{record.weight || '—'} kg</strong></td>
                  <td>{record.bodyFat ? `${record.bodyFat}%` : '—'}</td>
                  <td>{record.chest ? `${record.chest}"` : '—'}</td>
                  <td>{record.waist ? `${record.waist}"` : '—'}</td>
                  <td>{record.hips ? `${record.hips}"` : '—'}</td>
                  <td>{record.arms ? `${record.arms}"` : '—'}</td>
                  <td>{record.thighs ? `${record.thighs}"` : '—'}</td>
                  <td>
                    <button
                      className="icon-btn"
                      title="Delete record"
                      onClick={() => deleteProgressRecord(record.id)}
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!memberRecords.length && (
            <EmptyState
              title="No progress records"
              text="Add the first measurement for this member."
            />
          )}
        </div>
      </section>

      <section className="panel">
        <PanelHeader
          title="Latest progress notes"
          subtitle="Trainer notes from the most recent measurement."
          icon={ClipboardList}
        />

        <div style={{ padding: '20px' }}>
          {latest?.notes ? (
            <div
              style={{
                padding: '16px',
                background: '#f7f9fa',
                borderRadius: '12px',
                lineHeight: 1.6,
                color: '#46515c',
              }}
            >
              {latest.notes}
            </div>
          ) : (
            <EmptyState
              title="No notes"
              text="No trainer notes have been added to the latest record."
            />
          )}
        </div>
      </section>

      <section className="panel">
        <PanelHeader
          title="Progress photos"
          subtitle="Front, side and back photos can be attached to progress records."
          icon={Camera}
        />
        <div style={{ padding: '20px' }}>
          {latest?.photos?.front || latest?.photos?.side || latest?.photos?.back ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '14px',
              }}
            >
              {['front', 'side', 'back'].map((position) => (
                <div
                  key={position}
                  style={{
                    border: '1px solid #e7ebee',
                    borderRadius: '12px',
                    padding: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      marginBottom: '8px',
                    }}
                  >
                    {position}
                  </div>
                  {latest.photos[position] ? (
                    <img
                      src={latest.photos[position]}
                      alt={`${position} progress`}
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '180px',
                        display: 'grid',
                        placeItems: 'center',
                        background: '#f7f9fa',
                        borderRadius: '8px',
                        color: '#8a959f',
                      }}
                    >
                      No photo
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No progress photos"
              text="Add photos when recording the next measurement."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function ProgressModal({ members, onClose, onSave }) {
  const [form, setForm] = useState({
    memberId: members[0]?.id || '',
    date: today,
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    neck: '',
    notes: '',
    photos: { front: '', side: '', back: '' },
  });

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handlePhoto = (position, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        photos: { ...current.photos, [position]: reader.result },
      }));
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form.memberId || !form.date || !form.weight) {
      return;
    }

    onSave(form);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal wide-modal">
        <div className="modal-header">
          <div>
            <h3>Add progress measurement</h3>
            <span>Record body composition and measurements.</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <label>
              Member
              <select
                value={form.memberId}
                onChange={(e) => update('memberId', e.target.value)}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.id}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </label>

            <label>
              Weight (kg) *
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => update('weight', e.target.value)}
                placeholder="e.g. 78.5"
              />
            </label>

            <label>
              Body fat (%)
              <input
                type="number"
                step="0.1"
                value={form.bodyFat}
                onChange={(e) => update('bodyFat', e.target.value)}
                placeholder="e.g. 22.5"
              />
            </label>

            <label>
              Chest (in)
              <input
                type="number"
                step="0.1"
                value={form.chest}
                onChange={(e) => update('chest', e.target.value)}
              />
            </label>

            <label>
              Waist (in)
              <input
                type="number"
                step="0.1"
                value={form.waist}
                onChange={(e) => update('waist', e.target.value)}
              />
            </label>

            <label>
              Hips (in)
              <input
                type="number"
                step="0.1"
                value={form.hips}
                onChange={(e) => update('hips', e.target.value)}
              />
            </label>

            <label>
              Arms (in)
              <input
                type="number"
                step="0.1"
                value={form.arms}
                onChange={(e) => update('arms', e.target.value)}
              />
            </label>

            <label>
              Thighs (in)
              <input
                type="number"
                step="0.1"
                value={form.thighs}
                onChange={(e) => update('thighs', e.target.value)}
              />
            </label>

            <label>
              Neck (in)
              <input
                type="number"
                step="0.1"
                value={form.neck}
                onChange={(e) => update('neck', e.target.value)}
              />
            </label>
          </div>

          <label style={{ display: 'block', marginTop: '16px' }}>
            Trainer notes
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Add observations, goals or coaching notes..."
            />
          </label>

          <div style={{ marginTop: '18px' }}>
            <strong style={{ display: 'block', marginBottom: '10px' }}>
              Progress photos
            </strong>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              {['front', 'side', 'back'].map((position) => (
                <label key={position}>
                  {position.charAt(0).toUpperCase() + position.slice(1)}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handlePhoto(position, e.target.files?.[0])
                    }
                  />
                  {form.photos[position] && (
                    <img
                      src={form.photos[position]}
                      alt={`${position} preview`}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginTop: '8px',
                      }}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={!form.memberId || !form.date || !form.weight}
          >
            Save measurement
          </button>
        </div>
      </div>
    </div>
  );
}

function TrainingPage({ plans, members, setModal, deleteWorkoutPlan, updateWorkoutPlan }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(plans[0]?.id || null);
  const [assignmentMode, setAssignmentMode] = useState(null);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [checkedMemberIds, setCheckedMemberIds] = useState([]);
  const [overviewExpanded, setOverviewExpanded] = useState(true);
  const [overviewPage, setOverviewPage] = useState(1);

  useEffect(() => {
    if (selectedId && !plans.some((plan) => plan.id === selectedId)) {
      setSelectedId(plans[0]?.id || null);
    }
    if (!selectedId && plans[0]) setSelectedId(plans[0].id);
  }, [plans, selectedId]);

  const activeMembers = members.filter((member) => getMembershipStatus(member.expiry) !== 'Expired');
  const assignedMemberIds = new Set(plans.flatMap((plan) => plan.assignedMemberIds || []));
  const filteredPlans = plans.filter((plan) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [plan.name, plan.goal, plan.level, plan.trainer].join(' ').toLowerCase().includes(q);
  });
  const selectedPlan = plans.find((plan) => plan.id === selectedId) || filteredPlans[0] || null;
  const openAssignmentManager = (mode) => {
    if (!selectedPlan) return;
    setAssignmentMode(mode);
    setAssignmentSearch('');
    setCheckedMemberIds([]);
  };
  const toggleAssignmentMember = (id) => setCheckedMemberIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const saveAssignments = () => {
    if (!selectedPlan || typeof updateWorkoutPlan !== 'function') return;
    const existing = selectedPlan.assignedMemberIds || [];
    const nextIds = assignmentMode === 'remove' ? existing.filter((id) => !checkedMemberIds.includes(id)) : [...new Set([...existing, ...checkedMemberIds])];
    updateWorkoutPlan({ ...selectedPlan, assignedMemberIds: nextIds });
    setAssignmentMode(null);
  };
  const assignmentCandidates = members.filter((member) => {
    const q = assignmentSearch.trim().toLowerCase();
    const isAssigned = (selectedPlan?.assignedMemberIds || []).includes(member.id);
    if (assignmentMode === 'remove' && !isAssigned) return false;
    if (assignmentMode === 'add' && isAssigned) return false;
    return !q || [member.name, member.id, member.phone, member.plan].filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <PageTitle
        title="Training"
        subtitle="Create workout plans, assign them to members and track training structure."
        action={<button className="btn btn-primary" onClick={() => setModal('workoutPlan')}><Plus size={17} /> Create workout plan</button>}
      />

      <div className="member-summary">
        <MetricBox label="Workout plans" value={plans.length} tone="green" />
        <MetricBox label="Members with plans" value={assignedMemberIds.size} tone="teal" />
        <MetricBox label="Active members" value={activeMembers.length} />
        <MetricBox label="Exercises" value={plans.reduce((sum, plan) => sum + (plan.exercises?.length || 0), 0)} tone="amber" />
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <div className="panel-icon"><Dumbbell size={17} /></div>
              <div><h3>Workout plans</h3><span>Manage reusable training programs for your members.</span></div>
            </div>
          </div>
          <div className="search-box compact-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plans..." />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, .85fr)', gap: 18, padding: '0 18px 18px' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredPlans.map((plan) => {
              const selected = selectedPlan?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedId(plan.id)}
                  style={{
                    textAlign: 'left',
                    border: selected ? '1px solid rgba(21,155,141,.45)' : '1px solid #e7ebef',
                    background: selected ? '#f2fbf9' : '#fff',
                    borderRadius: 14,
                    padding: 16,
                    cursor: 'pointer',
                    boxShadow: selected ? '0 8px 24px rgba(21,155,141,.08)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <strong style={{ fontSize: 16, color: '#16212b' }}>{plan.name}</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
                        <span className="data-pill">{plan.goal || 'General Fitness'}</span>
                        <span className="data-pill">{plan.level || 'All levels'}</span>
                        <span className="data-pill">{plan.durationWeeks || 1} weeks</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: '#71808d', whiteSpace: 'nowrap' }}>{plan.exercises?.length || 0} exercises</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 13, color: '#71808d', fontSize: 12 }}>
                    <span>Trainer: {plan.trainer || '—'}</span>
                    <span>{(plan.assignedMemberIds || []).length} member{(plan.assignedMemberIds || []).length === 1 ? '' : 's'} assigned</span>
                  </div>
                </button>
              );
            })}
            {!filteredPlans.length && <EmptyState title="No workout plans" text="Create a plan or try another search." />}
          </div>

          {selectedPlan ? (
            <div style={{ border: '1px solid #e7ebef', borderRadius: 14, padding: 18, background: '#fff', alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div className="eyebrow">WORKOUT PLAN</div>
                  <h2 style={{ margin: '4px 0 5px', fontSize: 20 }}>{selectedPlan.name}</h2>
                  <span style={{ color: '#71808d', fontSize: 13 }}>{selectedPlan.goal || 'General Fitness'} · {selectedPlan.level || 'All levels'}</span>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button className="icon-btn" title="Edit plan" onClick={() => setModal({ type: 'editWorkoutPlan', plan: selectedPlan })}>✎</button>
                  <button className="icon-btn" title="Delete plan" onClick={() => deleteWorkoutPlan(selectedPlan.id)}><Trash2 size={16} /></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '18px 0' }}>
                <div style={{ background: '#f7f9fa', borderRadius: 10, padding: 11 }}><span style={{ display: 'block', fontSize: 11, color: '#71808d' }}>Duration</span><strong>{selectedPlan.durationWeeks || 1} weeks</strong></div>
                <div style={{ background: '#f7f9fa', borderRadius: 10, padding: 11 }}><span style={{ display: 'block', fontSize: 11, color: '#71808d' }}>Assigned</span><strong>{(selectedPlan.assignedMemberIds || []).length} members</strong></div>
              </div>

              <div className="form-section-title" style={{ marginTop: 0 }}>Exercises</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {(selectedPlan.exercises || []).map((exercise, index) => (
                  <div key={exercise.id || index} style={{ border: '1px solid #edf0f2', borderRadius: 10, padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <strong>{index + 1}. {exercise.name}</strong>
                      <span style={{ fontSize: 11, color: '#71808d' }}>{exercise.muscle || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, fontSize: 12, color: '#5e6c78' }}>
                      <span>{exercise.sets || 0} sets</span><span>{exercise.reps || '—'} reps</span><span>{exercise.rest || '—'} rest</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span>Assigned members</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button type="button" className="icon-btn" title="Assign members" aria-label="Assign members" onClick={() => openAssignmentManager('add')} style={{ width: 30, height: 30, color: '#0d9488' }}><Plus size={17} /></button>
                  <button type="button" className="icon-btn" title="Remove assigned members" aria-label="Remove assigned members" onClick={() => openAssignmentManager('remove')} style={{ width: 30, height: 30, color: '#d45d5d' }}><Trash2 size={15} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {(selectedPlan.assignedMemberIds || []).map((memberId) => {
                  const member = members.find((item) => item.id === memberId);
                  return member ? <span key={memberId} className="data-pill"><UserCheck size={13} /> {member.name}</span> : null;
                })}
                {!(selectedPlan.assignedMemberIds || []).length && <span style={{ color: '#8a96a0', fontSize: 13 }}>No members assigned yet.</span>}
              </div>

              {selectedPlan.notes && <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#f7f9fa', fontSize: 13, color: '#5e6c78' }}><strong style={{ color: '#25313a' }}>Trainer notes:</strong> {selectedPlan.notes}</div>}
            </div>
          ) : (
            <EmptyState title="Select a plan" text="Choose a workout plan to view its exercises and assignments." />
          )}
        </div>
      </div>

      <section className="panel" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: overviewExpanded ? 8 : 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PanelHeader title="Training overview" subtitle="Members currently assigned to workout plans" icon={UserCheck} />
          </div>
          <button type="button" className="icon-btn" aria-label={overviewExpanded ? 'Collapse training overview' : 'Expand training overview'} title={overviewExpanded ? 'Collapse section' : 'Expand section'} onClick={() => setOverviewExpanded((value) => !value)} style={{ flexShrink: 0, width: 34, height: 34 }}>
            {overviewExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
        </div>
        {overviewExpanded && (() => {
          const assignedMembers = members.filter((member) => plans.some((plan) => (plan.assignedMemberIds || []).includes(member.id)));
          const pageSize = 10;
          const totalPages = Math.max(1, Math.ceil(assignedMembers.length / pageSize));
          const currentPage = Math.min(overviewPage, totalPages);
          const visibleMembers = assignedMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
          return <>
            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table style={{ fontSize: 12, lineHeight: 1.25, minWidth: 760 }}>
                <thead><tr>
                  <th style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>Member</th>
                  <th style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>Membership</th>
                  <th style={{ padding: '8px 10px', minWidth: 180 }}>Workout plans</th>
                  <th style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>Level</th>
                  <th style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>Duration</th>
                  <th style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>Trainer</th>
                </tr></thead>
                <tbody>
                  {visibleMembers.map((member) => {
                    const memberPlans = plans.filter((plan) => (plan.assignedMemberIds || []).includes(member.id));
                    return <tr key={member.id}>
                      <td style={{ padding: '7px 10px' }}><div className="member-cell" style={{ gap: 8 }}><div className="avatar soft" style={{ width: 32, height: 32, minWidth: 32, overflow: 'hidden', fontSize: 11 }}>
                        {member.photo ? <img src={member.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(member.name)}
                      </div><div><strong style={{ fontSize: 12 }}>{member.name}</strong><span style={{ fontSize: 10 }}>{member.id}</span></div></div></td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{member.plan || '—'}</td>
                      <td style={{ padding: '7px 10px' }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{memberPlans.map((plan) => <span key={plan.id} style={{ display: 'inline-block', padding: '3px 7px', borderRadius: 6, background: '#f1f5f9', color: '#334155', fontSize: 11, whiteSpace: 'nowrap' }} title={`${plan.name} · ${plan.level || '—'} · ${plan.durationWeeks || 1} weeks`}>{plan.name}</span>)}</div></td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{[...new Set(memberPlans.map((plan) => plan.level).filter(Boolean))].join(', ') || '—'}</td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{[...new Set(memberPlans.map((plan) => `${plan.durationWeeks || 1} weeks`))].join(', ') || '—'}</td>
                      <td style={{ padding: '7px 10px' }}>{[...new Set(memberPlans.map((plan) => plan.trainer).filter(Boolean))].join(', ') || '—'}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
              {!assignedMembers.length && <EmptyState title="No assignments yet" text="Assign members while creating or editing a workout plan." />}
            </div>
            {assignedMembers.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 2px 0', fontSize: 12, color: '#718096' }}>
              <span>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, assignedMembers.length)} of {assignedMembers.length} members</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '5px 10px', minHeight: 30, fontSize: 12 }} disabled={currentPage <= 1} onClick={() => setOverviewPage((page) => Math.max(1, page - 1))}>Previous</button>
                <span style={{ minWidth: 58, textAlign: 'center' }}>Page {currentPage} / {totalPages}</span>
                <button type="button" className="btn btn-secondary" style={{ padding: '5px 10px', minHeight: 30, fontSize: 12 }} disabled={currentPage >= totalPages} onClick={() => setOverviewPage((page) => Math.min(totalPages, page + 1))}>Next</button>
              </div>
            </div>}
          </>;
        })()}
      </section>
      {assignmentMode && selectedPlan && <Modal title={assignmentMode === 'add' ? `Assign members · ${selectedPlan.name}` : `Manage assigned members · ${selectedPlan.name}`} onClose={() => setAssignmentMode(null)} wide>
        <div style={{ color: '#71808d', fontSize: 13, marginBottom: 12 }}>{assignmentMode === 'add' ? 'Select members to add to this workout plan.' : 'Select the members you want to remove from this workout plan.'}</div>
        <div className="search-box" style={{ marginBottom: 12, maxWidth: '100%' }}><Search size={16} /><input value={assignmentSearch} onChange={(e) => setAssignmentSearch(e.target.value)} placeholder="Search by name, member ID or phone..." /></div>
        <div style={{ maxHeight: 320, overflowY: 'auto', display: 'grid', gap: 8 }}>
          {assignmentCandidates.map((member) => <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 11, border: '1px solid #e7ebef', borderRadius: 10, cursor: 'pointer', background: checkedMemberIds.includes(member.id) ? '#f2fbf9' : '#fff' }}>
            <input type="checkbox" checked={checkedMemberIds.includes(member.id)} onChange={() => toggleAssignmentMember(member.id)} />
            <div style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 13 }}>{member.name}</strong><span style={{ fontSize: 11, color: '#71808d' }}>{member.id} · {member.phone || 'No phone'} · {member.plan || 'No plan'}</span></div>
          </label>)}
          {!assignmentCandidates.length && <div style={{ padding: 18, textAlign: 'center', color: '#71808d' }}>{assignmentMode === 'remove' ? 'No assigned members match your search.' : 'No unassigned members match your search.'}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <span style={{ fontSize: 12, color: '#71808d' }}>{assignmentMode === 'add' ? `${checkedMemberIds.filter((id) => !(selectedPlan.assignedMemberIds || []).includes(id)).length} member(s) selected to add` : `${checkedMemberIds.filter((id) => (selectedPlan.assignedMemberIds || []).includes(id)).length} member(s) selected to remove`}</span>
          <div style={{ display: 'flex', gap: 8 }}><button type="button" className="btn btn-secondary" onClick={() => setAssignmentMode(null)}>Cancel</button><button type="button" className="btn btn-primary" onClick={saveAssignments} disabled={!checkedMemberIds.length}>{assignmentMode === 'add' ? 'Assign selected' : 'Remove selected'}</button></div>
        </div>
      </Modal>}
    </div>
  );
}

function WorkoutPlanModal({ members, onClose, onSave, plan, muscleGroups = [], onAddMuscleGroup, onRemoveMuscleGroup }) {
  const defaultMuscleGroups = ['Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];
  const [memberSearch, setMemberSearch] = useState('');
  const [form, setForm] = useState(() => plan ? {
    ...plan,
    goal: plan.goal || 'General Fitness',
    level: plan.level || 'Beginner',
    durationWeeks: plan.durationWeeks || 4,
    trainer: plan.trainer || 'Administrator',
    notes: plan.notes || '',
    assignedMemberIds: plan.assignedMemberIds || [],
    exercises: plan.exercises?.length ? plan.exercises.map((exercise) => ({ ...exercise, muscle: exercise.muscle || 'Full Body' })) : [{ id: `EX-${Date.now()}`, name: '', muscle: 'Full Body', sets: 3, reps: '15', rest: '60 sec' }],
  } : {
    name: '', goal: 'General Fitness', level: 'Beginner', durationWeeks: 4, trainer: 'Administrator', notes: '', assignedMemberIds: [],
    exercises: [{ id: `EX-${Date.now()}`, name: '', muscle: 'Full Body', sets: 3, reps: '15', rest: '60 sec' }],
  });

  const allMuscleGroups = [...new Set([...defaultMuscleGroups, ...(muscleGroups || []).filter(Boolean), ...(form.exercises || []).map((exercise) => exercise.muscle).filter(Boolean)])];
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateExercise = (index, key, value) => setForm((current) => ({ ...current, exercises: current.exercises.map((exercise, i) => i === index ? { ...exercise, [key]: value } : exercise) }));
  const addExercise = () => setForm((current) => ({ ...current, exercises: [...current.exercises, { id: `EX-${Date.now()}-${current.exercises.length}`, name: '', muscle: 'Full Body', sets: 3, reps: '15', rest: '60 sec' }] }));
  const removeExercise = (index) => setForm((current) => ({ ...current, exercises: current.exercises.filter((_, i) => i !== index) }));
  const toggleMember = (id) => setForm((current) => ({ ...current, assignedMemberIds: current.assignedMemberIds.includes(id) ? current.assignedMemberIds.filter((item) => item !== id) : [...current.assignedMemberIds, id] }));
  const removeMuscleGroup = (exerciseIndex) => {
    const selected = String(form.exercises[exerciseIndex]?.muscle || '').trim();
    if (!selected) return;
    if (defaultMuscleGroups.some((group) => group.toLowerCase() === selected.toLowerCase())) {
      window.alert('Default muscle groups cannot be deleted. Select a custom group to remove it.');
      return;
    }
    const savedCustomGroups = (muscleGroups || []).filter((group) => !defaultMuscleGroups.some((defaultGroup) => String(defaultGroup).toLowerCase() === String(group).toLowerCase()));
    if (!savedCustomGroups.some((group) => String(group).toLowerCase() === selected.toLowerCase())) {
      window.alert('Select a saved custom muscle group from the dropdown to delete it.');
      return;
    }
    if (!window.confirm(`Delete the custom muscle group "${selected}"? It will be removed from the dropdown and exercises using it will switch to Full Body.`)) return;
    if (typeof onRemoveMuscleGroup === 'function') onRemoveMuscleGroup(selected);
    setForm((current) => ({ ...current, exercises: current.exercises.map((exercise) => String(exercise.muscle).toLowerCase() === selected.toLowerCase() ? { ...exercise, muscle: 'Full Body' } : exercise) }));
  };
  const addMuscleGroup = (exerciseIndex) => {
    const value = window.prompt('Enter new muscle group name:');
    const clean = String(value || '').trim();
    if (!clean) return;
    const existing = allMuscleGroups.find((item) => item.toLowerCase() === clean.toLowerCase());
    if (existing) {
      setForm((current) => ({ ...current, exercises: current.exercises.map((exercise, i) => i === exerciseIndex ? { ...exercise, muscle: existing } : exercise) }));
      return;
    }
    if (typeof onAddMuscleGroup === 'function') onAddMuscleGroup(clean);
    setForm((current) => ({ ...current, exercises: current.exercises.map((exercise, i) => i === exerciseIndex ? { ...exercise, muscle: clean } : exercise) }));
  };
  const query = memberSearch.trim().toLowerCase();
  const filteredMembers = (members || []).filter((member) => !query || [member.name, member.id, member.phone, member.plan].filter(Boolean).join(' ').toLowerCase().includes(query));
  const valid = form.name.trim() && form.exercises.some((exercise) => exercise.name.trim());
  const submit = () => onSave({ ...form, name: form.name.trim(), durationWeeks: Number(form.durationWeeks || 1), exercises: form.exercises.filter((exercise) => exercise.name.trim()).map(({ weight, ...exercise }) => ({ ...exercise, sets: Number(exercise.sets || 1) })) });

  return <Modal title={plan ? 'Edit workout plan' : 'Create workout plan'} onClose={onClose} wide>
    <div className="form-section-title">Plan details</div>
    <div className="form-grid three">
      <FormField label="Plan name"><input autoFocus value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Fat Loss Foundation" /></FormField>
      <FormField label="Goal"><select value={form.goal} onChange={(e) => update('goal', e.target.value)}><option>General Fitness</option><option>Fat Loss</option><option>Muscle Building</option><option>Strength</option><option>Rehabilitation</option><option>Sports Performance</option></select></FormField>
      <FormField label="Level"><select value={form.level} onChange={(e) => update('level', e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></FormField>
    </div>
    <div className="form-grid three">
      <FormField label="Duration (weeks)"><input type="number" min="1" max="52" value={form.durationWeeks} onChange={(e) => update('durationWeeks', e.target.value)} /></FormField>
      <FormField label="Trainer"><input value={form.trainer} onChange={(e) => update('trainer', e.target.value)} placeholder="Trainer name" /></FormField>
      <FormField label="Notes"><input value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Training instructions" /></FormField>
    </div>

    <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>Exercises</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={addExercise}><Plus size={14} /> Add exercise</button>
    </div>
    <div style={{ display: 'grid', gap: 10 }}>
      {form.exercises.map((exercise, index) => <div key={exercise.id || index} style={{ border: '1px solid #e7ebef', borderRadius: 12, padding: 12 }}>
        <div className="form-grid three">
          <FormField label={`Exercise ${index + 1}`}><input value={exercise.name} onChange={(e) => updateExercise(index, 'name', e.target.value)} placeholder="Exercise name" /></FormField>
          <FormField label="Muscle group"><div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}><select style={{ flex: 1, minWidth: 0, minHeight: 48, padding: '0 14px', fontSize: 16 }} value={exercise.muscle} onChange={(e) => updateExercise(index, 'muscle', e.target.value)}>{allMuscleGroups.map((group) => <option key={group} value={group}>{group}</option>)}</select><button type="button" className="btn btn-secondary btn-sm" onClick={() => addMuscleGroup(index)} title="Add a muscle group" aria-label="Add muscle group" style={{ flex: '0 0 42px', width: 42, minWidth: 42, height: 48, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} /></button><button type="button" className="btn btn-secondary btn-sm" onClick={() => removeMuscleGroup(index)} title="Delete the selected custom muscle group" aria-label="Delete selected custom muscle group" style={{ flex: '0 0 42px', width: 42, minWidth: 42, height: 48, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#d45d5d' }}><Trash2 size={17} /></button></div></FormField>
          <FormField label="Sets"><input type="number" min="1" value={exercise.sets} onChange={(e) => updateExercise(index, 'sets', e.target.value)} /></FormField>
        </div>
        <div className="form-grid three">
          <FormField label="Reps"><input value={exercise.reps} onChange={(e) => updateExercise(index, 'reps', e.target.value)} placeholder="8-12" /></FormField>
          <FormField label="Rest"><input value={exercise.rest} onChange={(e) => updateExercise(index, 'rest', e.target.value)} placeholder="60 sec" /></FormField>
          <div />
        </div>
        {form.exercises.length > 1 && <button type="button" className="link-btn" style={{ color: '#d45d5d' }} onClick={() => removeExercise(index)}><Trash2 size={14} /> Remove exercise</button>}
      </div>)}
    </div>

    <div className="form-section-title">Assign members</div>
    <div className="search-box" style={{ marginBottom: 10, maxWidth: '100%' }}><Search size={16} /><input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members by name, ID, phone or plan..." /></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, color: '#71808d', fontSize: 12 }}><span>{filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'} found</span><strong>{form.assignedMemberIds.length} selected</strong></div>
    <div style={{ maxHeight: 190, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
      {filteredMembers.map((member) => <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', border: '1px solid #e7ebef', borderRadius: 10, cursor: 'pointer', background: form.assignedMemberIds.includes(member.id) ? '#f2fbf9' : '#fff' }}>
        <input type="checkbox" checked={form.assignedMemberIds.includes(member.id)} onChange={() => toggleMember(member.id)} />
        <div><strong style={{ display: 'block', fontSize: 13 }}>{member.name}</strong><span style={{ fontSize: 11, color: '#71808d' }}>{member.id} · {member.plan || 'No plan'}</span></div>
      </label>)}
      {!filteredMembers.length && <div style={{ gridColumn: '1 / -1', padding: 16, textAlign: 'center', color: '#71808d', border: '1px dashed #dce3ed', borderRadius: 10 }}>No members match your search.</div>}
    </div>

    <ModalActions onClose={onClose} disabled={!valid} onSave={submit} saveLabel={plan ? 'Save changes' : 'Create plan'} />
  </Modal>;
}

function DietPage({ plans, members, setModal, deleteDietPlan }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(plans[0]?.id || null);

  useEffect(() => {
    if (selectedId && !plans.some((plan) => plan.id === selectedId)) setSelectedId(plans[0]?.id || null);
    if (!selectedId && plans[0]) setSelectedId(plans[0].id);
  }, [plans, selectedId]);

  const filteredPlans = plans.filter((plan) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [plan.name, plan.goal, plan.coach, ...(plan.assignedMemberIds || []).map((id) => members.find((m) => m.id === id)?.name || '')]
      .join(' ').toLowerCase().includes(q);
  });

  const selected = plans.find((plan) => plan.id === selectedId) || filteredPlans[0] || null;
  const totalAssigned = new Set(plans.flatMap((plan) => plan.assignedMemberIds || [])).size;
  const avgCalories = plans.length ? Math.round(plans.reduce((sum, plan) => sum + Number(plan.calories || 0), 0) / plans.length) : 0;
  const avgProtein = plans.length ? Math.round(plans.reduce((sum, plan) => sum + Number(plan.protein || 0), 0) / plans.length) : 0;

  return <div className="page">
    <PageTitle title="Diet & Nutrition" subtitle="Create nutrition plans, assign them to members and track daily targets." action={<button className="btn btn-primary" onClick={() => setModal('dietPlan')}><Plus size={18} /> New diet plan</button>} />

    <div className="member-summary">
      <MetricBox label="Diet plans" value={plans.length} tone="green" />
      <MetricBox label="Members assigned" value={totalAssigned} tone="teal" />
      <MetricBox label="Avg. calories" value={avgCalories ? `${avgCalories} kcal` : '—'} />
      <MetricBox label="Avg. protein" value={avgProtein ? `${avgProtein} g` : '—'} tone="amber" />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, .95fr) minmax(0, 1.55fr)', gap: 16, alignItems: 'start' }}>
      <section className="panel">
        <div className="panel-header">
          <div><div className="panel-title"><div className="panel-icon"><Target size={17} /></div><div><h3>Diet plans</h3><span>Reusable nutrition templates</span></div></div></div>
          <div className="search-box compact-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plan..." /></div>
        </div>
        <div style={{ display: 'grid', gap: 8, padding: '0 14px 14px' }}>
          {filteredPlans.map((plan) => <button key={plan.id} onClick={() => setSelectedId(plan.id)} style={{ textAlign: 'left', border: selected?.id === plan.id ? '1px solid #39b6a7' : '1px solid #e7ebef', background: selected?.id === plan.id ? '#f2fbf9' : '#fff', borderRadius: 12, padding: 13, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}><div><strong style={{ display: 'block', color: '#16242d' }}>{plan.name}</strong><span style={{ display: 'block', marginTop: 3, color: '#71808d', fontSize: 12 }}>{plan.goal} · {plan.durationWeeks} weeks</span></div><span className="status-badge active">{plan.protein || 0}g protein</span></div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: '#5f6f7b' }}><span>{plan.calories || 0} kcal/day</span><span>{(plan.assignedMemberIds || []).length} members</span></div>
          </button>)}
          {!filteredPlans.length && <EmptyState title="No diet plans" text="Create your first nutrition plan." />}
        </div>
      </section>

      <section className="panel">
        {selected ? <>
          <PanelHeader title={selected.name} subtitle={`${selected.goal} · ${selected.durationWeeks} weeks · Coach: ${selected.coach || '—'}`} icon={Target} action={<div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'editDietPlan', plan: selected })}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => deleteDietPlan(selected.id)}><Trash2 size={14} /> Delete</button></div>} />
          <div style={{ padding: '0 16px 16px' }}>
            <div className="member-summary" style={{ marginBottom: 16 }}><MetricBox label="Daily calories" value={`${selected.calories || 0} kcal`} tone="green" /><MetricBox label="Daily protein" value={`${selected.protein || 0} g`} tone="teal" /><MetricBox label="Meals" value={(selected.meals || []).length} /><MetricBox label="Assigned" value={(selected.assignedMemberIds || []).length} tone="amber" /></div>
            <div className="form-section-title">Meal plan</div>
            <div className="table-wrap"><table><thead><tr><th>Meal</th><th>Food / description</th><th>Calories</th><th>Protein</th></tr></thead><tbody>{(selected.meals || []).map((meal) => <tr key={meal.id}><td><strong>{meal.meal}</strong></td><td>{meal.food}</td><td>{Number(meal.calories || 0)} kcal</td><td>{Number(meal.protein || 0)} g</td></tr>)}</tbody></table></div>
            <div className="form-section-title">Assigned members</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>{members.filter((member) => (selected.assignedMemberIds || []).includes(member.id)).map((member) => <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 10, border: '1px solid #e7ebef', borderRadius: 10 }}><div className="avatar soft">{initials(member.name)}</div><div><strong style={{ display: 'block', fontSize: 13 }}>{member.name}</strong><span style={{ color: '#71808d', fontSize: 11 }}>{member.id} · {member.plan || 'Member'}</span></div></div>)}</div>
            {!(selected.assignedMemberIds || []).length && <div className="form-hint">No members assigned to this plan yet.</div>}
            {selected.notes && <><div className="form-section-title">Coach notes</div><div style={{ padding: 12, borderRadius: 10, background: '#f7f9fa', color: '#5f6f7b', lineHeight: 1.55 }}>{selected.notes}</div></>}
          </div>
        </> : <EmptyState title="Select a diet plan" text="Choose a plan from the list to see its details." />}
      </section>
    </div>
  </div>;
}

function DietPlanModal({ members, onClose, onSave, plan }) {
  const defaultMeal = (index = 0) => ({ id: `MEAL-${Date.now()}-${index}`, meal: ['Breakfast', 'Lunch', 'Snack', 'Dinner'][index] || 'Meal', food: '', calories: 0, protein: 0 });
  const [form, setForm] = useState(() => plan ? { ...plan, goal: plan.goal || 'General Fitness', calories: plan.calories || 0, protein: plan.protein || 0, durationWeeks: plan.durationWeeks || 4, coach: plan.coach || 'Administrator', notes: plan.notes || '', assignedMemberIds: plan.assignedMemberIds || [], meals: plan.meals?.length ? plan.meals : [defaultMeal(0)] } : { name: '', goal: 'General Fitness', calories: 2000, protein: 120, durationWeeks: 4, coach: 'Administrator', notes: '', assignedMemberIds: [], meals: [defaultMeal(0), defaultMeal(1), defaultMeal(2), defaultMeal(3)] });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateMeal = (index, key, value) => setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === index ? { ...meal, [key]: value } : meal) }));
  const addMeal = () => setForm((current) => ({ ...current, meals: [...current.meals, defaultMeal(current.meals.length)] }));
  const removeMeal = (index) => setForm((current) => ({ ...current, meals: current.meals.filter((_, i) => i !== index) }));
  const toggleMember = (id) => setForm((current) => ({ ...current, assignedMemberIds: current.assignedMemberIds.includes(id) ? current.assignedMemberIds.filter((item) => item !== id) : [...current.assignedMemberIds, id] }));
  const valid = form.name.trim() && form.meals.some((meal) => meal.food.trim());
  const submit = () => onSave({ ...form, name: form.name.trim(), calories: Number(form.calories || 0), protein: Number(form.protein || 0), durationWeeks: Number(form.durationWeeks || 1), meals: form.meals.filter((meal) => meal.food.trim()).map((meal) => ({ ...meal, calories: Number(meal.calories || 0), protein: Number(meal.protein || 0) })) });

  return <Modal title={plan ? 'Edit diet plan' : 'Create diet plan'} onClose={onClose} wide>
    <div className="form-section-title">Plan details</div>
    <div className="form-grid three"><FormField label="Plan name"><input autoFocus value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Fat Loss Starter" /></FormField><FormField label="Goal"><select value={form.goal} onChange={(e) => update('goal', e.target.value)}><option>General Fitness</option><option>Fat Loss</option><option>Muscle Building</option><option>Weight Gain</option><option>Performance</option><option>Maintenance</option></select></FormField><FormField label="Duration (weeks)"><input type="number" min="1" max="52" value={form.durationWeeks} onChange={(e) => update('durationWeeks', e.target.value)} /></FormField></div>
    <div className="form-grid three"><FormField label="Daily calories"><input type="number" min="0" value={form.calories} onChange={(e) => update('calories', e.target.value)} /></FormField><FormField label="Daily protein (g)"><input type="number" min="0" value={form.protein} onChange={(e) => update('protein', e.target.value)} /></FormField><FormField label="Coach / dietitian"><input value={form.coach} onChange={(e) => update('coach', e.target.value)} placeholder="Name" /></FormField></div>
    <FormField label="Plan notes"><textarea rows="2" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Nutrition instructions, restrictions, meal timing, etc." /></FormField>
    <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Meals</span><button className="btn btn-secondary btn-sm" onClick={addMeal}><Plus size={14} /> Add meal</button></div>
    <div style={{ display: 'grid', gap: 10 }}>{form.meals.map((meal, index) => <div key={meal.id || index} style={{ border: '1px solid #e7ebef', borderRadius: 12, padding: 12 }}><div className="form-grid four"><FormField label="Meal"><select value={meal.meal} onChange={(e) => updateMeal(index, 'meal', e.target.value)}><option>Breakfast</option><option>Mid-morning</option><option>Lunch</option><option>Pre-workout</option><option>Post-workout</option><option>Snack</option><option>Dinner</option><option>Other</option></select></FormField><FormField label="Food / description"><input value={meal.food} onChange={(e) => updateMeal(index, 'food', e.target.value)} placeholder="e.g. Paneer + roti + salad" /></FormField><FormField label="Calories"><input type="number" min="0" value={meal.calories} onChange={(e) => updateMeal(index, 'calories', e.target.value)} /></FormField><FormField label="Protein (g)"><input type="number" min="0" value={meal.protein} onChange={(e) => updateMeal(index, 'protein', e.target.value)} /></FormField></div>{form.meals.length > 1 && <button className="link-btn" style={{ color: '#d45d5d' }} onClick={() => removeMeal(index)}><Trash2 size={14} /> Remove meal</button>}</div>)}</div>
    <div className="form-section-title">Assign members</div>
    <div style={{ maxHeight: 190, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>{members.map((member) => <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', border: '1px solid #e7ebef', borderRadius: 10, cursor: 'pointer', background: form.assignedMemberIds.includes(member.id) ? '#f2fbf9' : '#fff' }}><input type="checkbox" checked={form.assignedMemberIds.includes(member.id)} onChange={() => toggleMember(member.id)} /><div><strong style={{ display: 'block', fontSize: 13 }}>{member.name}</strong><span style={{ fontSize: 11, color: '#71808d' }}>{member.id} · {member.plan || 'No plan'}</span></div></label>)}</div>
    <ModalActions onClose={onClose} disabled={!valid} onSave={submit} saveLabel={plan ? 'Save changes' : 'Create plan'} />
  </Modal>;
}


function LeadsPage({
  leads,
  members,
  setModal,
  updateLeadStage,
  updateLeadDetails,
  deleteLead,
  convertLeadToMember,
}) {
  const stages = [
    'New',
    'Contacted',
    'Trial Booked',
    'Trial Attended',
    'Negotiation',
    'Converted',
    'Lost',
  ];

  const [search, setSearch] = useState('');
  const [source, setSource] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);

  const filteredLeads = leads.filter((lead) => {
    const q = search.trim().toLowerCase();

    const matchesSearch =
      !q ||
      [lead.name, lead.phone, lead.email, lead.source, lead.stage, lead.notes]
        .join(' ')
        .toLowerCase()
        .includes(q);

    const matchesSource = source === 'All' || lead.source === source;

    return matchesSearch && matchesSource;
  });

  const sourceOptions = [
    'All',
    ...Array.from(new Set(leads.map((lead) => lead.source).filter(Boolean))),
  ];

  const activeLeads = leads.filter(
    (lead) => !['Converted', 'Lost'].includes(lead.stage)
  ).length;

  const followUpsToday = leads.filter(
    (lead) => lead.followUp === today && !['Converted', 'Lost'].includes(lead.stage)
  ).length;

  const converted = leads.filter((lead) => lead.stage === 'Converted').length;
  const conversionRate = leads.length
    ? Math.round((converted / leads.length) * 100)
    : 0;

  const openLead = (lead) => setSelectedLead(lead);

  const moveStage = (lead, nextStage) => {
    updateLeadStage(lead.id, nextStage);
    setSelectedLead({ ...lead, stage: nextStage });
  };

  return (
    <div className="page">
      <PageTitle
        title="Leads & Sales CRM"
        subtitle="Track prospects from first contact to membership conversion."
        action={
          <button className="btn btn-primary" onClick={() => setModal('lead')}>
            <Plus size={16} />
            Add lead
          </button>
        }
      />

      <div className="member-summary">
        <MetricBox label="Total leads" value={leads.length} tone="green" />
        <MetricBox label="Active pipeline" value={activeLeads} />
        <MetricBox label="Follow-ups today" value={followUpsToday} tone="amber" />
        <MetricBox label="Converted" value={`${converted} (${conversionRate}%)`} tone="teal" />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <div className="panel-icon">
                <Target size={17} />
              </div>
              <div>
                <h3>Sales pipeline</h3>
                <span>Move leads through each stage of the sales journey.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-box compact-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
              />
            </div>

            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {sourceOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(190px, 1fr))',
            gap: '14px',
            padding: '20px',
            overflowX: 'auto',
          }}
        >
          {stages.map((stage) => {
            const stageLeads = filteredLeads.filter((lead) => lead.stage === stage);

            return (
              <div
                key={stage}
                style={{
                  minHeight: '330px',
                  background: '#f7f9fa',
                  border: '1px solid #e8ecef',
                  borderRadius: '14px',
                  padding: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <strong style={{ fontSize: '13px' }}>{stage}</strong>
                  <span className="data-pill">{stageLeads.length}</span>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {stageLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => openLead(lead)}
                      style={{
                        textAlign: 'left',
                        border: '1px solid #e3e8eb',
                        background: '#fff',
                        borderRadius: '11px',
                        padding: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 7px rgba(0,0,0,.03)',
                      }}
                    >
                      <strong style={{ display: 'block', marginBottom: '6px' }}>
                        {lead.name}
                      </strong>

                      <span style={{ display: 'block', fontSize: '12px', color: '#7b8794' }}>
                        {lead.phone || 'No phone'}
                      </span>

                      <span style={{ display: 'block', fontSize: '12px', color: '#7b8794', marginTop: '4px' }}>
                        {lead.source || 'Walk-in'}
                      </span>

                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '9px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: lead.followUp === today ? '#c47a00' : '#7b8794',
                        }}
                      >
                        Follow-up: {lead.followUp ? formatDate(lead.followUp) : '—'}
                      </span>
                    </button>
                  ))}

                  {!stageLeads.length && (
                    <div style={{ color: '#9aa4ad', fontSize: '12px', padding: '15px 4px' }}>
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <PanelHeader
          title="Lead details"
          subtitle="Select a lead above to view contact and follow-up information."
          icon={ClipboardList}
        />

        {selectedLead ? (
          <div style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '20px',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div className="member-cell">
                <div className="avatar soft">{initials(selectedLead.name)}</div>
                <div>
                  <strong>{selectedLead.name}</strong>
                  <span>{selectedLead.phone || 'No phone'} · {selectedLead.email || 'No email'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setModal({ type: 'editLead', lead: selectedLead })}
                >
                  Edit lead
                </button>

                {selectedLead.stage !== 'Converted' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => convertLeadToMember(selectedLead)}
                  >
                    Convert to member
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={() => deleteLead(selectedLead.id)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '14px',
                marginTop: '20px',
              }}
            >
              <div className="data-card">
                <span>Current stage</span>
                <strong>{selectedLead.stage}</strong>
              </div>
              <div className="data-card">
                <span>Lead source</span>
                <strong>{selectedLead.source || '—'}</strong>
              </div>
              <div className="data-card">
                <span>Follow-up</span>
                <strong>{selectedLead.followUp ? formatDate(selectedLead.followUp) : '—'}</strong>
              </div>
              <div className="data-card">
                <span>Interested plan</span>
                <strong>{selectedLead.interestedPlan || '—'}</strong>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700 }}>
                Move pipeline stage
              </label>
              <select
                value={selectedLead.stage}
                onChange={(e) => moveStage(selectedLead, e.target.value)}
              >
                {stages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </div>

            {selectedLead.notes && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '15px',
                  borderRadius: '11px',
                  background: '#f7f9fa',
                  color: '#53606b',
                  lineHeight: 1.6,
                }}
              >
                <strong>Notes</strong>
                <div style={{ marginTop: '5px' }}>{selectedLead.notes}</div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No lead selected"
            text="Click a lead card in the pipeline to view its details."
          />
        )}
      </section>
    </div>
  );
}

function LeadModal({ onClose, onSave, lead }) {
  const [form, setForm] = useState(() => lead ? {
    ...lead,
    email: lead.email || '',
    source: lead.source || 'Walk-in',
    stage: lead.stage || 'New',
    followUp: lead.followUp || today,
    interestedPlan: lead.interestedPlan || 'Monthly',
    notes: lead.notes || '',
  } : {
    name: '',
    phone: '',
    email: '',
    source: 'Walk-in',
    stage: 'New',
    followUp: today,
    interestedPlan: 'Monthly',
    notes: '',
  });

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.name.trim()) return;

    onSave({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>{lead ? 'Edit lead' : 'Add lead'}</h3>
            <span>Capture prospect details and the next follow-up.</span>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <label>
              Name *
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Lead name"
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="Phone number"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="Email address"
              />
            </label>

            <label>
              Source
              <select value={form.source} onChange={(e) => update('source', e.target.value)}>
                <option>Walk-in</option>
                <option>Instagram</option>
                <option>Facebook</option>
                <option>Google</option>
                <option>Referral</option>
                <option>Website</option>
                <option>WhatsApp</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Stage
              <select value={form.stage} onChange={(e) => update('stage', e.target.value)}>
                <option>New</option>
                <option>Contacted</option>
                <option>Trial Booked</option>
                <option>Trial Attended</option>
                <option>Negotiation</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
            </label>

            <label>
              Follow-up date
              <input
                type="date"
                value={form.followUp}
                onChange={(e) => update('followUp', e.target.value)}
              />
            </label>

            <label>
              Interested plan
              <select
                value={form.interestedPlan}
                onChange={(e) => update('interestedPlan', e.target.value)}
              >
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Half-yearly</option>
                <option>Annual</option>
              </select>
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Notes
              <textarea
                rows="4"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Lead requirements, objections, follow-up notes..."
              />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!form.name.trim()}>
            {lead ? 'Save changes' : 'Add lead'}
          </button>
        </div>
      </div>
    </div>
  );
}


function PaymentsPage({ payments, overdue, setModal, deletePayment, members = [], settings = {} }) {
  const [typeFilter, setTypeFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [search, setSearch] = useState('');

  const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const membershipRevenue = payments
    .filter((payment) => payment.type === 'Membership')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const ptRevenue = payments
    .filter((payment) => payment.type === 'PT')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const todayRevenue = payments
    .filter((payment) => payment.date === today)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const filteredPayments = payments.filter((payment) => {
    const q = search.trim().toLowerCase();
    const searchMatch = !q || `${payment.member} ${payment.id}`.toLowerCase().includes(q);
    const typeMatch = typeFilter === 'All' || payment.type === typeFilter;
    const modeMatch = modeFilter === 'All' || payment.mode === modeFilter;
    return searchMatch && typeMatch && modeMatch;
  });

  return <div className="page">
    <PageTitle
      title="Payments & Billing"
      subtitle="Track collections, membership payments and outstanding dues."
      action={<button className="btn btn-primary" onClick={() => setModal('payment')}><Plus size={17} /> Record payment</button>}
    />

    <div className="member-summary">
      <MetricBox label="Total collected" value={`₹${totalRevenue.toLocaleString('en-IN')}`} tone="green" />
      <MetricBox label="Today" value={`₹${todayRevenue.toLocaleString('en-IN')}`} />
      <MetricBox label="Membership revenue" value={`₹${membershipRevenue.toLocaleString('en-IN')}`} tone="teal" />
      <MetricBox label="Outstanding dues" value={`₹${Number(overdue || 0).toLocaleString('en-IN')}`} tone="red" />
    </div>

    <section className="panel">
      <PanelHeader title="Revenue overview" subtitle="Recorded collections by category" />
      <div className="revenue-breakdown">
        <div><span>Membership</span><strong>₹{membershipRevenue.toLocaleString('en-IN')}</strong></div>
        <div><span>Personal training</span><strong>₹{ptRevenue.toLocaleString('en-IN')}</strong></div>
        <div><span>Other</span><strong>₹{Math.max(0, totalRevenue - membershipRevenue - ptRevenue).toLocaleString('en-IN')}</strong></div>
      </div>
    </section>

    <section className="panel">
      <PanelHeader title="Pending member payments" subtitle="Members with an outstanding balance, including members added with no initial payment." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Member</th><th>Plan</th><th>Membership amount</th><th>Paid</th><th>Outstanding due</th><th>Action</th></tr></thead>
          <tbody>
            {members.filter((member) => Number(member.due || 0) > 0).sort((a, b) => Number(b.due || 0) - Number(a.due || 0)).map((member) => (
              <tr key={`due-${member.id}`}>
                <td><strong>{member.name || 'Member'}</strong><div className="small-muted">{member.id}{member.phone ? ` · ${member.phone}` : ''}</div></td>
                <td>{member.plan || 'Membership'}</td>
                <td>₹{Number(member.amount || 0).toLocaleString('en-IN')}</td>
                <td>₹{Number(member.paid || 0).toLocaleString('en-IN')}</td>
                <td><strong className="danger-text">₹{Number(member.due || 0).toLocaleString('en-IN')}</strong></td>
                <td><button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'invoiceOptions', member, payment: null })}>View invoice</button></td>
              </tr>
            ))}
            {!members.some((member) => Number(member.due || 0) > 0) && <tr><td colSpan="6"><EmptyState title="No pending member payments" text="Members with an outstanding balance will appear here." /></td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>Payment ledger</h3>
          <span>Every recorded transaction appears here.</span>
        </div>
        <div className="table-filters">
          <div className="search-box compact-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search member or payment ID" /></div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All</option><option>Membership</option><option>PT</option><option>Class</option><option>Other</option></select>
          <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}><option>All</option><option>UPI</option><option>Cash</option><option>Card</option><option>Bank transfer</option></select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Payment ID</th><th>Member</th><th>Date</th><th>Type</th><th>Mode</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {filteredPayments.map((payment) => <tr key={payment.id}>
              <td><strong>{payment.id}</strong></td>
              <td>{payment.member}</td>
              <td>{formatDate(payment.date)}</td>
              <td><span className="soft-tag">{payment.type}</span></td>
              <td>{payment.mode}</td>
              <td><strong>₹{Number(payment.amount || 0).toLocaleString('en-IN')}</strong></td>
              <td><div className="row-actions"><button className="btn btn-secondary btn-sm" onClick={() => { const member = members.find((m) => m.id === payment.memberId || m.name === payment.member); if (member) setModal({ type:'invoiceOptions', member, payment }); }}>Invoice</button><button className="btn btn-danger btn-sm" onClick={() => deletePayment(payment.id)}>Delete</button></div></td>
            </tr>)}
            {!filteredPayments.length && <tr><td colSpan="7"><EmptyState title="No payments found" text="Try changing the filters or record a new payment." /></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}

function MembershipsPage({ members, data, setModal, planPrices, setData, setToast, onRenewMembership }) {
  const [renewingMember, setRenewingMember] = useState(null);
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingPrices, setEditingPrices] = useState(false);
  const [draftPrices, setDraftPrices] = useState(planPrices);

  useEffect(() => {
    setDraftPrices(planPrices);
  }, [planPrices]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => getMembershipStatus(m.expiry) === 'Active').length,
    expiring: members.filter((m) => getMembershipStatus(m.expiry) === 'Expiring').length,
    expired: members.filter((m) => getMembershipStatus(m.expiry) === 'Expired').length,
  }), [members]);

  const filteredMembers = members.filter((member) => {
    const status = getMembershipStatus(member.expiry);
    return (planFilter === 'All' || member.plan === planFilter) &&
      (statusFilter === 'All' || status === statusFilter);
  });

  const savePrices = async () => {
    const cleaned = {};
    MEMBERSHIP_PLANS.forEach((plan) => {
      cleaned[plan.name] = Math.max(0, Number(draftPrices[plan.name] || 0));
    });

    try {
      // Memberships page prices are independent from public-page package prices.
      // Only update the internal membershipPrices setting here; never mutate publicPage.
      const pricePatch = {
        membershipPrices: cleaned,
      };

      setData((current) => ({
        ...current,
        settings: {
          ...(current.settings || {}),
          ...pricePatch,
        },
      }));

      await saveCloudSettings(pricePatch);

      // Re-apply the saved values after the async cloud write, so a stale
      // component snapshot cannot put the previous prices back into the UI.
      setData((current) => ({
        ...current,
        settings: {
          ...(current.settings || {}),
          ...pricePatch,
        },
      }));

      setEditingPrices(false);
      setToast('Membership plan prices updated');
    } catch (error) {
      console.error('Membership price save failed:', error);
      setToast(error?.message || 'Unable to save membership prices');
    }
  };

  return <>
    <PageTitle title="Memberships" subtitle="Manage membership plans, renewals and expiry." />

    <div className="member-summary">
      <MetricBox label="Total memberships" value={stats.total} tone="green" />
      <MetricBox label="Active" value={stats.active} tone="green" />
      <MetricBox label="Expiring soon" value={stats.expiring} tone="amber" />
      <MetricBox label="Expired" value={stats.expired} tone="red" />
    </div>

    <section className="panel">
      <div className="panel-header">
        <PanelHeader title="Membership plans" subtitle="Set the prices your gym currently charges" icon={ShieldCheck} />
        {!editingPrices ? (
          <button className="btn btn-secondary btn-sm" onClick={() => setEditingPrices(true)}><Settings size={15} /> Edit prices</button>
        ) : (
          <div style={{ display:'flex', gap:'8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setDraftPrices(planPrices); setEditingPrices(false); }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={savePrices}><Save size={15} /> Save prices</button>
          </div>
        )}
      </div>

      <div className="plan-grid">
        {MEMBERSHIP_PLANS.map((plan) => (
          <div className="plan-card" key={plan.name}>
            <div className="plan-card-top">
              <div><div className="eyebrow">MEMBERSHIP</div><h3>{plan.name}</h3></div>
              {!editingPrices ? (
                <span className="plan-price">₹{Number(planPrices[plan.name] || 0).toLocaleString('en-IN')}</span>
              ) : (
                <div style={{ position:'relative', width:'110px' }}>
                  <span style={{ position:'absolute', left:'10px', top:'9px', color:'#7b8797', fontWeight:700 }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    value={draftPrices[plan.name] ?? ''}
                    onChange={(e) => setDraftPrices((current) => ({ ...current, [plan.name]: e.target.value }))}
                    style={{ width:'100%', padding:'8px 8px 8px 24px', border:'1px solid #dce5eb', borderRadius:'10px', fontWeight:800 }}
                  />
                </div>
              )}
            </div>
            <p>{plan.description}</p>
            <div className="plan-duration">{plan.months === 1 ? '1 month' : `${plan.months} months`}</div>
          </div>
        ))}
      </div>
    </section>

    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title"><div className="panel-icon"><Users size={17} /></div><div><h3>Member memberships</h3><span>Track active, expiring and expired memberships.</span></div></div>
        </div>
        <div className="membership-filters">
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="All">All plans</option>
            {MEMBERSHIP_PLANS.map((plan) => <option key={plan.name} value={plan.name}>{plan.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All status</option><option value="Active">Active</option><option value="Expiring">Expiring</option><option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="table-wrap membership-table-wrap">
        <table className="memberships-list-table">
          <thead><tr><th>Member</th><th>Plan</th><th>Start</th><th>Expiry</th><th>Remaining</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filteredMembers.map((member) => {
              const days = getDaysRemaining(member.expiry);
              const status = getMembershipStatus(member.expiry);
              return <tr key={member.id}>
                <td><div className="member-cell"><div className="avatar soft" style={{ overflow: 'hidden' }}>
            {member.photo ? (
              <img src={member.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials(member.name)
            )}
          </div><div><strong>{member.name}</strong><span>{member.id}</span></div></div></td>
                <td>{member.plan || '—'}</td>
                <td>{formatDate(member.start)}</td>
                <td>{formatDate(member.expiry)}</td>
                <td>{days < 0 ? `${Math.abs(days)} days overdue` : `${days} days`}</td>
                <td>{Number(member.due || 0) > 0 ? <strong className="danger-text">₹{Number(member.due).toLocaleString('en-IN')}</strong> : <span className="paid-text">Paid</span>}</td>
                <td><StatusBadge status={status} /></td>
                <td><button type="button" className="btn btn-secondary btn-sm" onClick={() => setRenewingMember(member)}>Renew</button></td>
              </tr>;
            })}
            {!filteredMembers.length && <tr><td colSpan="8"><EmptyState title="No memberships found" text="Try changing the filters." /></td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    {renewingMember && (
      <RenewalModal
        member={renewingMember}
        onClose={() => setRenewingMember(null)}
        onRenew={(renewal) => {
          if (onRenewMembership) onRenewMembership(renewingMember, renewal);
          setRenewingMember(null);
        }}
        planPrices={planPrices}
      />
    )}
  </>;
}

function RenewalModal({ member, onClose, onRenew, planPrices }) {
  if (!member) return null;

  const defaultPlan = MEMBERSHIP_PLANS.some((p) => p.name === member.plan) ? member.plan : 'Monthly';
  const currentDays = getDaysRemaining(member.expiry);
  const defaultPackageStart = currentDays >= 0 && member.expiry ? member.expiry : today;

  const [form, setForm] = useState({
    plan: defaultPlan,
    amount: Number(member.amount || planPrices[defaultPlan] || 0),
    paid: 0,
    paymentDate: today,
    packageStartDate: defaultPackageStart,
  });

  const selectedPlan = MEMBERSHIP_PLANS.find((plan) => plan.name === form.plan);
  const renewalStart = form.packageStartDate || defaultPackageStart;
  const previewExpiry = selectedPlan ? addMonthsToDate(renewalStart, selectedPlan.months) : '';
  const newDue = Math.max(0, Number(form.amount || 0) - Number(form.paid || 0));

  const handlePlanChange = (planName) => {
    const price = Number(planPrices[planName] || 0);
    setForm((current) => ({ ...current, plan: planName, amount: price }));
  };

  return <Modal title={`Renew membership — ${member.name}`} onClose={onClose} wide>
    <div className="renewal-current">
      <div><span>Current plan</span><strong>{member.plan || '—'}</strong></div>
      <div><span>Current expiry</span><strong>{formatDate(member.expiry)}</strong></div>
      <div><span>Status</span><StatusBadge status={getMembershipStatus(member.expiry)} /></div>
    </div>

    <div className="form-section-title">Renewal details</div>
    <div className="form-grid three">
      <FormField label="Renewal plan"><select value={form.plan} onChange={(e) => handlePlanChange(e.target.value)}>{MEMBERSHIP_PLANS.map((plan) => <option key={plan.name} value={plan.name}>{plan.name}</option>)}</select></FormField>
      <FormField label="Membership amount"><input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount:e.target.value })} /></FormField>
      <FormField label="Amount paid"><input type="number" min="0" value={form.paid} onChange={(e) => setForm({ ...form, paid:e.target.value })} /></FormField>
    </div>

    <div className="form-grid two renewal-date-grid">
      <FormField label="Date of payment">
        <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate:e.target.value })} />
      </FormField>
      <FormField label="Date of package start">
        <input type="date" value={form.packageStartDate} onChange={(e) => setForm({ ...form, packageStartDate:e.target.value })} />
      </FormField>
    </div>

    <div className="renewal-preview">
      <div><span>Renewal starts</span><strong>{formatDate(renewalStart)}</strong></div>
      <div><span>New expiry</span><strong>{formatDate(previewExpiry)}</strong></div>
      <div><span>New amount due</span><strong>₹{newDue.toLocaleString('en-IN')}</strong></div>
    </div>

    <ModalActions onClose={onClose} disabled={!form.plan || !form.paymentDate || !form.packageStartDate} onSave={() => onRenew({ ...form, amount: Number(form.amount || 0), paid: Number(form.paid || 0) })} saveLabel="Renew membership" />
  </Modal>;
}

function PageTitle({ title, subtitle, action }) { return <div className="page-heading compact"><div><div className="eyebrow">PREFACE FITNESS</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="heading-actions">{action}</div>}</div>; }
function PanelHeader({ title, subtitle, icon: Icon = MoreHorizontal, action, onAction }) { return <div className="panel-header"><div className="panel-title"><div className="panel-icon"><Icon size={17} /></div><div><h3>{title}</h3><span>{subtitle}</span></div></div>{action && <button className="link-btn" onClick={onAction}>{action} <ArrowUpRight size={15} /></button>}</div>; }
function StatCard({ label, value, change, positive, icon: Icon, tone }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small className={positive ? 'positive' : 'neutral'}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {change}</small></div></div>; }
function QuickAction({ icon: Icon, label, onClick }) { return <button className="quick-action" onClick={onClick}><span><Icon size={18} /></span><strong>{label}</strong><ArrowUpRight size={15} /></button>; }
function MetricBox({ label, value, tone }) { return <div className={`metric-box ${tone}`}><span>{label}</span><strong>{value}</strong></div>; }
function StatusBadge({ status }) { return <span className={`status ${status.toLowerCase()}`}>{status}</span>; }
function EmptyState({ title, text }) { return <div className="empty-state"><CheckCircle2 size={24} /><strong>{title}</strong><span>{text}</span></div>; }
function initials(name) { return name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(); }
function formatDate(date) { if (!date) return '—'; const [y, m, d] = date.split('-'); return `${d}/${m}/${y}`; }
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function calculateAge(dob) {
  if (!dob) return '—';
  const birth = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  return `${age} yrs`;
}

function nextSystemMemberId(members) {
  const maxNumber = (members || []).reduce((max, member) => {
    const match = String(member.id || '').match(/^PF-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1000);
  return `PF-${maxNumber + 1}`;
}

function calculateGstBreakdown(totalAmount, rate = 5) {
  const total = Math.max(0, Number(totalAmount || 0));
  const gstRate = Math.max(0, Number(rate || 0));
  if (!gstRate) return { taxable: total, gst: 0, cgst: 0, sgst: 0, rate: 0 };
  const taxable = total / (1 + gstRate / 100);
  const gst = total - taxable;
  return {
    taxable: Number(taxable.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    cgst: Number((gst / 2).toFixed(2)),
    sgst: Number((gst / 2).toFixed(2)),
    rate: gstRate,
  };
}

function currentFinancialYear(dateValue = today) {
  const date = new Date(`${dateValue}T00:00:00`);
  const year = date.getFullYear();
  const start = date.getMonth() >= 3 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

function getInvoiceSeriesSettings(settings, seriesKey) {
  const fallback = { prefix: String(settings?.invoicePrefix || 'PO').trim() || 'PO', numberLength: 6, financialYear: currentFinancialYear(), nextNumber: 1, yearlyNext: {} };
  const saved = settings?.[seriesKey] || {};
  return { ...fallback, ...saved, yearlyNext: { ...(saved.yearlyNext || {}) } };
}

// Series A is used for GST invoices; Series B for non-GST invoices.
// Sequence allocation is persisted in gym settings after each successful payment.
function allocateInvoiceNumber(settings, gstApplicable, dateValue = today) {
  const seriesKey = gstApplicable ? 'invoiceSeriesA' : 'invoiceSeriesB';
  const series = getInvoiceSeriesSettings(settings, seriesKey);
  const fy = currentFinancialYear(dateValue);
  const next = Math.max(1, Number(series.yearlyNext[fy] ?? (series.financialYear === fy ? series.nextNumber : 1)) || 1);
  const width = Math.min(12, Math.max(1, Number(series.numberLength) || 6));
  const prefix = String(series.prefix || 'PO').trim() || 'PO';
  const invoiceNumber = `${prefix}/${fy}/${String(next).padStart(width, '0')}`;
  const updatedSeries = { ...series, financialYear: fy, nextNumber: next + 1, yearlyNext: { ...series.yearlyNext, [fy]: next + 1 } };
  return { invoiceNumber, settings: { ...(settings || {}), [seriesKey]: updatedSeries } };
}

// Each member receives one permanent master invoice number. This counter is
// independent from individual payment numbering, so adding payments cannot
// consume the next member's number.
function allocateMemberInvoiceNumber(settings, gstApplicable, dateValue = today) {
  const seriesKey = gstApplicable ? 'invoiceSeriesA' : 'invoiceSeriesB';
  const series = getInvoiceSeriesSettings(settings, seriesKey);
  const fy = currentFinancialYear(dateValue);
  const memberYearlyNext = { ...(series.memberYearlyNext || {}) };
  const next = Math.max(1, Number(memberYearlyNext[fy] ?? series.yearlyNext?.[fy] ?? (series.financialYear === fy ? series.nextNumber : 1)) || 1);
  const width = Math.min(12, Math.max(1, Number(series.numberLength) || 6));
  const prefix = String(series.prefix || 'PO').trim() || 'PO';
  const invoiceNumber = `${prefix}/${fy}/${String(next).padStart(width, '0')}`;
  const updatedSeries = { ...series, financialYear: fy, memberNextNumber: next + 1, memberYearlyNext: { ...memberYearlyNext, [fy]: next + 1 } };
  return { invoiceNumber, settings: { ...(settings || {}), [seriesKey]: updatedSeries } };
}

function romanPaymentSuffix(value) {
  let n = Math.max(1, Number(value) || 1);
  const pairs = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let result = '';
  for (const [amount, symbol] of pairs) while (n >= amount) { result += symbol; n -= amount; }
  return result;
}

function getMemberMasterInvoiceNumber(member, settings, group = null) {
  const fromMember = member?.memberInvoiceNumber || readMemberMeta(member?.notes).memberInvoiceNumber;
  if (fromMember) return String(fromMember);
  // Legacy members: preserve an already-issued invoice number if available.
  const existing = group?.payments?.find((p) => p.invoiceNumber)?.invoiceNumber;
  if (existing) return String(existing).replace(/-(?:[IVXLCDM]+|P\d+)$/i, '');
  const series = getInvoiceSeriesSettings(settings, member?.gstMode === 'gst' ? 'invoiceSeriesA' : 'invoiceSeriesB');
  const fy = currentFinancialYear(group?.startDate || member?.start || today);
  const number = Math.max(1, Number(series.memberYearlyNext?.[fy] ?? series.yearlyNext?.[fy] ?? series.nextNumber ?? 1));
  return `${String(series.prefix || 'PO').trim() || 'PO'}/${fy}/${String(number).padStart(Math.min(12, Math.max(1, Number(series.numberLength) || 6)), '0')}`;
}

function makeInvoiceNumber(payment, settings) {
  if (payment?.invoiceNumber) return payment.invoiceNumber;
  const series = getInvoiceSeriesSettings(settings, payment?.gstApplicable ? 'invoiceSeriesA' : 'invoiceSeriesB');
  const fy = currentFinancialYear(payment?.date || today);
  const legacyDigits = String(payment?.id || '').match(/(\d+)$/);
  const number = Math.max(1, Number(legacyDigits?.[1] || 1));
  return `${String(series.prefix || 'PO').trim() || 'PO'}/${fy}/${String(number).padStart(Math.min(12, Math.max(1, Number(series.numberLength) || 6)), '0')}`;
}

function getInvoicePaymentForMember(member, payments = []) {
  const matching = payments
    .filter((payment) => payment.memberId === member.id || payment.member === member.name)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.id || '').localeCompare(String(a.id || '')));
  return matching[0] || null;
}

// Build subscription groups for the member-profile invoice. Legacy payment rows
// are grouped using plan description + the plan total implied by paid-to-date and balance.
function getMemberSubscriptionGroups(member, payments = []) {
  const rows = payments.filter((p) => (p.memberId === member.id || p.member === member.name) && p.type === 'Membership')
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.id || '').localeCompare(String(b.id || '')));
  const groups = [];
  rows.forEach((p) => {
    const paidToDate = Number(p.paidAmountAtInvoice ?? p.amount ?? 0);
    const balance = Number(p.balanceAtInvoice ?? 0);
    const inferredTotal = paidToDate + balance;
    const description = p.description || `${member.plan || 'Membership'} membership`;
    let group = groups[groups.length - 1];
    const matches = group && group.description === description &&
      (inferredTotal <= 0 || group.planTotal <= 0 || Math.abs(group.planTotal - inferredTotal) < 0.01) &&
      group.balance > 0.001;
    if (!matches) {
      group = { id: `sub-${p.id}`, description, planTotal: inferredTotal || Number(member.amount || p.amount || 0), payments: [], balance, startDate: p.date || today, endDate: p.date || today, lastPayment: p };
      groups.push(group);
    }
    group.payments.push(p);
    group.endDate = p.date || group.endDate;
    group.lastPayment = p;
    group.balance = balance;
    if (inferredTotal > 0) group.planTotal = inferredTotal;
  });
  // If there are no saved membership transactions, provide a current-plan fallback.
  if (!groups.length && member) groups.push({ id: 'current-plan', description: `${member.plan || 'Membership'} membership`, planTotal: Number(member.amount || 0), payments: [], balance: Number(member.due || 0), startDate: member.start || today, endDate: member.start || today, lastPayment: null });
  return groups.reverse().map((g, index) => ({ ...g, label: `${g.description} · ${formatDate(g.startDate)}${g.endDate && g.endDate !== g.startDate ? ` – ${formatDate(g.endDate)}` : ''} · ${g.payments.length} payment(s)` }));
}

function openPrintWindow(title, html) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  const documentHtml = `<!doctype html><html><head><title>${escapeHtml(title)}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
  @page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#1d2b42;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.invoice-page{width:100%;max-width:900px;margin:12px auto;background:#fff;font-size:12px;line-height:1.5;color:#172b46}.invoice-hero{position:relative;overflow:hidden;color:#172b46;padding:12px 0 15px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:3px solid #203954;background:#f3f8ff;border-radius:0 0 10px 10px}.hero-brand{display:flex;align-items:center;gap:12px;min-width:0}.hero-logo{width:54px;height:54px;object-fit:contain;background:#fff;border-radius:5px;padding:1px}.hero-name{font-size:27px;line-height:1.05;font-weight:900;letter-spacing:.01em;color:#172b46}.hero-tag{font-size:8px;letter-spacing:.2em;color:#596777;margin-top:6px;font-weight:700}.hero-invoice{text-align:right;flex:0 0 auto}.invoice-title{font-size:26px;letter-spacing:.02em;font-weight:900;color:#172b46}.invoice-status{display:inline-block;margin-top:7px;color:#087f70;background:#dff8ef;border:1px solid #b7edda;border-radius:30px;padding:4px 9px;font-size:9px;font-weight:900;letter-spacing:.12em}.invoice-meta{font-size:10px;line-height:1.7;margin-top:10px;color:#34445a}.invoice-meta strong{color:#1d2b42}.seller-details{padding:10px 12px;margin:0 0 3px;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:11px;color:#43546c;line-height:1.6;border-bottom:1px solid #dbe5ef;background:#f8fbff;border-radius:0 0 8px 8px}.seller-details strong{color:#1d2b42}.invoice-parties{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:13px 0 15px}.party-box{border:1px solid #d7e5f6;border-radius:13px;padding:13px 15px;background:#f7faff;font-size:11px;line-height:1.7;color:#42536b;min-width:0;box-shadow:0 3px 10px rgba(31,66,112,.045)}.party-box:nth-child(2){background:#f2fbf7;border-color:#c9eee1}.party-label{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:900;letter-spacing:.13em;color:#17385d;margin-bottom:9px;text-transform:uppercase}.party-label:before{content:'';display:inline-block;width:4px;height:18px;border-radius:3px;background:#1769b2;flex:0 0 4px;box-shadow:none}.party-box:nth-child(2) .party-label:before{background:#059669}.party-box strong{display:inline;color:#1d2b42;font-size:11px;margin-bottom:0}.party-box > strong:first-of-type{display:block;font-size:16px;margin:2px 0 6px;color:#142b49}.invoice-table-wrap{padding:0}.invoice-table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;font-size:11px;border:1px solid #cfdced;border-radius:10px;overflow:hidden}.invoice-table th{background:#203650;color:#fff;text-align:left;vertical-align:middle;padding:11px 9px;font-size:10px;line-height:1.35;letter-spacing:.025em;border-bottom:1px solid #d7e0e9;white-space:normal}.invoice-table td{padding:12px 9px;border-bottom:1px solid #e1eaf3;color:#344861;vertical-align:middle;font-size:11px;line-height:1.5;overflow-wrap:anywhere;background:#fff}.invoice-table tr:last-child td{border-bottom:1px solid #dce2e8}.invoice-table td strong{display:block;color:#172b46;font-size:12px}.invoice-table td small{display:block;color:#718096;margin-top:3px;font-size:10px}.invoice-table .right{text-align:right}.invoice-table th:nth-child(1),.invoice-table td:nth-child(1){text-align:center}.invoice-table th:nth-child(5),.invoice-table td:nth-child(5){text-align:center}.invoice-table th:nth-child(6),.invoice-table td:nth-child(6),.invoice-table th:nth-child(7),.invoice-table td:nth-child(7){text-align:right}.invoice-table .qty-col{text-align:center}.invoice-table .money-col{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.invoice-lower{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:13px 0 0;align-items:stretch}.payment-summary,.amount-summary{border:1px solid #d4e3f4;border-top:4px solid #0c9b83;border-radius:12px;overflow:hidden;background:#f5f9ff;box-shadow:0 4px 12px rgba(32,59,91,.05)}.amount-summary{border-top-color:#344d91;background:#f7f8ff}.summary-title{padding:12px 13px;background:transparent;color:#17365a;font-size:10px;font-weight:900;letter-spacing:.13em;border-bottom:1px solid #e1eaf4}.summary-title:before{content:'';display:inline-block;width:4px;height:18px;margin-right:9px;border-radius:3px;background:#079579;vertical-align:middle}.amount-summary .summary-title:before{background:#4d63ba}.summary-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 13px;border-bottom:1px solid #e2eaf2;font-size:11px;color:#52647d}.summary-row strong{color:#172b46;font-size:11px;text-align:right;font-variant-numeric:tabular-nums}.summary-row.grand{background:#e3f7f0;color:#087d73;border-top:2px solid #344d91;border-bottom:0;padding:11px 12px}.summary-row.grand span,.summary-row.grand strong{color:#16877d;font-weight:900}.summary-row.grand strong{font-size:14px}.payment-chip{display:inline-block;margin:10px 12px;background:#ddf8ee;color:#087d70;border:1px solid #b8ebd9;border-radius:30px;padding:6px 10px;font-size:9px;font-weight:900}.invoice-note{margin:12px 0 0;padding:11px 14px;background:#eff6ff;border:1px solid #d7e7fa;border-left:4px solid #0879b7;border-radius:9px;color:#50627b;font-size:11px;line-height:1.6}.invoice-note strong{color:#344257}.schedule-wrap{margin-top:14px;border:1px solid #d6e3f1;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 3px 10px rgba(31,66,112,.04)}.schedule-title{padding:11px 13px;font-size:10px;font-weight:900;letter-spacing:.13em;color:#17365a;border-bottom:1px solid #dce7f3;background:#eff6ff}.schedule-title:before{content:'';display:inline-block;width:4px;height:18px;margin-right:9px;border-radius:3px;background:#1769b2;vertical-align:middle}.schedule-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:10px}.schedule-table th{font-size:10px;letter-spacing:.025em;color:#43556e;text-align:left;padding:9px 10px;background:#f7faff;border-bottom:1px solid #dfe8f2}.schedule-table td{padding:10px;border-bottom:1px solid #e5e9ed;color:#344861;font-size:11px;font-variant-numeric:tabular-nums}.schedule-table tr:last-child td{border-bottom:0}.status-pill{display:inline-block;border:1px solid #b8ebd9;color:#078468;background:#dff9ef;border-radius:20px;padding:5px 10px;font-size:8px;font-weight:900;letter-spacing:.04em;white-space:nowrap}.status-pill.pending{border-color:#eee3ca;color:#9a6a25;background:#fffdf7}.invoice-bottom{display:grid;grid-template-columns:1fr 245px;gap:14px;padding:14px 0 0;align-items:start}.terms-card{border-top:1px solid #dce2e8;padding:11px 0;background:#fff;min-width:0}.qr-card{border:1px solid #d6e3f1;border-radius:12px;padding:11px;background:#f7faff;min-width:0;box-shadow:0 3px 10px rgba(31,66,112,.04)}.bottom-title{font-size:10px;font-weight:900;color:#17365a;margin-bottom:9px;letter-spacing:.12em}.bottom-title:before{content:'';display:inline-block;width:4px;height:17px;margin-right:8px;border-radius:3px;background:#1769b2;vertical-align:middle}.qr-row{display:flex;align-items:center;gap:10px}.qr-frame{position:relative;width:94px;height:94px;flex:0 0 94px;padding:0;background:transparent}.qr-frame .qr-code{width:100%;height:100%;display:block;object-fit:contain;background:white}.qr-center-logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:21px;height:21px;object-fit:contain;background:#fff;border-radius:4px;padding:2px;box-shadow:0 0 0 2px #fff}.qr-copy{font-size:9px;color:#5c6b80;line-height:1.55;overflow-wrap:anywhere}.qr-copy strong{display:block;color:#172b46;font-size:11px;margin-bottom:5px}.public-link{display:inline-block;margin-top:5px;color:#16877d!important;font-weight:800;text-decoration:none;font-size:8px}.terms-card .bottom-title{margin-bottom:6px}.terms-card ol{margin:7px 0 0;padding-left:17px;color:#53647b;font-size:10px;line-height:1.65}.terms-card li{padding-left:2px;margin-bottom:2px}.signature{margin-top:8px;text-align:right;color:#596574;font-size:8px}.signature-line{border-top:1px solid #8c97a4;width:135px;margin:16px 0 5px auto}.invoice-footer{margin-top:13px;padding:12px 0 0;color:#53647b;background:#fff;border-top:2px solid #d7e4f2;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:9px;line-height:1.5}.footer-contact{display:flex;gap:12px;flex-wrap:wrap}.footer-slogan{text-align:right;color:#16877d;font-weight:900;letter-spacing:.08em}.small-muted{color:#87919c}
  /* Refined Preface Fitness invoice masthead */
  .invoice-hero{padding:20px 22px 18px;background:#f3f8ff;border:1px solid #d8e5f5;border-bottom:3px solid #203954;border-radius:14px 14px 10px 10px;gap:24px;min-height:112px}
  .hero-brand{gap:15px;align-items:center;flex:1}
  .hero-logo{width:66px;height:66px;flex:0 0 66px;object-fit:contain;background:#fff;border:1px solid #e1e9f2;border-radius:12px;padding:4px;box-shadow:0 3px 10px rgba(23,56,93,.09)}
  .hero-name{font-size:29px;line-height:1.08;letter-spacing:.005em;color:#17365a}
  .hero-tag{font-size:9px;letter-spacing:.22em;color:#526985;margin-top:7px}
  .hero-invoice{min-width:245px;text-align:right;padding-left:18px;border-left:1px solid #d5e2f1}
  .invoice-title{font-size:25px;line-height:1.15;letter-spacing:.045em;color:#17365a}
  .invoice-status{margin-top:8px;padding:5px 11px;font-size:9px;letter-spacing:.1em}
  .invoice-meta{font-size:10px;line-height:1.7;margin-top:9px;color:#435670}
  .seller-details{padding:11px 15px;margin:0 0 4px;background:#f8fbff;border:1px solid #dce7f3;border-top:0;border-radius:0 0 10px 10px;align-items:center;gap:8px 18px}
  .qr-card{padding:13px;border-radius:14px;background:#f8fbff;border:1px solid #d8e5f5;box-shadow:0 4px 14px rgba(31,66,112,.06)}
  .qr-card .bottom-title{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:10px;letter-spacing:.1em}
  .qr-card .bottom-title:before{content:'';display:inline-block;width:5px;height:19px;border-radius:4px;background:#1769b2;margin:0}
  .qr-row{gap:13px;align-items:center}
  .qr-frame{width:116px;height:116px;flex:0 0 116px;padding:5px;border-radius:18px;background:linear-gradient(135deg,#1769b2 0%,#149b91 52%,#e7a936 100%);box-shadow:0 4px 12px rgba(23,105,178,.14)}
  .qr-frame .qr-code{width:100%;height:100%;border-radius:12px;object-fit:contain;padding:3px;background:#fff}
  .qr-center-logo{width:16px;height:16px;border-radius:4px;padding:2px;box-shadow:0 0 0 2px #fff,0 1px 4px rgba(20,40,70,.18)}
  .qr-copy{font-size:10px;line-height:1.6;color:#52647b}
  .qr-copy strong{font-size:12px;line-height:1.4;margin-bottom:6px;color:#17365a}
  .public-link{font-size:9px;overflow-wrap:anywhere}
  @media screen{.invoice-page{min-height:0}}
  @media print{html,body{width:100%;height:auto;background:#fff!important;margin:0!important;padding:0!important;overflow:visible!important}.invoice-page{width:100%;max-width:none;margin:0;border:0;box-shadow:none;overflow:visible}.invoice-hero{padding-top:4px}.invoice-parties{padding:10px 0}.party-box{padding:9px 10px}.invoice-table th{padding:7px 6px}.invoice-table td{padding:8px 6px}.invoice-lower{padding-top:10px;gap:10px}.summary-row{padding:6px 8px}.invoice-note{margin-top:9px;padding:8px 10px}.schedule-wrap{margin-top:10px}.invoice-bottom{padding-top:10px;gap:10px}.qr-card{padding:9px}.qr-frame{width:98px;height:98px;flex-basis:98px;padding:4px}.qr-center-logo{width:16px;height:16px}.invoice-hero{padding:13px 16px;min-height:0}.hero-logo{width:58px;height:58px;flex-basis:58px}.hero-name{font-size:24px}.hero-invoice{min-width:220px}.invoice-footer{margin-top:9px}.party-box,.invoice-table,.invoice-lower,.invoice-note,.schedule-wrap,.invoice-bottom,.invoice-footer{break-inside:avoid;page-break-inside:avoid}a{color:inherit;text-decoration:none}}
  

  @media print {
    @page { size: A4 portrait; margin: 5mm; }
    html, body { width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
    .invoice-page { width: 100% !important; max-width: none !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; overflow: visible !important; font-size: 10px !important; line-height: 1.35 !important; }
    .invoice-hero { padding: 10px 14px 11px !important; min-height: 0 !important; gap: 14px !important; }
    .hero-brand { gap: 11px !important; }
    .hero-logo { width: 54px !important; height: 54px !important; flex-basis: 54px !important; }
    .hero-name { font-size: 25px !important; }
    .hero-tag { font-size: 8px !important; margin-top: 4px !important; }
    .hero-invoice { min-width: 210px !important; padding-left: 12px !important; }
    .invoice-title { font-size: 22px !important; }
    .invoice-status { margin-top: 4px !important; padding: 4px 8px !important; font-size: 8px !important; }
    .invoice-meta { font-size: 9px !important; line-height: 1.4 !important; margin-top: 5px !important; }
    .seller-details { padding: 7px 10px !important; margin-bottom: 2px !important; font-size: 9px !important; line-height: 1.35 !important; gap: 5px 10px !important; }
    .invoice-parties { gap: 9px !important; padding: 8px 0 9px !important; }
    .party-box { padding: 8px 10px !important; border-radius: 9px !important; font-size: 9px !important; line-height: 1.35 !important; box-shadow: none !important; }
    .party-label { font-size: 8px !important; margin-bottom: 5px !important; }
    .party-label:before { height: 13px !important; }
    .party-box > strong:first-of-type { font-size: 13px !important; margin: 1px 0 3px !important; }
    .party-box strong { font-size: 9px !important; }
    .invoice-table { font-size: 9px !important; border-radius: 7px !important; }
    .invoice-table th { padding: 7px 6px !important; font-size: 8px !important; line-height: 1.2 !important; }
    .invoice-table td { padding: 7px 6px !important; font-size: 9px !important; line-height: 1.3 !important; }
    .invoice-table td strong { font-size: 10px !important; }
    .invoice-table td small { font-size: 8px !important; margin-top: 2px !important; }
    .invoice-lower { gap: 9px !important; padding-top: 8px !important; }
    .payment-summary, .amount-summary { border-radius: 8px !important; box-shadow: none !important; border-top-width: 3px !important; }
    .summary-title { padding: 7px 9px !important; font-size: 8px !important; }
    .summary-title:before { height: 13px !important; margin-right: 6px !important; }
    .summary-row { padding: 5px 9px !important; gap: 7px !important; font-size: 9px !important; }
    .summary-row strong { font-size: 9px !important; }
    .summary-row.grand { padding: 7px 9px !important; }
    .summary-row.grand strong { font-size: 12px !important; }
    .payment-chip { margin: 6px 9px !important; padding: 4px 7px !important; font-size: 8px !important; }
    .schedule-wrap { margin-top: 8px !important; border-radius: 8px !important; box-shadow: none !important; }
    .schedule-title { padding: 7px 9px !important; font-size: 8px !important; }
    .schedule-title:before { height: 13px !important; margin-right: 6px !important; }
    .schedule-table th { padding: 6px 8px !important; font-size: 8px !important; }
    .schedule-table td { padding: 6px 8px !important; font-size: 9px !important; }
    .status-pill { padding: 3px 7px !important; font-size: 7px !important; }
    .invoice-note { margin-top: 7px !important; padding: 7px 9px !important; border-radius: 7px !important; font-size: 9px !important; line-height: 1.4 !important; }
    .invoice-bottom { grid-template-columns: 1fr 225px !important; gap: 9px !important; padding-top: 8px !important; }
    .terms-card { padding: 7px 0 !important; }
    .qr-card { display: block !important; visibility: visible !important; padding: 8px !important; border-radius: 9px !important; box-shadow: none !important; break-inside: avoid !important; page-break-inside: avoid !important; }
    .qr-card .bottom-title { display: flex !important; margin-bottom: 7px !important; font-size: 8px !important; }
    .bottom-title { margin-bottom: 5px !important; font-size: 8px !important; }
    .bottom-title:before { height: 13px !important; margin-right: 6px !important; }
    .qr-frame { display: block !important; visibility: visible !important; width: 88px !important; height: 88px !important; flex: 0 0 88px !important; padding: 4px !important; border-radius: 12px !important; background: linear-gradient(135deg,#1769b2 0%,#149b91 52%,#e7a936 100%) !important; }
    .qr-frame .qr-code { display: block !important; visibility: visible !important; width: 100% !important; height: 100% !important; border-radius: 8px !important; object-fit: contain !important; padding: 2px !important; background: #fff !important; }
    .qr-center-logo { display: block !important; visibility: visible !important; width: 15px !important; height: 15px !important; }
    .qr-row { display: flex !important; gap: 8px !important; align-items: center !important; }
    .qr-copy { font-size: 8px !important; line-height: 1.35 !important; }
    .qr-copy strong { display: block !important; font-size: 9px !important; margin-bottom: 3px !important; }
    .public-link { display: none !important; }
    .terms-card ol { margin-top: 4px !important; font-size: 8px !important; line-height: 1.35 !important; }
    .terms-card li { margin-bottom: 1px !important; }
    .signature { margin-top: 4px !important; }
    .signature-line { margin-top: 10px !important; margin-bottom: 3px !important; }
    .invoice-footer { margin-top: 7px !important; padding-top: 7px !important; font-size: 8px !important; }
    .invoice-page, .invoice-hero, .seller-details, .invoice-parties, .invoice-table-wrap, .invoice-lower, .schedule-wrap, .invoice-note, .invoice-bottom, .invoice-footer { break-inside: avoid !important; page-break-inside: avoid !important; }
    a { color: inherit !important; text-decoration: none !important; }
  }

</style></head><body>${html}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));</script></body></html>`;
  if (!printWindow) {
    // Popup blockers can prevent window.open. Print the same invoice through a
    // temporary iframe instead of silently doing nothing.
    const frame = document.createElement('iframe');
    frame.setAttribute('title', `${title} print preview`);
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.border = '0';
    frame.style.opacity = '0';
    frame.onload = () => {
      setTimeout(() => {
        try { frame.contentWindow.focus(); frame.contentWindow.print(); }
        catch (error) { console.error('Invoice print failed:', error); alert('Invoice preview could not open. Please allow pop-ups and try again.'); }
        setTimeout(() => frame.remove(), 1500);
      }, 600);
    };
    document.body.appendChild(frame);
    frame.srcdoc = documentHtml;
    return true;
  }
  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
  return true;
}

function printMemberFitnessMedical(member, settings, workoutPlans = []) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const meta = readMemberMeta(member?.notes);
  const conditions = Array.isArray(meta.medicalConditions) ? meta.medicalConditions : (Array.isArray(member?.medicalConditions) ? member.medicalConditions : []);
  const rows = [
    ['Height', member?.height ? `${member.height} cm` : 'Not provided'],
    ['Weight', member?.weight ? `${member.weight} kg` : 'Not provided'],
    ['Body fat', member?.bodyFat ? `${member.bodyFat}%` : 'Not provided'],
    ['Trainer', member?.trainer || 'Not assigned'],
    ['Chest', meta.chest ?? member?.chest], ['Shoulder', meta.shoulder ?? member?.shoulder],
    ['Biceps', meta.biceps ?? member?.biceps], ['Forearms', meta.forearms ?? member?.forearms],
    ['Waist', meta.waist ?? member?.waist], ['Hips', meta.hips ?? member?.hips],
    ['Thighs', meta.thighs ?? member?.thighs], ['Calves', meta.calves ?? member?.calves],
    ['Neck', meta.neck ?? member?.neck]
  ];
  const assignedPlans = (workoutPlans || []).filter((plan) => (plan.assignedMemberIds || []).some((id) => String(id) === String(member?.id)));
  const assignedWorkoutHtml = assignedPlans.length ? `<table class="assigned-workout-table"><thead><tr><th>Workout plan</th><th>Exercise</th><th>Muscle group</th><th>Sets</th><th>Reps</th><th>Rest</th></tr></thead><tbody>${assignedPlans.flatMap((plan) => {
    const exercises = (plan.exercises || []).length ? plan.exercises : [{ name: 'No exercises added', muscleGroup: '—', sets: '—', reps: '—', rest: '—' }];
    return exercises.map((exercise, index) => `<tr><td>${index === 0 ? `<strong>${escapeHtml(plan.name || 'Workout plan')}</strong><div class="workout-plan-meta">${escapeHtml(plan.goal || 'General Fitness')} · ${escapeHtml(plan.level || 'Beginner')} · ${escapeHtml(plan.durationWeeks || 0)} weeks${plan.trainer ? ` · ${escapeHtml(plan.trainer)}` : ''}</div>${plan.notes ? `<div class="workout-plan-notes">${escapeHtml(plan.notes)}</div>` : ''}` : `<span class="workout-plan-repeat">${escapeHtml(plan.name || 'Workout plan')}</span>`}</td><td>${escapeHtml(exercise.name || 'Exercise')}</td><td>${escapeHtml(exercise.muscleGroup || exercise.muscle || 'Full Body')}</td><td>${escapeHtml(exercise.sets ?? 3)}</td><td>${escapeHtml(exercise.reps ?? 15)}</td><td>${escapeHtml(exercise.rest || '60 sec')}</td></tr>`);
  }).join('')}</tbody></table>` : '<p class="empty">No workout plans have been assigned to this member.</p>';
  const measurementLabels = ['Chest','Shoulder','Biceps','Forearms','Waist','Hips','Thighs','Calves','Neck'];
  const measurementValues = rows.filter(([label, value]) => measurementLabels.includes(label) && value !== undefined && value !== null && String(value).trim() !== '');
  const measurementRows = measurementValues.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)} cm</td></tr>`).join('');
  const profileRows = rows.filter(([label]) => ['Height','Weight','Body fat','Trainer'].includes(label))
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
  const conditionPills = conditions.length ? conditions.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('') : '<p class="empty">No medical conditions or injuries recorded.</p>';
  const humanFigure = `<img class="hero-visual" src="data:image/jpeg;base64,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" alt="Athletic human wellness illustration" />`;
  const html = `<div class="fitness-print">
    <header class="hero">
      <div class="hero-copy">
        <div class="eyebrow">MEMBER WELLNESS RECORD</div>
        <div class="gym">${escapeHtml(gymName)}</div>
        <div class="sub">FITNESS PROFILE &amp; MEDICAL HISTORY</div>
        <p class="hero-note">A clear snapshot of your training baseline, measurements and member-reported health notes.</p>
      </div>
      <div class="hero-art">
        ${humanFigure}
      </div>
      <div class="date-chip">PRINTED&nbsp; ${escapeHtml(formatDate(new Date().toISOString().slice(0,10)))}</div>
    </header>
    <section class="member">
      <div class="member-topline"><span class="member-label">MEMBER PROFILE</span><span class="member-id">ID&nbsp; ${escapeHtml(member?.id || '—')}</span></div>
      <h1>${escapeHtml(member?.name || 'Member')}</h1>
      <div class="member-details">
        <span><i>PHONE</i><b>${escapeHtml(member?.phone || '—')}</b></span>
        <span><i>EMAIL</i><b>${escapeHtml(member?.email || '—')}</b></span>
        <span><i>PLAN</i><b>${escapeHtml(member?.plan || '—')}</b></span>
      </div>
    </section>
    <div class="columns">
      <section class="panel profile-panel"><div class="panel-head"><span class="panel-icon">01</span><h2>Fitness profile</h2></div><table>${profileRows}</table></section>
      <section class="panel measure-panel"><div class="panel-head"><span class="panel-icon teal">02</span><h2>Body measurements <small>CM</small></h2></div>
        ${measurementRows ? `<table>${measurementRows}</table>` : '<p class="empty">No body measurements recorded yet.</p>'}
        <div class="measurement-art-note">Track consistently. Progress adds up.</div>
      </section>
    </div>
    <section class="panel medical">
      <div class="panel-head"><span class="panel-icon rose">03</span><h2>Medical conditions &amp; injuries</h2></div>
      <p class="section-help">Member-reported information for training awareness.</p>
      <div class="pills">${conditionPills}</div>
      ${conditions.includes('Other') && meta.medicalOther ? `<p class="detail-note"><b>Other condition:</b> ${escapeHtml(meta.medicalOther)}</p>` : ''}
      ${meta.surgeryDetails ? `<p class="detail-note"><b>Surgery (last 5 years):</b> ${escapeHtml(meta.surgeryDetails)}</p>` : ''}
      ${meta.additionalMedicalNotes ? `<p class="detail-note"><b>Additional details:</b> ${escapeHtml(meta.additionalMedicalNotes)}</p>` : ''}
    </section>
    <section class="panel workouts"><div class="panel-head"><span class="panel-icon teal">04</span><h2>Assigned workout plans &amp; exercises</h2></div>${assignedWorkoutHtml}</section>
    <footer><span class="footer-mark">PF</span><span>This profile records information reported by the member for gym safety and training awareness. It is not a medical diagnosis.</span><b>${escapeHtml(gymName.toUpperCase())}</b></footer>
  </div>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#eef3f9;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .fitness-print{font:12px/1.5 Inter,'Segoe UI',Arial,sans-serif;color:#172b46;max-width:800px;margin:18px auto;background:#fff;border:1px solid #d8e4f1;border-radius:20px;overflow:hidden;box-shadow:0 14px 36px rgba(19,47,79,.12)}
    .hero{position:relative;display:flex;align-items:center;justify-content:space-between;min-height:190px;overflow:hidden;padding:25px 30px;background:linear-gradient(115deg,#102943 0%,#173f61 57%,#087f78 100%);color:#fff;border-bottom:5px solid #23b8a4}
    .hero-copy{position:relative;z-index:2;max-width:65%;padding:4px 0}
    .eyebrow{font-size:9px;font-weight:900;letter-spacing:.2em;color:#8ce8dc;margin-bottom:9px}
    .gym{font-size:29px;line-height:1.1;font-weight:900;letter-spacing:-.02em}
    .sub{font-size:9px;letter-spacing:.19em;color:#c8e7f3;font-weight:800;margin-top:8px}
    .hero-note{font-size:11px;line-height:1.6;color:#d2e1ee;max-width:330px;margin:14px 0 0}
    .hero-art{position:absolute;right:0;top:0;bottom:0;width:365px;display:block;overflow:hidden;z-index:1;opacity:.98;pointer-events:none}
    .hero-visual{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;display:block;mask-image:linear-gradient(to right,transparent 0%,rgba(0,0,0,.45) 9%,#000 22%,#000 100%);-webkit-mask-image:linear-gradient(to right,transparent 0%,rgba(0,0,0,.45) 9%,#000 22%,#000 100%)}
    
    
    
    
    .date-chip{position:absolute;right:24px;top:16px;font-size:8px;letter-spacing:.07em;color:#d4f4ef;border:1px solid rgba(196,247,239,.3);background:rgba(7,37,61,.25);padding:5px 8px;border-radius:30px;z-index:3}
    .member{padding:20px 28px 18px;background:#f7faff;border-bottom:1px solid #e1eaf4}
    .member-topline{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px}
    .member-label{font-size:9px;font-weight:900;letter-spacing:.17em;color:#087f78}
    .member-id{font-size:10px;font-weight:900;color:#1769b2;background:#e3efff;border:1px solid #c9defb;border-radius:30px;padding:5px 10px}
    .member h1{font-size:21px;line-height:1.2;margin:0 0 12px;color:#142b49}
    .member-details{display:flex;flex-wrap:wrap;gap:12px 25px}
    .member-details span{display:flex;flex-direction:column;gap:2px;min-width:100px}
    .member-details i{font-style:normal;font-size:8px;font-weight:900;letter-spacing:.12em;color:#7c8ca2}
    .member-details b{font-size:11px;color:#263f5e;overflow-wrap:anywhere}
    .columns{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px 22px 0}
    .panel{border:1px solid #d7e4f1;border-radius:14px;padding:15px;background:#fff;break-inside:avoid;box-shadow:0 4px 12px rgba(23,54,90,.035)}
    .profile-panel{background:linear-gradient(145deg,#f6f9ff,#fff)}
    .measure-panel{background:linear-gradient(145deg,#effcf8,#fff);position:relative;overflow:hidden}
    .panel-head{display:flex;align-items:center;gap:9px;margin-bottom:11px}
    .panel-icon{width:27px;height:27px;flex:0 0 27px;border-radius:8px;display:grid;place-items:center;font-size:9px;font-weight:900;color:#1769b2;background:#dfedff;border:1px solid #cfe1fa}
    .panel-icon.teal{color:#07846f;background:#d8f8ec;border-color:#bcebd9}
    .panel-icon.rose{color:#b43a62;background:#ffe6ee;border-color:#f8d1de}
    h2{font-size:11px;margin:0;text-transform:uppercase;letter-spacing:.09em;color:#17365a}
    h2 small{font-size:8px;color:#71839a;letter-spacing:.1em;margin-left:3px}
    table{width:100%;border-collapse:collapse;position:relative;z-index:1}
    th,td{text-align:left;padding:7px 5px;border-bottom:1px solid #e8eef5;font-size:10px;vertical-align:top}
    th{color:#71839a;font-weight:600;width:47%}
    td{font-weight:800;color:#1d3554;overflow-wrap:anywhere}
    tr:last-child th,tr:last-child td{border-bottom:0}
    .empty{font-size:10px;color:#71839a;margin:5px 0 12px}
    .measurement-art-note{margin-top:10px;padding-top:8px;border-top:1px solid #d7eee7;font-size:9px;color:#168b7c;font-weight:700;letter-spacing:.02em}
    .medical{margin:14px 22px 0;background:linear-gradient(110deg,#fff8fb,#fff);border-color:#f0dce5}
    .section-help{font-size:10px;color:#7b8799;margin:0 0 11px}
    .pills{display:flex;flex-wrap:wrap;gap:7px}
    .pill{border:1px solid #f4c8d5;background:#fff0f4;color:#a52d52;border-radius:30px;padding:5px 9px;font-size:9px;font-weight:800}
    .medical .empty{margin:0}
    .workouts{margin:14px 22px 0;background:linear-gradient(110deg,#f5fbff,#fff);border-color:#d7e7f4}
    .assigned-workout-table{table-layout:fixed;margin-top:2px}
    .assigned-workout-table th,.assigned-workout-table td{font-size:8.5px;line-height:1.3;padding:5px 5px;overflow-wrap:anywhere}
    .assigned-workout-table th{width:auto;background:#f2f7fc;color:#60758f;font-weight:800}
    .assigned-workout-table th:nth-child(1){width:25%}.assigned-workout-table th:nth-child(2){width:25%}.assigned-workout-table th:nth-child(3){width:19%}.assigned-workout-table th:nth-child(4){width:7%}.assigned-workout-table th:nth-child(5){width:7%}.assigned-workout-table th:nth-child(6){width:17%}
    .workout-plan-meta{font-size:7.5px;color:#64748b;margin-top:2px;font-weight:400}
    .workout-plan-notes{font-size:7.5px;color:#64748b;margin-top:2px;font-weight:400}
    .workout-plan-repeat{font-size:7.5px;color:#94a3b8}
    .workout-plan{border:1px solid #dce7f1;border-radius:10px;padding:10px 12px;margin-top:9px;break-inside:avoid}
    .workout-plan-head{display:flex;justify-content:space-between;gap:10px;align-items:center;color:#17365a;font-size:11px}
    .workout-plan-head span{font-size:9px;color:#64748b;white-space:nowrap}
    .workout-plan p{font-size:9px;color:#64748b;margin:5px 0;line-height:1.45}
    .workout-plan table{margin-top:7px}
    .workout-plan th,.workout-plan td{font-size:9px;padding:5px 4px}
    .detail-note{font-size:10px;line-height:1.6;color:#52647b;margin:10px 0 0}
    footer{margin-top:16px;padding:12px 22px;display:flex;align-items:center;gap:10px;border-top:1px solid #e1eaf4;background:#f7faff;color:#718096;font-size:8px;line-height:1.5}
    .footer-mark{display:grid;place-items:center;flex:0 0 26px;height:26px;border-radius:8px;background:#173b5d;color:#fff;font-weight:900;font-size:9px}
    footer b{margin-left:auto;color:#526984;font-size:8px;letter-spacing:.08em;white-space:nowrap}
    @media screen and (max-width:650px){.fitness-print{margin:0;border-radius:0}.hero{padding:22px 20px;min-height:180px}.hero-art{right:0;width:260px;opacity:.72}.hero-copy{max-width:85%}.gym{font-size:24px}.date-chip{right:12px;top:8px}.columns{grid-template-columns:1fr;padding:12px 14px 0}.medical{margin:12px 14px 0}.member{padding:16px 18px}.member-details{gap:9px 15px}footer{padding:10px 14px}.workouts{margin:12px 14px 0}}
    @media print{
      @page{size:A4;margin:9mm}
      body{background:#fff!important}
      .fitness-print{margin:0;max-width:none;border-radius:12px;box-shadow:none;border:1px solid #d8e4f1}
      .hero{min-height:165px;padding:20px 24px}
      .hero-art{right:0;width:330px}
      .human-figure{height:calc(100% - 6px);max-height:158px;width:auto;max-width:166px;right:22px;bottom:0}
      .columns{gap:10px;padding:14px 16px 0}
      .panel{padding:11px}
      .medical{margin:10px 16px 0}
      .workouts{margin:10px 16px 0}
      .assigned-workout-table th,.assigned-workout-table td{font-size:7.5px;padding:3px 4px;line-height:1.2}
      .workout-plan-meta,.workout-plan-notes{font-size:6.8px}
      .member{padding:14px 20px}
      footer{margin-top:12px}
      *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    }
  </style>`;
  return openPrintWindow(`${gymName} - ${member?.name || 'Member'} Fitness and Medical Profile`, html);
}
function printMemberIdCard(member, settings) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const qrData = encodeURIComponent(`Preface Fitness | Member ID: ${member.id} | Name: ${member.name}`);
  const memberPhoto = member.photo
    ? `<img src="${member.photo}" style="width:100%;height:100%;object-fit:cover;display:block" />`
    : `<div style="font-size:44px;font-weight:900;color:#fff;background:linear-gradient(135deg,#1769b2,#0f9b8e);width:100%;height:100%;display:grid;place-items:center">${escapeHtml(initials(member.name))}</div>`;
  const html = `
    <div style="width:780px;max-width:100%;margin:24px auto;padding:12px;background:#f4f7fb;font-family:Inter,'Segoe UI',Arial,sans-serif;color:#172b46">
      <div style="width:660px;max-width:100%;margin:auto;border:1px solid #d7e3f1;border-radius:24px;overflow:hidden;background:#fff;box-shadow:0 16px 40px rgba(23,54,90,.13)">
        <div style="height:116px;background:linear-gradient(115deg,#142c49 0%,#1d4568 62%,#087f78 100%);color:#fff;display:flex;align-items:center;padding:20px 24px;gap:16px;position:relative">
          <div style="position:absolute;right:-24px;top:-48px;width:190px;height:190px;border:1px solid rgba(255,255,255,.13);border-radius:50%"></div>
          <div style="position:absolute;right:44px;top:-75px;width:190px;height:190px;border:1px solid rgba(255,255,255,.10);border-radius:50%"></div>
          <img src="${LOGO_URL}" style="width:66px;height:66px;object-fit:contain;background:#fff;border:2px solid rgba(255,255,255,.8);border-radius:15px;padding:4px;box-shadow:0 5px 15px rgba(0,0,0,.16);position:relative" />
          <div style="position:relative;min-width:0;flex:1">
            <div style="font-size:27px;font-weight:900;letter-spacing:.01em;line-height:1.1">${escapeHtml(gymName)}</div>
            <div style="font-size:10px;letter-spacing:.25em;font-weight:800;margin-top:8px;color:#c7e8f3">GYM &amp; FITNESS SERVICES</div>
          </div>
          <div style="position:relative;text-align:right;align-self:flex-start;padding-top:4px">
            <div style="font-size:9px;font-weight:800;letter-spacing:.16em;color:#bdeee4">MEMBER ID</div>
            <div style="font-size:17px;font-weight:900;margin-top:5px">${escapeHtml(member.id)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 24px;background:#f5f9ff;border-bottom:1px solid #e1eaf4">
          <div style="font-size:12px;font-weight:900;letter-spacing:.16em;color:#17365a">MEMBER ID CARD</div>
          <div style="border:1px solid #b8ebd9;background:#dff8ef;color:#087d70;border-radius:30px;padding:5px 10px;font-size:9px;font-weight:900;letter-spacing:.08em">● ACTIVE MEMBER</div>
        </div>
        <div style="display:flex;gap:22px;padding:24px;align-items:stretch">
          <div style="width:164px;height:194px;flex:0 0 164px;border-radius:17px;overflow:hidden;background:#eef4f9;border:1px solid #d9e5f1;box-shadow:0 5px 14px rgba(23,54,90,.08)">${memberPhoto}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:22px;line-height:1.2;font-weight:900;color:#142b49;margin:2px 0 15px;overflow-wrap:anywhere">${escapeHtml(member.name)}</div>
            <div style="display:grid;grid-template-columns:104px minmax(0,1fr);gap:10px 12px;font-size:13px;line-height:1.35">
              <span style="color:#718096">Member ID</span><strong style="color:#17365a">${escapeHtml(member.id)}</strong>
              <span style="color:#718096">Age</span><strong style="color:#17365a">${escapeHtml(calculateAge(member.dob)) || '—'}</strong>
              <span style="color:#718096">Birthday</span><strong style="color:#17365a">${escapeHtml(formatDate(member.dob)) || '—'}</strong>
              <span style="color:#718096">Contact</span><strong style="color:#17365a">${escapeHtml(member.phone || '—')}</strong>
              <span style="color:#718096">Membership</span><strong style="color:#087f78">${escapeHtml(member.plan || '—')}</strong>
              <span style="color:#718096">Diet preference</span><strong style="color:#17365a">${escapeHtml(member.dietPreference || 'Not provided')}</strong>
            </div>
          </div>
        </div>
        <div style="margin:0 24px;height:1px;background:#e3ebf4"></div>
        <div style="display:flex;align-items:center;gap:18px;padding:19px 24px;background:#fbfdff">
          <div style="width:112px;height:112px;flex:0 0 112px;padding:5px;border-radius:16px;background:linear-gradient(135deg,#1769b2 0%,#0f9b8e 60%,#e7ad3d 100%);box-shadow:0 5px 13px rgba(23,105,178,.15)">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&ecc=H&margin=3&color=17365A&bgcolor=FFFFFF&data=${qrData}" style="width:100%;height:100%;display:block;object-fit:contain;border-radius:11px;background:#fff" alt="Member QR" />
          </div>
          <div style="min-width:0;flex:1">
            <div style="font-size:10px;letter-spacing:.15em;font-weight:900;color:#087f78;margin-bottom:6px">MEMBER VERIFICATION</div>
            <div style="font-size:16px;font-weight:900;color:#17365a">Your fitness journey, identified.</div>
            <div style="font-size:12px;color:#64748b;line-height:1.55;margin-top:5px">Keep this card with you and show it at the gym when needed.</div>
            <div style="font-size:10px;color:#8796a8;margin-top:8px">Member ID: ${escapeHtml(member.id)}</div>
          </div>
        </div>
        <div style="height:7px;background:linear-gradient(90deg,#1769b2 0%,#0f9b8e 55%,#e7ad3d 100%)"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 24px;background:#f4f7fb;color:#64748b;font-size:10px">
          <span style="font-weight:800;letter-spacing:.08em">${escapeHtml(gymName.toUpperCase())}</span>
          <span>Strength · Consistency · Progress</span>
        </div>
      </div>
    </div>
    <style>
      @media print {
        body { margin:0 !important; background:#fff !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        @page { margin:8mm; }
      }
      * { box-sizing:border-box; }
    </style>`;
  return openPrintWindow(`${gymName} - Member ID Card`, html);
}
function shareMemberWhatsApp(member) {
  const text = `Preface Fitness Member ID Card%0A%0AName: ${encodeURIComponent(member.name)}%0AMember ID: ${encodeURIComponent(member.id)}%0APlan: ${encodeURIComponent(member.plan || '')}%0ABirthday: ${encodeURIComponent(formatDate(member.dob))}%0AContact: ${encodeURIComponent(member.phone || '')}`;
  const phone = String(member.phone || '').replace(/\D/g, '');
  const target = phone.length === 10 ? `91${phone}` : phone;
  window.open(`https://wa.me/${target}?text=${text}`, '_blank');
}

function printPaymentInvoice(member, payment, settings, overrideGstMode = null) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const gstMode = overrideGstMode || (payment?.gstApplicable ? 'gst' : 'without');
  const invoiceAmount = Number(payment?.consolidated ? payment.planTotal : (payment?.invoiceAmount ?? (payment?.type === 'Membership' ? member.amount : payment?.amount) ?? member.amount ?? 0));
  const rate = gstMode === 'gst' ? Number(payment?.gstRate || settings?.defaultGstRate || 5) : 0;
  const gst = calculateGstBreakdown(invoiceAmount, rate);
  const invoiceNumber = makeInvoiceNumber(payment, settings);
  const invoiceDate = payment?.date || today;
  const includedPayments = Array.isArray(payment?.payments) ? payment.payments : [payment];
  const paymentAmount = payment?.consolidated ? includedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0) : Number(payment?.amount || 0);
  const received = payment?.consolidated ? paymentAmount : Number(payment?.paidAmountAtInvoice ?? payment?.amount ?? member.paid ?? 0);
  const balance = payment?.consolidated ? Number(payment.balance ?? Math.max(0, invoiceAmount - received)) : Number(payment?.balanceAtInvoice ?? member.due ?? 0);
  const serviceDescription = payment?.description || `${member.plan || 'Membership'} membership`;
  const billingMeta = readMemberMeta(member?.notes);
  const memberTaxId = billingMeta.gstinAadhaar || member.gstinAadhaar || '';
  const billingState = billingMeta.billingState || member.billingState || 'UTTAR PRADESH';
  const billingStateCode = billingMeta.billingStateCode || member.billingStateCode || '09';
  const sacCode = String(settings?.membershipSacCode || '999723');
  const placeOfSupply = billingState || 'UTTAR PRADESH';
  // Define currency formatter before building any rows that call it; otherwise
  // JavaScript's const temporal-dead-zone throws and invoice generation stops.
  const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const schedulePaymentsRows = payment?.consolidated ? includedPayments.map((p) => `<tr><td>${escapeHtml(formatDate(p.date || today))}</td><td>${currency(p.amount)}</td><td>${escapeHtml(p.mode || '—')}</td><td><span class="status-pill">PAID / RECEIVED</span></td></tr>`).join('') : `<tr><td>${escapeHtml(formatDate(invoiceDate))}</td><td>${currency(paymentAmount)}</td><td>${escapeHtml(payment?.mode || '—')}</td><td><span class="status-pill">PAID / RECEIVED</span></td></tr>`;
  const isGst = gstMode === 'gst';
  const publicUrl = String(settings?.publicPage?.publicUrl || settings?.publicPage?.websiteUrl || settings?.publicPage?.url || 'https://noscodera.github.io/preface-fitness/#gym').trim();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=H&margin=4&color=1769B2&bgcolor=FFFFFF&data=${encodeURIComponent(publicUrl)}`;
  const servicePeriod = member.start && member.expiry ? `${formatDate(member.start)} – ${formatDate(member.expiry)}` : 'As per membership';
  const pendingDate = member.expiry ? formatDate(member.expiry) : 'As agreed';
  const scheduleRows = `${schedulePaymentsRows}${balance > 0 ? `<tr><td>${escapeHtml(pendingDate)}</td><td>${currency(balance)}</td><td>—</td><td><span class="status-pill pending">PENDING</span></td></tr>` : ''}`;
  const html = `
  <div class="invoice-page">
    <header class="invoice-hero">
      <div class="hero-brand"><img class="hero-logo" src="${LOGO_URL}" alt="Preface Fitness logo"/><div><div class="hero-name">${escapeHtml(gymName)}</div><div class="hero-tag">GYM &amp; FITNESS SERVICES</div></div></div>
      <div class="hero-invoice"><div class="invoice-title">${isGst ? 'TAX INVOICE' : 'INVOICE'}</div><div class="invoice-status">${isGst ? 'GST APPLICABLE' : 'PAYMENT RECEIPT'}</div><div class="invoice-meta">Invoice No. <strong>${escapeHtml(invoiceNumber)}</strong><br/>Invoice Date <strong>${escapeHtml(formatDate(invoiceDate))}</strong></div></div>
    </header>
    <div class="seller-details"><span>${settings?.gymAddress ? `${escapeHtml(settings.gymAddress)}` : 'Nadan Mahal Rd, Yahiyaganj, Lucknow, Uttar Pradesh'}</span><span>${settings?.gymPhone ? `${escapeHtml(settings.gymPhone)}` : ''}${settings?.gymEmail ? ` &nbsp; · &nbsp; ${escapeHtml(settings.gymEmail)}` : ''}${isGst && settings?.gstin ? ` &nbsp; · &nbsp; GSTIN: ${escapeHtml(settings.gstin)}` : ''}</span></div>
    <section class="invoice-parties">
      <div class="party-box"><div class="party-label">Bill To</div><strong>${escapeHtml(member.name)}</strong><div>Member ID: ${escapeHtml(member.id)}</div><div>Phone: ${escapeHtml(member.phone || '—')}</div>${member.email ? `<div>Email: ${escapeHtml(member.email)}</div>` : ''}${member.address ? `<div>Address: ${escapeHtml(member.address)}</div>` : ''}<div><strong>GSTIN / AADHAAR:</strong> ${escapeHtml(memberTaxId || '—')}</div><div><strong>State:</strong> ${escapeHtml(billingState)} &nbsp; <strong>Code:</strong> ${escapeHtml(billingStateCode)}</div></div>
      <div class="party-box"><div class="party-label">Membership Details</div><strong>${escapeHtml(member.plan || 'Membership')}</strong><div>Service period: ${escapeHtml(servicePeriod)}</div><div>Trainer: ${escapeHtml(member.trainer || 'Not assigned')}</div><div>Payment mode: ${escapeHtml(payment?.mode || '—')}</div><div><strong>Place of Supply:</strong> ${escapeHtml(placeOfSupply)}</div><div><strong>Reverse Charge (Y/N):</strong> N</div></div>
    </section>
    <div class="invoice-table-wrap"><table class="invoice-table"><thead><tr><th style="width:5%">#</th><th style="width:27%">Description</th><th style="width:9%">SAC Code</th><th style="width:21%">Service Period</th><th class="qty-col" style="width:10%">Qty<br/>(months)</th><th class="money-col" style="width:13%">Rate (₹)</th><th class="money-col" style="width:15%">Amount (₹)</th></tr></thead><tbody>
      <tr><td>01</td><td><strong>${escapeHtml(serviceDescription)}</strong><small>Membership / fitness service</small></td><td>${escapeHtml(sacCode)}</td><td>${escapeHtml(servicePeriod)}</td><td class="qty-col">${escapeHtml(String(({Monthly:1,Quarterly:3,'Half-yearly':6,Annual:12})[member.plan] || 1))}</td><td class="money-col">${currency(invoiceAmount)}</td><td class="money-col">${currency(invoiceAmount)}</td></tr>
    </tbody></table></div>
    <section class="invoice-lower">
      <div class="payment-summary"><div class="summary-title">PAYMENT DETAILS</div><div class="summary-row"><span>Payment received</span><strong>${currency(paymentAmount)}</strong></div><div class="summary-row"><span>Total paid to date</span><strong>${currency(received)}</strong></div><div class="summary-row"><span>Outstanding balance</span><strong>${currency(balance)}</strong></div><div class="payment-chip">${escapeHtml(payment?.mode || 'Payment')} · ${escapeHtml(formatDate(invoiceDate))}</div></div>
      <div class="amount-summary"><div class="summary-row"><span>Subtotal / Taxable value</span><strong>${currency(gst.taxable)}</strong></div>${isGst && billingStateCode === '09' ? `<div class="summary-row"><span>CGST (${(rate/2).toFixed(2)}%)</span><strong>${currency(gst.cgst)}</strong></div><div class="summary-row"><span>SGST (${(rate/2).toFixed(2)}%)</span><strong>${currency(gst.sgst)}</strong></div>` : ''}${isGst && billingStateCode !== '09' ? `<div class="summary-row"><span>IGST (${rate.toFixed(2)}%)</span><strong>${currency(gst.gst)}</strong></div>` : ''}<div class="summary-row"><span>Total Tax Amount</span><strong>${isGst ? currency(gst.gst) : currency(0)}</strong></div><div class="summary-row grand"><span>Total invoice value</span><strong>${currency(invoiceAmount)}</strong></div><div class="summary-row"><span>GST on Reverse Charge</span><strong>₹0.00</strong></div></div>
    </section>
    <section class="schedule-wrap"><div class="schedule-title">PAYMENT SCHEDULE</div><table class="schedule-table"><thead><tr><th>DUE / PAYMENT DATE</th><th>AMOUNT</th><th>PAYMENT MODE</th><th>STATUS</th></tr></thead><tbody>${scheduleRows}</tbody></table></section>
    <section class="invoice-note"><strong>Amount in words:</strong> ${escapeHtml(amountInWordsIndian(invoiceAmount))}</section>
    <section class="invoice-bottom">
      <div class="terms-card"><div class="bottom-title">NOTES &amp; TERMS</div><ol><li>This document records the membership / fitness service billed by ${escapeHtml(gymName)}.</li><li>Amounts paid are non-refundable.</li><li>Once your package has expired, it must be renewed. Expired packages will not be extended unless authorised by management.</li><li>Please retain this invoice for your records.</li>${isGst ? '<li>GST details should match the billing details configured by the gym.</li>' : ''}</ol><div class="signature"><div>For ${escapeHtml(gymName)}</div><div class="signature-line"></div><strong>Authorised Signatory</strong></div></div>
      <div class="qr-card"><div class="bottom-title">SCAN TO VISIT OUR GYM</div><div class="qr-row"><div class="qr-frame"><img class="qr-code" src="${qrUrl}" alt="QR code linking to Preface Fitness public page"/><img class="qr-center-logo" src="${LOGO_URL}" alt="Preface Fitness logo"/></div><div class="qr-copy"><strong>Thank you for choosing ${escapeHtml(gymName)}.</strong>Scan to visit our gym.</div></div></div>
    </section>
    <footer class="invoice-footer"><div class="footer-contact"><span>${escapeHtml(settings?.gymPhone || 'Preface Fitness')}</span>${settings?.gymEmail ? `<span>${escapeHtml(settings.gymEmail)}</span>` : ''}</div><div class="footer-slogan">THANK YOU FOR CHOOSING US</div></footer>
  </div>`;
  return openPrintWindow(`${gymName} - ${invoiceNumber}`, html);
}

function amountInWordsIndian(value) {
  const n = Math.round(Number(value || 0));
  if (n === 0) return 'Rupees Zero Only';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const two = (num) => num < 20 ? ones[num] : `${tens[Math.floor(num/10)]}${num%10 ? ` ${ones[num%10]}` : ''}`;
  const underThousand = (num) => `${num >= 100 ? `${ones[Math.floor(num/100)]} Hundred${num%100 ? ' ' : ''}` : ''}${num%100 ? two(num%100) : ''}`.trim();
  let x=n, parts=[];
  const crore=Math.floor(x/10000000); x%=10000000;
  const lakh=Math.floor(x/100000); x%=100000;
  const thousand=Math.floor(x/1000); x%=1000;
  if(crore) parts.push(`${underThousand(crore)} Crore`);
  if(lakh) parts.push(`${underThousand(lakh)} Lakh`);
  if(thousand) parts.push(`${underThousand(thousand)} Thousand`);
  if(x) parts.push(underThousand(x));
  return `Rupees ${parts.join(' ')} Only`;
}

function shareBillWhatsApp(member, settings, payment = null) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const invoiceNumber = makeInvoiceNumber(payment, settings);
  const text = `${gymName}\nInvoice: ${invoiceNumber}\nMember: ${member.name}\nMember ID: ${member.id}\nPlan: ${member.plan || 'Membership'}\nInvoice amount: ₹${Number(payment?.invoiceAmount || member.amount || 0).toLocaleString('en-IN')}\nPaid: ₹${Number(payment?.paidAmountAtInvoice ?? payment?.amount ?? member.paid ?? 0).toLocaleString('en-IN')}\nBalance: ₹${Number(payment?.balanceAtInvoice ?? member.due ?? 0).toLocaleString('en-IN')}`;
  const phone = String(member.phone || '').replace(/\D/g, '');
  const target = phone.length === 10 ? `91${phone}` : phone;
  window.open(`https://wa.me/${target}?text=${encodeURIComponent(text)}`, '_blank');
}

function MemberModal({ onClose, onSave, member, planPrices, existingMemberIds = [], members = [], trainers = [], isOwner = false }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  useEffect(() => () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const openCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by this browser. Please use Chrome, Edge or another modern browser over HTTPS or localhost.');
      setCameraOpen(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraError(error?.name === 'NotAllowedError'
        ? 'Camera permission was blocked. Allow camera access for this site in the browser address bar and try again.'
        : error?.name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : 'Unable to open the camera. Make sure another application is not using it and try again.');
      setCameraOpen(true);
    }
  };

  const captureCameraPhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    const maxSize = 900;
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL('image/jpeg', 0.84);
    setForm((current) => ({ ...current, photo }));
    stopCamera();
  };

  const [form, setForm] = useState(() => member ? {
    ...member,
    ...readMemberMeta(member.notes),
    notes: cleanMemberNotes(member.notes),
    referral: member.referredBy ? 'Customer' : (String(member.referral || '').startsWith('Others') ? 'Others' : (['Customer', 'Others', 'None / Walk-In'].includes(member.referral) ? member.referral : 'None / Walk-In')),
    referralOther: readMemberMeta(member.notes).referralOther || (String(member.referral || '').startsWith('Others:') ? String(member.referral).slice(7).trim() : ''),
    id: member.id || '',
    due: member.due ?? 0,
    amount: member.amount ?? 0,
    paid: member.paid ?? 0,
    paymentMode: member.paymentMode || 'Cash',
    gstMode: member.gstMode || 'without',
    gstRate: Number(member.gstRate || 5),
    medicalConditions: readMemberMeta(member.notes).medicalConditions || [],
    medicalOther: readMemberMeta(member.notes).medicalOther || '',
    surgeryDetails: readMemberMeta(member.notes).surgeryDetails || '',
    additionalMedicalNotes: readMemberMeta(member.notes).additionalMedicalNotes || '',
  } : {
    id: '', attendanceNumber: '', portalPin: '', name: '', phone: '', email: '', dob: '', gender: 'Prefer not to say', address: '',
    emergencyContact: '', dietPreference: 'Veg', gstinAadhaar: '', billingState: 'UTTAR PRADESH', billingStateCode: '09', referredBy: '', plan: 'Monthly', start: today, expiry: addMonthsToDate(today, MEMBERSHIP_PLANS.find((item) => item.name === 'Monthly')?.months || 1), amount: Number(planPrices?.Monthly || 0), paid: 0,
    due: 0, paymentMode: 'Cash', gstMode: 'without', gstRate: 5, height: '', weight: '', bodyFat: '', chest: '', shoulder: '', biceps: '', forearms: '', waist: '', hips: '', thighs: '', calves: '', neck: '', trainer: '', referral: 'None / Walk-In', referralOther: '', medicalConditions: [], medicalOther: '', surgeryDetails: '', additionalMedicalNotes: '', notes: '',
  });

  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'amount' || key === 'paid') next.due = Math.max(0, Number(next.amount || 0) - Number(next.paid || 0));
      if ((key === 'plan' || key === 'start') && next.plan !== 'Custom' && next.start) {
        const selectedPlan = MEMBERSHIP_PLANS.find((item) => item.name === next.plan);
        if (selectedPlan) next.expiry = addMonthsToDate(next.start, selectedPlan.months);
      }
      return next;
    });
  };

  const handlePhotoChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const normalizedId = String(form.id || '').trim().toLowerCase();
  const duplicateId = normalizedId && existingMemberIds.some((id) => String(id).toLowerCase() === normalizedId && (!member || String(member.id).toLowerCase() !== normalizedId));
  const submit = () => onSave({ ...form, referral: form.referral === 'Others' ? `Others: ${String(form.referralOther || '').trim()}` : (form.referral === 'Customer' ? 'Customer' : 'None / Walk-In'), referredBy: form.referral === 'Customer' ? (form.referredBy || '') : '', id: String(form.id || '').trim(), amount: Number(form.amount || 0), paid: Number(form.paid || 0), due: Number(form.due || 0) });
  const valid = form.name.trim() && /^[0-9]{10}$/.test(form.phone.replace(/\D/g, '')) && form.expiry && !duplicateId && (member ? (!form.portalPin || /^\d{6}$/.test(form.portalPin)) : /^\d{6}$/.test(form.portalPin));

  return <Modal title={member ? 'Edit member' : 'Add member'} onClose={onClose} wide>
    <div className="form-section-title">Member Portal PIN</div>
    <div className="form-grid two">
      <FormField label={member ? 'Change / Reset 6-digit PIN (Admin only)' : 'Set 6-digit Member Portal PIN'}>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          pattern="[0-9]{6}"
          value={form.portalPin || ''}
          onChange={(e) => update('portalPin', e.target.value.replace(/\\D/g, '').slice(0, 6))}
          placeholder={member ? (isOwner ? 'Leave blank to keep current PIN' : 'Admin only') : 'Enter 6 digits'}
          disabled={Boolean(member) && !isOwner}
          required={!member}
        />
      </FormField>
      <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
        {member
          ? (isOwner ? 'Only an Admin can change or reset this PIN. Leave blank to keep the existing PIN.' : 'Only an Admin can change or reset the member portal PIN.')
          : 'Admin or authorized staff sets this PIN while adding the member. OTP is not used.'}
      </div>
    </div>
    {cameraOpen && (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(7, 12, 22, 0.86)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}
      >
        <div style={{ width: 'min(720px, 100%)', background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 28px 80px rgba(0,0,0,.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderBottom: '1px solid #e8edf3' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#243447', fontSize: '16px' }}>Take member photo</div>
              <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>Position the member inside the frame and click capture.</div>
            </div>
            <button type="button" className="icon-btn" onClick={stopCamera} aria-label="Close camera"><X size={20} /></button>
          </div>
          <div style={{ position: 'relative', background: '#0b1220', aspectRatio: '16 / 10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cameraError ? (
              <div style={{ color: '#fff', padding: '28px', textAlign: 'center', maxWidth: '520px' }}>
                <Camera size={34} style={{ marginBottom: '10px' }} />
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Camera could not be opened</div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#d8e0ec' }}>{cameraError}</div>
              </div>
            ) : (
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(1)' }} />
            )}
            {!cameraError && <div style={{ position: 'absolute', inset: '10% 16%', border: '2px solid rgba(255,255,255,.82)', borderRadius: '18px', pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,.08)' }} />}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={stopCamera}>Cancel</button>
            {!cameraError && <button type="button" className="btn btn-primary" onClick={captureCameraPhoto}><Camera size={17} /> Capture photo</button>}
            {cameraError && <button type="button" className="btn btn-primary" onClick={openCamera}><Camera size={17} /> Try again</button>}
          </div>
        </div>
      </div>
    )}
    <div className="form-section-title">Personal details</div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '18px',
        padding: '14px',
        border: '1px solid #e7edf2',
        borderRadius: '14px',
        background: '#fbfcfd',
      }}
    >
      <div
        style={{
          width: '68px',
          height: '68px',
          minWidth: '68px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#dff6f3',
          color: '#168f8a',
          fontSize: '22px',
          fontWeight: 800,
          border: '3px solid #ffffff',
          boxShadow: '0 3px 12px rgba(20, 50, 70, 0.10)',
        }}
      >
        {form.photo ? (
          <img
            src={form.photo}
            alt="Member preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initials(form.name || 'Member')
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#243447', marginBottom: '4px' }}>
          Member photo
        </div>
        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px' }}>
          Add a profile photo for this member.
        </div>
        {!member ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={openCamera}
          >
            <Camera size={16} />
            {form.photo ? 'Retake photo' : 'Take photo'}
          </button>
        ) : (
          <label
            className="btn btn-secondary btn-sm"
            style={{ cursor: 'pointer', display: 'inline-flex' }}
          >
            Change photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoChange(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
          </label>
        )}
        {form.photo && (
          <button
            type="button"
            className="link-btn"
            style={{ marginLeft: '10px' }}
            onClick={() => update('photo', '')}
          >
            Remove
          </button>
        )}
      </div>
    </div>

    <div className="form-grid three">
      <FormField label="Member ID"><input value={form.id} readOnly={!!member} onChange={(e) => update('id', e.target.value)} placeholder="Leave blank for auto ID" /></FormField>
      <FormField label="Attendance number"><input value={form.attendanceNumber || ''} onChange={(e) => update('attendanceNumber', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="e.g. 23" inputMode="numeric" /></FormField>
      <FormField label="Full name"><input autoFocus value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Rahul Sharma" /></FormField>
      <FormField label="Phone"><input value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" inputMode="numeric" /></FormField>
      <FormField label="Email"><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@email.com" /></FormField>
    </div>
    <div className="form-grid three">
      <FormField label="Date of birth / Birthday"><input type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} /></FormField>
      <FormField label="Gender"><select value={form.gender} onChange={(e) => update('gender', e.target.value)}><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></FormField>
      <FormField label="Emergency contact"><input value={form.emergencyContact} onChange={(e) => update('emergencyContact', e.target.value)} placeholder="Name / phone" /></FormField>
    </div>
    <div className="form-grid two">
      <FormField label="Diet preference"><select value={form.dietPreference || ''} onChange={(e) => update('dietPreference', e.target.value)}><option value="">Not specified</option><option>Veg</option><option>Eggetarian</option><option>Non-veg</option></select></FormField>
      <FormField label="Referral type"><select value={form.referral || 'None / Walk-In'} onChange={(e) => { const value = e.target.value; update('referral', value); if (value !== 'Customer') update('referredBy', ''); if (value !== 'Others') update('referralOther', ''); }}><option>None / Walk-In</option><option>Customer</option><option>Others</option></select></FormField>
      {form.referral === 'Customer' && <FormField label="Select referring customer"><select value={form.referredBy || ''} onChange={(e) => update('referredBy', e.target.value)}><option value="">Select customer</option>{members.filter((item) => !member || item.id !== member.id).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select></FormField>}
      {form.referral === 'Others' && <FormField label="Referral details"><input value={form.referralOther || ''} onChange={(e) => update('referralOther', e.target.value)} placeholder="e.g. Friend, banner, local event" /></FormField>}
    </div>
    <FormField label="Address"><textarea rows="2" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Member address" /></FormField>
    <div className="form-section-title">Billing identity & state</div>
    <div style={{ border: '1px solid #cfe0f4', borderRadius: '14px', padding: '14px', marginBottom: '14px', background: '#f7faff', boxShadow: '0 3px 10px rgba(31,66,112,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ width: '34px', height: '34px', flex: '0 0 34px', display: 'grid', placeItems: 'center', borderRadius: '9px', background: '#dcecff', color: '#1769b2', fontWeight: 900, fontSize: '12px' }}>ID</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#17365a' }}>GSTIN / Aadhaar details</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Optional — these details can appear on the member's invoice.</div>
        </div>
      </div>
      <div className="form-grid three">
        <FormField label="GSTIN or Aadhaar Number">
          <input
            value={form.gstinAadhaar || ''}
            onChange={(e) => update('gstinAadhaar', e.target.value.toUpperCase().replace(/\\s/g, '').slice(0, 20))}
            placeholder="Enter GSTIN or Aadhaar"
            autoComplete="off"
            maxLength={20}
          />
        </FormField>
        <FormField label="State">
          <input value={form.billingState || ''} onChange={(e) => update('billingState', e.target.value)} placeholder="UTTAR PRADESH" />
        </FormField>
        <FormField label="State code">
          <input value={form.billingStateCode || ''} onChange={(e) => update('billingStateCode', e.target.value.replace(/\\D/g, '').slice(0, 2))} placeholder="09" inputMode="numeric" maxLength={2} />
        </FormField>
      </div>
    </div>

    <div className="form-section-title">Membership & billing</div>
    <div className="form-grid three">
      <FormField label="Plan"><select value={form.plan} onChange={(e) => { const plan = e.target.value; update('plan', plan); if (plan !== 'Custom') update('amount', planPrices?.[plan] || 0); }}><option>Monthly</option><option>Quarterly</option><option>Half-yearly</option><option>Annual</option><option>Custom</option></select></FormField>
      <FormField label="Start date"><input type="date" value={form.start} onChange={(e) => update('start', e.target.value)} /></FormField>
      <FormField label="Expiry date"><input type="date" value={form.expiry} onChange={(e) => update('expiry', e.target.value)} /></FormField>
    </div>
    <div className="form-grid four">
      <FormField label="Membership amount"><input type="number" min="0" value={form.amount} onChange={(e) => update('amount', e.target.value)} /></FormField>
      <FormField label="Amount paid"><input type="number" min="0" value={form.paid} onChange={(e) => update('paid', e.target.value)} /></FormField>
      <FormField label="Outstanding"><input type="number" value={form.due} readOnly /></FormField>
      <FormField label="Payment mode"><select value={form.paymentMode || 'Cash'} onChange={(e) => update('paymentMode', e.target.value)}><option>Cash</option><option>UPI</option><option>Card</option><option>Bank transfer</option></select></FormField>
    </div>
    <div className="form-grid two">
      <FormField label="Invoice / tax mode"><select value={form.gstMode || 'without'} onChange={(e) => update('gstMode', e.target.value)}><option value="without">Bill without GST</option><option value="gst">Tax Invoice with GST</option></select></FormField>
      <FormField label="GST rate (%)"><input type="number" min="0" step="0.01" value={form.gstRate ?? 5} onChange={(e) => update('gstRate', e.target.value)} disabled={form.gstMode !== 'gst'} /></FormField>
    </div>

    <div className="form-section-title">Fitness profile</div>
    <div className="form-grid four">
      <FormField label="Height (cm)"><input type="number" min="0" value={form.height} onChange={(e) => update('height', e.target.value)} placeholder="170" /></FormField>
      <FormField label="Weight (kg)"><input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => update('weight', e.target.value)} placeholder="75" /></FormField>
      <FormField label="Body fat %"><input type="number" min="0" max="100" step="0.1" value={form.bodyFat} onChange={(e) => update('bodyFat', e.target.value)} placeholder="20" /></FormField>
      <FormField label="Trainer"><select value={form.trainer || ''} onChange={(e) => update('trainer', e.target.value)}><option value="">Not assigned</option>{trainers.filter((item) => item.status !== 'Inactive').map((trainer) => <option key={trainer.id} value={trainer.name}>{trainer.name}</option>)}</select></FormField>
    </div>
    <div className="form-section-title">Body measurements</div>
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px', marginBottom: '12px', background: '#fbfdff' }}>
      <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '12px' }}>Optional fitness measurements in centimetres (cm).</p>
      <div className="form-grid three" style={{ gap: '8px', rowGap: '6px' }}>
        <FormField label="Chest (cm)"><input type="number" min="0" step="0.1" value={form.chest || ''} onChange={(e) => update('chest', e.target.value)} placeholder="e.g. 100" /></FormField>
        <FormField label="Shoulder (cm)"><input type="number" min="0" step="0.1" value={form.shoulder || ''} onChange={(e) => update('shoulder', e.target.value)} placeholder="e.g. 46" /></FormField>
        <FormField label="Biceps (cm)"><input type="number" min="0" step="0.1" value={form.biceps || ''} onChange={(e) => update('biceps', e.target.value)} placeholder="e.g. 35" /></FormField>
        <FormField label="Forearms (cm)"><input type="number" min="0" step="0.1" value={form.forearms || ''} onChange={(e) => update('forearms', e.target.value)} placeholder="e.g. 29" /></FormField>
        <FormField label="Waist (cm)"><input type="number" min="0" step="0.1" value={form.waist || ''} onChange={(e) => update('waist', e.target.value)} placeholder="e.g. 82" /></FormField>
        <FormField label="Hips (cm)"><input type="number" min="0" step="0.1" value={form.hips || ''} onChange={(e) => update('hips', e.target.value)} placeholder="e.g. 96" /></FormField>
        <FormField label="Thighs (cm)"><input type="number" min="0" step="0.1" value={form.thighs || ''} onChange={(e) => update('thighs', e.target.value)} placeholder="e.g. 55" /></FormField>
        <FormField label="Calves (cm)"><input type="number" min="0" step="0.1" value={form.calves || ''} onChange={(e) => update('calves', e.target.value)} placeholder="e.g. 37" /></FormField>
        <FormField label="Neck (cm)"><input type="number" min="0" step="0.1" value={form.neck || ''} onChange={(e) => update('neck', e.target.value)} placeholder="e.g. 38" /></FormField>
      </div>
    </div>

    <div className="form-section-title">Medical questionnaire</div>
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', marginBottom: '12px', background: '#fbfdff' }}>
      <p style={{ margin: '0 0 7px', color: '#64748b', fontSize: '12px', lineHeight: 1.35 }}>Select any conditions or injuries the member reports. This information is for gym safety and training awareness, not a medical diagnosis.</p>
      <div className="form-grid three" style={{ alignItems: 'start', gap: '6px', rowGap: '4px' }}>
        {MEMBER_MEDICAL_OPTIONS.map((condition) => <label key={condition} style={{ display: 'flex', alignItems: 'center', minHeight: '30px', boxSizing: 'border-box', gap: '6px', padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: '7px', background: (form.medicalConditions || []).includes(condition) ? '#e9fbf6' : '#fff', fontSize: '12px', lineHeight: 1.2, fontWeight: 600 }}><input type="checkbox" style={{ margin: 0, flex: '0 0 auto' }} checked={(form.medicalConditions || []).includes(condition)} onChange={(e) => update('medicalConditions', e.target.checked ? [...(form.medicalConditions || []), condition] : (form.medicalConditions || []).filter((item) => item !== condition))} />{condition}</label>)}
      </div>
      {(form.medicalConditions || []).includes('Other') && <FormField label="Other medical condition / injury details"><textarea rows="2" value={form.medicalOther || ''} onChange={(e) => update('medicalOther', e.target.value)} placeholder="Describe the condition or injury" /></FormField>}
      <FormField label="Surgery in the last 5 years? If yes, when and what type?"><textarea rows="2" value={form.surgeryDetails || ''} onChange={(e) => update('surgeryDetails', e.target.value)} placeholder="Write details, or leave blank if none" /></FormField>
      <FormField label="Anything else we should know?"><textarea rows="2" value={form.additionalMedicalNotes || ''} onChange={(e) => update('additionalMedicalNotes', e.target.value)} placeholder="Any other health, injury or training-safety details" /></FormField>
    </div>
    {!valid && <div className="form-hint">Enter a name, a valid 10-digit phone number and an expiry date to continue.{duplicateId ? ' This Member ID is already in use.' : ''}</div>}
    <ModalActions onClose={onClose} disabled={!valid} onSave={submit} saveLabel={member ? 'Save changes' : 'Add member'} />
  </Modal>;
}

// NOTE: Duplicate LeadModal removed from here

function InvoiceOptionsModal({ member, payment, payments = [], mode = 'single', settings, onClose, onPrint }) {
  const [gstMode, setGstMode] = useState(payment?.gstApplicable ? 'gst' : (settings?.gstin ? 'gst' : 'without'));
  const [gstRate, setGstRate] = useState(Number(payment?.gstRate || settings?.defaultGstRate || 5));
  const groups = mode === 'member' ? getMemberSubscriptionGroups(member, payments) : [];
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0] || null;
  const selectedPayment = mode === 'member' && selectedGroup ? {
    id: selectedGroup.id, invoiceNumber: getMemberMasterInvoiceNumber(member, settings, selectedGroup),
    type: 'Membership', description: selectedGroup.description, date: selectedGroup.endDate || today,
    mode: selectedGroup.payments.length === 1 ? selectedGroup.payments[0].mode : 'Multiple modes',
    consolidated: true, payments: selectedGroup.payments, planTotal: selectedGroup.planTotal,
    balance: selectedGroup.balance, gstApplicable: payment?.gstApplicable, gstRate,
  } : payment;
  const invoiceAmount = Number(mode === 'member' ? (selectedGroup?.planTotal || 0) : (payment?.invoiceAmount || (payment?.type === 'Membership' ? member?.amount : payment?.amount) || member?.amount || 0));
  const gst = calculateGstBreakdown(invoiceAmount, gstMode === 'gst' ? gstRate : 0);
  return <Modal title={mode === 'member' ? 'Generate membership invoice' : 'Generate payment invoice'} onClose={onClose}>
    <div className="invoice-choice-card">
      <div><div className="eyebrow">INVOICE SCOPE</div><strong>{mode === 'member' ? 'Select the membership subscription' : 'This invoice is for one payment only'}</strong><span>{mode === 'member' ? 'All recorded payments belonging to the selected subscription will appear on the invoice. Renewals are listed separately.' : 'Only the selected payment transaction will be included.'}</span></div>
      {mode === 'member' && <FormField label="Membership / subscription"><select value={selectedGroup?.id || ''} onChange={(e) => setSelectedGroupId(e.target.value)}>{groups.map((g) => <option key={g.id} value={g.id}>{g.label} · Plan value ₹{Number(g.planTotal || 0).toLocaleString('en-IN')}</option>)}</select></FormField>}
      <div className="invoice-choice-options">
        <label className={`invoice-choice ${gstMode === 'gst' ? 'selected' : ''}`}><input type="radio" name="invoice-gst-mode" checked={gstMode === 'gst'} onChange={() => setGstMode('gst')} /><div><strong>Tax Invoice with GST</strong><span>Shows GSTIN, taxable value, CGST and SGST.</span></div></label>
        <label className={`invoice-choice ${gstMode === 'without' ? 'selected' : ''}`}><input type="radio" name="invoice-gst-mode" checked={gstMode === 'without'} onChange={() => setGstMode('without')} /><div><strong>Bill without GST</strong><span>Shows the same professional bill without tax breakup.</span></div></label>
      </div>
      <div className="form-grid two">
        <FormField label="GST rate (%)"><input type="number" min="0" step="0.01" disabled={gstMode !== 'gst'} value={gstRate} onChange={(e) => setGstRate(e.target.value)} /></FormField>
        <FormField label={mode === 'member' ? 'Subscription value' : 'Invoice value'}><input readOnly value={`₹${invoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} /></FormField>
      </div>
      {mode === 'member' && selectedGroup && <div className="invoice-tax-preview"><div><span>Payments included</span><strong>{selectedGroup.payments.length}</strong></div><div><span>Paid in this subscription</span><strong>₹{selectedGroup.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div><span>Balance</span><strong>₹{Number(selectedGroup.balance || 0).toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div className="grand"><span>Subscription total</span><strong>₹{invoiceAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div></div>}
      <div className="invoice-tax-preview"><div><span>Taxable</span><strong>₹{gst.taxable.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div><span>CGST</span><strong>₹{gst.cgst.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div><span>SGST</span><strong>₹{gst.sgst.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div className="grand"><span>Total</span><strong>₹{invoiceAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div></div>
    </div>
    <ModalActions onClose={onClose} disabled={!member || (mode === 'member' && !selectedGroup)} onSave={() => onPrint(gstMode, Number(gstRate || 0), selectedPayment)} saveLabel={gstMode === 'gst' ? 'Generate GST invoice' : 'Generate bill'} />
  </Modal>;
}

function PaymentModal({ members, onClose, onSave, settings = {} }) {
  const [form, setForm] = useState({
    memberId: members[0]?.id || '',
    member: members[0]?.name || '',
    amount: '',
    type: 'Membership',
    mode: 'Cash',
    date: today,
    gstMode: settings.gstin ? 'gst' : 'without',
    gstRate: Number(settings.defaultGstRate || 5),
    notes: '',
  });

  const selectedMember = members.find((m) => m.id === form.memberId);
  const invoiceBase = Number(form.amount || 0); // Preview only the amount entered as received.
  const gst = calculateGstBreakdown(invoiceBase, form.gstMode === 'gst' ? form.gstRate : 0);

  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'memberId') {
        const member = members.find((m) => m.id === value);
        next.member = member?.name || '';
      }
      return next;
    });
  };

  return <Modal title="Record payment & invoice" onClose={onClose} wide>
    <div className="invoice-entry-banner">
      <div><strong>Payment will be saved to the ledger automatically.</strong><span>An invoice record will also be created and can be printed from Payments.</span></div>
      <CreditCard size={22} />
    </div>
    <div className="form-section-title">Transaction details</div>
    <div className="form-grid two">
      <FormField label="Member"><select value={form.memberId} onChange={(e) => update('memberId', e.target.value)}>{members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.id}</option>)}</select></FormField>
      <FormField label="Payment date"><input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} /></FormField>
    </div>
    <div className="form-grid three">
      <FormField label="Amount received"><input autoFocus type="number" min="1" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="5000" /></FormField>
      <FormField label="Payment mode"><select value={form.mode} onChange={(e) => update('mode', e.target.value)}><option>Cash</option><option>UPI</option><option>Card</option><option>Bank transfer</option></select></FormField>
      <FormField label="Payment type"><select value={form.type} onChange={(e) => update('type', e.target.value)}><option>Membership</option><option>PT</option><option>Class</option><option>Other</option></select></FormField>
    </div>
    <div className="form-section-title">Invoice / tax details</div>
    <div className="form-grid three">
      <FormField label="Bill type"><select value={form.gstMode} onChange={(e) => update('gstMode', e.target.value)}><option value="without">Bill without GST</option><option value="gst">Tax Invoice with GST</option></select></FormField>
      <FormField label="GST rate (%)"><input type="number" min="0" step="0.01" value={form.gstRate} disabled={form.gstMode !== 'gst'} onChange={(e) => update('gstRate', e.target.value)} /></FormField>
      <FormField label="Invoice total"><input value={`₹${invoiceBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} readOnly /></FormField>
    </div>
    <div className="invoice-tax-preview">
      <div><span>Taxable value</span><strong>₹{gst.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
      <div><span>CGST</span><strong>₹{gst.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
      <div><span>SGST</span><strong>₹{gst.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
      <div className="grand"><span>Total invoice</span><strong>₹{invoiceBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
    </div>
    <FormField label="Notes"><textarea rows="2" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional payment / invoice note" /></FormField>
    <ModalActions onClose={onClose} disabled={!form.amount || !form.memberId} onSave={() => onSave(form)} saveLabel="Record payment" />
  </Modal>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal ${wide ? 'modal-wide' : ''}`.trim()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">PREFACE FITNESS</div>
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) { 
  return <label className="form-field"><span>{label}</span>{children}</label>; 
}

function ModalActions({ onClose, onSave, disabled, saveLabel }) {
  // Explicit button types prevent accidental form submission/reload when a modal
  // is rendered inside a form in the application shell.
  const handleSave = () => {
    try {
      if (typeof onSave === 'function') onSave();
    } catch (error) {
      console.error('Invoice generation failed:', error);
      window.alert(`Invoice generation failed: ${error?.message || 'Unknown error'}. Please open DevTools Console for details.`);
    }
  };
  return <div className="modal-actions">
    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
    <button type="button" className="btn btn-primary" disabled={disabled} onClick={handleSave}><CheckCircle2 size={17} /> {saveLabel}</button>
  </div>;
}


function PerformancePage({ data }) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [tier, setTier] = useState('All tiers');

  const members = data.members || [];
  const payments = data.payments || [];
  const leads = data.leads || [];
  const attendance = data.attendance || [];
  const ptSessions = data.ptSessions || [];
  const communicationLogs = data.communicationLogs || [];
  const planPrices = {
    ...DEFAULT_MEMBERSHIP_PRICES,
    ...(data.settings?.membershipPrices || {}),
  };

  const active = members.filter((m) => getMembershipStatus(m.expiry) === 'Active');
  const activePaying = active.filter((m) => Number(m.due || 0) <= 0);
  const expired = members.filter((m) => getMembershipStatus(m.expiry) === 'Expired');
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const outstanding = members.reduce((sum, m) => sum + Number(m.due || 0), 0);

  const monthlyRecurringRevenue = active.reduce((sum, member) => {
    const price = Number(member.amount || planPrices[member.plan] || 0);
    const months = MEMBERSHIP_PLANS.find((p) => p.name === member.plan)?.months || 1;
    return sum + (price / months);
  }, 0);

  const revenuePerActive = active.length ? totalRevenue / active.length : 0;

  const newMembers30 = members.filter((m) => {
    const start = new Date(`${m.start || ''}T00:00:00`);
    const current = new Date(`${today}T00:00:00`);
    const days = Math.round((current - start) / 86400000);
    return Number.isFinite(days) && days >= 0 && days <= 30;
  }).length;

  const previousBase = Math.max(1, members.length - newMembers30);
  const churnRate = members.length ? (expired.length / members.length) * 100 : 0;
  const netGrowthRate = ((newMembers30 - expired.length) / previousBase) * 100;

  const averageTenure = active.length
    ? active.reduce((sum, member) => {
        const start = new Date(`${member.start || today}T00:00:00`);
        const current = new Date(`${today}T00:00:00`);
        return sum + Math.max(0, (current - start) / 86400000 / 30.44);
      }, 0) / active.length
    : 0;

  const dormant = active.filter((m) => Number(m.visits || 0) < 4).length;
  const dormantRate = active.length ? (dormant / active.length) * 100 : 0;

  const qualifiedLeads = leads.filter((l) =>
    ['Contacted', 'Trial Booked', 'Converted', 'Qualified'].includes(l.stage)
  ).length;

  const referredNewMembers = members.filter((m) =>
    ['Referral', 'Referred'].includes(m.referral)
  ).length;
  const referralShare = members.length
    ? (referredNewMembers / members.length) * 100
    : 0;

  const uniqueVisitors = new Set(
    attendance.map((a) => a.memberId || a.member)
  ).size;

  const visitsPerActive = active.length ? attendance.length / active.length : 0;

  const completedPT = ptSessions.filter((s) => s.status === 'Completed').length;

  const collectionRate =
    totalRevenue + outstanding > 0
      ? (totalRevenue / (totalRevenue + outstanding)) * 100
      : 0;

  const averageDailyRevenue = totalRevenue / 30;
  const dso = averageDailyRevenue > 0 ? outstanding / averageDailyRevenue : 0;

  const membershipRevenue = payments
    .filter((p) => p.type === 'Membership')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const ptRevenue = payments
    .filter((p) => p.type === 'PT')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const todayRevenue = payments
    .filter((p) => p.date === today)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const allKpis = [
    {
      section: 'Executive & Ownership',
      icon: CircleDollarSign,
      items: [
        { label: 'Total Revenue', value: `₹${Math.round(totalRevenue).toLocaleString('en-IN')}`, description: 'Total recorded payment revenue in the current browser database.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Monthly Recurring Revenue (MRR)', value: `₹${Math.round(monthlyRecurringRevenue).toLocaleString('en-IN')}`, description: 'Current active membership value normalized to a monthly run rate.', tier: 'Advanced', status: 'ESTIMATE' },
        { label: 'Revenue per Active Member', value: `₹${Math.round(revenuePerActive).toLocaleString('en-IN')}`, description: 'Total recorded revenue divided by currently active members.', tier: 'Advanced', status: 'LIVE' },
        { label: 'Today Revenue', value: `₹${Math.round(todayRevenue).toLocaleString('en-IN')}`, description: 'Payments recorded with today’s date.', tier: 'Must-have', status: 'LIVE' },
      ],
    },
    {
      section: 'Membership Lifecycle & Retention',
      icon: Users,
      items: [
        { label: 'Active Paying Members', value: activePaying.length.toLocaleString('en-IN'), description: 'Active members with no outstanding membership balance.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Active Members', value: active.length.toLocaleString('en-IN'), description: 'Members whose membership is currently active.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Expired Members', value: expired.length.toLocaleString('en-IN'), description: 'Members whose recorded membership expiry date has passed.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Average Membership Tenure', value: `${averageTenure.toFixed(1)} mo`, description: 'Average elapsed membership duration for active members.', tier: 'Advanced', status: 'LIVE' },
        { label: 'Dormant Member Rate', value: `${dormantRate.toFixed(0)}%`, description: 'Active members with fewer than four recorded visits.', tier: 'Advanced', status: 'ESTIMATE' },
      ],
    },
    {
      section: 'Sales & CRM',
      icon: Target,
      items: [
        { label: 'New Leads', value: leads.length.toLocaleString('en-IN'), description: 'Total leads currently stored in the CRM.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Qualified / Progressed Leads', value: qualifiedLeads.toLocaleString('en-IN'), description: 'Leads currently in Contacted, Trial Booked, Converted or Qualified stages.', tier: 'Must-have', status: 'LIVE' },
      ],
    },
    {
      section: 'Marketing & Growth',
      icon: TrendingUp,
      items: [
        { label: 'Referral Share of Members', value: `${referralShare.toFixed(0)}%`, description: 'Members whose referral source is recorded as Referral or Referred.', tier: 'Advanced', status: 'LIVE' },
      ],
    },
    {
      section: 'Front Desk, Attendance & Access',
      icon: CheckCircle2,
      items: [
        { label: 'Total Check-Ins', value: attendance.length.toLocaleString('en-IN'), description: 'All attendance check-ins currently recorded.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Unique Visitors', value: uniqueVisitors.toLocaleString('en-IN'), description: 'Distinct members appearing in the attendance records.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Visits per Active Member', value: visitsPerActive.toFixed(1), description: 'Recorded attendance visits divided by active members.', tier: 'Must-have', status: 'LIVE' },
      ],
    },
    {
      section: 'Personal Training & Coaching',
      icon: Dumbbell,
      items: [
        { label: 'PT Sessions Completed', value: completedPT.toLocaleString('en-IN'), description: 'Personal training sessions currently marked Completed.', tier: 'Must-have', status: 'LIVE' },
        { label: 'PT Revenue', value: `₹${Math.round(ptRevenue).toLocaleString('en-IN')}`, description: 'Recorded payment transactions marked as PT.', tier: 'Advanced', status: 'LIVE' },
      ],
    },
    {
      section: 'Finance & Collections',
      icon: CreditCard,
      items: [
        { label: 'Membership Revenue', value: `₹${Math.round(membershipRevenue).toLocaleString('en-IN')}`, description: 'Recorded payment transactions marked as Membership.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Outstanding Amount', value: `₹${Math.round(outstanding).toLocaleString('en-IN')}`, description: 'Outstanding balance currently recorded against members.', tier: 'Must-have', status: 'LIVE' },
        { label: 'Collection Rate', value: `${collectionRate.toFixed(1)}%`, description: 'Recorded collections divided by recorded collections plus outstanding dues.', tier: 'Advanced', status: 'ESTIMATE' },
      ],
    },
  ];

  const departments = ['All departments', ...allKpis.map((group) => group.section)];
  const tiers = ['All tiers', 'Must-have', 'Advanced', 'Estimate', 'Strategic'];

  const filteredGroups = allKpis
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const matchesDepartment =
          department === 'All departments' || group.section === department;
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          `${group.section} ${item.label} ${item.description}`
            .toLowerCase()
            .includes(q);
        const matchesTier = tier === 'All tiers' || item.tier === tier;
        return matchesDepartment && matchesSearch && matchesTier;
      }),
    }))
    .filter((group) => group.items.length);

  const visibleCount = filteredGroups.reduce(
    (sum, group) => sum + group.items.length,
    0
  );

  const exportCsv = () => {
    const rows = [['Category', 'KPI', 'Value', 'Tier', 'Status', 'Description']];
    filteredGroups.forEach((group) => {
      group.items.forEach((item) => {
        rows.push([
          group.section,
          item.label,
          item.value,
          item.tier,
          item.status,
          item.description,
        ]);
      });
    });

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preface-fitness-kpis-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tierClass = (value) =>
    value.toLowerCase().replace(/[^a-z]+/g, '-');

  return (
    <div className="page performance-page">
      <style>{`
        .performance-page {
          --kpi-navy: #10243b;
          --kpi-muted: #718096;
          --kpi-border: #dfe8ef;
          --kpi-soft: #f7fafc;
        }
        .kpi-toolbar {
          display:flex;
          gap:10px;
          align-items:center;
          flex-wrap:wrap;
          padding:14px;
          background:#fff;
          border:1px solid var(--kpi-border);
          border-radius:16px;
          box-shadow:0 8px 24px rgba(15,23,42,.04);
          margin-bottom:22px;
        }
        .kpi-toolbar .search-box {
          flex:1 1 260px;
          min-width:220px;
        }
        .kpi-toolbar select {
          min-width:170px;
        }
        .kpi-tool-btn {
          border:1px solid #dbe5eb;
          background:#fff;
          color:#203449;
          border-radius:10px;
          padding:10px 13px;
          font-size:12px;
          font-weight:700;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          gap:7px;
        }
        .kpi-tool-btn:hover {
          transform:translateY(-1px);
          box-shadow:0 5px 14px rgba(15,23,42,.08);
        }
        .kpi-section {
          margin-bottom:24px;
        }
        .kpi-section-head {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          border-bottom:1px solid #dce6ed;
          padding:0 2px 9px;
          margin-bottom:12px;
        }
        .kpi-section-title {
          display:flex;
          align-items:center;
          gap:9px;
          color:#1b3047;
        }
        .kpi-section-title .kpi-group-icon {
          width:26px;
          height:26px;
          border-radius:8px;
          display:grid;
          place-items:center;
          background:#e8f7f5;
          color:#13958e;
        }
        .kpi-section-title h3 {
          margin:0;
          font-size:14px;
          font-weight:800;
          letter-spacing:-.01em;
        }
        .kpi-section-title span {
          font-size:10px;
          color:#8291a0;
          margin-left:4px;
        }
        .kpi-grid {
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:10px;
        }
        .kpi-card {
          position:relative;
          min-height:144px;
          padding:12px;
          border:1px solid #dce7ee;
          border-radius:12px;
          background:linear-gradient(180deg,#ffffff 0%,#f8fbfd 100%);
          box-shadow:0 5px 16px rgba(20,40,60,.045);
          transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;
          overflow:hidden;
        }
        .kpi-card::after {
          content:'';
          position:absolute;
          inset:auto -20px -35px auto;
          width:80px;
          height:80px;
          border-radius:50%;
          background:rgba(20,160,150,.045);
        }
        .kpi-card:hover {
          transform:translateY(-3px);
          box-shadow:0 12px 28px rgba(20,40,60,.10);
          border-color:#c8dde4;
        }
        .kpi-top {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:6px;
          margin-bottom:10px;
        }
        .kpi-badge {
          font-size:8px;
          line-height:1;
          font-weight:900;
          letter-spacing:.03em;
          padding:5px 7px;
          border-radius:6px;
          background:#19bde0;
          color:#fff;
        }
        .kpi-badge.estimate { background:#18b7d7; }
        .kpi-tier {
          font-size:8px;
          font-weight:800;
          padding:5px 7px;
          border-radius:6px;
          background:#e8ff8a;
          color:#304700;
        }
        .kpi-tier.advanced { background:#d7f5fb; color:#05718a; }
        .kpi-tier.strategic { background:#efe7ff; color:#6540a5; }
        .kpi-tier.estimate { background:#eef3f6; color:#657482; }
        .kpi-value {
          color:#14283d;
          font-size:22px;
          line-height:1.05;
          font-weight:850;
          letter-spacing:-.035em;
          margin-bottom:7px;
        }
        .kpi-label {
          color:#20354a;
          font-size:11px;
          font-weight:800;
          line-height:1.25;
          margin-bottom:6px;
        }
        .kpi-description {
          color:#81909e;
          font-size:9px;
          line-height:1.35;
          max-width:95%;
        }
        .kpi-empty {
          padding:30px;
          text-align:center;
          border:1px dashed #d5e0e7;
          border-radius:14px;
          color:#778897;
          background:#fbfdfe;
        }
        .kpi-footer-note {
          font-size:10px;
          color:#81909e;
          padding:3px 2px 20px;
        }
        @media (max-width: 1100px) {
          .kpi-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
        }
        @media (max-width: 760px) {
          .kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .kpi-card { min-height:132px; }
        }
        @media (max-width: 500px) {
          .kpi-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="page-heading compact">
        <div>
          <div className="eyebrow">PREFACE FITNESS</div>
          <h1>Performance & KPIs</h1>
          <p>Live operational indicators across revenue, retention, sales, attendance and compliance.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-secondary" onClick={exportCsv}>
            <FileDown size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <ClipboardList size={16} /> Print / PDF
          </button>
        </div>
      </div>

      <div className="kpi-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search KPI, formula, data, owner..."
          />
        </div>

        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          {departments.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select value={tier} onChange={(e) => setTier(e.target.value)}>
          {tiers.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <button
          className="kpi-tool-btn"
          onClick={() => {
            setSearch('');
            setDepartment('All departments');
            setTier('All tiers');
          }}
        >
          Clear
        </button>
      </div>

      {filteredGroups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <section className="kpi-section" key={group.section}>
            <div className="kpi-section-head">
              <div className="kpi-section-title">
                <div className="kpi-group-icon">
                  <GroupIcon size={15} />
                </div>
                <h3>{group.section}</h3>
                <span>{group.items.length} KPI{group.items.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="kpi-grid">
              {group.items.map((item) => (
                <article className="kpi-card" key={`${group.section}-${item.label}`}>
                  <div className="kpi-top">
                    <span className={`kpi-badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                    <span className={`kpi-tier ${tierClass(item.tier)}`}>
                      {item.tier}
                    </span>
                  </div>
                  <div className="kpi-value">{item.value}</div>
                  <div className="kpi-label">{item.label}</div>
                  <div className="kpi-description">{item.description}</div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {!filteredGroups.length && (
        <div className="kpi-empty">
          No KPIs match your current search and filters.
        </div>
      )}

      <div className="kpi-footer-note">
        {visibleCount} KPI{visibleCount !== 1 ? 's' : ''} shown · Values reflect the current data stored in Preface Fitness. Metrics marked ESTIMATE use the available Phase 1 data model.
      </div>
    </div>
  );
}

function ReportsPage({ data, revenue }) {
  const [period, setPeriod] = useState('6m');
  const [chartMode, setChartMode] = useState('revenue');
  const [activeMembership, setActiveMembership] = useState('All');
  const members = data.members || [];
  const payments = data.payments || [];
  const attendance = data.attendance || [];
  const leads = data.leads || [];
  const trainers = data.trainers || [];
  const sessions = data.ptSessions || [];
  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const collected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const dues = members.reduce((sum, m) => sum + Number(m.due || 0), 0);
  const active = members.filter((m) => getMembershipStatus(m.expiry) === 'Active').length;
  const expiring = members.filter((m) => getMembershipStatus(m.expiry) === 'Expiring').length;
  const expired = members.filter((m) => getMembershipStatus(m.expiry) === 'Expired').length;
  const completedPT = sessions.filter((s) => s.status === 'Completed').length;
  const now = new Date();
  const monthCount = period === '12m' ? 12 : period === '3m' ? 3 : 6;
  const months = Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleDateString('en-IN', { month: 'short' }), amount: 0, visits: 0 };
  });
  payments.forEach((p) => {
    const raw = p.date || p.paymentDate || p.createdAt;
    if (!raw) return;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return;
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    if (bucket) bucket.amount += Number(p.amount || 0);
  });
  attendance.forEach((a) => {
    const raw = a.date || a.attendanceDate || a.createdAt;
    if (!raw) return;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return;
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    if (bucket) bucket.visits += 1;
  });
  const chartValues = months.map((m) => chartMode === 'revenue' ? m.amount : m.visits);
  const maxValue = Math.max(1, ...chartValues);
  const membershipRows = [
    { label: 'Active', count: active, color: '#13b981' },
    { label: 'Expiring soon', count: expiring, color: '#f59e0b' },
    { label: 'Expired', count: expired, color: '#fb7185' },
  ];
  const totalMemberships = Math.max(1, active + expiring + expired);
  const donutStops = (() => { let cursor = 0; return membershipRows.map((r) => { const from = cursor; cursor += r.count / totalMemberships * 100; return `${r.color} ${from}% ${cursor}%`; }).join(', '); })();
  const planCounts = Object.entries(members.reduce((acc, m) => { const name = m.plan || 'Unspecified'; acc[name] = (acc[name] || 0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1]).slice(0,5);
  const stageCounts = Object.entries(leads.reduce((acc, l) => { const stage = l.stage || 'New'; acc[stage] = (acc[stage] || 0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1]).slice(0,5);
  const todayStr = new Date().toISOString().slice(0,10);
  const todayAttendance = attendance.filter((a) => String(a.date || a.attendanceDate || '').slice(0,10) === todayStr).length;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="page report-dashboard">
      <style>{`
        .report-dashboard{--rp-ink:#17233d;--rp-muted:#77839b;--rp-line:#e7eaf3;color:var(--rp-ink)}
        .report-dashboard .report-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap;margin-bottom:22px}
        .report-dashboard .report-eyebrow{font-size:11px;letter-spacing:1.7px;font-weight:900;color:#8994aa;margin-bottom:7px}
        .report-dashboard .report-head h1{font-size:clamp(26px,3vw,38px);line-height:1.1;margin:0;font-weight:900;letter-spacing:-1px}
        .report-dashboard .report-head p{margin:8px 0 0;color:var(--rp-muted);font-size:15px}
        .report-dashboard .report-actions{display:flex;gap:8px;flex-wrap:wrap}
        .report-dashboard .report-pill{border:1px solid var(--rp-line);background:#fff;color:#66728b;padding:10px 14px;border-radius:12px;font-weight:800;cursor:pointer}
        .report-dashboard .report-pill.active{background:#7047ff;color:white;border-color:#7047ff;box-shadow:0 7px 18px #7047ff2c}
        .report-dashboard .report-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
        .report-dashboard .report-kpi{background:#fff;border:1px solid var(--rp-line);border-radius:18px;padding:19px;position:relative;overflow:hidden;box-shadow:0 8px 24px #28385b08;min-height:132px}
        .report-dashboard .report-kpi:after{content:'';position:absolute;right:-22px;top:-30px;width:105px;height:105px;border-radius:50%;background:var(--kpi-tint);opacity:.8}
        .report-dashboard .report-kpi-top{display:flex;align-items:center;gap:8px;color:var(--rp-muted);font-weight:800;font-size:12px;position:relative;z-index:1}
        .report-dashboard .report-kpi-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--kpi-tint);color:var(--kpi-color)}
        .report-dashboard .report-kpi strong{display:block;font-size:clamp(22px,2.2vw,30px);letter-spacing:-.7px;margin-top:14px;position:relative;z-index:1}
        .report-dashboard .report-kpi small{display:block;color:var(--rp-muted);margin-top:5px;font-size:11px;position:relative;z-index:1}
        .report-dashboard .report-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:16px;margin-bottom:16px}
        .report-dashboard .report-card{background:#fff;border:1px solid var(--rp-line);border-radius:20px;padding:21px;box-shadow:0 8px 24px #28385b08;min-width:0}
        .report-dashboard .report-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:20px}
        .report-dashboard .report-card h3{font-size:17px;margin:0;font-weight:900;letter-spacing:-.3px}
        .report-dashboard .report-card p{font-size:12px;color:var(--rp-muted);margin:6px 0 0}
        .report-dashboard .report-chart{height:225px;display:flex;gap:10px;align-items:stretch;padding-top:10px}
        .report-dashboard .report-ylabels{display:flex;flex-direction:column;justify-content:space-between;color:#9aa4b6;font-size:10px;padding-bottom:24px;min-width:42px;text-align:right}
        .report-dashboard .report-bars{display:flex;align-items:stretch;gap:clamp(5px,1.3vw,15px);flex:1;min-width:0;border-bottom:1px solid var(--rp-line);background:repeating-linear-gradient(to bottom,transparent 0,transparent 54px,#edf0f7 55px,#edf0f7 56px)}
        .report-dashboard .report-bar-wrap{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px}
        .report-dashboard .report-bar-track{height:185px;width:100%;display:flex;align-items:flex-end;justify-content:center}
        .report-dashboard .report-bar{width:min(34px,80%);min-height:4px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#9c7bff,#7047ff);transition:height .25s ease;position:relative;cursor:pointer}
        .report-dashboard .report-bar:hover{filter:brightness(1.08);box-shadow:0 0 0 4px #7047ff18}
        .report-dashboard .report-bar-label{font-size:10px;color:#8994aa;white-space:nowrap}
        .report-dashboard .report-chart-legend{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:13px;color:var(--rp-muted);font-size:11px}
        .report-dashboard .report-legend-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
        .report-dashboard .report-donut-row{display:flex;align-items:center;gap:24px;justify-content:center;min-height:205px;flex-wrap:wrap}
        .report-dashboard .report-donut{width:158px;height:158px;border-radius:50%;background:conic-gradient(${donutStops});display:grid;place-items:center;position:relative;flex-shrink:0}
        .report-dashboard .report-donut:before{content:'';position:absolute;inset:19px;background:white;border-radius:50%}
        .report-dashboard .report-donut-center{position:relative;text-align:center}.report-dashboard .report-donut-center strong{display:block;font-size:27px}.report-dashboard .report-donut-center span{font-size:11px;color:var(--rp-muted)}
        .report-dashboard .report-legend{display:grid;gap:13px;min-width:125px}.report-dashboard .report-legend button{border:0;background:transparent;padding:0;display:flex;align-items:center;gap:8px;justify-content:space-between;cursor:pointer;color:#596780;text-align:left;font-size:12px}.report-dashboard .report-legend button.selected{font-weight:900;color:#17233d}.report-dashboard .report-legend strong{margin-left:12px;color:#17233d}
        .report-dashboard .report-progress-list{display:grid;gap:17px}.report-dashboard .report-progress-top{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#66728b;margin-bottom:7px}.report-dashboard .report-progress-top strong{color:#17233d}.report-dashboard .report-progress-track{height:9px;background:#f0f2f8;border-radius:99px;overflow:hidden}.report-dashboard .report-progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#16b98a,#5dd6b2)}
        .report-dashboard .report-ops{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.report-dashboard .report-op{padding:16px;border-radius:15px;background:#f8f9fd;border:1px solid #edf0f7}.report-dashboard .report-op span{display:block;color:var(--rp-muted);font-size:11px;font-weight:800}.report-dashboard .report-op strong{display:block;font-size:23px;margin-top:9px}.report-dashboard .report-op small{font-size:10px;color:#8994aa}
        .report-dashboard .report-detail-toggle{border:0;background:#f2efff;color:#7047ff;font-weight:900;border-radius:10px;padding:9px 12px;cursor:pointer}.report-dashboard .report-details{margin-top:14px;border:1px solid var(--rp-line);border-radius:14px;overflow:hidden}.report-dashboard .report-details-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--rp-line);font-size:12px}.report-dashboard .report-details-row:last-child{border-bottom:0}.report-dashboard .report-details-row span{color:var(--rp-muted)}
        @media(max-width:1050px){.report-dashboard .report-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.report-dashboard .report-layout{grid-template-columns:1fr}}
        @media(max-width:560px){.report-dashboard .report-kpis{grid-template-columns:1fr 1fr;gap:9px}.report-dashboard .report-kpi{padding:13px;min-height:115px}.report-dashboard .report-kpi strong{font-size:21px}.report-dashboard .report-card{padding:15px}.report-dashboard .report-chart{gap:5px}.report-dashboard .report-ylabels{min-width:30px;font-size:9px}.report-dashboard .report-bar-label{font-size:9px}.report-dashboard .report-ops{grid-template-columns:1fr 1fr}.report-dashboard .report-donut-row{gap:14px}}
      `}</style>
      <div className="report-head">
        <div><div className="report-eyebrow">PREFACE FITNESS · BUSINESS INTELLIGENCE</div><h1>Reports & Analytics</h1><p>Explore your gym's performance with live, interactive insights.</p></div>
        <div className="report-actions">{[{id:'3m',label:'3 months'},{id:'6m',label:'6 months'},{id:'12m',label:'12 months'}].map((p) => <button key={p.id} className={`report-pill ${period===p.id?'active':''}`} onClick={() => setPeriod(p.id)}>{p.label}</button>)}</div>
      </div>
      <div className="report-kpis">
        <div className="report-kpi" style={{'--kpi-tint':'#d8f8ec','--kpi-color':'#0aa778'}}><div className="report-kpi-top"><span className="report-kpi-icon"><Users size={17}/></span>Total members</div><strong>{members.length}</strong><small>All registered gym members</small></div>
        <div className="report-kpi" style={{'--kpi-tint':'#dff8ed','--kpi-color':'#0aa778'}}><div className="report-kpi-top"><span className="report-kpi-icon"><UserCheck size={17}/></span>Active members</div><strong>{active}</strong><small>{members.length ? Math.round(active/members.length*100) : 0}% of total members</small></div>
        <div className="report-kpi" style={{'--kpi-tint':'#e9e1ff','--kpi-color':'#7047ff'}}><div className="report-kpi-top"><span className="report-kpi-icon"><CircleDollarSign size={17}/></span>Revenue collected</div><strong>{money(collected)}</strong><small>Across recorded payments</small></div>
        <div className="report-kpi" style={{'--kpi-tint':'#fff0c7','--kpi-color':'#d99409'}}><div className="report-kpi-top"><span className="report-kpi-icon"><CreditCard size={17}/></span>Outstanding dues</div><strong>{money(dues)}</strong><small>Pending member balances</small></div>
      </div>
      <div className="report-layout">
        <section className="report-card">
          <div className="report-card-head"><div><h3>{chartMode === 'revenue' ? 'Revenue trend' : 'Attendance trend'}</h3><p>{chartMode === 'revenue' ? 'Monthly collections based on payment dates' : 'Monthly check-ins recorded in the system'}</p></div><div className="report-actions"><button className={`report-pill ${chartMode==='revenue'?'active':''}`} onClick={() => setChartMode('revenue')}>Revenue</button><button className={`report-pill ${chartMode==='attendance'?'active':''}`} onClick={() => setChartMode('attendance')}>Attendance</button></div></div>
          <div className="report-chart"><div className="report-ylabels"><span>{chartMode==='revenue'?money(maxValue):maxValue}</span><span>{chartMode==='revenue'?money(maxValue*.66):Math.round(maxValue*.66)}</span><span>{chartMode==='revenue'?money(maxValue*.33):Math.round(maxValue*.33)}</span><span>0</span></div><div className="report-bars">{months.map((m,i) => <div className="report-bar-wrap" key={m.key}><div className="report-bar-track"><div className="report-bar" title={`${m.label}: ${chartMode==='revenue'?money(m.amount):m.visits+' visits'}`} style={{height:`${Math.max(2,chartValues[i]/maxValue*100)}%`,background:chartMode==='revenue'?'linear-gradient(180deg,#9c7bff,#7047ff)':'linear-gradient(180deg,#5ee2bd,#0aa778)'}} /></div><span className="report-bar-label">{m.label}</span></div>)}</div></div>
          <div className="report-chart-legend"><span><i className="report-legend-dot" style={{background:chartMode==='revenue'?'#7047ff':'#0aa778'}}/>{chartMode==='revenue'?'Collected payments':'Attendance check-ins'}</span><strong>{chartMode==='revenue'?money(months.reduce((s,m)=>s+m.amount,0)):`${months.reduce((s,m)=>s+m.visits,0)} visits`} in selected period</strong></div>
        </section>
        <section className="report-card"><div className="report-card-head"><div><h3>Membership health</h3><p>Click a category to inspect the counts</p></div><ShieldCheck size={21} color="#7047ff"/></div><div className="report-donut-row"><div className="report-donut" style={{background:`conic-gradient(${donutStops})`}}><div className="report-donut-center"><strong>{members.length}</strong><span>members</span></div></div><div className="report-legend">{membershipRows.map((r) => <button key={r.label} className={activeMembership===r.label?'selected':''} onClick={() => setActiveMembership(activeMembership===r.label?'All':r.label)}><span><i className="report-legend-dot" style={{background:r.color}}/>{r.label}</span><strong>{r.count}</strong></button>)}</div></div>{activeMembership!=='All'&&<div className="report-details">{members.filter(m=>getMembershipStatus(m.expiry)===(activeMembership==='Expiring soon'?'Expiring':activeMembership)).map(m=><div className="report-details-row" key={m.id}><strong>{m.name||'Member'}</strong><span>{m.expiry?`Expires ${m.expiry}`:'No expiry date'}</span></div>)}{members.filter(m=>getMembershipStatus(m.expiry)===(activeMembership==='Expiring soon'?'Expiring':activeMembership)).length===0&&<div className="report-details-row"><span>No members in this category.</span></div>}</div>}</section>
      </div>
      <div className="report-layout">
        <section className="report-card"><div className="report-card-head"><div><h3>Membership plan mix</h3><p>Most popular plans in your member base</p></div><Target size={21} color="#0aa778"/></div><div className="report-progress-list">{planCounts.length?planCounts.map(([name,count])=><div key={name}><div className="report-progress-top"><span>{name}</span><strong>{count} member{count===1?'':'s'}</strong></div><div className="report-progress-track"><div className="report-progress-fill" style={{width:`${count/Math.max(1,...planCounts.map(p=>p[1]))*100}%`}}/></div></div>):<p>No membership plan data available yet.</p>}</div></section>
        <section className="report-card"><div className="report-card-head"><div><h3>Lead pipeline</h3><p>Enquiry-to-conversion overview</p></div><TrendingUp size={21} color="#7047ff"/></div><div className="report-progress-list">{stageCounts.length?stageCounts.map(([stage,count],i)=><div key={stage}><div className="report-progress-top"><span>{stage}</span><strong>{count} lead{count===1?'':'s'}</strong></div><div className="report-progress-track"><div className="report-progress-fill" style={{width:`${count/Math.max(1,...stageCounts.map(p=>p[1]))*100}%`,background:i%2?'linear-gradient(90deg,#9c7bff,#7047ff)':'linear-gradient(90deg,#16b98a,#5dd6b2)'}}/></div></div>):<p>No leads recorded yet.</p>}</div></section>
      </div>
      <section className="report-card"><div className="report-card-head"><div><h3>Operations snapshot</h3><p>Activity across your gym management system</p></div><button className="report-detail-toggle" onClick={() => setShowDetails(!showDetails)}>{showDetails?'Hide details':'View details'} <ArrowUpRight size={14}/></button></div><div className="report-ops"><div className="report-op"><span>Today's attendance</span><strong>{todayAttendance}</strong><small>check-ins today</small></div><div className="report-op"><span>Total leads</span><strong>{leads.length}</strong><small>all pipeline stages</small></div><div className="report-op"><span>Trainers</span><strong>{trainers.length}</strong><small>registered trainers</small></div><div className="report-op"><span>PT sessions completed</span><strong>{completedPT}</strong><small>completed sessions</small></div><div className="report-op"><span>PT revenue</span><strong>{money(revenue)}</strong><small>recorded PT collection</small></div><div className="report-op"><span>Attendance records</span><strong>{attendance.length}</strong><small>all recorded visits</small></div></div>{showDetails&&<div className="report-details"><div className="report-details-row"><span>Active memberships</span><strong>{active}</strong></div><div className="report-details-row"><span>Expiring within 30 days</span><strong>{expiring}</strong></div><div className="report-details-row"><span>Expired memberships</span><strong>{expired}</strong></div><div className="report-details-row"><span>Revenue in selected chart period</span><strong>{money(months.reduce((s,m)=>s+m.amount,0))}</strong></div></div>}</section>
    </div>
  );
}

function PublicFeedbackPage() {
  const params = new URLSearchParams(window.location.search);
  const gymId = params.get('gym') || '';
  const gymName = params.get('name') || 'Preface Fitness';
  const [form, setForm] = useState({ name: '', category: 'Complaint', priority: 'medium', feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setResult(null);
    const message = String(form.feedback || '').trim();
    if (!gymId) {
      setResult({ type: 'error', message: 'This feedback QR code is not configured correctly.' });
      return;
    }
    if (!message) {
      setResult({ type: 'error', message: 'Please enter your feedback or complaint.' });
      return;
    }
    if (message.length < 5) {
      setResult({ type: 'error', message: 'Please provide a little more detail.' });
      return;
    }

    setSubmitting(true);
    try {
      await publicSubmitFeedback({
        gymId,
        memberName: String(form.name || '').trim(),
        category: form.category,
        priority: form.priority,
        feedback: message,
      });
      setForm({ name: '', category: 'Complaint', priority: 'medium', feedback: '' });
      setResult({ type: 'success', message: 'Thank you. Your feedback has been submitted successfully.' });
    } catch (error) {
      console.error('Public feedback submission failed:', error);
      setResult({ type: 'error', message: error?.message || 'Unable to submit feedback right now. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-feedback-page">
      <div className="public-feedback-shell">
        <div className="public-feedback-brand">
          <img src={LOGO_URL} alt={gymName} />
          <div><strong>{gymName}</strong><span>Customer Feedback</span></div>
        </div>

        <div className="public-feedback-card">
          <div className="public-feedback-icon"><MessageCircle size={28} /></div>
          <div className="eyebrow">WE VALUE YOUR FEEDBACK</div>
          <h1>Tell us how we can improve.</h1>
          <p className="public-feedback-subtitle">Share a suggestion, complaint or experience. Your feedback goes directly to the gym management team.</p>

          <form onSubmit={submit} className="public-feedback-form">
            <div className="form-grid two">
              <FormField label="Your name (optional)"><input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Enter your name" maxLength={100} /></FormField>
              <FormField label="Feedback type"><select value={form.category} onChange={(e) => update('category', e.target.value)}><option>Complaint</option><option>Suggestion</option><option>Appreciation</option><option>Service</option><option>Trainer</option><option>Cleanliness</option><option>Equipment</option><option>Other</option></select></FormField>
            </div>

            <FormField label="Priority"><div className="public-feedback-priority-group">
              {['low', 'medium', 'high'].map((priority) => <button key={priority} type="button" className={`public-feedback-priority ${form.priority === priority ? `selected ${priority}` : ''}`} onClick={() => update('priority', priority)}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</button>)}
            </div></FormField>

            <FormField label="Feedback / complaint"><textarea rows="6" value={form.feedback} onChange={(e) => update('feedback', e.target.value)} placeholder="Please tell us what happened or what you would like us to improve..." maxLength={2000} required /></FormField>

            {result && <div className={`public-feedback-result ${result.type}`}>{result.message}</div>}

            <button className="btn btn-primary public-feedback-submit" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Feedback'} <ArrowUpRight size={17} /></button>
          </form>
        </div>

        <div className="public-feedback-footer">{gymName} · Your feedback is submitted securely to the gym management system.</div>
      </div>
    </div>
  );
}

function StaffAccessPage() {
  const [staff, setStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [permissions, setPermissions] = useState(DEFAULT_STAFF_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getGymStaff();
      setStaff(rows);
      if (rows.length) {
        const first = rows[0];
        setSelectedStaffId(first.user_id);
        setPermissions({ ...DEFAULT_STAFF_PERMISSIONS, ...(first.permissions || {}) });
      } else {
        setSelectedStaffId('');
        setPermissions(DEFAULT_STAFF_PERMISSIONS);
      }
    } catch (err) {
      setError(err?.message || 'Unable to load staff accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const selectedStaff = staff.find((item) => item.user_id === selectedStaffId);

  const handleStaffChange = (userId) => {
    setSelectedStaffId(userId);
    const selected = staff.find((item) => item.user_id === userId);
    setPermissions({
      ...DEFAULT_STAFF_PERMISSIONS,
      ...(selected?.permissions || {}),
    });
    setMessage('');
    setError('');
  };

  const togglePermission = (key) => {
    setPermissions((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const setAllPermissions = (value) => {
    setPermissions(
      Object.fromEntries(
        STAFF_PERMISSION_DEFINITIONS.map((item) => [item.key, value])
      )
    );
  };

  const savePermissions = async () => {
    if (!selectedStaffId) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateStaffPermissions(selectedStaffId, permissions);
      setStaff((current) => current.map((item) => (
        item.user_id === selectedStaffId
          ? { ...item, permissions }
          : item
      )));
      setMessage('Permissions saved successfully.');
    } catch (err) {
      setError(err?.message || 'Unable to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStaffStatus = async () => {
    if (!selectedStaff) return;
    const nextStatus = !selectedStaff.is_active;
    setMessage('');
    setError('');
    try {
      await setStaffActive(selectedStaff.user_id, nextStatus);
      setStaff((current) => current.map((item) => (
        item.user_id === selectedStaff.user_id
          ? { ...item, is_active: nextStatus }
          : item
      )));
      setMessage(nextStatus ? 'Staff account enabled.' : 'Staff account disabled.');
    } catch (err) {
      setError(err?.message || 'Unable to update staff status.');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Staff Access</h1>
            <p>Loading staff accounts...</p>
          </div>
        </div>
        <section className="card">
          <div style={{ padding: '24px', color: '#718096' }}>Loading...</div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Staff Access</h1>
          <p>Choose which sections each staff member can access.</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#fff4f4', border: '1px solid #ffd7d7', color: '#b83240' }}>
          {error}
        </div>
      )}

      {staff.length === 0 ? (
        <section className="card">
          <div className="card-header">
            <div>
              <h3>No staff accounts found</h3>
              <p>Create a new user in Supabase Authentication and add it to <strong>gym_users</strong> with role <strong>staff</strong>.</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="card" style={{ marginBottom: '18px' }}>
            <div className="card-header">
              <div>
                <h3>Select staff member</h3>
                <p>Permissions below apply only to the selected staff account.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedStaffId}
                onChange={(event) => handleStaffChange(event.target.value)}
                style={{ minWidth: '320px', maxWidth: '100%', height: '42px', border: '1px solid #dce5ea', borderRadius: '10px', padding: '0 12px', background: '#fff', color: '#203246' }}
              >
                {staff.map((item) => (
                  <option key={item.user_id} value={item.user_id}>
                    {item.email}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '13px', fontWeight: 700, color: selectedStaff?.is_active ? '#16736e' : '#b83240' }}>
                {selectedStaff?.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h3>Feature access</h3>
                <p>Turn sections on or off for this staff member.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" type="button" onClick={() => setAllPermissions(true)}>Allow all</button>
                <button className="btn btn-secondary" type="button" onClick={() => setAllPermissions(false)}>Remove all</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {STAFF_PERMISSION_DEFINITIONS.map((item) => (
                <label key={item.key} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid #e5ebef', borderRadius: '12px', cursor: 'pointer', background: permissions[item.key] ? '#f7fbfa' : '#fff' }}>
                  <input
                    type="checkbox"
                    checked={permissions[item.key] === true}
                    onChange={() => togglePermission(item.key)}
                    style={{ marginTop: '3px' }}
                  />
                  <span>
                    <strong style={{ display: 'block', color: '#203246', marginBottom: '4px' }}>{item.label}</strong>
                    <span style={{ display: 'block', fontSize: '12px', lineHeight: 1.45, color: '#718096' }}>{item.description}</span>
                  </span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
              <button className="btn btn-primary" type="button" onClick={savePermissions} disabled={saving || !selectedStaffId}>
                {saving ? 'Saving...' : 'Save permissions'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={toggleStaffStatus} disabled={!selectedStaffId}>
                {selectedStaff?.is_active ? 'Disable staff' : 'Enable staff'}
              </button>
            </div>

            {message && (
              <div style={{ marginTop: '14px', padding: '11px 13px', borderRadius: '10px', background: '#f1faf8', border: '1px solid #d6eee9', color: '#16736e', fontSize: '13px' }}>
                {message}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SettingsPage({ exportBackup, importBackup, onExportExcel, onImportExcel, data, setData, dbReady, resetData }) {
  const current = data.settings || {};
  const [form, setForm] = useState({
    gymName: current.gymName || 'Preface Fitness',
    gymAddress: current.gymAddress || '',
    gymPhone: current.gymPhone || '',
    gymEmail: current.gymEmail || '',
    gstin: current.gstin || '',
    defaultGstRate: Number(current.defaultGstRate ?? 5),
    invoicePrefix: current.invoicePrefix || 'PO',
    invoiceSeriesA: getInvoiceSeriesSettings(current, 'invoiceSeriesA'),
    invoiceSeriesB: getInvoiceSeriesSettings(current, 'invoiceSeriesB'),
    referralPointsPerReferral: Number(current.referralPointsPerReferral ?? 10),
    gymLatitude: current.gymLatitude || '',
    gymLongitude: current.gymLongitude || '',
    publicPage: {
      whatsappNumber: current.publicPage?.whatsappNumber || '', instagramUrl: current.publicPage?.instagramUrl || '', facebookUrl: current.publicPage?.facebookUrl || '', websiteUrl: current.publicPage?.websiteUrl || '',
      googleRating: current.publicPage?.googleRating || '5.0', googleReviewCount: (current.publicPage?.googleReviewCount && String(current.publicPage.googleReviewCount) !== '2') ? current.publicPage.googleReviewCount : '94', googleMapsUrl: current.publicPage?.googleMapsUrl || '', googleSearchUrl: current.publicPage?.googleSearchUrl || 'https://www.google.com/search?q=preface+fitness', googlePlaceName: current.publicPage?.googlePlaceName || current.gymName || 'Preface Fitness', googlePhone: current.publicPage?.googlePhone || '093692 79056', googleAddress: current.publicPage?.googleAddress || current.gymAddress || 'Preface Fitness, Nadan Mahal Rd. above Hdfc Bank, Yahiyaganj, Lucknow, Uttar Pradesh 226003', hoursText: current.publicPage?.hoursText || '6 AM - 11 PM', openingDays: Array.isArray(current.publicPage?.openingDays) ? current.publicPage.openingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      trainers: Array.isArray(current.publicPage?.trainers) ? current.publicPage.trainers : [],
      packages: Array.isArray(current.publicPage?.packages) && current.publicPage.packages.length ? current.publicPage.packages : MEMBERSHIP_PLANS.map((plan) => ({ name: plan.name, months: plan.months, price: plan.price, description: plan.description })),
      reviews: Array.isArray(current.publicPage?.reviews) ? current.publicPage.reviews : [],
    },
  });
  const [authForm, setAuthForm] = useState({
    username: current.auth?.username || 'admin',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [authMessage, setAuthMessage] = useState('');
  const [noticeForm, setNoticeForm] = useState({ enabled: Boolean(current.notice?.enabled), dashboardEnabled: current.notice?.dashboardEnabled !== false, text: current.notice?.text || '', priority: current.notice?.priority || 'medium' });
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

  const showActionFeedback = (message, type = 'success') => {
    setActionFeedback({ type, message });
    window.clearTimeout(showActionFeedback._timer);
    showActionFeedback._timer = window.setTimeout(() => setActionFeedback({ type: '', message: '' }), 3600);
  };

  useEffect(() => {
    setForm({
      gymName: current.gymName || 'Preface Fitness',
      gymAddress: current.gymAddress || '',
      gymPhone: current.gymPhone || '',
      gymEmail: current.gymEmail || '',
      gstin: current.gstin || '',
      defaultGstRate: Number(current.defaultGstRate ?? 5),
      invoicePrefix: current.invoicePrefix || 'PO',
      invoiceSeriesA: getInvoiceSeriesSettings(current, 'invoiceSeriesA'),
      invoiceSeriesB: getInvoiceSeriesSettings(current, 'invoiceSeriesB'),
      referralPointsPerReferral: Number(current.referralPointsPerReferral ?? 10),
      gymLatitude: current.gymLatitude || '',
      gymLongitude: current.gymLongitude || '',
      publicPage: {
        whatsappNumber: current.publicPage?.whatsappNumber || '', instagramUrl: current.publicPage?.instagramUrl || '', facebookUrl: current.publicPage?.facebookUrl || '', websiteUrl: current.publicPage?.websiteUrl || '',
        googleRating: current.publicPage?.googleRating || '5.0', googleReviewCount: (current.publicPage?.googleReviewCount && String(current.publicPage.googleReviewCount) !== '2') ? current.publicPage.googleReviewCount : '94', googleMapsUrl: current.publicPage?.googleMapsUrl || '', googleSearchUrl: current.publicPage?.googleSearchUrl || 'https://www.google.com/search?q=preface+fitness', googlePlaceName: current.publicPage?.googlePlaceName || current.gymName || 'Preface Fitness', googlePhone: current.publicPage?.googlePhone || '093692 79056', googleAddress: current.publicPage?.googleAddress || current.gymAddress || 'Preface Fitness, Nadan Mahal Rd. above Hdfc Bank, Yahiyaganj, Lucknow, Uttar Pradesh 226003', hoursText: current.publicPage?.hoursText || '6 AM - 11 PM', openingDays: Array.isArray(current.publicPage?.openingDays) ? current.publicPage.openingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        trainers: Array.isArray(current.publicPage?.trainers) ? current.publicPage.trainers : [],
        packages: Array.isArray(current.publicPage?.packages) && current.publicPage.packages.length ? current.publicPage.packages : MEMBERSHIP_PLANS.map((plan) => ({ name: plan.name, months: plan.months, price: plan.price, description: plan.description })),
        reviews: Array.isArray(current.publicPage?.reviews) ? current.publicPage.reviews : [],
      },
    });
    setAuthForm((form) => ({
      ...form,
      username: current.auth?.username || 'admin',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    setAuthMessage('');
    setNoticeForm({ enabled: Boolean(current.notice?.enabled), dashboardEnabled: current.notice?.dashboardEnabled !== false, text: current.notice?.text || '', priority: current.notice?.priority || 'medium' });
  }, [current.gymName, current.gymAddress, current.gymPhone, current.gymEmail, current.gstin, current.defaultGstRate, current.invoicePrefix, current.invoiceSeriesA, current.invoiceSeriesB, current.referralPointsPerReferral, current.gymLatitude, current.gymLongitude, current.publicPage, current.notice?.id, current.notice?.enabled, current.notice?.dashboardEnabled, current.notice?.text, current.notice?.priority, current.noticeHistory, current.auth?.username, current.auth?.passwordHash]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { showActionFeedback('This browser does not support location detection.', 'error'); return setAuthMessage('This browser does not support location detection.'); }
    navigator.geolocation.getCurrentPosition(
      (position) => { setForm((f) => ({ ...f, gymLatitude: position.coords.latitude.toFixed(7), gymLongitude: position.coords.longitude.toFixed(7) })); showActionFeedback('Current gym location detected.'); },
      () => { showActionFeedback('Could not read the current location. Allow location access and try again.', 'error'); setAuthMessage('Could not read the current location. Allow location access and try again.'); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const saveGymLocation = async () => {
    const lat = Number(form.gymLatitude);
    const lng = Number(form.gymLongitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setAuthMessage('Enter valid gym latitude and longitude first.');
      showActionFeedback('Enter valid gym latitude and longitude first.', 'error');
      return;
    }

    const locationSettings = {
      gymLatitude: String(form.gymLatitude).trim(),
      gymLongitude: String(form.gymLongitude).trim(),
    };

    setData((d) => ({
      ...d,
      settings: { ...(d.settings || {}), ...locationSettings },
    }));

    try {
      await saveCloudSettings(locationSettings);
      setAuthMessage('Gym location saved to the cloud.');
      showActionFeedback('Gym location saved successfully.');
    } catch (error) {
      console.error('Supabase gym location save failed:', error);
      setAuthMessage(error?.message || 'Gym location saved locally, but cloud save failed.');
    }
  };

  const qrUrl = getCheckInUrl(
    data.gym?.id || PRODUCTION_GYM_ID,
    String(form.gymLatitude || '').trim(),
    String(form.gymLongitude || '').trim()
  );
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=20&data=${encodeURIComponent(qrUrl)}`;
  const feedbackQrUrl = getFeedbackUrl(data.gym?.id || '', form.gymName || 'Preface Fitness');
  const feedbackQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=20&data=${encodeURIComponent(feedbackQrUrl)}`;
  const memberPortalUrl = `${PRODUCTION_APP_URL}?gym=${encodeURIComponent(data.gym?.id || PRODUCTION_GYM_ID)}#member-portal`;
  const memberPortalQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=20&data=${encodeURIComponent(memberPortalUrl)}`;
  const openMemberPortalQr = () => { window.open(memberPortalQrImageUrl, '_blank', 'noopener,noreferrer'); showActionFeedback('Member Portal QR opened in a new tab.'); };
  const printMemberPortalQr = () => { const w = window.open('', '_blank', 'width=700,height=900'); if (!w) { showActionFeedback('Popup was blocked. Allow popups to print the Member Portal QR.', 'error'); return; } w.document.write(`<!doctype html><html><head><title>Member Portal QR</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:40px;color:#17263b}img{width:360px;max-width:90vw}h1{font-size:28px}p{font-size:16px;color:#64748b}</style></head><body><h1>${String(form.gymName || 'Preface Fitness')}</h1><p>Scan to log in to your Member Portal</p><img src="${memberPortalQrImageUrl}" alt="Member Portal QR"/><p>Use your registered mobile/member ID and 6-digit PIN</p></body></html>`); w.document.close(); w.focus(); setTimeout(()=>w.print(),250); };

  const openQr = () => { window.open(qrImageUrl, '_blank', 'noopener,noreferrer'); showActionFeedback('Attendance QR opened in a new tab.'); };
  const openFeedbackQr = () => { window.open(feedbackQrImageUrl, '_blank', 'noopener,noreferrer'); showActionFeedback('Feedback QR opened in a new tab.'); };
  const printFeedbackQr = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=700,height=900');
    if (!printWindow) { showActionFeedback('Popup was blocked. Allow popups to print the feedback QR.', 'error'); return; }
    printWindow.document.write(`<!doctype html><html><head><title>${String(form.gymName || 'Preface Fitness')} - Feedback QR</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;color:#17263b}img{width:420px;max-width:90vw}h1{margin:0 0 8px;font-size:28px}p{color:#667788;font-size:16px}
  /* Final navbar alignment: lift only the second navigation row by 10px. */
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+9) {
    transform: translateY(-10px) !important;
  }
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+9):hover {
    transform: translateY(-12px) !important;
  }
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+9):active {
    transform: translateY(-10px) scale(.992) !important;
  }
</style></head><body><h1>${String(form.gymName || 'Preface Fitness')}</h1><p>Scan to submit feedback or a complaint</p><img src="${feedbackQrImageUrl}" alt="Feedback QR"/><p>Customer Feedback • Low / Medium / High priority</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
    showActionFeedback('Feedback QR print window opened.');
  };

  const saveSettings = async () => {
    const settingsPatch = {
      ...form,
      referralPointsPerReferral: Math.max(0, Number(form.referralPointsPerReferral || 0)),
      invoiceSeriesA: getInvoiceSeriesSettings({ ...current, ...form }, 'invoiceSeriesA'),
      invoiceSeriesB: getInvoiceSeriesSettings({ ...current, ...form }, 'invoiceSeriesB'),
    };

    setData((d) => ({
      ...d,
      settings: {
        ...(d.settings || {}),
        ...settingsPatch,
      },
    }));

    try {
      await saveCloudSettings(settingsPatch);
      setAuthMessage('Gym settings saved successfully to the cloud.');
      showActionFeedback('Gym details saved successfully.');
    } catch (error) {
      console.error('Supabase settings save failed:', error);
      setAuthMessage(error?.message || 'Settings saved locally, but cloud save failed.');
    }
  };

  const saveNotice = async () => {
    const text = String(noticeForm.text || '').trim();
    if (!text) {
      setAuthMessage('Please enter the notice text first.');
      showActionFeedback('Enter notice text before publishing.', 'error');
      return;
    }

    const notice = {
      id: `NOTICE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      priority: noticeForm.priority || 'medium',
      enabled: Boolean(noticeForm.enabled),
      dashboardEnabled: Boolean(noticeForm.dashboardEnabled),
      createdAt: new Date().toISOString(),
    };

    const existingHistory = Array.isArray(current.noticeHistory) ? current.noticeHistory : [];
    const legacyCurrentNotice = current.notice?.text && !existingHistory.some((item) => item?.id && item.id === current.notice.id)
      ? { ...current.notice, id: current.notice.id || `NOTICE-LEGACY-${Date.now()}`, createdAt: current.notice.createdAt || new Date().toISOString() }
      : null;
    const historyBase = legacyCurrentNotice ? [...existingHistory, legacyCurrentNotice] : existingHistory;
    const noticeHistory = [...historyBase, notice].slice(-10);

    setData((d) => ({
      ...d,
      settings: {
        ...(d.settings || {}),
        notice,
        noticeHistory,
      },
    }));
    setNoticeForm({ enabled: notice.enabled, dashboardEnabled: notice.dashboardEnabled, text: '', priority: notice.priority });

    try {
      await saveCloudSettings({ notice, noticeHistory });
      setAuthMessage('Notice published and added to the last 10 notices history.');
      showActionFeedback('Notice published successfully.');
    } catch (error) {
      console.error('Supabase notice save failed:', error);
      setAuthMessage(error?.message || 'Notice saved locally, but cloud save failed.');
    }
  };

  const hideCurrentNotice = async () => {
    const currentNotice = current.notice || {};
    const notice = { ...currentNotice, enabled: false, dashboardEnabled: false };
    setData((d) => ({ ...d, settings: { ...(d.settings || {}), notice } }));
    try {
      await saveCloudSettings({ notice });
      setNoticeForm((f) => ({ ...f, enabled: false, dashboardEnabled: false }));
      setAuthMessage('Current notice removed from the public page and dashboard. It remains in history.');
      showActionFeedback('Current notice hidden from the public page.');
    } catch (error) {
      console.error('Supabase notice hide failed:', error);
      setAuthMessage(error?.message || 'Notice was hidden locally, but cloud save failed.');
    }
  };

  const removeNoticeHistoryItem = async (noticeId) => {
    const history = Array.isArray(current.noticeHistory) ? current.noticeHistory : [];
    const removed = history.find((item) => item?.id === noticeId);
    if (!removed) return;
    if (!window.confirm('Remove this notice from the last 10 notices history? If it is active, it will also disappear from the public page.')) return;

    const noticeHistory = history.filter((item) => item?.id !== noticeId);
    const isCurrent = current.notice?.id === noticeId;
    const notice = isCurrent ? { ...(current.notice || {}), enabled: false, dashboardEnabled: false } : current.notice;

    setData((d) => ({
      ...d,
      settings: {
        ...(d.settings || {}),
        noticeHistory,
        ...(isCurrent ? { notice } : {}),
      },
    }));

    try {
      await saveCloudSettings(isCurrent ? { notice, noticeHistory } : { noticeHistory });
      if (isCurrent) setNoticeForm((f) => ({ ...f, enabled: false, dashboardEnabled: false }));
      setAuthMessage('Notice removed from history and public display.');
      showActionFeedback('Notice removed successfully.');
    } catch (error) {
      console.error('Supabase notice history delete failed:', error);
      setAuthMessage(error?.message || 'Notice was removed locally, but cloud delete failed.');
    }
  };

  const saveAuthSettings = async () => {
    const username = authForm.username.trim();

    if (!username) {
      setAuthMessage('Username cannot be empty.');
      return;
    }

    if (!authForm.currentPassword) {
      setAuthMessage('Enter your current password to make changes.');
      return;
    }

    const currentHash = current.auth?.passwordHash || await hashPassword('admin123');
    const enteredCurrentHash = await hashPassword(authForm.currentPassword);

    if (enteredCurrentHash !== currentHash) {
      setAuthMessage('Current password is incorrect.');
      return;
    }

    if (!authForm.newPassword) {
      setAuthMessage('Enter a new password.');
      return;
    }

    if (authForm.newPassword.length < 6) {
      setAuthMessage('New password must be at least 6 characters.');
      return;
    }

    if (authForm.newPassword !== authForm.confirmPassword) {
      setAuthMessage('New password and confirmation do not match.');
      return;
    }

    const passwordHash = await hashPassword(authForm.newPassword);

    setData((d) => ({
      ...d,
      settings: {
        ...(d.settings || {}),
        auth: { username, passwordHash },
      },
    }));

    setAuthForm({
      username,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setAuthMessage('Login credentials updated successfully.');
    showActionFeedback('Login credentials updated successfully.');
  };


  const updatePublicPage = (key, value) => setForm((f) => ({ ...f, publicPage: { ...(f.publicPage || {}), [key]: value } }));
  const addPublicTrainer = () => { updatePublicPage('trainers', [...(form.publicPage?.trainers || []), { name: '', role: 'FITNESS TRAINER', experience: '', forte: '', specialization: '', certification: '', description: '', photo: '' }]); showActionFeedback('Trainer added to the draft.'); };
  const updatePublicTrainer = (index, key, value) => updatePublicPage('trainers', (form.publicPage?.trainers || []).map((item, i) => i === index ? { ...item, [key]: value } : item));

  const handlePublicTrainerPhoto = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const photo = await resizePublicImage(file, 900, 0.82);
      updatePublicTrainer(index, 'photo', photo);
      setAuthMessage('Trainer photo selected. Click “Save public page” to publish it.');
      showActionFeedback('Trainer photo selected. Save the public page to publish it.');
    } catch (error) {
      console.error('Trainer photo processing failed:', error);
      setAuthMessage(error?.message || 'Unable to use this trainer photo.');
    } finally {
      event.target.value = '';
    }
  };

  const removePublicTrainerPhoto = (index) => {
    updatePublicTrainer(index, 'photo', '');
    showActionFeedback('Trainer photo removed from the draft.');
  };

  const removePublicTrainer = (index) => { updatePublicPage('trainers', (form.publicPage?.trainers || []).filter((_, i) => i !== index)); showActionFeedback('Trainer removed from the draft.'); };
  const addPublicPackage = () => { updatePublicPage('packages', [...(form.publicPage?.packages || []), { name: '', months: 1, price: 0, description: '' }]); showActionFeedback('Package added to the draft.'); };
  const updatePublicPackage = (index, key, value) => updatePublicPage('packages', (form.publicPage?.packages || []).map((item, i) => i === index ? { ...item, [key]: value } : item));
  const removePublicPackage = (index) => { updatePublicPage('packages', (form.publicPage?.packages || []).filter((_, i) => i !== index)); showActionFeedback('Package removed from the draft.'); };
  const addPublicReview = () => { updatePublicPage('reviews', [...(form.publicPage?.reviews || []), { name: '', date: 'Google review', text: '', photo: '' }]); showActionFeedback('Review added to the draft.'); };
  const updatePublicReview = (index, key, value) => updatePublicPage('reviews', (form.publicPage?.reviews || []).map((item, i) => i === index ? { ...item, [key]: value } : item));
  const removePublicReview = (index) => { updatePublicPage('reviews', (form.publicPage?.reviews || []).filter((_, i) => i !== index)); showActionFeedback('Review removed from the draft.'); };

  const savePublicPageOnly = async () => {
    // Treat the edited package form as the source of truth. Previously this
    // preferred data.settings.membershipPrices over the form value, so a user
    // could edit a price but the old value was written back on Save.
    const cleanedPackages = (form.publicPage?.packages || [])
      .filter((p) => String(p.name || '').trim())
      .map((p) => {
        const standardPlan = MEMBERSHIP_PLANS.find(
          (plan) => String(plan.name).trim().toLowerCase() === String(p.name || '').trim().toLowerCase()
        );
        return {
          ...p,
          months: Math.max(1, Number(p.months || standardPlan?.months || 1)),
          price: Math.max(0, Number(p.price ?? standardPlan?.price ?? 0)),
        };
      });

    const publicPage = {
      ...(form.publicPage || {}),
      trainers: (form.publicPage?.trainers || [])
        .filter((t) => String(t.name || '').trim())
        .map((t) => ({ ...t, photo: String(t.photo || '') })),
      packages: cleanedPackages,
      reviews: (form.publicPage?.reviews || []).filter((r) => String(r.name || r.text || '').trim()),
    };
    const patch = {
      publicPage: { ...publicPage, updatedAt: new Date().toISOString() },
    };

    setForm((f) => ({ ...f, publicPage: patch.publicPage }));
    setData((d) => ({ ...d, settings: { ...(d.settings || {}), ...patch } }));

    try {
      await saveCloudSettings(patch);
      setAuthMessage('Public page settings saved successfully.');
      showActionFeedback('Public page settings saved successfully.');
    } catch (error) {
      console.error('Membership/public page settings save failed:', error);
      setAuthMessage(error?.message || 'Changes are visible locally, but cloud save failed.');
      showActionFeedback(error?.message || 'Unable to save public page settings.', 'error');
    }
  };


  return (
    <div className="page settings-page-organized">
      <style>{`
        .settings-tabs-shell { display:block; width:100%; }
        .settings-tabs-nav { position:static; display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:10px; margin:0 0 18px; padding:10px; border:1px solid #e4e9f0; border-radius:18px; background:linear-gradient(180deg,#ffffff,#f7f9fc); box-shadow:0 10px 28px rgba(31,45,61,.06); }
        .settings-tab { appearance:none; width:100%; min-width:0; display:flex; align-items:center; gap:12px; text-align:left; border:1px solid transparent; border-radius:13px; padding:12px 13px; background:transparent; color:#526173; cursor:pointer; transition:.18s ease; }
        .settings-tab svg { flex:0 0 auto; color:#7a63ff; }
        .settings-tab span { min-width:0; display:grid; gap:2px; }
        .settings-tab strong { font-size:13px; color:#26364b; }
        .settings-tab small { font-size:11px; color:#8793a3; line-height:1.35; }
        .settings-tab:hover { background:#f2efff; border-color:#ddd5ff; transform:translateY(-1px); }
        .settings-tab.active { background:linear-gradient(135deg,#6d4aff,#8b65ff); border-color:#7657ff; box-shadow:0 9px 22px rgba(109,74,255,.22); color:#fff; }
        .settings-tab.active svg,.settings-tab.active strong,.settings-tab.active small { color:#fff; }
        .settings-tab-panel { display:grid; gap:18px; }
        .settings-tab-panel > .card { margin:0; }
        .settings-action-toast { position:fixed; top:22px; right:24px; z-index:5000; display:flex; align-items:center; gap:10px; max-width:min(420px,calc(100vw - 32px)); padding:13px 16px; border-radius:14px; background:#10233f; color:#fff; box-shadow:0 16px 40px rgba(15,35,60,.25); border:1px solid rgba(255,255,255,.12); animation:settingsToastIn .22s ease-out; }
        .settings-action-toast.success { border-left:4px solid #13b89d; }
        .settings-action-toast.error { border-left:4px solid #ef476f; background:#2a1620; }
        .settings-action-toast strong { font-size:13px; }
        .settings-action-toast span { font-size:12px; color:#dbe5ef; line-height:1.4; }
        @keyframes settingsToastIn { from { opacity:0; transform:translateY(-10px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @media(max-width:1100px) { .settings-tabs-nav { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media(max-width:700px) { .settings-tabs-nav { grid-template-columns:repeat(2,minmax(0,1fr)); } .settings-tab { min-height:66px; } }
        @media(max-width:560px) { .settings-tabs-nav { grid-template-columns:1fr; } .settings-tab { min-height:unset; } .settings-action-toast { top:12px; right:12px; } }
      `}</style>
      {actionFeedback.message && <div className={`settings-action-toast ${actionFeedback.type || 'success'}`} role="status" aria-live="polite"><CheckCircle2 size={18} /><div><strong>{actionFeedback.type === 'error' ? 'Action needs attention' : 'Done'}</strong><span>{actionFeedback.message}</span></div></div>}
      <PageTitle title="Settings" subtitle="Organized controls for gym operations, public website, notices, security and data." />
      <div className="settings-tabs-shell">
        <nav className="settings-tabs-nav" aria-label="Settings sections">
          <button type="button" className={"settings-tab " + (activeSettingsTab === 'general' ? 'active' : '')} onClick={() => setActiveSettingsTab('general')}><Settings size={18} /><span><strong>General</strong><small>Gym identity, billing and referral controls</small></span></button>
          <button type="button" className={"settings-tab " + (activeSettingsTab === 'notices' ? 'active' : '')} onClick={() => setActiveSettingsTab('notices')}><Bell size={18} /><span><strong>Notices</strong><small>Public notices and offers</small></span></button>
          <button type="button" className={"settings-tab " + (activeSettingsTab === 'public' ? 'active' : '')} onClick={() => setActiveSettingsTab('public')}><Sparkles size={18} /><span><strong>Public Page</strong><small>Everything customers see online</small></span></button>
          <button type="button" className={"settings-tab " + (activeSettingsTab === 'security' ? 'active' : '')} onClick={() => setActiveSettingsTab('security')}><ShieldCheck size={18} /><span><strong>Security</strong><small>Owner login and access</small></span></button>
          <button type="button" className={"settings-tab " + (activeSettingsTab === 'qr' ? 'active' : '')} onClick={() => setActiveSettingsTab('qr')}><QrCode size={18} /><span><strong>QR & Feedback</strong><small>Attendance and customer feedback</small></span></button>
          <button type="button" className={"settings-tab " + (activeSettingsTab === 'data' ? 'active' : '')} onClick={() => setActiveSettingsTab('data')}><FileDown size={18} /><span><strong>Data & Backup</strong><small>Cloud status and backup</small></span></button>
        </nav>
        <div className="settings-tab-content">
        {activeSettingsTab === 'general' && (
          <div className="settings-tab-panel">
<section className="card">
          <div className="card-header"><div><h3>Gym & billing details</h3><p>These details are used on member bills and invoices. Invoice numbers use separate Series A (GST) and Series B (non-GST) counters by financial year.</p></div></div>
          <div className="form-grid two">
            <FormField label="Gym name"><input value={form.gymName} onChange={(e) => setForm((f) => ({...f,gymName:e.target.value}))} /></FormField>
            <div style={{gridColumn:'1 / -1',display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'16px'}}>
              {['A','B'].map((letter) => {
                const key = letter === 'A' ? 'invoiceSeriesA' : 'invoiceSeriesB';
                const series = form[key] || getInvoiceSeriesSettings(current, key);
                const fy = String(series.financialYear || currentFinancialYear());
                const nextNumber = Number(series.yearlyNext?.[fy] ?? series.nextNumber ?? 1);
                const preview = `${String(series.prefix || 'PO').trim() || 'PO'}/${fy}/${String(nextNumber).padStart(Math.min(12,Math.max(1,Number(series.numberLength)||6)),'0')}`;
                const updateSeries = (patch) => setForm((f) => ({...f,[key]:{...(f[key] || series),...patch}}));
                const applyStart = async () => {
                  const chosenYear = String(series.financialYear || currentFinancialYear()).trim();
                  const chosenNumber = Math.max(1,parseInt(series.nextNumber,10)||1);
                  const updatedSeries = { ...(form[key] || series), financialYear:chosenYear, nextNumber:chosenNumber, yearlyNext:{...((form[key] || series).yearlyNext || {}),[chosenYear]:chosenNumber}, memberNextNumber:chosenNumber, memberYearlyNext:{...((form[key] || series).memberYearlyNext || {}),[chosenYear]:chosenNumber} };
                  const nextSettings = { ...(data.settings || {}), [key]: updatedSeries };
                  setForm((f) => ({...f,[key]:updatedSeries}));
                  setData((d) => ({...d,settings:{...(d.settings || {}),[key]:updatedSeries}}));
                  try {
                    await saveCloudSettings({ [key]: updatedSeries });
                    showActionFeedback(`Series ${letter} applied. Next invoice: ${String(updatedSeries.prefix || 'PO').trim() || 'PO'}/${chosenYear}/${String(chosenNumber).padStart(Math.min(12,Math.max(1,Number(updatedSeries.numberLength)||6)),'0')}`);
                  } catch (error) {
                    console.error('Invoice series save failed:', error);
                    showActionFeedback(error?.message || `Series ${letter} saved locally, but cloud save failed.`, 'error');
                  }
                };
                return <div key={key} style={{border:'1px solid #e5e7eb',borderRadius:'12px',padding:'14px',display:'grid',gap:'10px'}}>
                  <strong>Invoice Series {letter}</strong>
                  <FormField label="Prefix"><input value={series.prefix || ''} onChange={(e) => updateSeries({prefix:e.target.value})} placeholder="PO" /></FormField>
                  <FormField label="Number length"><input type="number" min="1" max="12" value={series.numberLength ?? 6} onChange={(e) => updateSeries({numberLength:Math.min(12,Math.max(1,Number(e.target.value)||1))})} /></FormField>
                  <div style={{fontSize:'13px',color:'#94a3b8'}}>Next: {preview}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <FormField label="Financial year"><input value={series.financialYear || currentFinancialYear()} onChange={(e) => updateSeries({financialYear:e.target.value.trim()})} placeholder="2026-27" /></FormField>
                    <FormField label="Start next at"><input type="number" min="1" value={series.nextNumber ?? 1} onChange={(e) => updateSeries({nextNumber:Math.max(1,parseInt(e.target.value,10)||1)})} /></FormField>
                  </div>
                  <div style={{fontSize:'12px',color:'#94a3b8'}}>Currently next: {preview}</div>
                  <button className="btn btn-secondary" type="button" onClick={applyStart}><CheckCircle2 size={16}/> Apply start number</button>
                </div>;
              })}
            </div>
          </div>
          <FormField label="Gym address"><textarea rows="2" value={form.gymAddress} onChange={(e) => setForm((f) => ({...f,gymAddress:e.target.value}))} placeholder="Full gym address" /></FormField>
          <div className="form-grid two">
            <FormField label="Gym phone"><input value={form.gymPhone} onChange={(e) => setForm((f) => ({...f,gymPhone:e.target.value}))} /></FormField>
            <FormField label="Gym email"><input type="email" value={form.gymEmail} onChange={(e) => setForm((f) => ({...f,gymEmail:e.target.value}))} /></FormField>
          </div>
          <div className="form-grid two"><FormField label="GSTIN (optional)"><input value={form.gstin} onChange={(e) => setForm((f) => ({...f,gstin:e.target.value}))} placeholder="GSTIN" /></FormField><FormField label="Default GST rate (%)"><input type="number" min="0" step="0.01" value={form.defaultGstRate ?? 5} onChange={(e) => setForm((f) => ({...f,defaultGstRate:e.target.value}))} /></FormField></div>
          <div className="form-section-title" style={{ marginTop: '18px' }}>QR attendance location</div>
          <p style={{ color: '#718096', fontSize: '13px', lineHeight: 1.5, marginTop: 0 }}>The public check-in page will only accept attendance when the member's phone is within 50 metres of these coordinates.</p>
          <div className="form-grid two">
            <FormField label="Gym latitude"><input value={form.gymLatitude} onChange={(e) => setForm((f) => ({...f,gymLatitude:e.target.value}))} placeholder="e.g. 26.8467007" /></FormField>
            <FormField label="Gym longitude"><input value={form.gymLongitude} onChange={(e) => setForm((f) => ({...f,gymLongitude:e.target.value}))} placeholder="e.g. 80.9462007" /></FormField>
          </div>
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'12px'}}>
            <button className="btn btn-secondary" type="button" onClick={useCurrentLocation}><Target size={17}/> Use my current location</button>
            <button className="btn btn-secondary" type="button" onClick={saveGymLocation}><Save size={17}/> Save gym location</button>
          </div>
          <button className="btn btn-primary" onClick={saveSettings}><Save size={17}/> Save gym details</button>
        </section>

<section className="card">
          <div className="card-header"><div><h3>Referral rewards</h3><p>Choose how many points a member earns for each successful referral.</p></div></div>
          <FormField label="Points per successful referral"><input type="number" min="0" step="1" value={form.referralPointsPerReferral} onChange={(e) => setForm((f) => ({...f,referralPointsPerReferral:e.target.value}))} /></FormField>
          <div style={{padding:'14px 16px',borderRadius:'12px',background:'#f5fbfa',border:'1px solid #dcefeb',color:'#55706e',fontSize:'13px',lineHeight:1.6}}>
            Example: if this is <strong>{Number(form.referralPointsPerReferral || 0)} points</strong>, a member who successfully refers 5 clients earns <strong>{Number(form.referralPointsPerReferral || 0) * 5} points</strong>.
          </div>
          <button className="btn btn-primary" style={{marginTop:'12px'}} onClick={saveSettings}><Save size={17}/> Save referral settings</button>
        </section>
          </div>
        )}
        {activeSettingsTab === 'notices' && (
          <div className="settings-tab-panel">
<section className="card notice-settings-card">
          <div className="card-header">
            <div><h3>Public notice / offer</h3><p>Publish a notice, offer, holiday message or announcement on the public gym page. Every saved notice is kept in the latest 10 notices history.</p></div>
            <Bell size={20} />
          </div>

          <div className="notice-settings-toggles">
            <label className="notice-toggle"><input type="checkbox" checked={noticeForm.enabled} onChange={(e) => setNoticeForm((f) => ({ ...f, enabled: e.target.checked }))} /><span>Show on public page</span></label>
            <label className="notice-toggle"><input type="checkbox" checked={noticeForm.dashboardEnabled} onChange={(e) => setNoticeForm((f) => ({ ...f, dashboardEnabled: e.target.checked }))} /><span>Show on admin dashboard</span></label>
          </div>

          <div className="form-grid two">
            <FormField label="Priority"><select value={noticeForm.priority} onChange={(e) => setNoticeForm((f) => ({ ...f, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High / urgent</option></select></FormField>
            <div style={{display:'flex',alignItems:'end'}}><div style={{fontSize:'12px',color:'#718096',lineHeight:1.55,paddingBottom:'10px'}}>Tip: use <strong>High</strong> for closures or urgent alerts and <strong>Medium</strong> for offers and normal announcements.</div></div>
          </div>

          <FormField label="Notice / offer text"><textarea rows="4" value={noticeForm.text} onChange={(e) => setNoticeForm((f) => ({ ...f, text: e.target.value }))} placeholder="Example: Diwali Offer — Get 20% off on 3-month memberships till 31 October." /></FormField>
          <div className={`notice-preview priority-${noticeForm.priority}`}><Bell size={17} /><div><strong>{noticeForm.priority === 'high' ? 'Important notice' : noticeForm.priority === 'low' ? 'Gym update' : 'Gym announcement'}</strong><span>{noticeForm.text || 'Your public notice preview will appear here.'}</span></div><span className="notice-preview-pulse" /></div>

          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'12px'}}>
            <button className="btn btn-primary" onClick={saveNotice}><Save size={17} /> Publish notice</button>
            {current.notice?.text && <button className="btn btn-secondary" type="button" onClick={hideCurrentNotice}><X size={17} /> Hide current notice</button>}
          </div>

          <div className="notice-history">
            <div className="notice-history-head"><div><h4>Last 10 notices</h4><p>Deleting a notice from history also removes it from the public page if it is currently active.</p></div><span>{Array.isArray(current.noticeHistory) ? current.noticeHistory.length : 0}/10</span></div>
            {(Array.isArray(current.noticeHistory) ? [...current.noticeHistory].reverse() : []).map((item) => {
              const active = current.notice?.id && current.notice.id === item.id;
              const dateLabel = item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Date unavailable';
              return <div className={`notice-history-item ${active ? 'active' : ''}`} key={item.id || `${item.createdAt}-${item.text}`}>
                <div className={`notice-history-dot priority-${item.priority || 'medium'}`} />
                <div className="notice-history-copy"><div className="notice-history-meta"><span>{item.priority === 'high' ? 'HIGH' : item.priority === 'low' ? 'LOW' : 'MEDIUM'}</span><small>{dateLabel}</small>{active && <b>ACTIVE</b>}</div><strong>{item.text}</strong></div>
                <button className="btn btn-danger btn-sm" type="button" onClick={() => removeNoticeHistoryItem(item.id)} title="Remove notice"><Trash2 size={15} /> Remove</button>
              </div>;
            })}
            {!(Array.isArray(current.noticeHistory) && current.noticeHistory.length) && <div className="notice-history-empty"><Bell size={18} /><span>No saved notices yet. Your last 10 published notices will appear here.</span></div>}
          </div>
        </section>
          </div>
        )}
        {activeSettingsTab === 'public' && (
          <div className="settings-tab-panel">
<section className="card public-page-admin-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div><h3>Public Gym Page</h3><p>Manage everything customers see on the public gym website: trainers, packages, contact buttons, Google business details and customer reviews.</p></div>
            <Sparkles size={22} />
          </div>

          <div className="form-section-title">Contact & social links</div>
          <div className="form-grid two">
            <FormField label="WhatsApp number"><input value={form.publicPage?.whatsappNumber || ''} onChange={(e) => updatePublicPage('whatsappNumber', e.target.value)} placeholder="Gym WhatsApp number, e.g. 919876543210" /></FormField>
            <FormField label="Instagram URL"><input value={form.publicPage?.instagramUrl || ''} onChange={(e) => updatePublicPage('instagramUrl', e.target.value)} placeholder="https://instagram.com/yourgym" /></FormField>
            <FormField label="Facebook URL"><input value={form.publicPage?.facebookUrl || ''} onChange={(e) => updatePublicPage('facebookUrl', e.target.value)} placeholder="https://facebook.com/yourgym" /></FormField>
            <FormField label="Website URL"><input value={form.publicPage?.websiteUrl || ''} onChange={(e) => updatePublicPage('websiteUrl', e.target.value)} placeholder="https://yourgym.com" /></FormField>
          </div>
          <p style={{fontSize:'12px',color:'#718096',marginTop:'-4px'}}>Call and email buttons use the Gym phone and Gym email entered in the Gym & billing section above.</p>

          <div className="form-section-title">Google business display</div>
          <div className="form-grid three">
            <FormField label="Google rating"><input value={form.publicPage?.googleRating || ''} onChange={(e) => updatePublicPage('googleRating', e.target.value)} placeholder="5.0" /></FormField>
            <FormField label="Google review count"><input value={form.publicPage?.googleReviewCount || ''} onChange={(e) => updatePublicPage('googleReviewCount', e.target.value)} placeholder="94" /></FormField>
            <FormField label="Google phone"><input value={form.publicPage?.googlePhone || ''} onChange={(e) => updatePublicPage('googlePhone', e.target.value)} placeholder="Google listing phone" /></FormField>
            <FormField label="Business name"><input value={form.publicPage?.googlePlaceName || ''} onChange={(e) => updatePublicPage('googlePlaceName', e.target.value)} placeholder="Preface Fitness" /></FormField>
          </div>
          <div className="form-grid two">
            <FormField label="Google Maps URL"><input value={form.publicPage?.googleMapsUrl || ''} onChange={(e) => updatePublicPage('googleMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." /></FormField>
            <FormField label="Google Search URL"><input value={form.publicPage?.googleSearchUrl || ''} onChange={(e) => updatePublicPage('googleSearchUrl', e.target.value)} placeholder="Google business search/listing URL" /></FormField>
            <FormField label="Google address"><input value={form.publicPage?.googleAddress || ''} onChange={(e) => updatePublicPage('googleAddress', e.target.value)} placeholder="Full Google business address" /></FormField>
            <FormField label="Opening hours"><input value={form.publicPage?.hoursText || ''} onChange={(e) => updatePublicPage('hoursText', e.target.value)} placeholder="6 AM - 11 PM" /></FormField>
          </div>
          <div className="form-section-title">Opening days</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(125px,1fr))',gap:'10px',padding:'14px',border:'1px solid #e1e7ef',borderRadius:'14px',background:'#fafcff'}}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const selectedDays = Array.isArray(form.publicPage?.openingDays) ? form.publicPage.openingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              const checked = selectedDays.includes(day);
              return <label key={day} style={{display:'flex',alignItems:'center',gap:'9px',fontSize:'13px',fontWeight:700,color:'#334155',cursor:'pointer',padding:'8px 10px',border:'1px solid '+(checked ? '#b8aaff' : '#e1e7ef'),borderRadius:'10px',background:checked ? '#f1edff' : '#fff'}}><input type="checkbox" checked={checked} onChange={(e) => updatePublicPage('openingDays', e.target.checked ? [...selectedDays, day].filter((d, i, arr) => arr.indexOf(d) === i) : selectedDays.filter((d) => d !== day))} />{day}</label>;
            })}
          </div>
          <p style={{fontSize:'12px',color:'#718096',marginTop:'8px'}}>Select all days the gym is open. These days will be shown on the public gym page after you click Save public page.</p>

          <div className="form-section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}><span>Trainer profiles</span><button className="btn btn-secondary btn-sm" onClick={addPublicTrainer}><Plus size={15}/> Add trainer</button></div>
          <div style={{display:'grid',gap:'14px'}}>
            {(form.publicPage?.trainers || []).map((trainer,index)=><div key={index} style={{padding:'16px',border:'1px solid #e1e7ef',borderRadius:'14px',background:'#fafcff'}}>
              <div className="form-grid three">
                <FormField label="Name"><input value={trainer.name || ''} onChange={(e) => updatePublicTrainer(index,'name',e.target.value)} placeholder="Trainer name" /></FormField>
                <FormField label="Role"><input value={trainer.role || ''} onChange={(e) => updatePublicTrainer(index,'role',e.target.value)} placeholder="FITNESS TRAINER" /></FormField>
                <FormField label="Experience"><input value={trainer.experience || ''} onChange={(e) => updatePublicTrainer(index,'experience',e.target.value)} placeholder="8" /></FormField>
                <FormField label="Forte"><input value={trainer.forte || ''} onChange={(e) => updatePublicTrainer(index,'forte',e.target.value)} placeholder="Strength & hypertrophy" /></FormField>
                <FormField label="Specialization"><input value={trainer.specialization || ''} onChange={(e) => updatePublicTrainer(index,'specialization',e.target.value)} placeholder="Fat loss / strength / PT" /></FormField>
                <FormField label="Certification"><input value={trainer.certification || ''} onChange={(e) => updatePublicTrainer(index,'certification',e.target.value)} placeholder="ACE / ISSA / etc." /></FormField>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 220px',gap:'16px',alignItems:'start'}}>
                <div>
                  <FormField label="Trainer photo">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePublicTrainerPhoto(index, e)}
                    />
                  </FormField>
                  <div style={{fontSize:'12px',color:'#718096',marginTop:'6px'}}>
                    Select a photo from your computer. The app automatically resizes it for the public page.
                  </div>
                  {trainer.photo && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{marginTop:'10px'}}
                      onClick={() => removePublicTrainerPhoto(index)}
                    >
                      <Trash2 size={15}/> Remove photo
                    </button>
                  )}
                </div>
                <div>
                  {trainer.photo ? (
                    <img
                      src={trainer.photo}
                      alt={trainer.name || 'Trainer'}
                      style={{width:'180px',height:'180px',objectFit:'cover',borderRadius:'16px',border:'1px solid #e1e7ef',display:'block',background:'#eef2f7'}}
                    />
                  ) : (
                    <div style={{width:'180px',height:'180px',borderRadius:'16px',border:'1px dashed #cbd5e1',display:'grid',placeItems:'center',background:'#f7f9fc',color:'#94a3b8',fontSize:'12px',textAlign:'center',padding:'15px'}}>
                      No photo selected
                    </div>
                  )}
                </div>
              </div>
              <FormField label="Trainer description"><textarea rows="3" value={trainer.description || ''} onChange={(e) => updatePublicTrainer(index,'description',e.target.value)} placeholder="Short professional introduction, coaching style, achievements, etc." /></FormField>
              <button className="btn btn-danger btn-sm" onClick={() => removePublicTrainer(index)}><Trash2 size={15}/> Remove trainer</button>
            </div>)}
            {!(form.publicPage?.trainers || []).length && <div style={{padding:'15px',borderRadius:'12px',background:'#f7f9fc',color:'#718096'}}>No public trainers added yet. Click “Add trainer” to create the first profile.</div>}
          </div>

          <div className="form-section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}><span>Public membership packages</span><button className="btn btn-secondary btn-sm" onClick={addPublicPackage}><Plus size={15}/> Add package</button></div>
          <div style={{display:'grid',gap:'12px'}}>
            {(form.publicPage?.packages || []).map((pkg,index)=><div key={index} className="form-grid four" style={{padding:'13px',border:'1px solid #e1e7ef',borderRadius:'12px',background:'#fafcff',alignItems:'end'}}>
              <FormField label="Package name"><input value={pkg.name || ''} onChange={(e) => updatePublicPackage(index,'name',e.target.value)} placeholder="Monthly" /></FormField>
              <FormField label="Months"><input type="number" min="1" value={pkg.months ?? 1} onChange={(e) => updatePublicPackage(index,'months',e.target.value)} /></FormField>
              <FormField label="Price"><input type="number" min="0" value={pkg.price ?? 0} onChange={(e) => updatePublicPackage(index,'price',e.target.value)} /></FormField>
              <button className="btn btn-danger btn-sm" onClick={() => removePublicPackage(index)}><Trash2 size={15}/> Remove</button>
              <div style={{gridColumn:'1 / -1'}}><FormField label="Description"><input value={pkg.description || ''} onChange={(e) => updatePublicPackage(index,'description',e.target.value)} placeholder="Short package description" /></FormField></div>
            </div>)}
            {!(form.publicPage?.packages || []).length && <div style={{padding:'15px',borderRadius:'12px',background:'#f7f9fc',color:'#718096'}}>No custom packages added. The public page will use your standard Membership plans automatically.</div>}
          </div>

          <div className="form-section-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}><span>Customer reviews</span><button className="btn btn-secondary btn-sm" onClick={addPublicReview}><Plus size={15}/> Add review</button></div>
          <div style={{display:'grid',gap:'12px'}}>
            {(form.publicPage?.reviews || []).map((review,index)=><div key={index} style={{padding:'15px',border:'1px solid #e1e7ef',borderRadius:'12px',background:'#fafcff'}}>
              <div className="form-grid three"><FormField label="Customer name"><input value={review.name || ''} onChange={(e) => updatePublicReview(index,'name',e.target.value)} /></FormField><FormField label="Date / label"><input value={review.date || ''} onChange={(e) => updatePublicReview(index,'date',e.target.value)} placeholder="Google review" /></FormField><FormField label="Customer photo URL"><input value={review.photo || ''} onChange={(e) => updatePublicReview(index,'photo',e.target.value)} /></FormField></div>
              <FormField label="Review"><textarea rows="3" value={review.text || ''} onChange={(e) => updatePublicReview(index,'text',e.target.value)} placeholder="Customer's review" /></FormField>
              <button className="btn btn-danger btn-sm" onClick={() => removePublicReview(index)}><Trash2 size={15}/> Remove review</button>
            </div>)}
            {!(form.publicPage?.reviews || []).length && <div style={{padding:'15px',borderRadius:'12px',background:'#f7f9fc',color:'#718096'}}>No manual reviews added yet.</div>}
          </div>

          <div style={{marginTop:'20px',display:'flex',justifyContent:'space-between',gap:'12px',alignItems:'center',flexWrap:'wrap'}}>
            <p style={{margin:0,fontSize:'12px',lineHeight:1.5,color:'#718096'}}>Reviews are manually controlled here. This keeps the public site stable and avoids depending on Google's API availability.</p>
            <button className="btn btn-primary" onClick={savePublicPageOnly}><Save size={17}/> Save public page</button>
          </div>
        </section>
          </div>
        )}
        {activeSettingsTab === 'security' && (
          <div className="settings-tab-panel">
<section className="card">
          <div className="card-header">
            <div>
              <h3>Owner login</h3>
              <p>Change the username and password required to open the app.</p>
            </div>
          </div>

          <div className="form-grid two">
            <FormField label="Username">
              <input
                value={authForm.username}
                onChange={(e) => setAuthForm((f) => ({ ...f, username: e.target.value }))}
                autoComplete="username"
              />
            </FormField>

            <FormField label="Current password">
              <input
                type="password"
                value={authForm.currentPassword}
                onChange={(e) => setAuthForm((f) => ({ ...f, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
            </FormField>
          </div>

          <div className="form-grid two">
            <FormField label="New password">
              <input
                type="password"
                value={authForm.newPassword}
                onChange={(e) => setAuthForm((f) => ({ ...f, newPassword: e.target.value }))}
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
              />
            </FormField>

            <FormField label="Confirm new password">
              <input
                type="password"
                value={authForm.confirmPassword}
                onChange={(e) => setAuthForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                autoComplete="new-password"
              />
            </FormField>
          </div>

          {authMessage && (
            <div style={{
              marginBottom: '12px',
              padding: '11px 13px',
              borderRadius: '10px',
              background: '#f5fbfa',
              border: '1px solid #dcefeb',
              color: '#356765',
              fontSize: '13px',
            }}>
              {authMessage}
            </div>
          )}

          <button className="btn btn-primary" onClick={saveAuthSettings}>
            <Save size={17} /> Save login credentials
          </button>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#7b8794', lineHeight: 1.5 }}>
            New installations start with <strong>admin</strong> / <strong>admin123</strong>. Change these from this section after signing in.
          </div>
        </section>
          </div>
        )}
        {activeSettingsTab === 'qr' && (
          <div className="settings-tab-panel">
<section className="card">
          <div className="card-header"><div><h3>Member Portal QR Code</h3><p>Members scan this QR to open their private portal and sign in with their registered mobile/member ID and 6-digit PIN.</p></div><QrCode size={21}/></div>
          <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:'22px',alignItems:'center'}}>
            <div style={{border:'1px solid #dce5eb',borderRadius:'16px',padding:'12px',background:'#fff',textAlign:'center'}}><img src={memberPortalQrImageUrl} alt="Member Portal QR" style={{width:'100%',maxWidth:'180px',display:'block',margin:'0 auto'}} /></div>
            <div><div style={{fontSize:'15px',fontWeight:800,color:'#25364b'}}>Scan → Enter member ID/mobile → Enter 6-digit PIN</div><p style={{fontSize:'13px',lineHeight:1.6,color:'#687789',margin:'8px 0'}}>The QR contains only the portal URL and gym identifier; it does not contain a member's PIN or personal details. Give each member their PIN separately.</p><div style={{fontSize:'12px',color:'#64748b',wordBreak:'break-all',padding:'10px',borderRadius:9,background:'#f7fafc'}}>{memberPortalUrl}</div><div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'12px'}}><button className="btn btn-primary" onClick={openMemberPortalQr}><QrCode size={17}/> Open Member Portal QR</button><button className="btn btn-secondary" onClick={printMemberPortalQr}><Printer size={17}/> Print Member Portal QR</button></div></div>
          </div>
        </section>
<section className="card">
          <div className="card-header"><div><h3>Attendance QR code</h3><p>This QR opens the password-free member check-in page.</p></div></div>
          <div style={{padding:'12px 14px',borderRadius:'12px',background:'#f7fafc',border:'1px solid #e5ebf0',fontSize:'12px',color:'#64748b',wordBreak:'break-all',lineHeight:1.5}}>{qrUrl}</div>
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'12px'}}>
            <button className="btn btn-primary" onClick={openQr}><QrCode size={17}/> Generate / open QR</button>
            <button className="btn btn-secondary" onClick={() => window.print()}><FileDown size={17}/> Print QR</button>
          </div>
          <p style={{margin:'12px 0 0',fontSize:'12px',color:'#7b8794',lineHeight:1.5}}>Print the QR and place it at the gym entrance. Members scan it with their phone camera; no owner password is required.</p>
          <div style={{marginTop:'12px',padding:'12px 14px',borderRadius:'12px',background:'#eef9f7',border:'1px solid #d3ece7',fontSize:'12px',color:'#3d6b66',lineHeight:1.5}}><strong>Cloud attendance:</strong> member check-ins are written to the shared Supabase database, so the permanent QR can be used from members' phones without requiring the owner's browser to be open.</div>
        </section>

<section className="card">
          <div className="card-header"><div><h3>Customer Feedback QR</h3><p>Place this QR at the gate, reception or workout floor so any customer can submit feedback or a complaint without logging in.</p></div><QrCode size={21} /></div>
          <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:'22px',alignItems:'center'}}>
            <div style={{border:'1px solid #dce5eb',borderRadius:'16px',padding:'12px',background:'#fff',textAlign:'center'}}><img src={feedbackQrImageUrl} alt="Customer feedback QR" style={{width:'100%',maxWidth:'180px',display:'block',margin:'0 auto'}} /></div>
            <div>
              <div style={{fontSize:'15px',fontWeight:800,color:'#25364b'}}>Scan → Feedback / Complaint → Priority → Submit</div>
              <p style={{fontSize:'13px',lineHeight:1.6,color:'#687789',margin:'8px 0'}}>The customer can enter their name optionally, choose the feedback type, select Low / Medium / High priority and submit the message. It is stored directly in the Customer Feedback section.</p>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'12px'}}>
                <button className="btn btn-primary" onClick={openFeedbackQr}><QrCode size={17}/> Open Feedback QR</button>
                <button className="btn btn-secondary" onClick={printFeedbackQr}><FileDown size={17}/> Print QR</button>
              </div>
            </div>
          </div>
        </section>
          </div>
        )}
        {activeSettingsTab === 'data' && (
          <div className="settings-tab-panel">
            <section className="card">
              <div className="card-header"><div><h3>Cloud database</h3><p>Business data is connected to the shared Supabase database.</p></div></div>
              <div className="report-list">
                <div><span>Database status</span><strong>{dbReady ? 'Ready' : 'Loading'}</strong></div>
                <div><span>Members</span><strong>{(data.members || []).length}</strong></div>
                <div><span>Payments</span><strong>{(data.payments || []).length}</strong></div>
                <div><span>Attendance records</span><strong>{(data.attendance || []).length}</strong></div>
              </div>
            </section>

            <section className="card">
              <div className="card-header"><div><h3>Excel import & export</h3><p>Import member lists from an Excel workbook with separate sheets for Monthly, Quarterly, Half-yearly, Annual or other plans. Export current members to Excel.</p></div></div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                <button className="btn btn-primary" onClick={onExportExcel}><FileDown size={17}/> Export Excel</button>
                <label className="btn btn-secondary" style={{cursor:'pointer'}}><FileUp size={17}/> Import Excel<input type="file" accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={onImportExcel} style={{display:'none'}} /></label>
                <button className="btn btn-danger" onClick={() => { resetData(); showActionFeedback('Demo data reset action completed.'); }}>Reset demo data</button>
              </div>
              <p style={{fontSize:'13px',color:'#687789',lineHeight:1.6,marginTop:'12px'}}>Required columns: Member Name and Phone. Recommended: Membership Plan, Joining Date, Expiry Date, Membership Amount, Amount Paid and Due Amount. If Membership Plan is blank, the sheet name is used as the plan. Duplicate phone numbers/member IDs and invalid rows are skipped during import.</p>
            </section>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}


function MemberPortalPage() {
  const gymId = new URLSearchParams(window.location.search).get('gym') || '';
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [portalData, setPortalData] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const gymName = 'Preface Fitness';

  const login = async (event) => {
    event.preventDefault();
    setError('');
    if (!gymId) { setError('Gym link is missing. Please scan the Member Portal QR provided by your gym.'); return; }
    if (!identifier.trim() || !/^\d{6}$/.test(pin)) { setError('Enter your registered mobile/member ID and the 6-digit PIN provided by the gym.'); return; }
    setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('member_portal_login', {
        p_gym_id: gymId,
        p_identifier: identifier.trim(),
        p_pin: pin,
      });
      if (rpcError) throw rpcError;
      if (!data || data.ok !== true || !data.member) throw new Error('Login failed. Check your details and try again.');
      setPortalData(data);
      setPin('');
    } catch (e) {
      console.error('Member portal login failed:', e);
      setError(e?.message?.toLowerCase().includes('locked') ? 'Too many failed attempts. Please wait 15 minutes before trying again.' : 'Login failed. Check your registered mobile/member ID and 6-digit PIN. If the problem continues, contact the gym admin.');
    } finally { setBusy(false); }
  };
  const logout = () => { setPortalData(null); setIdentifier(''); setPin(''); setError(''); };
  const card = { background:'#fff', border:'1px solid #e4eaf2', borderRadius:18, padding:20, boxShadow:'0 12px 34px rgba(20,36,68,.06)' };
  const label = { display:'block', fontSize:13, fontWeight:700, color:'#34445c', marginBottom:7 };
  const input = { width:'100%', boxSizing:'border-box', padding:'13px 14px', border:'1px solid #d7dfeb', borderRadius:11, fontSize:16, outlineColor:'#7654ef', background:'#fff' };
  const moneyText = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits:2 })}`;
  return <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f5f7ff 0%,#f8fbff 48%,#f1f8f7 100%)',padding:'24px 14px 44px',fontFamily:'Inter,system-ui,-apple-system,Segoe UI,sans-serif',color:'#1d2b42'}}>
    <div style={{maxWidth:860,margin:'0 auto'}}>
      <header style={{display:'flex',alignItems:'center',gap:13,margin:'8px 0 22px'}}><img src={LOGO_URL} alt="Preface Fitness" style={{width:56,height:56,objectFit:'contain',borderRadius:14,background:'#fff',padding:5,boxShadow:'0 6px 18px #18284812'}}/><div><div style={{fontSize:22,fontWeight:900,letterSpacing:-.4}}>Preface Fitness</div><div style={{fontSize:13,color:'#748198'}}>Member self-service portal</div></div></header>
      {!portalData ? <section style={{...card,maxWidth:460,margin:'0 auto'}}>
        <div style={{width:54,height:54,borderRadius:16,background:'#eee9ff',color:'#6846df',display:'grid',placeItems:'center',marginBottom:16}}><UserCheck size={26}/></div>
        <h1 style={{fontSize:25,margin:'0 0 7px',letterSpacing:-.5}}>Member Login</h1><p style={{fontSize:14,color:'#6e7c91',lineHeight:1.6,margin:'0 0 22px'}}>Use your registered mobile number or member ID and the 6-digit PIN provided by the gym.</p>
        <form onSubmit={login} style={{display:'grid',gap:16}}>
          <div><label style={label}>Registered mobile number / Member ID</label><input style={input} autoComplete="username" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Enter mobile number or member ID" maxLength={80} required /></div>
          <div><label style={label}>6-digit PIN</label><div style={{position:'relative'}}><input style={{...input,paddingRight:70,letterSpacing:showPin?2:5}} type={showPin?'text':'password'} inputMode="numeric" autoComplete="current-password" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="••••••" required/><button type="button" onClick={()=>setShowPin(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',color:'#6846df',fontWeight:800,cursor:'pointer'}}>{showPin?'Hide':'Show'}</button></div></div>
          {error && <div role="alert" style={{padding:'11px 12px',borderRadius:10,background:'#fff0f0',border:'1px solid #ffd5d5',color:'#a82c38',fontSize:13,lineHeight:1.5}}>{error}</div>}
          <button type="submit" disabled={busy} style={{border:0,borderRadius:12,padding:'14px 16px',background:busy?'#9c8be9':'linear-gradient(100deg,#6944e5,#8a5cf6)',color:'#fff',fontWeight:800,fontSize:15,cursor:busy?'wait':'pointer',boxShadow:'0 8px 18px #7047ff30'}}>{busy?'Verifying…':'Login to Member Portal'}</button>
        </form>
        <p style={{fontSize:12,color:'#8590a3',lineHeight:1.6,margin:'18px 0 0'}}>Forgot your PIN? Contact the gym admin. PIN reset is handled by the admin; no OTP is used.</p>
      </section> : <>
        <section style={{...card,marginBottom:16,background:'linear-gradient(120deg,#fff 0%,#f8f5ff 100%)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}><div><div style={{fontSize:12,fontWeight:800,color:'#7654e8',textTransform:'uppercase',letterSpacing:1}}>Welcome back</div><h1 style={{fontSize:28,margin:'6px 0 5px'}}>{portalData.member.name || 'Member'}</h1><div style={{fontSize:13,color:'#758198'}}>Member ID: {portalData.member.member_code || '—'}</div></div><button onClick={logout} className="btn btn-secondary" style={{display:'inline-flex',alignItems:'center',gap:7}}><LogOut size={16}/> Logout</button></div></section>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:16}}>{[{label:'Membership plan',value:portalData.member.plan_name||'—'},{label:'Membership status',value:portalData.member.status||'—'},{label:'Valid until',value:portalData.member.expiry_date||'—'},{label:'Outstanding due',value:moneyText(portalData.member.due_amount)}].map(x=><div key={x.label} style={{...card,padding:16}}><div style={{fontSize:12,color:'#7b8798',fontWeight:700,marginBottom:8}}>{x.label}</div><div style={{fontSize:18,fontWeight:850,overflowWrap:'anywhere'}}>{x.value}</div></div>)}</div>
        <section style={{...card,marginBottom:16}}><h2 style={{fontSize:19,margin:'0 0 14px'}}>Membership details</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,fontSize:14}}><div><div style={{color:'#7b8798',marginBottom:4}}>Registered phone</div><strong>{portalData.member.phone||'—'}</strong></div><div><div style={{color:'#7b8798',marginBottom:4}}>Membership start</div><strong>{portalData.member.start_date||'—'}</strong></div><div><div style={{color:'#7b8798',marginBottom:4}}>Membership amount</div><strong>{moneyText(portalData.member.membership_amount)}</strong></div><div><div style={{color:'#7b8798',marginBottom:4}}>Amount paid</div><strong>{moneyText(portalData.member.paid_amount)}</strong></div></div></section>
        <section style={{...card,marginBottom:16}}><h2 style={{fontSize:19,margin:'0 0 14px'}}>Payment history</h2>{!portalData.payments?.length?<p style={{color:'#778398',fontSize:14,margin:0}}>No payment records available yet.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:440}}><thead><tr>{['Date','Type','Mode','Amount','Receipt'].map(t=><th key={t} style={{textAlign:'left',padding:'10px 8px',borderBottom:'1px solid #e8edf4',color:'#758198'}}>{t}</th>)}</tr></thead><tbody>{portalData.payments.map((p,i)=><tr key={p.id||i}>{[p.payment_date||p.date||'—',p.payment_type||'Payment',p.payment_mode||'—',moneyText(p.amount),p.invoice_number||'—'].map((v,j)=><td key={j} style={{padding:'11px 8px',borderBottom:'1px solid #f0f3f7',whiteSpace:'nowrap'}}>{v}</td>)}</tr>)}</tbody></table></div>}</section>
        <section style={card}><h2 style={{fontSize:19,margin:'0 0 14px'}}>Recent attendance</h2>{!portalData.attendance?.length?<p style={{color:'#778398',fontSize:14,margin:0}}>No attendance records available yet.</p>:<div style={{display:'grid',gap:9}}>{portalData.attendance.map((a,i)=><div key={a.id||i} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'11px 12px',borderRadius:10,background:'#f7f9fc',fontSize:13}}><strong>{a.date||a.attendance_date||a.check_in_date||a.created_at?.slice(0,10)||'Attendance'}</strong><span style={{color:'#718096'}}>{a.source||a.status||'Checked in'}</span></div>)}</div>}</section>
      </>}
      <footer style={{textAlign:'center',fontSize:12,color:'#8a95a7',marginTop:22}}>Preface Fitness · Keep your 6-digit PIN private.</footer>
    </div>
  </div>;
}

const initialRoute = window.location.hash;
createRoot(document.getElementById('root')).render(initialRoute === '#feedback' ? <PublicFeedbackPage /> : initialRoute === '#member-portal' ? <MemberPortalPage /> : <App />);

/* =========================================================
   FINAL NAV SPLIT: sidebar-only items stay out of top navbar
   ========================================================= */
const SIDEBAR_ONLY_NAV_CSS = `

  /* MEMBER PROFILE TEXT SCALE - keep readable without oversized contact/email text */
  .vibrant-app-shell .member-profile-header h1 {
    font-size: 38px !important;
    line-height: 1.1 !important;
  }
  .vibrant-app-shell .member-profile-header p {
    font-size: 17px !important;
    line-height: 1.45 !important;
  }
  .vibrant-app-shell .profile-stat span {
    font-size: 13px !important;
  }
  .vibrant-app-shell .profile-stat strong {
    font-size: 18px !important;
    line-height: 1.35 !important;
  }
  .vibrant-app-shell .detail-list > div > span {
    font-size: 14px !important;
    line-height: 1.4 !important;
  }
  .vibrant-app-shell .detail-list > div > strong {
    font-size: 15px !important;
    line-height: 1.45 !important;
  }
  .vibrant-app-shell .member-notes {
    font-size: 15px !important;
    line-height: 1.6 !important;
  }

  .vibrant-app-shell .top-navigation-scroll {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    grid-auto-rows: minmax(42px, auto) !important;
    gap: 6px !important;
  }
  .vibrant-app-shell .top-navigation-item {
    min-width: 0 !important;
    width: 100% !important;
  }
  .vibrant-app-shell .top-navigation-item span {
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: nowrap !important;
  }
  /* Keep the second navigation row slightly above the navbar bottom boundary. */
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+6) {
    transform: translateY(-10px) !important;
  }
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+6):hover {
    transform: translateY(-11px) !important;
  }
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+6):active {
    transform: translateY(-9px) scale(.992) !important;
  }
  @media (max-width: 1100px) {
    .vibrant-app-shell .top-navigation-scroll {
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    }
  }
  @media (max-width: 800px) {
    .vibrant-app-shell .top-navigation-scroll {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
  }
  @media (max-width: 560px) {
    .vibrant-app-shell .top-navigation-scroll {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }

  /* FINAL MEMBER PROFILE TYPOGRAPHY OVERRIDE
     Higher specificity than the global inner-page rules. */
  .vibrant-app-shell .member-profile-premium .profile-name {
    font-size: 46px !important;
    line-height: 1.08 !important;
  }
  .vibrant-app-shell .member-profile-premium .profile-meta {
    font-size: 19px !important;
  }
  .vibrant-app-shell .member-profile-premium .summary-card span {
    font-size: 14px !important;
  }
  .vibrant-app-shell .member-profile-premium .summary-card strong {
    font-size: 21px !important;
  }
  .vibrant-app-shell .member-profile-premium .panel-title h3 {
    font-size: 23px !important;
  }
  .vibrant-app-shell .member-profile-premium .panel-title span {
    font-size: 14px !important;
  }
  .vibrant-app-shell .member-profile-premium .detail-list > div {
    padding: 15px 0 !important;
  }
  .vibrant-app-shell .member-profile-premium .detail-list > div > span {
    font-size: 16px !important;
    line-height: 1.4 !important;
  }
  .vibrant-app-shell .member-profile-premium .detail-list > div > strong {
    font-size: 18px !important;
    line-height: 1.45 !important;
  }
  .vibrant-app-shell .member-profile-premium .member-notes {
    font-size: 17px !important;
    line-height: 1.65 !important;
  }


  /* Members list/table - slightly larger readable typography */
  .vibrant-app-shell .inner-page-content table th {
    font-size: 17px !important;
    line-height: 1.35 !important;
  }

  .vibrant-app-shell .inner-page-content table td {
    font-size: 16px !important;
    line-height: 1.4 !important;
  }

  .vibrant-app-shell .inner-page-content table td strong {
    font-size: 17px !important;
    line-height: 1.35 !important;
  }

  .vibrant-app-shell .inner-page-content table td .member-name,
  .vibrant-app-shell .inner-page-content table td .contact,
  .vibrant-app-shell .inner-page-content table td .phone {
    font-size: 17px !important;
  }

  .vibrant-app-shell .inner-page-content table td .member-id,
  .vibrant-app-shell .inner-page-content table td .secondary,
  .vibrant-app-shell .inner-page-content table td .muted,
  .vibrant-app-shell .inner-page-content table td .subtle,
  .vibrant-app-shell .inner-page-content table td .email {
    font-size: 14px !important;
  }

  .vibrant-app-shell .inner-page-content table td .badge,
  .vibrant-app-shell .inner-page-content table td .status-badge,
  .vibrant-app-shell .inner-page-content table td .pill,
  .vibrant-app-shell .inner-page-content table td .tag {
    font-size: 14px !important;
  }


  /* =========================================================
     MEMBERS TABLE — FINAL READABLE SIZE
     Directly targets the actual members-list-table markup.
     ========================================================= */
  .vibrant-app-shell .members-list-table th {
    font-size: 17px !important;
    line-height: 1.35 !important;
    font-weight: 800 !important;
  }

  .vibrant-app-shell .members-list-table td {
    font-size: 16px !important;
    line-height: 1.4 !important;
  }

  .vibrant-app-shell .members-list-table .member-cell strong,
  .vibrant-app-shell .members-list-table .contact-cell strong {
    font-size: 17px !important;
    line-height: 1.35 !important;
    font-weight: 750 !important;
  }

  .vibrant-app-shell .members-list-table .member-cell span,
  .vibrant-app-shell .members-list-table .contact-cell span {
    font-size: 13px !important;
    line-height: 1.3 !important;
  }

  .vibrant-app-shell .members-list-table .data-pill {
    font-size: 14px !important;
  }

  .vibrant-app-shell .members-list-table .row-actions .table-action {
    font-size: 14px !important;
  }

  .vibrant-app-shell .members-list-table .danger-text,
  .vibrant-app-shell .members-list-table .paid-text {
    font-size: 16px !important;
  }


  /* =========================================================
     ATTENDANCE TABLE — FINAL READABLE SIZE
     Same practical typography scale as the corrected Members page.
     ========================================================= */
  .vibrant-app-shell .page .panel table th {
    font-size: 17px !important;
    line-height: 1.35 !important;
    font-weight: 800 !important;
  }

  .vibrant-app-shell .page .panel table td {
    font-size: 16px !important;
    line-height: 1.4 !important;
  }

  .vibrant-app-shell .page .panel table td .member-cell strong {
    font-size: 17px !important;
    line-height: 1.35 !important;
    font-weight: 750 !important;
  }

  .vibrant-app-shell .page .panel table td .member-cell span {
    font-size: 13px !important;
    line-height: 1.3 !important;
  }

  .vibrant-app-shell .page .panel table td .data-pill {
    font-size: 14px !important;
  }

  .vibrant-app-shell .page .panel table td .status-badge,
  .vibrant-app-shell .page .panel table td .badge {
    font-size: 14px !important;
  }

  .vibrant-app-shell .page .panel table td .btn-sm {
    font-size: 15px !important;
    line-height: 1.3 !important;
  }

  .vibrant-app-shell .page .panel .panel-title h3 {
    font-size: 23px !important;
    line-height: 1.2 !important;
  }

  .vibrant-app-shell .page .panel .panel-title span {
    font-size: 14px !important;
  }


  /* =========================================================
     MEMBERSHIP LIST — DIRECT FINAL FONT SIZE FIX
     Targets only the Memberships page list. Theme/colors/layout
     remain unchanged.
     ========================================================= */
  .vibrant-app-shell .memberships-list-table {
    font-size:16px !important;
  }

  .vibrant-app-shell .memberships-list-table thead th {
    font-size:17px !important;
    line-height:1.35 !important;
    font-weight:800 !important;
  }

  .vibrant-app-shell .memberships-list-table tbody td {
    font-size:16px !important;
    line-height:1.45 !important;
    font-weight:500 !important;
  }

  .vibrant-app-shell .memberships-list-table tbody td .member-cell strong {
    font-size:17px !important;
    line-height:1.35 !important;
    font-weight:750 !important;
  }

  .vibrant-app-shell .memberships-list-table tbody td .member-cell span {
    font-size:13px !important;
    line-height:1.3 !important;
  }

  .vibrant-app-shell .memberships-list-table tbody td .danger-text,
  .vibrant-app-shell .memberships-list-table tbody td .paid-text {
    font-size:16px !important;
    font-weight:750 !important;
  }

  .vibrant-app-shell .memberships-list-table tbody td .status {
    font-size:14px !important;
  }

  .vibrant-app-shell .memberships-list-table tbody td .btn-sm {
    font-size:15px !important;
    min-height:44px !important;
  }

`;
