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
  Pencil,
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
  const assigned = packages.reduce((n,p)=>n+Number(p.sessionsTotal||1),0);
  const remaining = packages.reduce((n,p)=>n+Math.max(0,Number(p.sessionsTotal||1)-Number(p.sessionsCompleted||0)),0);
  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const esc = (v) => String(v ?? '—').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gymName = settings?.gymName || 'Preface Fitness';
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) { alert('Please allow pop-ups to print the PT record.'); return; }
  win.document.write(`<!doctype html><html><head><title>PT Master Record - ${esc(member?.name || 'Member')}</title><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#17243b;margin:22px;background:#f4f8fc}.page{max-width:1100px;margin:0 auto;background:#fff;border:1px solid #dbe7f2;border-radius:16px;overflow:hidden}.hero{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:24px 28px;color:#fff;background:linear-gradient(112deg,#123553 0%,#1c5275 58%,#087f78 100%);border-bottom:5px solid #20b7a5}.hero:before,.hero:after{content:"";position:absolute;border:1px solid rgba(255,255,255,.13);border-radius:50%;width:220px;height:220px;right:100px;top:-115px}.hero:after{width:160px;height:160px;right:130px;top:-85px}.hero-copy{position:relative;z-index:1}.eyebrow{font-size:10px;font-weight:900;letter-spacing:.22em;color:#83eee0;text-transform:uppercase}.hero h1{margin:7px 0 5px;font-size:27px;letter-spacing:.01em}.hero-sub{font-size:11px;font-weight:800;letter-spacing:.16em;color:#d3e9f5;text-transform:uppercase}.hero-desc{margin-top:12px;color:#dceaf4;font-size:12px}.hero-art{position:relative;z-index:1;width:210px;height:84px;flex:0 0 210px}.toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 22px;background:#f5f9fd;border-bottom:1px solid #e2ebf4}.toolbar strong{color:#1769a5;font-size:12px;letter-spacing:.12em}.print-btn{background:#1769b2;color:#fff;border:0;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:800}.content{padding:18px 22px 24px}.section-title{display:flex;align-items:center;gap:9px;color:#1769a5;font-size:15px;font-weight:900;margin:18px 0 9px}.section-title:before{content:"";width:5px;height:18px;border-radius:5px;background:#19a99b}.client{display:flex;flex-wrap:wrap;gap:8px 22px;padding:12px 14px;border:1px solid #dce8f3;border-radius:10px;background:#f8fbfe}.client strong{color:#173b5d}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.metric{padding:12px;border:1px solid #dce8f3;border-radius:10px;background:linear-gradient(145deg,#fff,#f5faff);border-top:3px solid #159b91}.metric span{display:block;color:#647b91;font-size:10px;font-weight:700}.metric strong{display:block;font-size:20px;margin-top:5px;color:#173b5d}.muted{color:#647b91}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:11px}th,td{padding:8px 7px;border:1px solid #dbe5ef;text-align:left;vertical-align:top}th{background:#e8f3fc;color:#20577e;font-size:9px;text-transform:uppercase;letter-spacing:.06em}tbody tr:nth-child(even){background:#f7fafc}.notes{max-width:240px;white-space:pre-wrap;word-break:break-word}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin:52px 30px 10px}.signatures div{border-top:1px solid #8093a7;padding-top:8px;text-align:center;color:#526b82;font-size:11px}.footer{display:flex;justify-content:space-between;padding:12px 22px;background:#f3f8fc;color:#647b91;font-size:9px;font-weight:800;letter-spacing:.08em;border-top:1px solid #e1eaf3}@media print{body{margin:0;background:#fff}.page{max-width:none;border-radius:0;border:0}.print-btn{display:none}.hero{break-after:avoid}.summary,.metric,table,tr{break-inside:avoid} .content{padding:14px 18px}.signatures{margin-top:38px}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
  </style></head><body><main class="page"><header class="hero"><div class="hero-copy"><div class="eyebrow">Personal training record</div><h1>${esc(gymName)}</h1><div class="hero-sub">PT Progress & Session Report</div><div class="hero-desc">A clear record of coaching sessions, assigned packages and training progress.</div></div><svg class="hero-art" viewBox="0 0 240 100" role="img" aria-label="Dumbbell illustration"><defs><linearGradient id="bar" x1="0" x2="1"><stop stop-color="#b9fff2"/><stop offset="1" stop-color="#37c7ba"/></linearGradient></defs><g fill="none" stroke="url(#bar)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M54 50H186"/><path d="M45 27V73M30 34V66M195 27V73M210 34V66"/><path d="M45 50H30M195 50H210"/></g><circle cx="120" cy="50" r="44" fill="none" stroke="rgba(150,255,239,.25)" stroke-width="1.5"/><circle cx="120" cy="50" r="34" fill="none" stroke="rgba(150,255,239,.14)" stroke-width="1"/></svg></header>
  <div class="toolbar"><strong>CLIENT TRAINING OVERVIEW</strong><button class="print-btn" onclick="window.print()">Print / Save PDF</button></div><section class="content">
  <div class="client"><span><strong>Member:</strong> ${esc(member?.name)}</span><span><strong>Member ID:</strong> ${esc(member?.id)}</span><span><strong>Phone:</strong> ${esc(member?.phone || '—')}</span></div>
  <div class="summary"><div class="metric"><span>Completed sessions</span><strong>${completed}</strong></div><div class="metric"><span>PT packages</span><strong>${packages.length}</strong></div><div class="metric"><span>Sessions assigned</span><strong>${assigned}</strong></div><div class="metric"><span>Sessions remaining</span><strong>${remaining}</strong></div></div>
  <h2 class="section-title">Completed session history</h2>${rows.length ? `<table><thead><tr><th>#</th><th>Date</th><th>Time</th><th>Trainer</th><th>Package</th><th>Session note</th><th>Recorded by</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${rows.length-i}</td><td>${esc(r.date)}</td><td>${esc(r.time || '—')}</td><td>${esc(r.trainerName)}</td><td>${esc(r.planName)}</td><td class="notes">${esc(r.notes || '—')}</td><td>${esc(r.recordedBy || 'Staff')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No individual completed-session history has been recorded yet. Older package counts may exist without per-session dates.</p>'}
  <h2 class="section-title">Assigned PT packages</h2><table><thead><tr><th>Package start</th><th>Plan</th><th>Trainer</th><th>Completed / Total</th><th>Expiry</th><th>Fee</th><th>Status</th></tr></thead><tbody>${packages.map(p=>`<tr><td>${esc(p.date)}</td><td>${esc(p.planName||p.type||'Personal Training')}</td><td>${esc(trainers.find(t=>t.id===p.trainerId)?.name||p.trainer||'—')}</td><td>${Number(p.sessionsCompleted||0)} / ${Number(p.sessionsTotal||1)}</td><td>${esc(p.expiryDate||'—')}</td><td>${money(p.fee)}</td><td>${esc(p.status)}</td></tr>`).join('')}</tbody></table>
  <div class="signatures"><div>Client signature</div><div>Trainer / Gym representative</div></div></section><footer class="footer"><span>${esc(gymName.toUpperCase())} · PERSONAL TRAINING</span><span>CONSISTENCY · COACHING · PROGRESS</span></footer></main></body></html>`);
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


// Gentle typing assistance shared by the admin app and member portal.
// Apply only conservative corrections to words that are present; never
// reinsert deleted text or modify identifiers, numbers, email, URLs or PINs.
function useGentleInputAssist() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const safeCorrections = {
      recieve: 'receive', adress: 'address', addres: 'address',
      seperate: 'separate', definately: 'definitely', occured: 'occurred',
      untill: 'until', wich: 'which', teh: 'the', thier: 'their',
      heigth: 'height', wieght: 'weight', excersise: 'exercise',
      workuot: 'workout', tranner: 'trainer', membar: 'member',
      paymant: 'payment', ammount: 'amount', attendence: 'attendance',
      mesurment: 'measurement', mesurement: 'measurement', medicle: 'medical',
    };
    const isTextField = (el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el instanceof HTMLTextAreaElement) return true;
      if (!(el instanceof HTMLInputElement)) return false;
      return ['text', 'search', ''].includes((el.type || '').toLowerCase());
    };
    const fieldContext = (el) => {
      const parts = [el.getAttribute('name'), el.id, el.getAttribute('placeholder'), el.getAttribute('aria-label')];
      const label = el.closest('label');
      if (label) parts.push(label.innerText || label.textContent || '');
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) labelledBy.split(/\s+/).forEach((id) => parts.push(document.getElementById(id)?.textContent || ''));
      const parent = el.parentElement;
      if (parent) parts.push(parent.innerText || parent.textContent || '');
      return parts.filter(Boolean).join(' ').toLowerCase();
    };
    const isNameField = (el) => {
      const context = fieldContext(el);
      return /\b(full\s*name|member\s*name|customer\s*name|client\s*name|first\s*name|last\s*name|trainer\s*name|your\s*name|name)\b/i.test(context)
        && !/\b(file\s*name|user\s*name|username|plan\s*name|gym\s*name|company\s*name|product\s*name)\b/i.test(context);
    };
    const preserveCase = (original, replacement) => {
      if (original.toUpperCase() === original) return replacement.toUpperCase();
      if (original[0] === original[0]?.toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
      return replacement;
    };
    const gentlyCorrectText = (value) => String(value || '').replace(/\b[\p{L}]+\b/gu, (word) => {
      const replacement = safeCorrections[word.toLocaleLowerCase()];
      return replacement ? preserveCase(word, replacement) : word;
    }).replace(/[ \t]+([,.;!?])/g, '$1').replace(/([,.;!?])(?=\S)/g, '$1 ');
    const capitalizeName = (value) => String(value || '').trim().replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => separator + letter.toLocaleUpperCase());
    const isAddressField = (el) => {
      const context = fieldContext(el);
      return /\b(address|street|residential|permanent address|correspondence address|locality|landmark)\b/i.test(context)
        && !/\b(email|website|url|maps|search)\b/i.test(context);
    };
    const capitalizeAddress = (value) => {
      const smallWords = new Set(['and', 'of', 'the', 'near', 'behind', 'opposite', 'at', 'to']);
      return gentlyCorrectText(value).trim().replace(/\s+/g, ' ').split(/(\s+|,\s*|\/)/).map((part, index, all) => {
        if (!part || /^\s+$/.test(part) || part === '/' || /^,/.test(part)) return part;
        const word = part.replace(/^[,]+|[,]+$/g, '');
        if (!word || /^\d+$/.test(word) || /^[A-Z0-9-]{2,}$/i.test(word) && /\d/.test(word)) return part;
        const lower = word.toLocaleLowerCase();
        const isFirstWord = index === 0 || /^\s+$/.test(all[index - 1] || '') && (index < 2 || !all.slice(0, index).some((x) => x && !/^\s+$/.test(x)));
        const fixed = smallWords.has(lower) && !isFirstWord ? lower : lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
        return part.replace(word, fixed);
      });
    };
    const setNativeValue = (el, value) => {
      if (el.value === value) return;
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      setter?.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const enhance = (root) => {
      const fields = [];
      if (root instanceof HTMLElement && isTextField(root)) fields.push(root);
      if (root?.querySelectorAll) fields.push(...root.querySelectorAll('input[type="text"],input[type="search"],textarea'));
      fields.forEach((el) => {
        if (el.dataset.gentleAssistApplied === '1') return;
        el.dataset.gentleAssistApplied = '1';
        el.setAttribute('spellcheck', 'true');
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('autocapitalize', isNameField(el) ? 'words' : 'sentences');
        if (isNameField(el)) el.dataset.gentleNameField = '1';
      });
    };
    enhance(document.body);
    const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === 1) enhance(node);
    })));
    observer.observe(document.body, { childList: true, subtree: true });
    const onFocusOut = (event) => {
      const el = event.target;
      if (!isTextField(el) || el.dataset.gentleCorrectionBusy === '1') return;
      const before = el.value;
      if (!before.trim()) return;
      let after = gentlyCorrectText(before);
      if (isNameField(el)) after = capitalizeName(after);
      else if (isAddressField(el)) after = capitalizeAddress(after);
      if (after !== before) {
        el.dataset.gentleCorrectionBusy = '1';
        setNativeValue(el, after);
        delete el.dataset.gentleCorrectionBusy;
      }
    };
    document.addEventListener('focusout', onFocusOut, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusout', onFocusOut, true);
    };
  }, []);
}

function App() {
  useGentleInputAssist();
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      const overlays = Array.from(document.querySelectorAll('.modal-backdrop')).filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden';
      });
      const topOverlay = overlays[overlays.length - 1];
      if (!topOverlay) return;
      event.preventDefault();
      event.stopPropagation();
      const closeButton = topOverlay.querySelector('.modal-header button[aria-label*="close" i], .modal-header button[title*="close" i], .modal-header .icon-btn');
      if (closeButton) closeButton.click();
      else topOverlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    };
    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, []);
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

  const getDietPlanCloudPayload = (plan) => ({
    legacy_id: plan.id || null,
    name: plan.name || '',
    goal: plan.goal || '',
    calories: Number(plan.calories || 0),
    protein: Number(plan.protein || 0),
    duration_weeks: Number(plan.durationWeeks || 1),
    coach: plan.coach || '',
    notes: plan.notes || '',
    assigned_member_ids: (plan.assignedMemberIds || [])
      .map((memberId) => data.members.find((member) => String(member.id) === String(memberId))?.cloudId)
      .filter(Boolean),
    meals: (plan.meals || []).map((meal) => ({
      ...meal,
      calories: Number(meal.calories || 0),
      protein: Number(meal.protein || 0),
    })),
  });

  const createDietPlan = async (plan) => {
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
    try {
      const row = await insertRecord('diet_plans', getDietPlanCloudPayload(clean));
      const saved = { ...clean, cloudId: row.id };
      setData((d) => ({ ...d, dietPlans: [saved, ...(d.dietPlans || [])] }));
      setModal(null);
      setToast('Diet plan created and synced');
    } catch (error) {
      console.error('Supabase diet plan insert failed:', error);
      setToast(error?.message || 'Unable to save diet plan to cloud');
    }
  };

  const updateDietPlan = async (plan) => {
    const existing = (data.dietPlans || []).find((item) => item.id === plan.id);
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
    try {
      let cloudId = existing?.cloudId;
      const payload = getDietPlanCloudPayload(clean);
      if (cloudId) {
        delete payload.legacy_id;
        await updateRecord('diet_plans', cloudId, payload);
      } else {
        const row = await insertRecord('diet_plans', payload);
        cloudId = row.id;
      }
      setData((d) => ({ ...d, dietPlans: (d.dietPlans || []).map((item) => item.id === clean.id ? { ...clean, cloudId } : item) }));
      setModal(null);
      setToast('Diet plan updated and synced');
    } catch (error) {
      console.error('Supabase diet plan update failed:', error);
      setToast(error?.message || 'Unable to update diet plan in cloud');
    }
  };

  const deleteDietPlan = async (id) => {
    const plan = (data.dietPlans || []).find((item) => item.id === id);
    if (!plan || !window.confirm(`Delete diet plan "${plan.name}"? This will remove it from assigned member profiles too.`)) return;
    try {
      if (plan.cloudId) await deleteRecord('diet_plans', plan.cloudId);
      setData((d) => ({ ...d, dietPlans: (d.dietPlans || []).filter((item) => item.id !== id) }));
      setToast('Diet plan deleted');
    } catch (error) {
      console.error('Supabase diet plan delete failed:', error);
      setToast(error?.message || 'Unable to delete diet plan from cloud');
    }
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

  const deleteLead = async (id) => {
    const lead = data.leads.find((item) => item.id === id);
    if (!lead || !window.confirm(`Delete ${lead.name}? This cannot be undone.`)) return;

    // Leads loaded from Supabase carry cloudId. Delete the database row first;
    // otherwise a page reload would load the same lead from Supabase again.
    // Locally-created legacy leads without cloudId are removed from local state.
    try {
      if (lead.cloudId) {
        await deleteRecord('leads', lead.cloudId);
      }

      setData((current) => ({
        ...current,
        leads: current.leads.filter((item) => item.id !== id),
      }));
      setToast(lead.cloudId ? 'Lead permanently deleted from Supabase' : 'Local lead deleted');
    } catch (error) {
      console.error('Supabase lead delete failed:', error);
      setToast(error?.message || 'Could not delete lead. It is still saved in Supabase.');
    }
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
      <style>{TOPBAR_SPACING_FIX_CSS}</style>
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
          {active === 'Members' && <MembersPage members={data.members} query={query} setQuery={setQuery} setModal={setModal} markAttendance={markAttendance} deleteMember={deleteMember} settings={data.settings || {}} payments={data.payments || []} ptSessions={data.ptSessions || []} trainers={data.trainers || []} workoutPlans={data.workoutPlans || []} dietPlans={data.dietPlans || []} />}
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

function capitalizeFieldWords(value) {
  return String(value || '').trim().replace(/(^|[\s'-])([\p{L}])/gu, (_, separator, letter) => separator + letter.toLocaleUpperCase());
}

function SearchableMemberPicker({ members = [], value, onChange, placeholder = 'Search member by name or ID...' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = members.find((member) => member.id === value);
  const filtered = members.filter((member) => [member.name, member.id, member.phone, member.plan].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => {
    const closeOutside = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, []);
  return <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
    <button type="button" className="professional-field" onClick={() => { setQuery(''); setOpen((current) => !current); }} style={{ width: '100%', minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, textAlign: 'left', background: '#fff', border: '1px solid #dbe3ef', borderRadius: 10, padding: '10px 12px', color: selected ? '#243b53' : '#94a3b8' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected ? `${selected.name} (${selected.id})` : 'Select member'}</span><ChevronDown size={16}/>
    </button>
    {open && <div style={{ position: 'absolute', zIndex: 10020, top: 'calc(100% + 5px)', left: 0, right: 0, background: '#fff', border: '1px solid #dbe3ef', borderRadius: 12, boxShadow: '0 14px 35px rgba(25,45,75,.18)', padding: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #dbe3ef', borderRadius: 8, padding: '0 9px', marginBottom: 7 }}><Search size={15} color="#718096"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); } }} placeholder={placeholder} style={{ border: 0, outline: 0, width: '100%', minHeight: 38, background: 'transparent' }}/></div>
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {filtered.length ? filtered.map((member) => <button key={member.id} type="button" onClick={() => { onChange(member.id); setOpen(false); setQuery(''); }} style={{ display: 'block', width: '100%', border: 0, borderRadius: 7, background: member.id === value ? '#eaf3ff' : '#fff', padding: '9px 10px', textAlign: 'left', cursor: 'pointer', color: '#243b53' }}><strong>{member.name}</strong><span style={{ display: 'block', color: '#718096', fontSize: 11, marginTop: 2 }}>{member.id}{member.phone ? ` · ${member.phone}` : ''}</span></button>) : <div style={{ padding: 12, color: '#718096', fontSize: 13, textAlign: 'center' }}>No matching members found.</div>}
      </div>
    </div>}
  </div>;
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
              <input value={form.name} onChange={(e) => update('name', e.target.value)} onBlur={(e) => update('name', capitalizeFieldWords(e.target.value))} />
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
                onBlur={(e) => update('specialization', capitalizeFieldWords(e.target.value))}
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
  return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><div><h3>Assign PT package</h3><span>Select trainer, member and a configured PT plan.</span></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div><div className="modal-body"><div className="form-grid professional-form-grid"><label className="professional-field">Trainer<select value={form.trainerId} onChange={(e)=>update('trainerId',e.target.value)}>{trainers.map((t)=><option key={t.id} value={t.id}>{t.name} — {t.tier || 'Silver'}</option>)}</select></label><label className="professional-field">Member<SearchableMemberPicker members={members} value={form.memberId} onChange={(value)=>update('memberId',value)} /></label><label className="professional-field">Package start date<input type="date" value={form.date} onChange={(e)=>update('date',e.target.value)}/></label><label className="professional-field">PT plan<select value={form.planName} onChange={(e)=>update('planName',e.target.value)}><option>Monthly</option><option>Half-yearly</option><option>Annual</option></select></label><div style={{gridColumn:'1 / -1',background:'#f5f7ff',padding:14,borderRadius:12}}><div style={{fontWeight:800,fontSize:20}}>₹{Number(cfg.fee || 0).toLocaleString('en-IN')}</div><div>{Number(cfg.sessions || 22)} sessions · valid for {Number(cfg.validityDays || 30)} days · {trainer?.tier || 'Silver'} tier</div><small style={{color:'#68758a'}}>Plan price and limits are configured in the trainer profile.</small></div><label style={{gridColumn:'1 / -1'}}>Notes<textarea rows="3" value={form.notes} onChange={(e)=>update('notes',e.target.value)}/></label></div></div><div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={!form.trainerId || !form.memberId || !form.date}>Assign package</button></div></div></div>;
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
function printMemberDietPlans(member, settings, plans = []) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const esc = (value) => escapeHtml(value ?? '—');
  const planSections = (plans || []).map((plan) => {
    const meals = (plan.meals || []).map((meal, index) => `<tr>
      <td><strong>${esc(meal.meal || `Meal ${index + 1}`)}</strong></td>
      <td>${esc(meal.food || '—')}</td>
      <td>${Number(meal.calories || 0)} kcal</td>
      <td>${Number(meal.protein || 0)} g</td>
    </tr>`).join('');
    return `<section class="plan">
      <div class="plan-head"><div><span class="eyebrow">NUTRITION PROGRAMME</span><h2>${esc(plan.name || 'Diet plan')}</h2><p>${esc(plan.goal || 'General Fitness')} · ${Number(plan.durationWeeks || 1)} weeks · Coach: ${esc(plan.coach || '—')}</p></div><div class="targets"><b>${Number(plan.calories || 0)} kcal</b><small>Daily calories</small><b>${Number(plan.protein || 0)} g</b><small>Daily protein</small></div></div>
      <table><thead><tr><th>Meal</th><th>Food / description</th><th>Calories</th><th>Protein</th></tr></thead><tbody>${meals || '<tr><td colspan="4">No meals added.</td></tr>'}</tbody></table>
      ${plan.notes ? `<div class="notes"><b>Coach notes:</b> ${esc(plan.notes)}</div>` : ''}
    </section>`;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(gymName)} - Diet Plan</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eef4fb;color:#19324d;font:13px/1.5 Arial,sans-serif}
    .sheet{max-width:900px;margin:24px auto;background:#fff;border:1px solid #d9e5f2;border-radius:18px;overflow:hidden}
    header{padding:24px 30px;background:linear-gradient(110deg,#123454,#1a5271);color:#fff;border-bottom:5px solid #18b6a5;display:flex;justify-content:space-between;align-items:center;gap:20px}
    header h1{font-size:30px;margin:3px 0;font-weight:900;letter-spacing:.02em}header p{margin:0;color:#c8dced;letter-spacing:.12em;font-size:10px;font-weight:800}
    .eyebrow{font-size:10px;letter-spacing:.18em;color:#65e4d2;font-weight:900}.printed{border:1px solid #5bb8b3;border-radius:30px;padding:8px 12px;white-space:nowrap;font-size:11px}
    .member{padding:20px 30px;background:#f2f7fd;border-bottom:1px solid #dce7f2}.member h2{margin:0 0 4px;font-size:23px}.member span{color:#647b92}
    .plan{margin:20px 24px;border:1px solid #dce7f2;border-radius:13px;overflow:hidden;break-inside:avoid}
    .plan-head{padding:15px 18px;background:linear-gradient(90deg,#edf6ff,#effaf7);display:flex;justify-content:space-between;gap:15px;align-items:center;border-bottom:1px solid #dce7f2}
    .plan h2{margin:3px 0;color:#173b5d;font-size:19px}.plan p{margin:0;color:#647b92;font-size:11px}
    .targets{display:grid;grid-template-columns:auto auto;gap:2px 8px;text-align:right}.targets b{color:#087f79;font-size:13px}.targets small{color:#71839a;font-size:9px}
    table{width:100%;border-collapse:collapse}th{background:#173d5d;color:#fff;text-align:left;padding:10px;font-size:10px;letter-spacing:.05em}td{padding:10px;border-bottom:1px solid #e8eef5;vertical-align:top}tbody tr:nth-child(even){background:#f7fafd}
    .notes{padding:12px 16px;background:#f7f9fc;color:#52677e;border-top:1px solid #e5edf5}
    footer{padding:15px 25px;background:#f2f7fd;border-top:1px solid #dce7f2;display:flex;justify-content:space-between;gap:10px;color:#71839a;font-size:10px}
    @page{size:A4;margin:12mm}@media print{body{background:#fff}.sheet{margin:0;max-width:none;border:0;border-radius:0}.plan{break-inside:avoid}header,th,.plan-head,.member,footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><main class="sheet"><header><div><span class="eyebrow">MEMBER NUTRITION RECORD</span><h1>${esc(gymName)}</h1><p>PERSONALIZED DIET & MEAL PLAN</p></div><span class="printed">PRINTED ${esc(formatDate(new Date().toISOString().slice(0,10)))}</span></header>
  <section class="member"><h2>${esc(member?.name || 'Member')}</h2><span>Member ID: ${esc(member?.id || '—')} · Phone: ${esc(member?.phone || '—')}</span></section>
  ${planSections || '<p style="padding:25px">No diet plans assigned.</p>'}
  <footer><span>Follow the meal schedule as advised by your trainer / dietitian.</span><b>${esc(gymName.toUpperCase())}</b></footer></main><script>window.onload=()=>setTimeout(()=>window.print(),350)</script></body></html>`;
  const win = window.open('', '_blank', 'width=950,height=850');
  if (!win) { alert('Please allow pop-ups to print the diet plan.'); return; }
  win.document.open(); win.document.write(html); win.document.close();
}

function MembersPage({ members, query, setQuery, setModal, markAttendance, deleteMember, settings, payments = [], ptSessions = [], trainers = [], workoutPlans = [], dietPlans = [] }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState(null);
  const [workoutPlansExpanded, setWorkoutPlansExpanded] = useState(true);
  const [dietPlansExpanded, setDietPlansExpanded] = useState(true);

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
    const memberDietPlans = dietPlans.filter((plan) => (plan.assignedMemberIds || []).some((id) => String(id) === String(member.id)));
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
              </div>;
            })()}
          </div>

          <div className="profile-card" style={{...cardStyle, minHeight: workoutPlansExpanded ? undefined : 112, display:'flex', flexDirection:'column', justifyContent:'center', transition:'min-height .2s ease, padding .2s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0,flex:'1 1 260px'}}>
                <div style={{width:42,height:42,minWidth:42,borderRadius:13,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#e4f2ff,#e5f8f4)',color:'#1769b2',border:'1px solid #d9eaf8'}}><Dumbbell size={20}/></div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:17,fontWeight:850,color:'#173b5d'}}>Assigned workout plans</div>
                  <div style={{fontSize:12,color:'#71839a',marginTop:3}}>Weekly training schedule · {memberWorkoutPlans.length} {memberWorkoutPlans.length === 1 ? 'plan' : 'plans'} assigned</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <button type="button" className="btn btn-secondary" onClick={() => printMemberWorkoutPlan(member, settings, memberWorkoutPlans)} style={{display:'inline-flex',alignItems:'center',gap:7,flexShrink:0}}><Printer size={17}/> Print workout plan</button>
                <button type="button" className="btn btn-secondary" aria-expanded={workoutPlansExpanded} onClick={() => setWorkoutPlansExpanded(value => !value)} style={{display:'inline-flex',alignItems:'center',gap:7,flexShrink:0,minWidth:112,justifyContent:'center'}}>{workoutPlansExpanded ? <><ChevronUp size={17}/> Collapse</> : <><ChevronDown size={17}/> Expand</>}</button>
              </div>
            </div>
            {!workoutPlansExpanded && <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12,padding:'9px 11px',borderRadius:11,background:'linear-gradient(90deg,#f1f7ff,#f0fbf8)',border:'1px solid #e2edf6',color:'#58718a',fontSize:12}}><ClipboardList size={15} color="#159b91"/><span>{memberWorkoutPlans.length ? `${memberWorkoutPlans.length} workout ${memberWorkoutPlans.length === 1 ? 'plan is' : 'plans are'} assigned. Expand to view the weekly schedule and exercises.` : 'No workout plans assigned yet.'}</span></div>}
            {workoutPlansExpanded && (memberWorkoutPlans.length ? <div style={{display:'grid',gap:7,marginTop:8}}>{memberWorkoutPlans.map((plan) => {
              const esc = (value) => escapeHtml(value ?? '—');
              const groups = getWorkoutDayGroups(plan);
              return <section key={plan.id} className="workout-card-sheet" style={{margin:0}}>
                {memberWorkoutPlans[0]?.id === plan.id && <><div className="workout-card-top"><div className="workout-brand">PREFACE<small>FITNESS • WORKOUT CARD</small></div><span style={{fontSize:10,color:'#71839a',fontWeight:800}}>WEEKLY TRAINING</span></div><div className="workout-member-meta"><span>Member: {member.name || '—'}</span><span>ID: {member.id || '—'}</span></div></>}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'5px 10px',background:'#f7faff',borderBottom:'1px solid #e5edf6'}}><strong style={{fontSize:12,color:'#24496d'}}>{plan.name || 'Workout plan'}</strong><span style={{fontSize:9,fontWeight:900,color:'#1769b2'}}>{String(plan.level || 'BEGINNER').toUpperCase()} · {Number(plan.durationWeeks || 1)} WKS</span></div>
                {groups.length ? groups.map((group,index) => <section key={`${plan.id}-group-${index}`} className="workout-day-card">
                  <div className="workout-day-heading">{group.days.map(day=>day.toUpperCase()).join('  •  ')}</div>
                  <div className="workout-warmup"><strong>Warm up &amp; Stretching</strong><b>{plan.warmupMinutes ?? 10} MIN</b></div>
                  {group.exercises.map((exercise,i)=><div key={exercise.id||i} className="workout-exercise-row"><span className="workout-number">{i+1}</span><span className="workout-exercise-name">{exercise.name || 'Exercise'}</span><span className="workout-exercise-dose">{exercise.reps ?? 15} × {exercise.sets ?? 3}</span></div>)}
                  <div className="workout-cooldown"><strong>Cool Down &amp; Stretching</strong><b>{plan.cooldownMinutes ?? 5} MIN</b></div>
                </section>) : <p style={{padding:14}}>No exercises added.</p>}
                <div className="workout-card-footer"><span>{plan.goal || 'GENERAL FITNESS'} · {plan.trainer || 'PREFACE FITNESS'}</span><span>{Number(plan.durationWeeks || 1)} WEEKS</span></div>
              </section>;
            })}</div> : <p style={{margin:'10px 0 0',color:'#718096'}}>No workout plans have been assigned to this member.</p>)}
          </div>

          <div className="profile-card" style={{...cardStyle, minHeight: dietPlansExpanded ? undefined : 112, display:'flex', flexDirection:'column', justifyContent:'center', transition:'min-height .2s ease, padding .2s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0,flex:'1 1 260px'}}>
                <div style={{width:42,height:42,minWidth:42,borderRadius:13,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#e4f2ff,#e5f8f4)',color:'#159b91',border:'1px solid #d9eaf8'}}><Activity size={20}/></div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:17,fontWeight:850,color:'#173b5d'}}>Assigned diet plans</div>
                  <div style={{fontSize:12,color:'#71839a',marginTop:3}}>Meal-wise nutrition schedule · {memberDietPlans.length} {memberDietPlans.length === 1 ? 'plan' : 'plans'} assigned</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <button type="button" className="btn btn-secondary" onClick={() => printMemberDietPlans(member, settings, memberDietPlans)} style={{display:'inline-flex',alignItems:'center',gap:7,flexShrink:0}}><Printer size={17}/> Print diet plan</button>
                <button type="button" className="btn btn-secondary" aria-expanded={dietPlansExpanded} onClick={() => setDietPlansExpanded(value => !value)} style={{display:'inline-flex',alignItems:'center',gap:7,flexShrink:0,minWidth:112,justifyContent:'center'}}>{dietPlansExpanded ? <><ChevronUp size={17}/> Collapse</> : <><ChevronDown size={17}/> Expand</>}</button>
              </div>
            </div>
            {!dietPlansExpanded && <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12,padding:'9px 11px',borderRadius:11,background:'linear-gradient(90deg,#f1f7ff,#f0fbf8)',border:'1px solid #e2edf6',color:'#58718a',fontSize:12}}><ClipboardList size={15} color="#159b91"/><span>{memberDietPlans.length ? `${memberDietPlans.length} diet ${memberDietPlans.length === 1 ? 'plan is' : 'plans are'} assigned. Expand to view meal-wise nutrition details.` : 'No diet plans assigned yet.'}</span></div>}
            {dietPlansExpanded && (memberDietPlans.length ? <div style={{display:'grid',gap:12,marginTop:12}}>{memberDietPlans.map((plan,index)=><section key={plan.id || index} style={{border:'1px solid #dce7f2',borderRadius:14,overflow:'hidden',background:'#fff'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',padding:'12px 14px',background:'linear-gradient(90deg,#edf6ff,#effaf7)',borderBottom:'1px solid #dce7f2'}}>
                <div><strong style={{color:'#173b5d',fontSize:14}}>{plan.name || 'Nutrition plan'}</strong><div style={{fontSize:11,color:'#71839a',marginTop:3}}>{plan.goal || 'General Fitness'} · {plan.durationWeeks || 1} weeks · Coach: {plan.coach || '—'}</div></div>
                <div style={{display:'flex',gap:7,flexWrap:'wrap'}}><span className="status-badge active">{Number(plan.calories || 0)} kcal/day</span><span className="status-badge">{Number(plan.protein || 0)}g protein</span></div>
              </div>
              <div style={{padding:12,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:9}}>
                {(plan.meals || []).map((meal,mealIndex)=><div key={meal.id || mealIndex} style={{border:'1px solid #e6edf5',borderRadius:11,padding:11,background:mealIndex%2===0?'#fbfdff':'#f8fcfb'}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',marginBottom:6}}><strong style={{color:'#147d79',fontSize:13}}>{meal.meal || `Meal ${mealIndex+1}`}</strong><span style={{fontSize:10,color:'#71839a',fontWeight:800}}>{Number(meal.calories || 0)} kcal · {Number(meal.protein || 0)}g protein</span></div>
                  <div style={{fontSize:13,color:'#334155',lineHeight:1.55,whiteSpace:'pre-wrap'}}>{meal.food || 'Food details not provided'}</div>
                </div>)}
              </div>
              {plan.notes && <div style={{padding:'0 14px 12px',fontSize:12,color:'#64748b'}}><strong>Notes:</strong> {plan.notes}</div>}
            </section>)}</div> : <p style={{margin:'10px 0 0',color:'#718096'}}>No diet plans have been assigned to this member.</p>)}
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
    warmupMinutes: plan.warmupMinutes ?? 10,
    cooldownMinutes: plan.cooldownMinutes ?? 5,
    assignedMemberIds: plan.assignedMemberIds || [],
    exercises: plan.exercises?.length ? plan.exercises.map((exercise) => ({ ...exercise, muscle: exercise.muscle || 'Full Body', day: exercise.day || 'Unscheduled' })) : [{ id: `EX-${Date.now()}`, name: '', muscle: 'Full Body', day: 'Unscheduled', sets: 3, reps: '15', rest: '60 sec' }],
  } : {
    name: '', goal: 'General Fitness', level: 'Beginner', durationWeeks: 4, trainer: 'Administrator', notes: '', warmupMinutes: 10, cooldownMinutes: 5, assignedMemberIds: [],
    exercises: [{ id: `EX-${Date.now()}`, name: '', muscle: 'Full Body', day: 'Unscheduled', sets: 3, reps: '15', rest: '60 sec' }],
  });

  const allMuscleGroups = [...new Set([...defaultMuscleGroups, ...(muscleGroups || []).filter(Boolean), ...(form.exercises || []).map((exercise) => exercise.muscle).filter(Boolean)])];
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateExercise = (index, key, value) => setForm((current) => ({ ...current, exercises: current.exercises.map((exercise, i) => i === index ? { ...exercise, [key]: value } : exercise) }));
  const addExercise = () => setForm((current) => ({ ...current, exercises: [...current.exercises, { id: `EX-${Date.now()}-${current.exercises.length}`, name: '', muscle: 'Full Body', day: 'Unscheduled', sets: 3, reps: '15', rest: '60 sec' }] }));
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
      <FormField label="Plan name"><input autoFocus value={form.name} onChange={(e) => update('name', e.target.value)} onBlur={(e) => update('name', capitalizeFieldWords(e.target.value))} placeholder="e.g. Fat Loss Foundation" /></FormField>
      <FormField label="Goal"><select value={form.goal} onChange={(e) => update('goal', e.target.value)}><option>General Fitness</option><option>Fat Loss</option><option>Muscle Building</option><option>Strength</option><option>Rehabilitation</option><option>Sports Performance</option></select></FormField>
      <FormField label="Level"><select value={form.level} onChange={(e) => update('level', e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></FormField>
    </div>
    <div className="form-grid three">
      <FormField label="Duration (weeks)"><input type="number" min="1" max="52" value={form.durationWeeks} onChange={(e) => update('durationWeeks', e.target.value)} /></FormField>
      <FormField label="Trainer"><input value={form.trainer} onChange={(e) => update('trainer', e.target.value)} onBlur={(e) => update('trainer', capitalizeFieldWords(e.target.value))} placeholder="Trainer name" /></FormField>
      <FormField label="Warm up (minutes)"><input type="number" min="0" max="60" value={form.warmupMinutes ?? 10} onChange={(e) => update('warmupMinutes', e.target.value)} /></FormField>
      <FormField label="Cool down (minutes)"><input type="number" min="0" max="60" value={form.cooldownMinutes ?? 5} onChange={(e) => update('cooldownMinutes', e.target.value)} /></FormField>
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
          <FormField label="Workout day"><select value={exercise.day || 'Unscheduled'} onChange={(e) => updateExercise(index, 'day', e.target.value)}>{['Unscheduled','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => <option key={day} value={day}>{day}</option>)}</select></FormField>
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
          {filteredPlans.map((plan) => <div key={plan.id} style={{textAlign:'left',border:selected?.id===plan.id?'1px solid #39b6a7':'1px solid #e7ebef',background:selected?.id===plan.id?'#f2fbf9':'#fff',borderRadius:12,padding:13}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}}>
              <button type="button" onClick={() => setSelectedId(plan.id)} style={{textAlign:'left',border:0,background:'transparent',padding:0,cursor:'pointer',minWidth:0,flex:1}}>
                <strong style={{display:'block',color:'#16242d'}}>{plan.name}</strong>
                <span style={{display:'block',marginTop:3,color:'#71808d',fontSize:12}}>{plan.goal} · {plan.durationWeeks} weeks</span>
              </button>
              <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                <button type="button" className="icon-btn" title="Assign members" aria-label={`Assign members to ${plan.name}`} onClick={() => setModal({type:'editDietPlan',plan,focusAssign:true})} style={{color:'#0f9b8e',border:'1px solid #cdece6',background:'#f0fbf8'}}><Plus size={16}/></button>
                <button type="button" className="icon-btn" title="Edit diet plan" aria-label={`Edit ${plan.name}`} onClick={() => setModal({type:'editDietPlan',plan})}><Pencil size={15}/></button>
                <button type="button" className="icon-btn" title="Delete diet plan" aria-label={`Delete ${plan.name}`} onClick={() => deleteDietPlan(plan.id)} style={{color:'#dc5555',border:'1px solid #f3d6d6',background:'#fff8f8'}}><X size={16}/></button>
              </div>
            </div>
            <div style={{display:'flex',gap:14,marginTop:10,fontSize:12,color:'#5f6f7b'}}><span>{plan.calories || 0} kcal/day</span><span>{(plan.assignedMemberIds || []).length} members</span><span className="status-badge active">{plan.protein || 0}g protein</span></div>
          </div>)}
          {!filteredPlans.length && <EmptyState title="No diet plans" text="Create your first nutrition plan." />}
        </div>
      </section>

      <section className="panel">
        {selected ? <>
          <PanelHeader title={selected.name} subtitle={`${selected.goal} · ${selected.durationWeeks} weeks · Coach: ${selected.coach || '—'}`} icon={Target} action={<div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'editDietPlan', plan: selected, focusAssign: true })}><Plus size={14}/> Assign</button><button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'editDietPlan', plan: selected })}><Pencil size={14}/> Edit</button><button className="btn btn-danger btn-sm" onClick={() => deleteDietPlan(selected.id)}><X size={14}/> Delete</button></div>} />
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

function DietMemberPicker({ members, selectedIds, onToggle }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = (members || []).filter((member) => {
    const q = search.trim().toLowerCase();
    return !q || [member.name, member.id, member.phone, member.plan].join(' ').toLowerCase().includes(q);
  });
  const selected = (members || []).filter((member) => selectedIds.includes(member.id));
  return <div style={{position:'relative'}}>
    <button type="button" onClick={() => setOpen(value => !value)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,padding:'11px 13px',border:'1px solid #dce5ef',borderRadius:11,background:'#fff',color:'#26384d',cursor:'pointer',textAlign:'left'}}>
      <span>{selected.length ? `${selected.length} member${selected.length===1?'':'s'} selected` : 'Select members to assign'}</span><ChevronDown size={17}/>
    </button>
    {selected.length>0 && <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>{selected.map(member=><span key={member.id} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 8px',borderRadius:99,background:'#eaf7f4',color:'#147d79',fontSize:12,fontWeight:750}}>{member.name}<button type="button" onClick={()=>onToggle(member.id)} aria-label={`Remove ${member.name}`} style={{border:0,background:'transparent',color:'#147d79',padding:0,cursor:'pointer',display:'inline-flex'}}><X size={13}/></button></span>)}</div>}
    {open && <div style={{position:'absolute',zIndex:40,top:'calc(100% + 6px)',left:0,right:0,border:'1px solid #dce5ef',borderRadius:12,background:'#fff',boxShadow:'0 14px 35px rgba(20,40,70,.16)',padding:10}}>
      <div className="search-box" style={{marginBottom:8}}><Search size={16}/><input autoFocus value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search member name, ID or phone..." /></div>
      <div style={{maxHeight:190,overflowY:'auto',display:'grid',gap:4}}>
        {filtered.map(member=><button key={member.id} type="button" onClick={()=>onToggle(member.id)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 8px',border:0,borderRadius:8,background:selectedIds.includes(member.id)?'#effaf7':'#fff',textAlign:'left',cursor:'pointer'}}>
          <span style={{width:18,height:18,borderRadius:5,border:'1px solid #b9c8d8',background:selectedIds.includes(member.id)?'#159b91':'#fff',color:'#fff',display:'grid',placeItems:'center',fontSize:12}}>{selectedIds.includes(member.id)?'✓':''}</span>
          <span style={{minWidth:0}}><strong style={{display:'block',fontSize:13,color:'#25364b'}}>{member.name}</strong><small style={{color:'#71839a'}}>{member.id} · {member.phone || 'No phone'} · {member.plan || 'No plan'}</small></span>
        </button>)}
        {!filtered.length && <div style={{padding:12,textAlign:'center',color:'#71839a',fontSize:13}}>No members found.</div>}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'1px solid #edf1f5',marginTop:8}}><small style={{color:'#71839a'}}>{selected.length} selected</small><button type="button" className="btn btn-primary btn-sm" onClick={()=>setOpen(false)}>Done</button></div>
    </div>}
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
    <DietMemberPicker members={members} selectedIds={form.assignedMemberIds} onToggle={toggleMember} />
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
  const humanFigure = `<img class="hero-visual" src="data:image/jpeg;base64,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" alt="Preface Fitness full visible strength-training athlete with dumbbells" />`;
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
    .hero-art{position:absolute;right:0;top:0;bottom:0;width:42%;display:flex;align-items:stretch;justify-content:stretch;overflow:hidden;z-index:1;opacity:1;pointer-events:none;background:linear-gradient(90deg,#153b59 0%,#0b5266 72%,#087f78 100%)}
    .hero-art::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(90deg,rgba(16,41,67,.78) 0%,rgba(16,41,67,.18) 16%,transparent 42%),linear-gradient(270deg,rgba(8,127,120,.82) 0%,rgba(8,127,120,.34) 12%,transparent 38%),linear-gradient(180deg,rgba(16,41,67,.12) 0%,transparent 16%,transparent 86%,rgba(8,127,120,.12) 100%)}
    .hero-visual{position:absolute;inset:-2.5% -3%;width:106%;height:105%;object-fit:cover;object-position:center 44%;display:block;mix-blend-mode:normal;filter:saturate(1.08) contrast(1.03);mask-image:linear-gradient(90deg,transparent 0%,#000 8%,#000 88%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 8%,#000 88%,transparent 100%)}
    
    
    
    
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
    @media screen and (max-width:650px){.fitness-print{margin:0;border-radius:0}.hero{padding:22px 20px;min-height:180px}.hero-art{right:0;width:245px;opacity:.9}.hero-copy{max-width:85%}.gym{font-size:24px}.date-chip{right:12px;top:8px}.columns{grid-template-columns:1fr;padding:12px 14px 0}.medical{margin:12px 14px 0}.member{padding:16px 18px}.member-details{gap:9px 15px}footer{padding:10px 14px}.workouts{margin:12px 14px 0}}
    @media print{
      @page{size:A4;margin:9mm}
      body{background:#fff!important}
      .fitness-print{margin:0;max-width:none;border-radius:12px;box-shadow:none;border:1px solid #d8e4f1}
      .hero{min-height:165px;padding:20px 24px}
      .hero-art{right:0;width:340px;top:0;bottom:0}
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
function getWorkoutDayGroups(plan) {
  const order = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Unscheduled'];
  const groups = new Map();
  order.forEach((day) => {
    const exercises = (plan?.exercises || []).filter((exercise) => (exercise.day || 'Unscheduled') === day);
    if (!exercises.length) return;
    const signature = JSON.stringify(exercises.map((ex) => [ex.name || ex.exercise || '', ex.muscle || ex.muscleGroup || 'Full Body', ex.sets ?? 3, ex.reps ?? 15, ex.rest || '60 sec']));
    if (!groups.has(signature)) groups.set(signature, { days: [], exercises });
    groups.get(signature).days.push(day);
  });
  return [...groups.values()];
}

function workoutPortalTableHtml(plan, esc) {
  const groups = getWorkoutDayGroups(plan);
  return groups.map((group) => `<section class="portal-workout-day">
    <div class="portal-workout-day-title">${group.days.map((day) => esc(day.toUpperCase())).join(' • ')}</div>
    <table class="portal-workout-table"><thead><tr><th>#</th><th>Exercise</th><th>Muscle group</th><th>Sets</th><th>Reps</th><th>Rest</th></tr></thead><tbody>
    ${group.exercises.map((ex, index) => `<tr><td><span class="portal-workout-number">${index + 1}</span></td><td><strong>${esc(ex.name || ex.exercise || 'Exercise')}</strong></td><td>${esc(ex.muscleGroup || ex.muscle || 'Full Body')}</td><td>${esc(ex.sets ?? 3)}</td><td>${esc(ex.reps ?? 15)}</td><td>${esc(ex.rest || '60 sec')}</td></tr>`).join('')}
    </tbody></table>
    <div class="portal-workout-warmcool"><span>Warm up &amp; Stretching <b>${esc(plan.warmupMinutes ?? 10)} min</b></span><span>Cool down &amp; Stretching <b>${esc(plan.cooldownMinutes ?? 5)} min</b></span></div>
  </section>`).join('');
}

function workoutCardGroupHtml(plan, esc) {
  const groups = getWorkoutDayGroups(plan);
  return groups.map((group) => `<section class="workout-day-card">
    <div class="workout-day-heading">${group.days.map((day) => esc(day.toUpperCase())).join(' <span>•</span> ')}</div>
    <div class="workout-warmup"><strong>Warm up &amp; Stretching</strong><b>${esc(plan.warmupMinutes ?? 10)} MIN</b></div>
    <div class="workout-exercise-list">${group.exercises.map((ex, index) => `<div class="workout-exercise-row"><span class="workout-number">${index + 1}</span><span class="workout-exercise-name">${esc(ex.name || ex.exercise || 'Exercise')}</span><span class="workout-exercise-dose">${esc(ex.reps ?? 15)} × ${esc(ex.sets ?? 3)}</span></div>`).join('')}</div>
    <div class="workout-cooldown"><strong>Cool Down &amp; Stretching</strong><b>${esc(plan.cooldownMinutes ?? 5)} MIN</b></div>
  </section>`).join('');
}

const WORKOUT_CARD_CSS = `
  .workout-card-sheet{font-family:Arial,Helvetica,sans-serif;background:#ffffff;color:#1b2942;border:1px solid #d9e4f0;border-radius:10px;overflow:hidden;margin:8px 0;break-inside:avoid}
  .workout-card-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 12px;background:linear-gradient(110deg,#f4f8fd 0%,#eaf3fb 100%);border-bottom:2px solid #159b91}
  .workout-brand{font-size:18px;line-height:1;font-weight:950;letter-spacing:.03em;color:#173b5e}.workout-brand small{display:block;color:#168b9b;font-size:9px;letter-spacing:.08em;margin-top:3px}
  .workout-plan-level{background:#e7f3ff;color:#1769b2;border:1px solid #c6def8;border-radius:7px;padding:6px 10px;font-size:11px;font-weight:950;letter-spacing:.04em;white-space:nowrap}
  .workout-member-meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;padding:6px 10px;background:#f5f8fc;border:1px solid #dce6f1;border-radius:7px;margin:6px 10px;color:#24527a;font-size:9px;font-weight:800}
  .workout-member-meta span{border-bottom:1px dotted #b8c7d8;padding-bottom:3px}
  .workout-day-card{margin:6px 10px 8px;border:1px solid #dce6f1;border-radius:8px;overflow:hidden;background:#ffffff;break-inside:avoid}
  .workout-day-heading{background:#e7f3ff;color:#1769b2;padding:6px 10px;font-size:11px;font-weight:950;letter-spacing:.055em}.workout-day-heading span{color:#4f83b5;padding:0 5px}
  .workout-warmup,.workout-cooldown{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:4px 10px;font-size:10px;font-weight:900;color:#167f79}.workout-warmup b,.workout-cooldown b{white-space:nowrap}
  .workout-exercise-row{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:9px;align-items:center;padding:3px 9px;min-height:23px;background:#f7f9fc;color:#26384d;font-size:10px}.workout-exercise-row:nth-child(even){background:#eef3f8}
  .workout-number{width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:#159b91;color:#fff;font-size:10px;font-weight:950}
  .workout-exercise-name{min-width:0;overflow-wrap:anywhere}.workout-exercise-dose{font-size:10px;font-weight:950;color:#1769b2;white-space:nowrap}
  .workout-cooldown{border-top:1px solid #dce6f1;color:#168b9b;padding-top:9px;padding-bottom:10px}
  .workout-plan-strip{display:flex;justify-content:space-between;gap:8px;padding:5px 10px;background:#f7faff;border-bottom:1px solid #e5edf6;color:#24496d}.workout-plan-strip strong{font-size:11px}.workout-plan-strip span{font-size:9px;font-weight:900;color:#1769b2}
  .workout-card-footer{display:flex;justify-content:space-between;gap:12px;padding:6px 10px;color:#71839a;font-size:8px;letter-spacing:.08em;font-weight:800}
  @media(max-width:600px){.workout-member-meta{grid-template-columns:1fr}.workout-brand{font-size:19px}.workout-day-heading{font-size:12px}}
`;


if (typeof document !== 'undefined' && !document.getElementById('preface-workout-card-theme')) {
  const style = document.createElement('style');
  style.id = 'preface-workout-card-theme';
  style.textContent = WORKOUT_CARD_CSS;
  document.head.appendChild(style);
}

function printMemberWorkoutPlan(member, settings, workoutPlans = []) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const esc = (value) => escapeHtml(value ?? '—');
  const plans = (workoutPlans || []).filter((plan) => (plan.assignedMemberIds || []).some((id) => String(id) === String(member?.id)));
  const sections = plans.map((plan, index) => `<section class="workout-card-sheet">
    ${index === 0 ? `<div class="workout-hero"><div class="workout-hero-copy"><div class="workout-eyebrow">Personal training programme</div><div class="workout-brand">${esc(gymName.toUpperCase())}<small>FITNESS • WORKOUT CARD</small></div><div class="workout-hero-sub">Your weekly strength & conditioning plan</div></div><svg class="workout-hero-art" viewBox="0 0 220 90" aria-label="Dumbbell illustration"><defs><linearGradient id="workBar" x1="0" x2="1"><stop stop-color="#c9fff4"/><stop offset="1" stop-color="#42cbbb"/></linearGradient></defs><g fill="none" stroke="url(#workBar)" stroke-width="7" stroke-linecap="round"><path d="M48 45H172M40 22V68M24 30V60M180 22V68M196 30V60"/></g><circle cx="110" cy="45" r="39" fill="none" stroke="rgba(255,255,255,.2)"/></svg></div><div class="workout-member-meta"><span>MEMBER: ${esc(member?.name)}</span><span>ID: ${esc(member?.id)}</span></div>` : `<div class="workout-plan-compact-brand"><strong>${esc(gymName.toUpperCase())}</strong><span>WORKOUT PLAN ${index + 1}</span></div>`}
    <div class="workout-plan-strip"><strong>${esc(plan.name || 'Workout plan')}</strong><span>${esc(String(plan.level || 'BEGINNER').toUpperCase())} · ${esc(Number(plan.durationWeeks || 1))} WKS</span></div>
    ${workoutCardGroupHtml(plan, esc) || '<p style="padding:8px">No exercises added.</p>'}
    <div class="workout-card-footer"><span>${esc(plan.goal || 'GENERAL FITNESS')}</span><span>${esc(Number(plan.durationWeeks || 1))} WEEKS</span></div>
  </section>`).join('');
  const html = `<main class="workout-print-page">${sections || '<p>No workout plans assigned.</p>'}<footer class="workout-print-footer"><span>${esc(gymName.toUpperCase())} · TRAINING PROGRAMME</span><span>TRAIN SMART · STAY CONSISTENT</span></footer></main><style>*{box-sizing:border-box}body{margin:0;padding:12px;background:#f4f7fb;color:#1b2942;font:10px/1.35 Arial,sans-serif}.workout-print-page{max-width:850px;margin:0 auto}.workout-card-sheet{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#1b2942;border:1px solid #d9e4f0;border-radius:12px;overflow:hidden;margin:8px 0 12px;break-inside:avoid;box-shadow:0 5px 16px rgba(23,54,90,.06)}.workout-hero{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;background:linear-gradient(112deg,#123553 0%,#1d5275 62%,#087f78 100%);border-bottom:4px solid #20b7a5;color:#fff}.workout-hero:after{content:"";position:absolute;width:170px;height:170px;border:1px solid rgba(255,255,255,.14);border-radius:50%;right:80px;top:-100px}.workout-hero-copy{position:relative;z-index:1}.workout-eyebrow{font-size:8px;font-weight:900;letter-spacing:.18em;color:#8af0df;text-transform:uppercase;margin-bottom:4px}.workout-brand{font-size:19px;line-height:1;font-weight:950;color:#fff}.workout-brand small{display:block;color:#9de9e0;font-size:8px;letter-spacing:.12em;margin-top:4px}.workout-hero-sub{font-size:9px;color:#d8eaf5;margin-top:7px}.workout-hero-art{position:relative;z-index:1;width:170px;height:68px;flex:0 0 170px}.workout-member-meta{display:flex;gap:16px;padding:6px 11px;background:#f2f7fc;color:#24527a;font-size:8px;font-weight:900;letter-spacing:.04em;border-bottom:1px solid #e2ebf4}.workout-plan-compact-brand{display:flex;justify-content:space-between;align-items:center;padding:7px 11px;background:#f3f8fc;border-bottom:1px solid #e1eaf3;color:#24527a;font-size:9px}.workout-plan-compact-brand span{font-weight:900;color:#168b9b;letter-spacing:.08em}.workout-plan-strip{display:flex;justify-content:space-between;gap:8px;padding:6px 10px;background:#f7faff;border-bottom:1px solid #e5edf6;color:#24496d}.workout-plan-strip strong{font-size:11px}.workout-plan-strip span{font-size:9px;font-weight:900;color:#1769b2}.workout-day-card{margin:5px 9px 7px;border:1px solid #dce6f1;border-radius:7px;overflow:hidden;break-inside:avoid}.workout-day-heading{background:#e7f3ff;color:#1769b2;padding:5px 9px;font-size:10px;font-weight:950}.workout-warmup,.workout-cooldown{display:flex;justify-content:space-between;padding:3px 9px;font-size:9px;font-weight:900;color:#167f79}.workout-exercise-row{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:7px;align-items:center;padding:2px 8px;min-height:20px;background:#f7f9fc;color:#26384d;font-size:9px}.workout-exercise-row:nth-child(even){background:#eef3f8}.workout-number{width:14px;height:14px;border-radius:50%;display:grid;place-items:center;background:#159b91;color:#fff;font-size:8px;font-weight:950}.workout-exercise-dose{font-size:9px;font-weight:950;color:#1769b2}.workout-cooldown{border-top:1px solid #dce6f1;color:#168b9b}.workout-card-footer{display:flex;justify-content:space-between;padding:5px 10px;color:#71839a;font-size:8px;font-weight:800;background:#f7fafc;border-top:1px solid #edf2f7}.workout-print-footer{display:flex;justify-content:space-between;padding:9px 3px;color:#71839a;font-size:8px;font-weight:900;letter-spacing:.08em}.portal-workout-day{margin:5px 9px 7px;border:1px solid #dce6f1;border-radius:7px;overflow:hidden;break-inside:avoid}.portal-workout-day-title{background:#e7f3ff;color:#1769b2;padding:5px 9px;font-size:10px;font-weight:950}.portal-workout-table{width:100%;border-collapse:collapse;font-size:9px}.portal-workout-table th{background:#f1f6fc;color:#31516f;text-align:left;padding:5px 6px;border-bottom:1px solid #dce6f1}.portal-workout-table td{padding:5px 6px;border-bottom:1px solid #edf1f6;color:#26384d}.portal-workout-table tbody tr:nth-child(even){background:#f5f8fc}.portal-workout-number{display:inline-grid;place-items:center;width:15px;height:15px;border-radius:50%;background:#159b91;color:#fff;font-size:8px;font-weight:900}.portal-workout-warmcool{display:flex;justify-content:space-between;gap:8px;padding:5px 8px;color:#167f79;font-size:8px;font-weight:800;background:#fbfdff}.portal-workout-warmcool span{display:flex;gap:5px}.portal-workout-warmcool b{color:#1769b2}@page{size:A4 portrait;margin:7mm}@media print{body{padding:0;background:#fff}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}.workout-card-sheet{box-shadow:none}}</style>`;
  openPrintWindow(`${gymName} - ${member?.name || 'Member'} Workout Card`, html);
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
      <FormField label="Full name"><input autoFocus value={form.name} onChange={(e) => update('name', e.target.value)} onBlur={(e) => update('name', String(e.target.value || '').trim().replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => separator + letter.toLocaleUpperCase()))} placeholder="Rahul Sharma" /></FormField>
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
      <FormField label="Member"><SearchableMemberPicker members={members} value={form.memberId} onChange={(value) => update('memberId', value)} /></FormField>
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
  useGentleInputAssist();
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
  const printPortalWorkoutPlan = () => {
    const esc = (value) => escapeHtml(value ?? '—');
    const sourcePlans = portalData?.workout_plans || [];
    const plans = sourcePlans.map((plan,index) => `<section class="workout-card-sheet">
      ${index === 0 ? `<div class="workout-card-top"><div class="workout-brand">PREFACE<small>FITNESS • WORKOUT CARD</small></div><span style="font-size:10px;color:#71839a;font-weight:800">WEEKLY TRAINING</span></div><div class="workout-member-meta"><span>Member: ${esc(portalData?.member?.name || 'Member')}</span><span>ID: ${esc(portalData?.member?.member_code || '—')}</span></div>` : ''}
      <div class="workout-plan-strip"><strong>${esc(plan.name || plan.title || 'Workout plan')}</strong><span>${esc(String(plan.level || 'BEGINNER').toUpperCase())} · ${esc(Number(plan.durationWeeks || 1))} WKS</span></div>
      ${workoutPortalTableHtml(plan, esc)}
      <div class="workout-card-footer"><span>${esc(plan.goal || 'GENERAL FITNESS')}</span><span>${esc(Number(plan.durationWeeks || 1))} WEEKS</span></div>
    </section>`).join('');
    const html = `<main class="workout-print-page">${plans || '<p>No workout plans assigned.</p>'}</main><style>*{box-sizing:border-box}body{margin:0;padding:8px;background:#f4f7fb;color:#1b2942;font:10px/1.35 Arial,sans-serif}.workout-print-page{max-width:850px;margin:0 auto}.workout-card-sheet{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#1b2942;border:1px solid #d9e4f0;border-radius:9px;overflow:hidden;margin:7px 0;break-inside:avoid}.workout-card-top{display:flex;justify-content:space-between;align-items:center;padding:7px 11px;background:linear-gradient(110deg,#f4f8fd,#eaf3fb);border-bottom:2px solid #159b91}.workout-brand{font-size:17px;line-height:1;font-weight:950;color:#173b5e}.workout-brand small{display:block;color:#168b9b;font-size:8px;letter-spacing:.08em;margin-top:3px}.workout-member-meta{display:flex;gap:14px;padding:5px 10px;background:#f5f8fc;color:#24527a;font-size:9px;font-weight:800}.workout-plan-strip{display:flex;justify-content:space-between;gap:8px;padding:5px 10px;background:#f7faff;border-bottom:1px solid #e5edf6;color:#24496d}.workout-plan-strip strong{font-size:11px}.workout-plan-strip span{font-size:9px;font-weight:900;color:#1769b2}.workout-day-card{margin:5px 9px 7px;border:1px solid #dce6f1;border-radius:7px;overflow:hidden;break-inside:avoid}.workout-day-heading{background:#e7f3ff;color:#1769b2;padding:5px 9px;font-size:10px;font-weight:950}.workout-warmup,.workout-cooldown{display:flex;justify-content:space-between;padding:3px 9px;font-size:9px;font-weight:900;color:#167f79}.workout-exercise-row{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:7px;align-items:center;padding:2px 8px;min-height:20px;background:#f7f9fc;color:#26384d;font-size:9px}.workout-exercise-row:nth-child(even){background:#eef3f8}.workout-number{width:14px;height:14px;border-radius:50%;display:grid;place-items:center;background:#159b91;color:#fff;font-size:8px;font-weight:950}.workout-exercise-dose{font-size:9px;font-weight:950;color:#1769b2}.workout-cooldown{border-top:1px solid #dce6f1;color:#168b9b}.workout-card-footer{display:flex;justify-content:space-between;padding:4px 10px;color:#71839a;font-size:8px;font-weight:800}@page{size:A4 portrait;margin:7mm}@media print{body{padding:0;background:#fff}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>`;
    openPrintWindow('Preface Fitness Workout Card', html);
  };
  const logout = () => { setPortalData(null); setIdentifier(''); setPin(''); setError(''); };
  const card = { background:'rgba(255,255,255,.94)', border:'1px solid rgba(210,220,240,.9)', borderRadius:20, padding:20, boxShadow:'0 14px 36px rgba(44,55,110,.08)' };
  const label = { display:'block', fontSize:13, fontWeight:700, color:'#34445c', marginBottom:7 };
  const input = { width:'100%', boxSizing:'border-box', padding:'13px 14px', border:'1px solid #d7dfeb', borderRadius:11, fontSize:16, outlineColor:'#7654ef', background:'#fff' };
  const moneyText = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits:2 })}`;
  const memberMeta = readMemberMeta(portalData?.member?.notes || '');
  const measurementRows = [
    ['Height', portalData?.member?.height, 'cm'], ['Weight', portalData?.member?.weight, 'kg'],
    ['Body fat', portalData?.member?.body_fat, '%'], ['Chest', memberMeta.chest, 'cm'],
    ['Shoulder', memberMeta.shoulder, 'cm'], ['Biceps', memberMeta.biceps, 'cm'],
    ['Forearms', memberMeta.forearms, 'cm'], ['Waist', memberMeta.waist, 'cm'],
    ['Hips', memberMeta.hips, 'cm'], ['Thighs', memberMeta.thighs, 'cm'],
    ['Calves', memberMeta.calves, 'cm'], ['Neck', memberMeta.neck, 'cm'],
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
  return <div className="member-portal-root" style={{minHeight:'100vh',background:'radial-gradient(circle at 8% 4%,#dff7ff 0,transparent 28%),radial-gradient(circle at 92% 10%,#f0ddff 0,transparent 30%),linear-gradient(135deg,#f5f3ff 0%,#eff8ff 48%,#f0fdf7 100%)',padding:'24px 14px 44px',fontFamily:'Inter,system-ui,-apple-system,Segoe UI,sans-serif',color:'#1d2b42'}}>
    <style>{`@media print { @page { size:A4; margin:12mm; } html,body,#root { background:#fff!important; margin:0!important; padding:0!important; width:100%!important; height:auto!important; overflow:visible!important; } .member-portal-root { background:#fff!important; padding:0!important; min-height:0!important; color:#172033!important; } .member-portal-root > div { max-width:none!important; width:100%!important; margin:0!important; } .member-portal-no-print { display:none!important; } .member-portal-root section { break-inside:avoid; page-break-inside:avoid; box-shadow:none!important; } .member-portal-root img { print-color-adjust:exact; -webkit-print-color-adjust:exact; } .member-portal-root table { width:100%!important; border-collapse:collapse!important; } .member-portal-root h1,.member-portal-root h2,.member-portal-root h3 { break-after:avoid; page-break-after:avoid; } .member-portal-root footer { margin-top:12px!important; } }`}</style>
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
        <section style={{...card,marginBottom:16,position:'relative',overflow:'hidden',background:'linear-gradient(115deg,#4f46e5 0%,#7c3aed 48%,#0891b2 100%)',border:'none',color:'#fff',boxShadow:'0 18px 38px rgba(79,70,229,.22)'}}><div aria-hidden="true" style={{position:'absolute',width:190,height:190,borderRadius:'50%',background:'rgba(255,255,255,.09)',right:-55,top:-85}}/><div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}><div style={{display:'flex',alignItems:'center',gap:16,minWidth:0}}><div style={{width:94,height:94,flex:'0 0 94px',borderRadius:26,padding:4,background:'rgba(255,255,255,.25)',boxShadow:'0 8px 22px rgba(20,20,60,.18)',boxSizing:'border-box'}}>{portalData.member.photo ? <img src={portalData.member.photo} alt={`${portalData.member.name || 'Member'} profile`} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:22,display:'block',background:'#fff'}} onError={e=>{e.currentTarget.style.display='none';}}/> : <div style={{width:'100%',height:'100%',borderRadius:22,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#fff,#dbeafe)',color:'#5145cd',fontSize:32,fontWeight:900}}>{String(portalData.member.name||'M').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()}</div>}</div><div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:800,color:'#e0e7ff',textTransform:'uppercase',letterSpacing:1.3}}>Your fitness journey</div><h1 style={{fontSize:28,margin:'6px 0 5px',lineHeight:1.15,overflowWrap:'anywhere'}}>{portalData.member.name || 'Member'}</h1><div style={{fontSize:13,color:'#e0f2fe'}}>Member ID: {portalData.member.member_code || '—'}</div><div style={{display:'inline-flex',marginTop:10,padding:'5px 10px',borderRadius:99,background:'rgba(255,255,255,.17)',border:'1px solid rgba(255,255,255,.25)',fontSize:12,fontWeight:800}}>{portalData.member.status || 'Active Member'}</div></div></div><div className="member-portal-no-print" style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={() => window.print()} style={{display:'inline-flex',alignItems:'center',gap:7,border:'1px solid rgba(255,255,255,.55)',borderRadius:12,padding:'10px 14px',background:'#fff',color:'#4f46e5',fontWeight:800,cursor:'pointer',boxShadow:'0 5px 14px rgba(20,20,60,.12)'}}><Printer size={16}/> Print this page</button><button onClick={logout} style={{display:'inline-flex',alignItems:'center',gap:7,border:'1px solid rgba(255,255,255,.45)',borderRadius:12,padding:'10px 14px',background:'rgba(255,255,255,.15)',color:'#fff',fontWeight:800,cursor:'pointer'}}><LogOut size={16}/> Logout</button></div></div></section>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:16}}>{[{label:'Membership plan',value:portalData.member.plan_name||'—'},{label:'Membership status',value:portalData.member.status||'—'},{label:'Valid until',value:portalData.member.expiry_date||'—'},{label:'Outstanding due',value:moneyText(portalData.member.due_amount)}].map(x=><div key={x.label} style={{...card,padding:16}}><div style={{fontSize:12,color:'#7b8798',fontWeight:700,marginBottom:8}}>{x.label}</div><div style={{fontSize:18,fontWeight:850,overflowWrap:'anywhere'}}>{x.value}</div></div>)}</div>
        <section style={{...card,marginBottom:16}}><h2 style={{fontSize:19,margin:'0 0 14px',background:'linear-gradient(90deg,#4f46e5,#0891b2)',WebkitBackgroundClip:'text',color:'transparent'}}>✦ Membership details</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,fontSize:14}}><div><div style={{color:'#7b8798',marginBottom:4}}>Registered phone</div><strong>{portalData.member.phone||'—'}</strong></div><div><div style={{color:'#7b8798',marginBottom:4}}>Membership start</div><strong>{portalData.member.start_date||'—'}</strong></div><div><div style={{color:'#7b8798',marginBottom:4}}>Membership amount</div><strong>{moneyText(portalData.member.membership_amount)}</strong></div><div><div style={{color:'#7b8798',marginBottom:4}}>Amount paid</div><strong>{moneyText(portalData.member.paid_amount)}</strong></div></div></section>
        <section style={{...card,marginBottom:16}}><h2 style={{fontSize:19,margin:'0 0 14px',background:'linear-gradient(90deg,#059669,#0d9488)',WebkitBackgroundClip:'text',color:'transparent'}}>✦ Body measurements</h2>{!measurementRows.length?<p style={{color:'#778398',fontSize:14,margin:0}}>No body measurements have been added yet.</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10}}>{measurementRows.map(([name,value,unit])=><div key={name} style={{padding:12,borderRadius:11,background:'#f7f9fc',border:'1px solid #edf0f5'}}><div style={{fontSize:12,color:'#7b8798',marginBottom:5}}>{name}</div><strong style={{fontSize:17}}>{value}{unit?' '+unit:''}</strong></div>)}</div>}</section>
        <section style={{...card,marginBottom:16}}><h2 style={{fontSize:19,margin:'0 0 14px',background:'linear-gradient(90deg,#ea580c,#db2777)',WebkitBackgroundClip:'text',color:'transparent'}}>✦ Medical conditions & notes</h2>{(memberMeta.medicalConditions||[]).length===0 && !memberMeta.medicalOther && !memberMeta.surgeryDetails && !memberMeta.additionalMedicalNotes ? <p style={{color:'#778398',fontSize:14,margin:0}}>No medical conditions or notes have been recorded.</p>:<div style={{display:'grid',gap:10}}>{(memberMeta.medicalConditions||[]).length>0&&<div><div style={{fontSize:12,color:'#7b8798',marginBottom:6}}>Reported conditions / injuries</div><div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{memberMeta.medicalConditions.map((condition)=><span key={condition} style={{padding:'6px 9px',borderRadius:99,background:'#fff4e5',border:'1px solid #ffe0b2',fontSize:12,fontWeight:700,color:'#8a5200'}}>{condition}</span>)}</div></div>}{memberMeta.medicalOther&&<div><div style={{fontSize:12,color:'#7b8798'}}>Other condition details</div><div style={{fontSize:14,whiteSpace:'pre-wrap'}}>{memberMeta.medicalOther}</div></div>}{memberMeta.surgeryDetails&&<div><div style={{fontSize:12,color:'#7b8798'}}>Surgery details</div><div style={{fontSize:14,whiteSpace:'pre-wrap'}}>{memberMeta.surgeryDetails}</div></div>}{memberMeta.additionalMedicalNotes&&<div><div style={{fontSize:12,color:'#7b8798'}}>Additional medical notes</div><div style={{fontSize:14,whiteSpace:'pre-wrap'}}>{memberMeta.additionalMedicalNotes}</div></div>}</div>}</section>
        <section className="member-portal-workouts" style={{...card,marginBottom:16,background:'#ffffff',border:'1px solid #d9e4f0',color:'#1b2942'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:14}}>
            <h2 style={{fontSize:19,margin:0,color:'#1769b2',letterSpacing:'.04em'}}>✦ FITNESS • WORKOUT PLAN</h2>
            <button className="member-portal-no-print" onClick={printPortalWorkoutPlan} style={{border:'1px solid #c6def8',borderRadius:10,padding:'8px 12px',background:'#e7f3ff',color:'#1769b2',fontWeight:900,cursor:'pointer'}}>Print workout plan</button>
          </div>
          {!portalData.workout_plans?.length ? <p style={{color:'#71839a',fontSize:14,margin:0}}>No workout plans have been assigned to your profile yet.</p> : <div style={{display:'grid',gap:12}}>
            {portalData.workout_plans.map((plan,index)=>{
              const groups=getWorkoutDayGroups(plan);
              return <section key={plan.id||index} className="workout-card-sheet" style={{margin:0}}>
                {index===0 && <><div className="workout-card-top"><div className="workout-brand">PREFACE<small>FITNESS • WORKOUT CARD</small></div><span style={{fontSize:10,color:'#71839a',fontWeight:800}}>WEEKLY TRAINING</span></div><div className="workout-member-meta"><span>Member: {portalData.member.name||'Member'}</span><span>ID: {portalData.member.member_code||'—'}</span></div></>}
                <div className="workout-plan-strip"><strong>{plan.name||plan.title||'Workout plan'}</strong><span>{String(plan.level||'BEGINNER').toUpperCase()} · {Number(plan.durationWeeks||1)} WKS</span></div>
                {groups.length ? groups.map((group,gIndex)=><section key={`${plan.id||index}-${gIndex}`} className="portal-workout-day" style={{margin:'6px 10px 8px',border:'1px solid #dce6f1',borderRadius:8,overflow:'hidden'}}>
                  <div className="portal-workout-day-title" style={{background:'#e7f3ff',color:'#1769b2',padding:'7px 10px',fontSize:12,fontWeight:950,letterSpacing:'.05em'}}>{group.days.map(day=>day.toUpperCase()).join('  •  ')}</div>
                  <div style={{overflowX:'auto'}}><table className="portal-workout-table" style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:520}}><thead><tr style={{background:'#f1f6fc',color:'#31516f'}}>{['#','Exercise','Muscle group','Sets','Reps','Rest'].map((h,i)=><th key={h} style={{textAlign:i===0?'center':'left',padding:'8px 7px',fontSize:11,fontWeight:850,borderBottom:'1px solid #dce6f1',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead><tbody>{group.exercises.map((ex,i)=><tr key={ex.id||i} style={{background:i%2===0?'#ffffff':'#f5f8fc',color:'#26384d'}}><td style={{padding:'8px 7px',textAlign:'center',borderBottom:'1px solid #edf1f6'}}><span className="portal-workout-number" style={{display:'inline-grid',placeItems:'center',width:19,height:19,borderRadius:'50%',background:'#159b91',color:'#fff',fontSize:10,fontWeight:900}}>{i+1}</span></td><td style={{padding:'8px 7px',borderBottom:'1px solid #edf1f6',fontWeight:800}}>{ex.name||ex.exercise||'Exercise'}</td><td style={{padding:'8px 7px',borderBottom:'1px solid #edf1f6'}}>{ex.muscleGroup||ex.muscle||'Full Body'}</td><td style={{padding:'8px 7px',borderBottom:'1px solid #edf1f6',fontWeight:800,color:'#1769b2'}}>{ex.sets??3}</td><td style={{padding:'8px 7px',borderBottom:'1px solid #edf1f6',fontWeight:800,color:'#1769b2'}}>{ex.reps??15}</td><td style={{padding:'8px 7px',borderBottom:'1px solid #edf1f6'}}>{ex.rest||'60 sec'}</td></tr>)}</tbody></table></div>
                  <div className="portal-workout-warmcool" style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',padding:'7px 10px',background:'#fbfdff',color:'#167f79',fontSize:11,fontWeight:850}}><span>Warm up &amp; Stretching <b style={{color:'#1769b2'}}>{plan.warmupMinutes??10} min</b></span><span>Cool down &amp; Stretching <b style={{color:'#1769b2'}}>{plan.cooldownMinutes??5} min</b></span></div>
                </section>) : <p style={{padding:12,color:'#71839a'}}>No exercises added.</p>}
                <div className="workout-card-footer"><span>{plan.goal||'GENERAL FITNESS'}</span><span>{Number(plan.durationWeeks||1)} WEEKS</span></div>
              </section>;
            })}
          </div>}
        </section>
        <section className="member-portal-diet-plans" style={{...card,marginBottom:16,background:'#ffffff',border:'1px solid #d9e4f0',color:'#1b2942'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:14}}>
            <h2 style={{fontSize:19,margin:0,color:'#159b91',letterSpacing:'.04em'}}>✦ PERSONALIZED DIET & MEAL PLAN</h2>
          </div>
          {!portalData.diet_plans?.length ? <p style={{color:'#71839a',fontSize:14,margin:0}}>No diet plan has been assigned to your profile yet.</p> : <div style={{display:'grid',gap:12}}>
            {portalData.diet_plans.map((plan,index)=><section key={plan.id || index} style={{border:'1px solid #dce7f2',borderRadius:13,overflow:'hidden',background:'#fff'}}>
              <div style={{padding:'13px 15px',background:'linear-gradient(90deg,#eaf4ff,#effaf7)',borderBottom:'1px solid #dce7f2',display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                <div><div style={{fontSize:15,fontWeight:900,color:'#173b5d'}}>{plan.name || 'Nutrition plan'}</div><div style={{fontSize:11,color:'#71839a',marginTop:3}}>{plan.goal || 'General Fitness'} · {Number(plan.durationWeeks || 1)} weeks</div></div>
                <div style={{display:'flex',gap:7,flexWrap:'wrap'}}><span style={{padding:'6px 9px',borderRadius:99,background:'#e4f2ff',color:'#1769b2',fontSize:11,fontWeight:900}}>{Number(plan.calories || 0)} kcal/day</span><span style={{padding:'6px 9px',borderRadius:99,background:'#e5f8f2',color:'#118477',fontSize:11,fontWeight:900}}>{Number(plan.protein || 0)}g protein</span></div>
              </div>
              <div style={{padding:12,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:9}}>
                {(plan.meals || []).map((meal,mealIndex)=><div key={meal.id || mealIndex} style={{padding:12,border:'1px solid #e5edf5',borderRadius:11,background:mealIndex%2===0?'#fbfdff':'#f7fcfa'}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',marginBottom:7}}><strong style={{color:'#147d79',fontSize:13}}>{meal.meal || `Meal ${mealIndex+1}`}</strong><span style={{fontSize:10,color:'#71839a',fontWeight:800}}>{Number(meal.calories || 0)} kcal · {Number(meal.protein || 0)}g protein</span></div>
                  <div style={{fontSize:13,lineHeight:1.6,color:'#334155',whiteSpace:'pre-wrap'}}>{meal.food || 'Food details not provided'}</div>
                </div>)}
              </div>
              {plan.notes && <div style={{padding:'0 14px 13px',fontSize:12,color:'#64748b'}}><strong>Dietitian notes:</strong> {plan.notes}</div>}
            </section>)}
          </div>}
        </section>
        <section style={{...card,marginBottom:16}}><h2 style={{fontSize:19,margin:'0 0 14px',background:'linear-gradient(90deg,#16a34a,#0d9488)',WebkitBackgroundClip:'text',color:'transparent'}}>✦ Payment history</h2>{!portalData.payments?.length?<p style={{color:'#778398',fontSize:14,margin:0}}>No payment records available yet.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:440}}><thead><tr>{['Date','Type','Mode','Amount','Receipt'].map(t=><th key={t} style={{textAlign:'left',padding:'10px 8px',borderBottom:'1px solid #e8edf4',color:'#758198'}}>{t}</th>)}</tr></thead><tbody>{portalData.payments.map((p,i)=><tr key={p.id||i}>{[p.payment_date||p.date||'—',p.payment_type||'Payment',p.payment_mode||'—',moneyText(p.amount),p.invoice_number||'—'].map((v,j)=><td key={j} style={{padding:'11px 8px',borderBottom:'1px solid #f0f3f7',whiteSpace:'nowrap'}}>{v}</td>)}</tr>)}</tbody></table></div>}</section>
        <section style={card}><h2 style={{fontSize:19,margin:'0 0 14px',background:'linear-gradient(90deg,#d97706,#db2777)',WebkitBackgroundClip:'text',color:'transparent'}}>✦ Recent attendance</h2>{!portalData.attendance?.length?<p style={{color:'#778398',fontSize:14,margin:0}}>No attendance records available yet.</p>:<div style={{display:'grid',gap:9}}>{portalData.attendance.map((a,i)=><div key={a.id||i} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'11px 12px',borderRadius:10,background:'#f7f9fc',fontSize:13}}><strong>{a.date||a.attendance_date||a.check_in_date||a.created_at?.slice(0,10)||'Attendance'}</strong><span style={{color:'#718096'}}>{a.source||a.status||'Checked in'}</span></div>)}</div>}</section>
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
const TOPBAR_SPACING_FIX_CSS = `
  /* Definitive topbar spacing fix: keep both navigation rows in normal grid flow. */
  .vibrant-app-shell .vibrant-topbar {
    display:flex !important;
    flex-direction:column !important;
    align-items:stretch !important;
    justify-content:flex-start !important;
    height:178px !important;
    min-height:178px !important;
    padding:8px 22px !important;
    box-sizing:border-box !important;
    overflow:visible !important;
  }
  .vibrant-app-shell .topbar-primary-row {
    flex:0 0 58px !important;
    height:58px !important;
    min-height:58px !important;
    margin:0 !important;
  }
  .vibrant-app-shell .top-navigation-scroll {
    position:static !important;
    display:grid !important;
    flex:0 0 96px !important;
    align-self:stretch !important;
    width:100% !important;
    height:96px !important;
    min-height:96px !important;
    margin:8px 0 0 !important;
    padding:0 !important;
    box-sizing:border-box !important;
    grid-template-columns:repeat(5,minmax(0,1fr)) !important;
    grid-template-rows:repeat(2,44px) !important;
    grid-auto-flow:row !important;
    gap:8px !important;
    overflow:visible !important;
  }
  .vibrant-app-shell .top-navigation-item,
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+6) {
    transform:none !important;
    position:relative !important;
    top:auto !important;
    margin:0 !important;
    width:100% !important;
    height:44px !important;
    min-height:44px !important;
    box-sizing:border-box !important;
  }
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+6):hover,
  .vibrant-app-shell .top-navigation-scroll .top-navigation-item:nth-child(n+6):active {
    transform:translateY(-1px) !important;
  }
  .vibrant-app-shell .main { padding-top:178px !important; }
  .vibrant-app-shell .sidebar-compact,
  .vibrant-app-shell .backdrop { top:178px !important; }

  @media (max-width:1250px) {
    .vibrant-app-shell .vibrant-topbar { height:230px !important; min-height:230px !important; }
    .vibrant-app-shell .top-navigation-scroll {
      flex-basis:148px !important; height:148px !important; min-height:148px !important;
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      grid-template-rows:repeat(3,44px) !important;
    }
    .vibrant-app-shell .main { padding-top:230px !important; }
    .vibrant-app-shell .sidebar-compact,
    .vibrant-app-shell .backdrop { top:230px !important; }
  }
  @media (max-width:900px) {
    .vibrant-app-shell .vibrant-topbar { height:282px !important; min-height:282px !important; }
    .vibrant-app-shell .top-navigation-scroll {
      flex-basis:200px !important; height:200px !important; min-height:200px !important;
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
      grid-template-rows:repeat(4,44px) !important;
    }
    .vibrant-app-shell .main { padding-top:282px !important; width:100% !important; margin-left:0 !important; }
    .vibrant-app-shell .sidebar-compact,
    .vibrant-app-shell .backdrop { top:282px !important; }
  }
  @media (max-width:600px) {
    .vibrant-app-shell .vibrant-topbar { height:334px !important; min-height:334px !important; padding-left:12px !important; padding-right:12px !important; }
    .vibrant-app-shell .top-navigation-scroll {
      flex-basis:252px !important; height:252px !important; min-height:252px !important;
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      grid-template-rows:repeat(5,44px) !important;
    }
    .vibrant-app-shell .main { padding-top:334px !important; }
    .vibrant-app-shell .sidebar-compact,
    .vibrant-app-shell .backdrop { top:334px !important; }
  }
`;

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
