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
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileDown,
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
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
  getMyAccess,
  getGymStaff,
  updateStaffPermissions,
  setStaffActive,
} from './cloudData';

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
  .vibrant-app-shell .modal { border-radius:22px !important; }
  .vibrant-app-shell .modal-header h2 { font-size:24px !important; }
  @keyframes pfFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @media (max-width:1200px) { .vibrant-tile-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.dashboard-filter-card{align-items:flex-start;flex-direction:column}.vibrant-dashboard-lower{grid-template-columns:1fr}.vibrant-app-shell .content{padding:24px 20px 40px!important} }
  .vibrant-app-shell .backdrop { display:none !important; }
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
    gymName: 'Preface Fitness', currency: '₹', gymAddress: '', gymPhone: '', gymEmail: '', gstin: '', invoicePrefix: 'PF-INV', defaultGstRate: 5, referralPointsPerReferral: 10, gymLatitude: '', gymLongitude: '',
    notice: { enabled: false, dashboardEnabled: false, text: '', priority: 'medium', id: '', createdAt: '' },
    noticeHistory: [],
    gymIntro: { description: 'A modern fitness destination focused on strength, conditioning, personal training and sustainable results.', facilities: ['Strength & cardio zone', 'Personal training', 'Functional training', 'Locker & changing facilities', 'Member progress tracking', 'Diet & nutrition guidance'] },
    publicPage: {
      whatsappNumber: '', instagramUrl: '', facebookUrl: '', websiteUrl: '',
      googleRating: '5.0', googleReviewCount: '95', googleMapsUrl: '', googleSearchUrl: 'https://www.google.com/search?q=preface+fitness', googlePlaceName: 'Preface Fitness', googlePhone: '093692 79056', googleAddress: 'Preface Fitness, Nadan Mahal Rd. above Hdfc Bank, Yahiyaganj, Lucknow, Uttar Pradesh 226003', hoursText: 'Mon-Sun · 6 AM - 11 PM',
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
  { key: 'leads', label: 'Leads', description: 'Manage enquiries and leads' },
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('checking');
  const [access, setAccess] = useState({
    userId: '',
    gymId: '',
    role: 'staff',
    permissions: {},
  });

  const isOwner = access.role === 'owner';
  const can = (permission) => isOwner || access.permissions?.[permission] === true;

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
          // Only replace a local collection when the cloud actually has
          // records. This prevents a newly-created/empty cloud database
          // from wiping the existing local browser data.
          membershipPlans: cloud.membershipPlans?.length
            ? cloud.membershipPlans
            : current.membershipPlans,
          members: cloud.members?.length
            ? cloud.members
            : current.members,
          leads: cloud.leads?.length
            ? cloud.leads
            : current.leads,
          payments: cloud.payments?.length
            ? cloud.payments
            : current.payments,
          attendance: cloud.attendance?.length
            ? cloud.attendance
            : current.attendance,
          trainers: cloud.trainers?.length
            ? cloud.trainers
            : current.trainers,
          ptSessions: cloud.ptSessions?.length
            ? cloud.ptSessions
            : current.ptSessions,
          progressRecords: cloud.progressRecords?.length
            ? cloud.progressRecords
            : current.progressRecords,
          workoutPlans: cloud.workoutPlans?.length
            ? cloud.workoutPlans
            : current.workoutPlans,
          dietPlans: cloud.dietPlans?.length
            ? cloud.dietPlans
            : current.dietPlans,
          communicationLogs: cloud.communicationLogs?.length
            ? cloud.communicationLogs
            : current.communicationLogs,
          feedbacks: cloud.feedbacks?.length
            ? cloud.feedbacks
            : current.feedbacks,
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
    const requestedId = String(member.id || '').trim();
    const id = requestedId || nextSystemMemberId(data.members);

    if (data.members.some((item) => String(item.id).toLowerCase() === id.toLowerCase())) {
      setToast(`Member ID ${id} is already in use`);
      return;
    }

    const clean = {
      ...member,
      id,
      visits: 0,
      due: Number(member.due || 0),
      amount: Number(member.amount || planPrices[member.plan] || 0),
      paid: Number(member.paid || 0),
      status: getMemberStatus(member.expiry),
      paymentMode: member.paymentMode || 'Cash',
      gstMode: member.gstMode || 'without',
      gstRate: Number(member.gstRate || data.settings?.defaultGstRate || 5),
      createdAt: new Date().toISOString(),
    };

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

      const saved = { ...clean, cloudId: row.id, id: row.member_code || clean.id };

      let initialPayment = null;
      if (Number(clean.paid || 0) > 0) {
        const paymentId = `PAY-${Date.now()}`;
        const gst = clean.gstMode === 'gst' ? calculateGstBreakdown(clean.amount, clean.gstRate) : calculateGstBreakdown(clean.amount, 0);
        const invoiceNumber = `${data.settings?.invoicePrefix || 'PF-INV'}-${paymentId}`;
        const paymentRow = await insertRecord('payments', {
          member_id: row.id,
          legacy_id: paymentId,
          amount: Number(clean.paid || 0),
          payment_type: 'Membership',
          payment_mode: clean.paymentMode || 'Cash',
          payment_date: today,
          notes: 'Initial membership payment',
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
        initialPayment = {
          id: paymentRow.legacy_id || paymentId,
          cloudId: paymentRow.id,
          memberId: saved.id,
          member: saved.name,
          amount: Number(clean.paid || 0),
          type: 'Membership',
          mode: clean.paymentMode || 'Cash',
          date: today,
          notes: 'Initial membership payment',
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
        members: [saved, ...d.members],
        payments: initialPayment ? [initialPayment, ...d.payments] : d.payments,
      }));
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

      setData((d) => ({
        ...d,
        members: d.members.map((m) => m.id === updated.id ? { ...clean, cloudId: existing.cloudId } : m),
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
          payment_date: today,
          notes: `Membership renewal - ${plan.name}`,
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
                  date: today,
                  notes: `Membership renewal - ${plan.name}`,
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
      const gstApplicable = payment.gstMode === 'gst';
      const invoiceAmount = payment.type === 'Membership' ? Number(member.amount || amount) : amount;
      const gst = calculateGstBreakdown(invoiceAmount, gstApplicable ? Number(payment.gstRate || data.settings?.defaultGstRate || 5) : 0);
      const invoiceNumber = `${data.settings?.invoicePrefix || 'PF-INV'}-${paymentId}`;

      await insertRecord('payments', {
        member_id: member.cloudId,
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

      if (payment.type === 'Membership') {
        await updateRecord('members', member.cloudId, {
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

  const markAttendance = (name, attendanceDate = today) => {
    const already = data.attendance.some(
      (a) => a.member === name && a.date === attendanceDate
    );

    if (already) {
      return setToast(`${name} is already marked present for this date`);
    }

    const member = data.members.find((m) => m.name === name);
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setData((d) => ({
      ...d,
      attendance: [
        {
          id: `A-${Date.now()}`,
          member: name,
          memberId: member?.id || '',
          date: attendanceDate,
          time,
        },
        ...d.attendance,
      ],
      members: d.members.map((m) =>
        m.name === name
          ? { ...m, visits: Number(m.visits || 0) + 1 }
          : m
      ),
    }));

    setToast(`${name} marked present`);
  };

  const createWorkoutPlan = (plan) => {
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

    setData((d) => ({ ...d, workoutPlans: [clean, ...(d.workoutPlans || [])] }));
    setModal(null);
    setToast('Workout plan created');
  };

  const updateWorkoutPlan = (plan) => {
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

    setData((d) => ({
      ...d,
      workoutPlans: (d.workoutPlans || []).map((item) => item.id === clean.id ? clean : item),
    }));
    setModal(null);
    setToast('Workout plan updated');
  };

  const deleteWorkoutPlan = (id) => {
    if (!window.confirm('Delete this workout plan?')) return;
    setData((d) => ({
      ...d,
      workoutPlans: (d.workoutPlans || []).filter((plan) => plan.id !== id),
    }));
    setToast('Workout plan deleted');
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

    if (!member?.cloudId) {
      setToast('Please select a Supabase-linked member');
      return;
    }
    if (!trainer) {
      setToast('Please select a trainer');
      return;
    }

    const clean = {
      ...session,
      id: `PT-${Date.now()}`,
      duration: Number(session.duration || 60),
      fee: Number(session.fee || 0),
      status: session.status || 'Scheduled',
      date: session.date || today,
    };

    const startTime = timeTo24Hour(clean.time) || '19:00';
    const endTime = addMinutesToTime(clean.time, clean.duration) || startTime;

    try {
      // Older locally-created trainers may not have a cloudId yet.
      // Promote that trainer to Supabase automatically before creating the PT session.
      if (!trainer.cloudId) {
        const trainerRow = await insertRecord('trainers', {
          legacy_id: trainer.id || `TR-${Date.now()}`,
          name: trainer.name || '',
          phone: trainer.phone || '',
          specialization: trainer.specialization || '',
          experience: Number(trainer.experience || 0),
          status: trainer.status || 'Active',
          monthly_salary: Number(trainer.monthlySalary || 0),
          notes: trainer.notes || '',
        });
        trainer = { ...trainer, cloudId: trainerRow.id };
        setData((d) => ({
          ...d,
          trainers: (d.trainers || []).map((item) => item.id === trainer.id ? trainer : item),
        }));
      }

      const row = await insertRecord('pt_sessions', {
        legacy_id: clean.id,
        member_id: member.cloudId,
        trainer_id: trainer.cloudId,
        session_date: clean.date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: clean.duration,
        session_type: clean.type || 'Personal Training',
        status: clean.status || 'Scheduled',
        amount: Number(clean.fee || 0),
        notes: clean.notes || '',
      });

      const saved = { ...clean, cloudId: row.id, endTime };
      setData((d) => ({
        ...d,
        ptSessions: [saved, ...(d.ptSessions || [])],
      }));
      setModal(null);
      setToast('PT session scheduled successfully');
    } catch (error) {
      console.error('Supabase PT session insert failed:', error);
      setToast(error?.message || 'Unable to schedule PT session');
    }
  };

  const updatePTSessionStatus = async (id, status) => {
    const session = (data.ptSessions || []).find((item) => item.id === id);
    if (!session?.cloudId) {
      setToast('This PT session is not linked to Supabase yet');
      return;
    }

    try {
      await updateRecord('pt_sessions', session.cloudId, { status });
      setData((d) => ({
        ...d,
        ptSessions: (d.ptSessions || []).map((item) =>
          item.id === id ? { ...item, status } : item
        ),
      }));
      setToast(`Session marked ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Supabase PT status update failed:', error);
      setToast(error?.message || 'Unable to update PT session');
    }
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

  const nav = [
    { label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    { label: 'Performance', icon: BarChart3, permission: 'performance' },
    { label: 'Members', icon: Users, permission: 'members' },
    { label: 'Leads', icon: Target, permission: 'leads' },
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
    <div className={`app-shell vibrant-app-shell ${sidebarOpen ? 'sidebar-is-open' : 'sidebar-is-collapsed'}`}>
      <style>{VIBRANT_THEME_CSS}</style>
      <style>{NOTICE_SETTINGS_CSS}</style>
      <style>{FINAL_UI_FIX_CSS}</style>
      <style>{FINAL_LAYOUT_CSS}</style>
      <style>{SIDEBAR_ONLY_NAV_CSS}</style>
      <style>{DEVELOPER_CONTACT_BAR_CSS}</style>
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
              <button className="icon-btn vibrant-icon-btn" title="Notifications"><Bell size={20} /><span className="notification-dot" /></button>
              <div className="admin-chip vibrant-admin-chip"><div className="avatar">{isOwner ? 'O' : 'S'}</div><div><strong>{isOwner ? 'Administrator' : 'Staff Member'}</strong><span>{isOwner ? 'Owner' : 'Staff'}</span></div><ChevronDown size={15} /></div>
            </div>
          </div>
          <div className="top-navigation-scroll" aria-label="Main navigation">
            {visibleNav
              .filter(({ label }) => !['Dashboard', 'Members', 'Attendance', 'Payments', 'Settings', 'Staff Access'].includes(label))
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
          {active === 'Dashboard' && <Dashboard {...{ activeMembers, expiringMembers, overdue, revenue, data, navigate, setModal, markAttendance }} />}
          {active === 'Members' && <MembersPage members={data.members} query={query} setQuery={setQuery} setModal={setModal} markAttendance={markAttendance} deleteMember={deleteMember} settings={data.settings || {}} payments={data.payments || []} />}
          {active === 'Leads' && <LeadsPage leads={data.leads} members={data.members} setModal={setModal} updateLeadStage={updateLeadStage} updateLeadDetails={updateLeadDetails} deleteLead={deleteLead} convertLeadToMember={convertLeadToMember} />}
          {active === 'Memberships' && <MembershipsPage members={data.members} setModal={setModal} planPrices={planPrices} setData={setData} setToast={setToast} onRenewMembership={renewMembership} />}
          {active === 'Attendance' && <AttendancePage attendance={data.attendance} members={data.members} markAttendance={markAttendance} />}
          {active === 'Payments' && <PaymentsPage payments={data.payments} overdue={overdue} setModal={setModal} deletePayment={deletePayment} members={data.members} settings={data.settings || {}} />}
          {active === 'Progress' && <ProgressPage progressRecords={data.progressRecords || []} members={data.members} setModal={setModal} deleteProgressRecord={deleteProgressRecord} />}
          {active === 'Trainers & PT' && <TrainersPTPage trainers={data.trainers || []} sessions={data.ptSessions || []} members={data.members} setModal={setModal} updatePTSessionStatus={updatePTSessionStatus} deletePTSession={deletePTSession} deleteTrainer={deleteTrainer} />}
          {active === 'Training' && <TrainingPage plans={data.workoutPlans || []} members={data.members} setModal={setModal} deleteWorkoutPlan={deleteWorkoutPlan} />}
          {active === 'Diet & Nutrition' && <DietPage plans={data.dietPlans || []} members={data.members} setModal={setModal} deleteDietPlan={deleteDietPlan} />}
          {active === 'Communication' && <CommunicationPage members={data.members} logs={data.communicationLogs || []} setModal={setModal} deleteCommunicationLog={deleteCommunicationLog} />}
          {active === 'Customer Feedback' && <FeedbackPage feedbacks={data.feedbacks || []} members={data.members || []} setModal={setModal} deleteFeedback={deleteFeedback} />}
          {active === 'Reports' && <ReportsPage data={data} revenue={revenue} />}
          {active === 'Staff Access' && isOwner && <StaffAccessPage />}
          {active === 'Settings' && <SettingsPage exportBackup={exportBackup} importBackup={importBackup} data={data} setData={setData} dbReady={dbReady} resetData={() => {
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

      {modal === 'member' && <MemberModal onClose={() => setModal(null)} onSave={addMember} planPrices={planPrices} members={data.members} trainers={data.trainers || []} existingMemberIds={data.members.map((m) => m.id)} />}
      {modal?.type === 'editMember' && <MemberModal member={modal.member} onClose={() => setModal(null)} onSave={updateMember} planPrices={planPrices} members={data.members} trainers={data.trainers || []} existingMemberIds={data.members.map((m) => m.id)} />}
      {modal === 'lead' && <LeadModal onClose={() => setModal(null)} onSave={addLead} />}
      {modal?.type === 'editLead' && <LeadModal lead={modal.lead} onClose={() => setModal(null)} onSave={updateLeadDetails} />}
      {modal === 'trainer' && <TrainerModal onClose={() => setModal(null)} onSave={addTrainer} />}
      {modal?.type === 'editTrainer' && <TrainerModal trainer={modal.trainer} onClose={() => setModal(null)} onSave={updateTrainer} />}
      {modal === 'ptSession' && <PTSessionModal trainers={data.trainers || []} members={data.members} onClose={() => setModal(null)} onSave={addPTSession} />}
      {modal === 'communication' && <CommunicationModal members={data.members} onClose={() => setModal(null)} onSave={addCommunicationLog} />}
      {modal === 'progress' && <ProgressModal members={data.members} onClose={() => setModal(null)} onSave={addProgressRecord} />}
      {modal === 'payment' && <PaymentModal members={data.members} settings={data.settings || {}} onClose={() => setModal(null)} onSave={addPayment} />}
      {(modal === 'workoutPlan' || modal?.type === 'editWorkoutPlan') && <WorkoutPlanModal members={data.members} plan={modal?.type === 'editWorkoutPlan' ? modal.plan : null} onClose={() => setModal(null)} onSave={modal?.type === 'editWorkoutPlan' ? updateWorkoutPlan : createWorkoutPlan} />}
      {(modal === 'dietPlan' || modal?.type === 'editDietPlan') && <DietPlanModal members={data.members} plan={modal?.type === 'editDietPlan' ? modal.plan : null} onClose={() => setModal(null)} onSave={modal?.type === 'editDietPlan' ? updateDietPlan : createDietPlan} />}
      {modal === 'feedback' && <FeedbackModal members={data.members || []} onClose={() => setModal(null)} onSave={addFeedback} />}
      {modal?.type === 'invoiceOptions' && <InvoiceOptionsModal member={modal.member} payment={modal.payment} settings={data.settings || {}} onClose={() => setModal(null)} onPrint={(mode, rate) => { const selectedPayment = { ...(modal.payment || {}), gstApplicable: mode === 'gst', gstRate: Number(rate || 0) }; printPaymentInvoice(modal.member, selectedPayment, data.settings || {}, mode); setModal(null); }} />}
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


function PublicGymIntroPage({ settings = {}, gymId = PRODUCTION_GYM_ID }) {
  const [remoteSettings, setRemoteSettings] = useState(settings || {});
  const [remotePlans, setRemotePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    (async () => {
      try {
        const profile = await getPublicGymProfile(gymId);
        if (!cancelled) {
          const nextSettings = profile?.settings || {};
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
    'member progress tracking': 'https://images.unsplash.com/photo-1599058917212-d750089860fc?auto=format&fit=crop&w=1000&q=85',
    'diet & nutrition guidance': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=85',
  };

  const uniqueFacilityFallbacks = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1599058917212-d750089860fc?auto=format&fit=crop&w=1000&q=85',
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
  const configuredPlanPrices = publicSettings.membershipPrices || {};
  const remotePlanByName = Object.fromEntries((remotePlans || []).map((p) => [String(p?.name || '').trim().toLowerCase(), p]));
  const packageSource = Array.isArray(publicPage.packages) && publicPage.packages.length
    ? publicPage.packages
    : (remotePlans.length ? remotePlans : MEMBERSHIP_PLANS);
  const packages = packageSource.map((pkg) => {
    const key = String(pkg?.name || '').trim().toLowerCase();
    const standardPlan = MEMBERSHIP_PLANS.find((plan) => String(plan.name).trim().toLowerCase() === key);
    const remotePlan = remotePlanByName[key];
    const price = standardPlan
      ? Number(configuredPlanPrices[standardPlan.name] ?? remotePlan?.price ?? pkg?.price ?? standardPlan.price)
      : Number(remotePlan?.price ?? pkg?.price ?? 0);
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
  const googleReviewCount = publicPage.googleReviewCount || '95';
  const googlePlaceName = publicPage.googlePlaceName || gymName;
  const googleAddress = publicPage.googleAddress || publicSettings.gymAddress || 'Preface Fitness, Nadan Mahal Rd. above Hdfc Bank, Yahiyaganj, Lucknow, Uttar Pradesh 226003';
  const googlePhone = publicPage.googlePhone || '093692 79056';
  const hoursText = publicPage.hoursText || 'Mon-Sun · 6 AM - 11 PM';
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
        .gym-public-dark-v2 .public-contact-actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}.gym-public-dark-v2 .public-contact-actions a{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);border-radius:999px;padding:10px 14px;font-size:13px;font-weight:800}.gym-public-dark-v2 .public-contact-actions a.primary{background:#7047ff;border-color:#7047ff}
        .gym-public-dark-v2 .gym-hero{min-height:640px;padding:80px clamp(20px,7vw,110px);display:grid;grid-template-columns:1fr .92fr;gap:60px;align-items:center;background:radial-gradient(circle at 15% 20%,rgba(112,71,255,.22),transparent 38%),radial-gradient(circle at 90% 30%,rgba(16,185,129,.13),transparent 35%)}
        .gym-public-dark-v2 .gym-kicker,.gym-public-dark-v2 .gym-section-kicker{font-size:12px;font-weight:900;letter-spacing:2.2px;background:linear-gradient(90deg,#c78cff 0%,#7ea7ff 52%,#32e6d0 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 0 24px rgba(112,71,255,.12)}.gym-public-dark-v2 .gym-hero-rule{width:170px;height:4px;border-radius:999px;margin:14px 0 21px;background:linear-gradient(90deg,#8d4dff 0%,#b95cff 42%,#22d9c0 100%);box-shadow:0 0 24px rgba(139,77,255,.48),0 0 34px rgba(34,217,192,.18)}.gym-public-dark-v2 .gym-hero h1{font-size:clamp(48px,7vw,86px);line-height:1.10;margin:0 0 26px;letter-spacing:-4.5px;font-weight:950;overflow:visible;padding-bottom:.18em}.gym-public-dark-v2 .gym-hero h1 .hero-line{display:inline-block;line-height:1.10;padding-bottom:.18em;overflow:visible}.gym-public-dark-v2 .gym-hero h1 .hero-line{display:inline-block}.gym-public-dark-v2 .gym-hero h1 .hero-line-1{color:#f5f2ff;text-shadow:0 0 28px rgba(190,170,255,.16)}.gym-public-dark-v2 .gym-hero h1 .hero-line-2{background:linear-gradient(100deg,#ff6de7 0%,#bd68ff 48%,#8f7bff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}.gym-public-dark-v2 .gym-hero h1 .hero-line-3{background:linear-gradient(100deg,#69ddff 0%,#53cfff 38%,#52e5b0 100%);-webkit-background-clip:text;background-clip:text;color:transparent}.gym-public-dark-v2 .gym-hero p{max-width:650px;color:#d3d8e7;font-size:18px;line-height:1.72;text-shadow:0 2px 18px rgba(0,0,0,.22)}.gym-public-dark-v2 .gym-trust-row{display:flex;flex-wrap:wrap;gap:18px;margin-top:30px;color:#e9edf7;font-size:13px}.gym-public-dark-v2 .gym-trust-row span{display:flex;align-items:center;gap:8px;font-weight:700}.gym-public-dark-v2 .gym-trust-row b{color:#ffffff}.gym-public-dark-v2 .trust-icon{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-style:normal;background:#0d1420;border:1px solid rgba(255,255,255,.14);box-shadow:0 0 24px rgba(112,71,255,.10)}.gym-public-dark-v2 .trust-icon-1{color:#d26cff;border-color:rgba(210,108,255,.65);box-shadow:0 0 22px rgba(210,108,255,.18)}.gym-public-dark-v2 .trust-icon-2{color:#55aaff;border-color:rgba(85,170,255,.65);box-shadow:0 0 22px rgba(85,170,255,.16)}.gym-public-dark-v2 .trust-icon-3{color:#37e0bd;border-color:rgba(55,224,189,.65);box-shadow:0 0 22px rgba(55,224,189,.16)}.gym-public-dark-v2 .gym-hero-visual{position:relative}.gym-public-dark-v2 .gym-hero-visual img{width:100%;height:500px;object-fit:cover;border-radius:28px;border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 90px rgba(0,0,0,.42)}.gym-public-dark-v2 .gym-hero-float{position:absolute;left:-24px;bottom:26px;background:rgba(13,17,27,.9);border:1px solid rgba(255,255,255,.1);padding:16px 19px;border-radius:15px;box-shadow:0 15px 40px rgba(0,0,0,.35)}.gym-public-dark-v2 .gym-hero-float strong,.gym-public-dark-v2 .gym-hero-float span{display:block}.gym-public-dark-v2 .gym-hero-float span{color:#929db0;font-size:12px;margin-top:5px}
        .gym-public-dark-v2 .gym-public-section{padding:78px clamp(20px,7vw,110px)}.gym-public-dark-v2 .gym-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07)}.gym-public-dark-v2 h2{font-size:clamp(30px,4vw,48px);line-height:1.05;margin:12px 0 0;letter-spacing:-1.5px}.gym-public-dark-v2 .gym-about-grid p{color:#9da8bb;font-size:16px;line-height:1.8;margin:0 0 15px}
        .gym-public-dark-v2 .gym-section-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:28px}.gym-public-dark-v2 .gym-section-heading>span{color:#717d91;font-size:12px}.gym-public-dark-v2 .gym-facility-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.gym-public-dark-v2 .gym-facility-card{background:linear-gradient(145deg,#111827,#0d121d);border:1px solid rgba(255,255,255,.09);border-radius:20px;overflow:hidden;min-height:300px;box-shadow:0 18px 50px rgba(0,0,0,.20);transition:transform .28s ease,border-color .28s ease,box-shadow .28s ease}.gym-public-dark-v2 .gym-facility-card:hover{transform:translateY(-6px);border-color:rgba(169,145,255,.38);box-shadow:0 24px 65px rgba(0,0,0,.32),0 0 35px rgba(112,71,255,.10)}.gym-public-dark-v2 .gym-facility-image-wrap{position:relative;height:158px;overflow:hidden;background:#0b0f17}.gym-public-dark-v2 .gym-facility-image-wrap img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.92) contrast(1.06);transition:transform .55s ease,filter .35s ease}.gym-public-dark-v2 .gym-facility-card:hover .gym-facility-image-wrap img{transform:scale(1.06);filter:saturate(1.05) contrast(1.08)}.gym-public-dark-v2 .gym-facility-image-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,8,15,.04) 25%,rgba(5,8,15,.78) 100%);pointer-events:none}.gym-public-dark-v2 .gym-facility-number{position:absolute;left:18px;bottom:14px;color:#d7caff;font-weight:950;font-size:12px;letter-spacing:1px;background:rgba(10,13,23,.70);border:1px solid rgba(169,145,255,.30);padding:6px 9px;border-radius:999px;backdrop-filter:blur(8px)}.gym-public-dark-v2 .gym-facility-card-body{padding:21px 22px 24px}.gym-public-dark-v2 .gym-facility-card h3{margin:0 0 8px;font-size:19px;color:#f5f7ff;font-weight:900;letter-spacing:-.2px}.gym-public-dark-v2 .gym-facility-card p{color:#aeb8c8;font-size:13px;line-height:1.6;margin:0}
        .gym-public-dark-v2 .gym-trainer-list{display:flex;flex-direction:column;gap:26px}.gym-public-dark-v2 .public-trainer-card{width:min(900px,92%);display:grid;grid-template-columns:260px 1fr;gap:30px;align-items:center;background:linear-gradient(135deg,#111722,#0c1018);border:1px solid rgba(255,255,255,.09);border-radius:24px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.18)}.gym-public-dark-v2 .public-trainer-card:nth-child(odd){align-self:flex-start;transform:translateX(0)}.gym-public-dark-v2 .public-trainer-card:nth-child(even){align-self:flex-end;transform:translateX(-2%)}.gym-public-dark-v2 .public-trainer-card img,.gym-public-dark-v2 .public-trainer-photo-placeholder{width:260px;height:280px;object-fit:cover;border-radius:18px;background:linear-gradient(135deg,#27203f,#111827);display:grid;place-items:center;color:#a991ff;font-size:48px;font-weight:900}.gym-public-dark-v2 .public-trainer-copy .eyebrow{color:#8e98ab;font-size:11px;letter-spacing:2px;font-weight:900}.gym-public-dark-v2 .public-trainer-copy h3{font-size:31px;margin:8px 0}.gym-public-dark-v2 .public-trainer-copy p{color:#9ea8ba;line-height:1.7}.gym-public-dark-v2 .public-trainer-meta{display:flex;flex-wrap:wrap;gap:8px}.gym-public-dark-v2 .public-trainer-meta span{border:1px solid rgba(112,71,255,.3);background:rgba(112,71,255,.09);padding:8px 11px;border-radius:999px;color:#c8bcff;font-size:12px;font-weight:800}
        .gym-public-dark-v2 .public-package-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.gym-public-dark-v2 .public-package-card{background:linear-gradient(145deg,#141a27,#0d111a);border:1px solid rgba(255,255,255,.09);border-radius:20px;padding:25px}.gym-public-dark-v2 .public-package-card.featured{border-color:rgba(119,82,255,.65);box-shadow:0 0 0 1px rgba(119,82,255,.14),0 22px 55px rgba(54,33,128,.25)}.gym-public-dark-v2 .public-package-card .package-tag{font-size:10px;letter-spacing:1.5px;color:#9d8bff;font-weight:900}.gym-public-dark-v2 .public-package-card h3{font-size:23px;margin:9px 0}.gym-public-dark-v2 .public-package-price{font-size:34px;font-weight:900}.gym-public-dark-v2 .public-package-price small{font-size:12px;color:#7e899b;font-weight:600}.gym-public-dark-v2 .public-package-card p{color:#8490a2;line-height:1.6;font-size:13px;min-height:43px}
        .gym-public-dark-v2 .gym-gallery{display:grid;grid-template-columns:1.25fr .75fr;grid-template-rows:245px 245px;gap:12px}.gym-public-dark-v2 .gym-gallery-item{overflow:hidden;border-radius:18px}.gym-public-dark-v2 .gym-gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s}.gym-public-dark-v2 .gym-gallery-item:hover img{transform:scale(1.04)}.gym-public-dark-v2 .gallery-1{grid-row:1/3}.gym-public-dark-v2 .gym-gallery-item img{filter:saturate(.88) contrast(1.05)}
        .gym-public-dark-v2 .public-google-card{display:grid;grid-template-columns:1.15fr .85fr;gap:20px;background:#10151f;border:1px solid rgba(255,255,255,.09);border-radius:24px;padding:28px}.gym-public-dark-v2 .google-rating{font-size:38px;font-weight:900}.gym-public-dark-v2 .stars{color:#ffc533;letter-spacing:2px;font-size:19px}.gym-public-dark-v2 .google-muted{color:#7f8a9d;font-size:13px}.gym-public-dark-v2 .google-map-box{min-height:180px;border-radius:17px;background:linear-gradient(135deg,#162133,#0c121c);display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}.gym-public-dark-v2 .google-map-box a{color:#b9aaff;text-decoration:none;font-weight:800}
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
        <div className="public-contact-actions">
          {phone && <a className="primary" href={`tel:${phone}`}>Call</a>}
          {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          {email && <a href={`mailto:${email}`}>Email</a>}
          {instagram && <a href={instagram} target="_blank" rel="noreferrer">Instagram</a>}
        </div>
      </header>
      {loading && !publicSettings.publicPage ? <div className="public-loading">Loading gym profile…</div> : <>
      <section className="gym-hero"><div className="gym-hero-copy"><div className="gym-kicker">YOUR FITNESS. YOUR PROGRESS. YOUR SPACE.</div><div className="gym-hero-rule" aria-hidden="true" /><h1><span className="hero-line hero-line-1">Train</span><br /><span className="hero-line hero-line-2">stronger.</span><br /><span className="hero-line hero-line-3">Live better.</span></h1><p>{description}</p><div className="gym-trust-row"><span><i className="trust-icon trust-icon-1"><Dumbbell size={17} /></i><b>Professional</b> training</span><span><i className="trust-icon trust-icon-2"><TrendingUp size={17} /></i><b>Progress</b> focused</span><span><i className="trust-icon trust-icon-3"><Users size={17} /></i><b>Member</b> first</span></div></div><div className="gym-hero-visual"><img src={gallery[0]} alt="Fitness training area" /><div className="gym-hero-float"><strong>Built for consistency</strong><span>Strength • Conditioning • Results</span></div></div></section>
      <section className="gym-public-section gym-about-grid"><div><div className="gym-section-kicker">ABOUT THE GYM</div><h2>A focused environment for people who want to make progress.</h2></div><div><p>{description}</p><p>Whether your goal is fat loss, strength, muscle development or simply becoming more active, the space is designed to keep your training structured, measurable and sustainable.</p></div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">FACILITIES</div><h2>Everything you need to train with purpose.</h2></div></div><div className="gym-facility-grid">{facilities.map((item,index)=><article className="gym-facility-card" key={`${item.name}-${index}`}><div className="gym-facility-image-wrap"><img src={item.image} alt={item.name} loading="lazy" /><div className="gym-facility-image-overlay" /><div className="gym-facility-number">{String(index + 1).padStart(2, '0')}</div></div><div className="gym-facility-card-body"><h3>{item.name}</h3><p>{item.description}</p></div></article>)}</div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">OUR TRAINERS</div><h2>Meet the people behind the progress.</h2></div></div>{trainers.length ? <div className="gym-trainer-list">{trainers.map((trainer,index)=><article className="public-trainer-card" key={`${trainer.name}-${index}`}>{trainer.photo ? <img src={trainer.photo} alt={trainer.name || 'Trainer'} /> : <div className="public-trainer-photo-placeholder">{initials(trainer.name || 'Trainer')}</div>}<div className="public-trainer-copy"><div className="eyebrow">{trainer.role || 'FITNESS TRAINER'}</div><h3>{trainer.name || 'Trainer'}</h3><div className="public-trainer-meta">{trainer.experience && <span>{trainer.experience} years experience</span>}{trainer.forte && <span>Forte: {trainer.forte}</span>}{trainer.specialization && <span>{trainer.specialization}</span>}{trainer.certification && <span>{trainer.certification}</span>}</div><p>{trainer.description || 'Focused on structured training, safe technique and measurable member progress.'}</p></div></article>)}</div> : <div className="public-review"><strong>Trainer profiles coming soon</strong><p>Trainer details will appear here as the administrator adds them.</p></div>}</section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">MEMBERSHIP PACKAGES</div><h2>Choose the plan that fits your routine.</h2></div></div><div className="public-package-grid">{packages.map((pkg,index)=><article className={`public-package-card ${index===packages.length-1?'featured':''}`} key={`${pkg.name}-${index}`}><div className="package-tag">MEMBERSHIP</div><h3>{pkg.name}</h3><div className="public-package-price">₹{Number(pkg.price||0).toLocaleString('en-IN')} <small>/ {Number(pkg.months||1)} month{Number(pkg.months||1)>1?'s':''}</small></div><p>{pkg.description || 'Flexible membership for your fitness goals.'}</p></article>)}</div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">THE SPACE</div><h2>Train in a space built around movement.</h2></div><span>Swipe / scroll through the gallery</span></div><div className="gym-gallery">{gallery.map((src,index)=><div className={`gym-gallery-item gallery-${index+1}`} key={src}><img src={src} alt={`Gym training ${index+1}`} /></div>)}</div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">GOOGLE BUSINESS</div><h2>Find us. See what members say.</h2></div></div><div className="public-google-card"><div><div className="google-rating">{googleRating} <span className="stars">★★★★★</span></div><div className="google-muted">{googleReviewCount} Google reviews</div><h3 style={{fontSize:'22px',margin:'25px 0 6px'}}>{googlePlaceName}</h3><div className="google-muted">{googleAddress}</div><div style={{marginTop:'10px',color:'#ffbf36',fontWeight:800}}>Hours · {hoursText}</div><div className="google-muted" style={{marginTop:'10px'}}>Google phone · {googlePhone}</div><div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'18px'}}>{(mapsUrl || googleSearchUrl) && <a href={mapsUrl || googleSearchUrl} target="_blank" rel="noreferrer" style={{color:'#a991ff',textDecoration:'none',fontWeight:800}}>Open Google →</a>}<a href={googleSearchUrl} target="_blank" rel="noreferrer" style={{color:'#d9d2ff',textDecoration:'none',fontWeight:800}}>View Google listing</a></div></div><div className="google-map-box"><div><div style={{fontSize:'42px'}}>📍</div><strong>{googlePlaceName}</strong><div className="google-muted">{googleAddress || 'Google business location'}</div><div className="stars" style={{marginTop:'12px'}}>★★★★★</div><div className="google-muted">{googleRating}/5 · {googleReviewCount} reviews</div></div></div></div></section>
      <section className="gym-public-section"><div className="gym-section-heading"><div><div className="gym-section-kicker">MEMBER REVIEWS</div><h2>What our customers say.</h2></div></div>{reviews.length ? <div className="review-grid">{reviews.map((review,index)=><article className="public-review" key={`${review.name}-${index}`}><div className="public-review-head">{review.photo ? <img className="public-review-avatar" src={review.photo} alt="" /> : <div className="public-review-avatar">{initials(review.name || 'C')}</div>}<div><strong>{review.name || 'Customer'}</strong><small>{review.date || 'Verified customer'}</small></div></div><div className="stars" style={{marginTop:'13px'}}>★★★★★</div><p>{review.text}</p></article>)}</div> : <div className="public-review"><strong>No reviews added yet.</strong><p>Customer reviews added from Administrator → Settings will appear here.</p></div>}</section>
      <section className="gym-cta"><div className="public-contact-panel"><div><div className="gym-section-kicker">READY TO START?</div><h2>Show up. Put in the work. Track the progress.</h2><p>Contact the gym using your preferred channel.</p></div><div className="public-socials">
        {phone&&<a className="social-icon-btn" href={`tel:${phone}`} aria-label="Call gym" title="Call gym"><Phone size={23} /></a>}
        {getWhatsAppNumberFromGymPhone(phone)&&<a className="social-icon-btn" href={`https://wa.me/${getWhatsAppNumberFromGymPhone(phone)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp gym" title="WhatsApp gym"><MessageCircle size={23} /></a>}
        {instagram&&<a className="social-icon-btn" href={normalizeExternalUrl(instagram)} target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg></a>}
        {facebook&&<a className="social-icon-btn" href={normalizeExternalUrl(facebook)} target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.4 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.7v8h3.4Z"/></svg></a>}
        {website&&<a className="social-icon-btn" href={normalizeExternalUrl(website)} target="_blank" rel="noreferrer" aria-label="Website" title="Website"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z" stroke="currentColor" strokeWidth="2"/></svg></a>}
      </div></div></section>
      <footer className="gym-public-footer"><div><strong>{gymName}</strong><span>{publicSettings.gymAddress || 'Fitness • Strength • Wellness'}</span></div><div>{phone}{email ? ` • ${email}` : ''}</div></footer>
      <div className="public-developer-footer"><DeveloperContactBar /></div>
      </>}
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
                    <th>Date / Time</th>
                    <th>Member</th>
                    <th>Trainer</th>
                    <th>Type</th>
                    <th>Duration</th>
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
                          <div style={{ color: '#8a959f', fontSize: '12px' }}>{session.time}</div>
                        </td>
                        <td>
                          <div className="member-cell">
                            <div className="avatar soft">{initials(member?.name || 'Member')}</div>
                            <div>
                              <strong>{member?.name || 'Unknown member'}</strong>
                              <span>{member?.id || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td>{trainer?.name || '—'}</td>
                        <td>{session.type}</td>
                        <td>{session.duration} min</td>
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
                          <div className="avatar soft">{initials(trainer.name)}</div>
                          <div>
                            <strong>{trainer.name}</strong>
                            <span>{trainer.phone || 'No phone'}</span>
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
    notes: trainer.notes || '',
  } : {
    name: '',
    phone: '',
    specialization: '',
    experience: 1,
    monthlySalary: 0,
    status: 'Active',
    notes: '',
  });

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.name.trim() || !form.specialization.trim()) return;
    onSave({
      ...form,
      name: form.name.trim(),
      specialization: form.specialization.trim(),
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
  const [form, setForm] = useState({
    trainerId: trainers[0]?.id || '',
    memberId: members[0]?.id || '',
    date: today,
    time: '07:00 PM',
    duration: 60,
    type: 'Personal Training',
    status: 'Scheduled',
    fee: 1000,
    notes: '',
  });

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.trainerId || !form.memberId || !form.date) return;
    onSave(form);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>Schedule PT session</h3>
            <span>Assign a trainer and member to a personal training session.</span>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid professional-form-grid">
            <label className="professional-field">
              Trainer
              <select value={form.trainerId} onChange={(e) => update('trainerId', e.target.value)}>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                ))}
              </select>
            </label>

            <label className="professional-field">
              Member
              <select value={form.memberId} onChange={(e) => update('memberId', e.target.value)}>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>

            <label className="professional-field">
              Date
              <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
            </label>

            <label className="professional-field">
              Time
              <input value={form.time} onChange={(e) => update('time', e.target.value)} placeholder="07:00 PM" />
            </label>

            <label className="professional-field">
              Duration (minutes)
              <input type="number" min="15" step="15" value={form.duration} onChange={(e) => update('duration', e.target.value)} />
            </label>

            <label className="professional-field">
              Session fee
              <input type="number" min="0" value={form.fee} onChange={(e) => update('fee', e.target.value)} />
            </label>

            <label className="professional-field">
              Session type
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                <option>Personal Training</option>
                <option>Assessment</option>
                <option>Trial PT</option>
                <option>Consultation</option>
              </select>
            </label>

            <label className="professional-field">
              Status
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option>Scheduled</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Notes
              <textarea rows="3" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={!form.trainerId || !form.memberId || !form.date}
          >
            Schedule session
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ activeMembers, expiringMembers, overdue, revenue, data, navigate, setModal, markAttendance }) {
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

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

  return (
    <div className="vibrant-dashboard">
      <div className="vibrant-dashboard-hero">
        <div>
          <div className="eyebrow">PREFACE FITNESS · COMMAND CENTER</div>
          <h1>Good day, Administrator <span>👋</span></h1>
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


    </div>
  );
}

function MembersPage({ members, query, setQuery, setModal, markAttendance, deleteMember, settings, payments = [] }) {
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

    const referralCount = members.filter((item) => item.referredBy === member.id).length;
    const referralPointsPerClient = Number(settings?.referralPointsPerReferral || 0);
    const referralPoints = referralCount * referralPointsPerClient;

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

          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Fitness profile" subtitle="Baseline information for training" icon={Activity} />
            <div className="detail-list">
              <div><span>Height</span><strong>{member.height ? `${member.height} cm` : 'Not provided'}</strong></div>
              <div><span>Weight</span><strong>{member.weight ? `${member.weight} kg` : 'Not provided'}</strong></div>
              <div><span>Body fat</span><strong>{member.bodyFat ? `${member.bodyFat}%` : 'Not provided'}</strong></div>
              <div><span>Trainer</span><strong>{member.trainer || 'Not assigned'}</strong></div>
              <div><span>Referral source</span><strong>{member.referral || 'Not provided'}</strong></div>
            </div>
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
              <button className="quick-action" onClick={() => { const payment = getInvoicePaymentForMember(member, payments); setModal({ type:'invoiceOptions', member, payment }); }}><span><CreditCard size={18} /></span><strong>Bill / PDF</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => { const payment = getInvoicePaymentForMember(member, payments); shareBillWhatsApp(member, settings, payment); }}><span><MessageCircle size={18} /></span><strong>Share bill on WhatsApp</strong><ArrowUpRight size={15} /></button>
            </div>
          </div>

          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Quick actions" subtitle="Common front-desk actions" icon={Sparkles} />
            <div className="profile-actions">
              <button className="quick-action" onClick={() => setModal({ type:'editMember', member })}><span><Settings size={18} /></span><strong>Edit member</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => markAttendance(member.name)}><span><CheckCircle2 size={18} /></span><strong>Mark attendance</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => window.open(`https://wa.me/91${member.phone}`, '_blank')}><span><MessageCircle size={18} /></span><strong>WhatsApp member</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => window.location.href = `mailto:${member.email || ''}`}><span><MessageCircle size={18} /></span><strong>Send email</strong><ArrowUpRight size={15} /></button>
            </div>
          </div>

          <div className="profile-card" style={cardStyle}>
            <PanelHeader title="Notes" subtitle="Internal notes for staff" icon={ClipboardList} />
            <p className="member-notes">{member.notes || 'No notes added for this member.'}</p>
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

function AttendancePage({ attendance, members, markAttendance }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');

  const dayAttendance = attendance.filter(
    (record) => record.date === selectedDate
  );

  const presentNames = new Set(
    dayAttendance.map((record) => record.member)
  );

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
                const present = presentNames.has(member.name);

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
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            markAttendance(
                              member.name,
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

function TrainingPage({ plans, members, setModal, deleteWorkoutPlan }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(plans[0]?.id || null);

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
                      <span>{exercise.sets || 0} sets</span><span>{exercise.reps || '—'} reps</span><span>{exercise.weight || 'Bodyweight'}</span><span>{exercise.rest || '—'} rest</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-section-title">Assigned members</div>
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

      <section className="panel">
        <PanelHeader title="Training overview" subtitle="Members currently assigned to workout plans" icon={UserCheck} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Member</th><th>Membership</th><th>Workout plan</th><th>Level</th><th>Duration</th><th>Trainer</th></tr></thead>
            <tbody>
              {members.filter((member) => plans.some((plan) => (plan.assignedMemberIds || []).includes(member.id))).map((member) => {
                const plan = plans.find((item) => (item.assignedMemberIds || []).includes(member.id));
                return <tr key={member.id}>
                  <td><div className="member-cell"><div className="avatar soft" style={{ overflow: 'hidden' }}>
            {member.photo ? (
              <img src={member.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials(member.name)
            )}
          </div><div><strong>{member.name}</strong><span>{member.id}</span></div></div></td>
                  <td>{member.plan || '—'}</td><td>{plan?.name || '—'}</td><td>{plan?.level || '—'}</td><td>{plan?.durationWeeks || 1} weeks</td><td>{plan?.trainer || '—'}</td>
                </tr>;
              })}
            </tbody>
          </table>
          {!members.some((member) => plans.some((plan) => (plan.assignedMemberIds || []).includes(member.id))) && <EmptyState title="No assignments yet" text="Assign members while creating or editing a workout plan." />}
        </div>
      </section>
    </div>
  );
}

function WorkoutPlanModal({ members, onClose, onSave, plan }) {
  const [form, setForm] = useState(() => plan ? {
    ...plan,
    goal: plan.goal || 'General Fitness',
    level: plan.level || 'Beginner',
    durationWeeks: plan.durationWeeks || 4,
    trainer: plan.trainer || 'Administrator',
    notes: plan.notes || '',
    assignedMemberIds: plan.assignedMemberIds || [],
    exercises: plan.exercises?.length ? plan.exercises : [{ id: `EX-${Date.now()}`, name: '', muscle: 'Full Body', sets: 3, reps: '10', weight: '', rest: '60 sec' }],
  } : {
    name: '', goal: 'General Fitness', level: 'Beginner', durationWeeks: 4, trainer: 'Administrator', notes: '', assignedMemberIds: [],
    exercises: [{ id: `EX-${Date.now()}`, name: '', muscle: 'Full Body', sets: 3, reps: '10', weight: '', rest: '60 sec' }],
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateExercise = (index, key, value) => setForm((current) => ({ ...current, exercises: current.exercises.map((exercise, i) => i === index ? { ...exercise, [key]: value } : exercise) }));
  const addExercise = () => setForm((current) => ({ ...current, exercises: [...current.exercises, { id: `EX-${Date.now()}-${current.exercises.length}`, name: '', muscle: 'Full Body', sets: 3, reps: '10', weight: '', rest: '60 sec' }] }));
  const removeExercise = (index) => setForm((current) => ({ ...current, exercises: current.exercises.filter((_, i) => i !== index) }));
  const toggleMember = (id) => setForm((current) => ({ ...current, assignedMemberIds: current.assignedMemberIds.includes(id) ? current.assignedMemberIds.filter((item) => item !== id) : [...current.assignedMemberIds, id] }));
  const valid = form.name.trim() && form.exercises.some((exercise) => exercise.name.trim());
  const submit = () => onSave({ ...form, name: form.name.trim(), durationWeeks: Number(form.durationWeeks || 1), exercises: form.exercises.filter((exercise) => exercise.name.trim()).map((exercise) => ({ ...exercise, sets: Number(exercise.sets || 1) })) });

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
      <button className="btn btn-secondary btn-sm" onClick={addExercise}><Plus size={14} /> Add exercise</button>
    </div>
    <div style={{ display: 'grid', gap: 10 }}>
      {form.exercises.map((exercise, index) => <div key={exercise.id || index} style={{ border: '1px solid #e7ebef', borderRadius: 12, padding: 12 }}>
        <div className="form-grid three">
          <FormField label={`Exercise ${index + 1}`}><input value={exercise.name} onChange={(e) => updateExercise(index, 'name', e.target.value)} placeholder="Exercise name" /></FormField>
          <FormField label="Muscle group"><select value={exercise.muscle} onChange={(e) => updateExercise(index, 'muscle', e.target.value)}><option>Full Body</option><option>Chest</option><option>Back</option><option>Shoulders</option><option>Arms</option><option>Legs</option><option>Core</option><option>Cardio</option></select></FormField>
          <FormField label="Sets"><input type="number" min="1" value={exercise.sets} onChange={(e) => updateExercise(index, 'sets', e.target.value)} /></FormField>
        </div>
        <div className="form-grid three">
          <FormField label="Reps"><input value={exercise.reps} onChange={(e) => updateExercise(index, 'reps', e.target.value)} placeholder="8-12" /></FormField>
          <FormField label="Weight"><input value={exercise.weight} onChange={(e) => updateExercise(index, 'weight', e.target.value)} placeholder="20 kg / Bodyweight" /></FormField>
          <FormField label="Rest"><input value={exercise.rest} onChange={(e) => updateExercise(index, 'rest', e.target.value)} placeholder="60 sec" /></FormField>
        </div>
        {form.exercises.length > 1 && <button className="link-btn" style={{ color: '#d45d5d' }} onClick={() => removeExercise(index)}><Trash2 size={14} /> Remove exercise</button>}
      </div>)}
    </div>

    <div className="form-section-title">Assign members</div>
    <div style={{ maxHeight: 190, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
      {members.map((member) => <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', border: '1px solid #e7ebef', borderRadius: 10, cursor: 'pointer', background: form.assignedMemberIds.includes(member.id) ? '#f2fbf9' : '#fff' }}>
        <input type="checkbox" checked={form.assignedMemberIds.includes(member.id)} onChange={() => toggleMember(member.id)} />
        <div><strong style={{ display: 'block', fontSize: 13 }}>{member.name}</strong><span style={{ fontSize: 11, color: '#71808d' }}>{member.id} · {member.plan || 'No plan'}</span></div>
      </label>)}
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

function MembershipsPage({ members, setModal, planPrices, setData, setToast, onRenewMembership }) {
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
      const currentPublicPage = data.settings?.publicPage || {};
      const currentPackages = Array.isArray(currentPublicPage.packages)
        ? currentPublicPage.packages
        : [];

      const syncedPackages = (currentPackages.length ? currentPackages : MEMBERSHIP_PLANS.map((plan) => ({ name: plan.name, months: plan.months, price: cleaned[plan.name], description: plan.description }))).map((pkg) => {
        const standardPlan = MEMBERSHIP_PLANS.find(
          (plan) => String(plan.name).trim().toLowerCase() === String(pkg?.name || '').trim().toLowerCase()
        );

        return standardPlan
          ? {
              ...pkg,
              months: standardPlan.months,
              price: cleaned[standardPlan.name],
            }
          : pkg;
      });

      const nextPublicPage = {
        ...currentPublicPage,
        packages: syncedPackages,
        updatedAt: new Date().toISOString(),
      };

      const nextSettings = {
        ...(data.settings || {}),
        membershipPrices: cleaned,
        publicPage: nextPublicPage,
      };

      setData((current) => ({
        ...current,
        settings: nextSettings,
      }));

      await saveCloudSettings({
        membershipPrices: cleaned,
        publicPage: nextPublicPage,
      });

      setEditingPrices(false);
      setToast('Membership plan prices updated and synced to the public page');
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
  const [form, setForm] = useState({
    plan: defaultPlan,
    amount: Number(member.amount || planPrices[defaultPlan] || 0),
    paid: 0,
  });

  const selectedPlan = MEMBERSHIP_PLANS.find((plan) => plan.name === form.plan);
  const currentDays = getDaysRemaining(member.expiry);
  const renewalStart = currentDays >= 0 && member.expiry ? member.expiry : today;
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

    <div className="renewal-preview">
      <div><span>Renewal starts</span><strong>{formatDate(renewalStart)}</strong></div>
      <div><span>New expiry</span><strong>{formatDate(previewExpiry)}</strong></div>
      <div><span>New amount due</span><strong>₹{newDue.toLocaleString('en-IN')}</strong></div>
    </div>

    <ModalActions onClose={onClose} disabled={!form.plan} onSave={() => onRenew({ ...form, amount: Number(form.amount || 0), paid: Number(form.paid || 0) })} saveLabel="Renew membership" />
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

function makeInvoiceNumber(payment, settings) {
  const prefix = String(settings?.invoicePrefix || 'PF-INV').trim() || 'PF-INV';
  if (payment?.invoiceNumber) return payment.invoiceNumber;
  const raw = String(payment?.id || `PAY-${Date.now()}`).replace(/[^a-zA-Z0-9-]/g, '');
  return `${prefix}-${raw}`;
}

function getInvoicePaymentForMember(member, payments = []) {
  const matching = payments
    .filter((payment) => payment.memberId === member.id || payment.member === member.name)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.id || '').localeCompare(String(a.id || '')));
  return matching[0] || null;
}

function openPrintWindow(title, html) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><meta charset="utf-8"><style>body{margin:0;background:#eef1f4;font-family:Arial,Helvetica,sans-serif;color:#152238}*{box-sizing:border-box}.invoice-page{width:900px;max-width:calc(100vw - 30px);margin:24px auto;background:#fff;box-shadow:0 10px 35px rgba(15,35,60,.10);padding:34px 38px}.invoice-top-rule{height:5px;background:#10233f;margin:-34px -38px 28px}.invoice-header{display:flex;justify-content:space-between;gap:28px;padding-bottom:22px;border-bottom:2px solid #10233f}.brand-row{display:flex;align-items:center;gap:14px}.brand-row img{width:58px;height:58px;object-fit:contain;border:1px solid #e0e5ea;border-radius:9px;padding:4px}.seller-name{font-size:25px;font-weight:800;color:#10233f}.seller-tag{font-size:10px;letter-spacing:.16em;color:#718096;margin-top:3px}.seller-address,.seller-contact,.seller-gstin{font-size:11px;color:#5e6c7b;line-height:1.6}.seller-address{margin-top:12px}.seller-gstin{margin-top:5px}.invoice-meta{text-align:right;min-width:245px}.invoice-title{font-size:24px;font-weight:900;color:#10233f;letter-spacing:.03em}.invoice-status{display:inline-block;margin:7px 0 14px;padding:5px 9px;border-radius:999px;background:#eef7f6;color:#087f76;font-size:9px;font-weight:800;letter-spacing:.08em}.invoice-meta>div:not(.invoice-title):not(.invoice-status){display:flex;justify-content:space-between;gap:18px;font-size:11px;margin-top:6px;color:#6d7a89}.invoice-meta strong{color:#152238}.invoice-parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:22px 0}.party-box{border:1px solid #e1e7ed;border-radius:10px;padding:15px;background:#fafbfd;font-size:11px;line-height:1.7;color:#5f6c7a}.party-box strong{display:block;color:#172335;font-size:15px;margin-bottom:4px}.party-label{font-size:9px;font-weight:900;letter-spacing:.12em;color:#758395;margin-bottom:7px}.invoice-table{width:100%;border-collapse:collapse;font-size:10px}.invoice-table th{background:#10233f;color:#fff;text-align:left;padding:10px 9px;font-size:9px;letter-spacing:.04em}.invoice-table td{padding:13px 9px;border-bottom:1px solid #e2e7ec;color:#4f5d6c;vertical-align:top}.invoice-table td strong{display:block;color:#182537;font-size:11px}.invoice-table td small{display:block;color:#8995a3;margin-top:3px}.invoice-table .right{text-align:right}.invoice-lower{display:grid;grid-template-columns:1fr 330px;gap:18px;margin-top:22px}.payment-summary,.amount-summary{border:1px solid #dfe6ed;border-radius:12px;padding:17px 18px;background:#fff;box-shadow:0 4px 16px rgba(15,35,60,.035)}.payment-summary{border-top:3px solid #0f9d8f}.amount-summary{border-top:3px solid #10233f}.summary-title{font-size:9px;font-weight:900;letter-spacing:.14em;color:#647487;margin-bottom:11px;text-transform:uppercase}.summary-row{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:9px 0;border-bottom:1px solid #edf0f3;font-size:10.5px;color:#667486}.summary-row span{color:#657386}.summary-row strong{color:#172335;font-weight:800}.summary-row.grand{border-top:2px solid #10233f;border-bottom:0;margin-top:7px;padding-top:13px;font-size:13px;color:#172335}.summary-row.grand strong{font-size:16px;color:#0b6f68}.payment-chip{display:inline-flex;align-items:center;margin-top:13px;background:#eef8f6;color:#167d75;border:1px solid #d5ebe7;border-radius:999px;padding:6px 10px;font-size:8.5px;font-weight:800;letter-spacing:.02em}.schedule-section{margin-top:18px;border:1px solid #dfe6ed;border-radius:12px;overflow:hidden;background:#fff}.schedule-title{padding:11px 14px;background:#f6f8fa;border-bottom:1px solid #dfe6ed;color:#10233f;font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.schedule-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.5px}.schedule-table th{padding:9px 10px;background:#10233f;color:#fff;text-align:left;font-size:8px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.schedule-table th:nth-child(1){width:26%}.schedule-table th:nth-child(2){width:19%;text-align:right}.schedule-table th:nth-child(3){width:22%}.schedule-table th:nth-child(4){width:33%;text-align:center}.schedule-table td{padding:10px;border-bottom:1px solid #edf0f3;color:#4f5d6c;vertical-align:middle}.schedule-table tr:last-child td{border-bottom:0}.schedule-table td:nth-child(2){text-align:right;font-weight:800;color:#172335}.schedule-table td:nth-child(4){text-align:center}.paid-status,.due-status{display:inline-flex;align-items:center;justify-content:center;min-width:94px;padding:5px 8px;border-radius:999px;font-size:7.5px;font-weight:900;letter-spacing:.06em}.paid-status{background:#eaf7f4;color:#167d75;border:1px solid #cfe9e3}.due-status{background:#fff7e8;color:#93621b;border:1px solid #f0dfbf}.invoice-note{margin-top:16px;padding:12px 14px;background:#f7f9fb;border:1px solid #e1e7ed;border-left:3px solid #0f9d8f;border-radius:0 9px 9px 0;font-size:9.5px;color:#596879;line-height:1.5}.invoice-note strong{color:#344256}.invoice-terms{display:flex;justify-content:space-between;gap:30px;margin-top:20px;padding-top:17px;border-top:1px solid #e1e7ed;font-size:9px;color:#687687;line-height:1.55}.invoice-terms ul{margin:7px 0 0;padding-left:17px}.signature{min-width:190px;text-align:center;padding-top:28px;color:#526274}.signature-line{border-top:1px solid #8995a3;margin:35px 0 7px}.invoice-footer{display:flex;justify-content:space-between;margin-top:20px;padding-top:10px;border-top:1px solid #e1e7ed;font-size:8px;color:#8a95a2}@media(max-width:700px){.invoice-page{padding:20px}.invoice-top-rule{margin:-20px -20px 20px}.invoice-header,.invoice-parties,.invoice-lower,.invoice-terms{grid-template-columns:1fr;display:grid}.invoice-meta{text-align:left}.invoice-meta>div:not(.invoice-title):not(.invoice-status){justify-content:flex-start}.invoice-table{font-size:8px}.invoice-table th,.invoice-table td{padding:7px 5px}.schedule-table{font-size:8px}.schedule-table th,.schedule-table td{padding:7px 6px}.paid-status,.due-status{min-width:76px;font-size:6.5px}}@media print{body{background:#fff}.invoice-page{width:100%;max-width:none;margin:0;box-shadow:none}.no-print{display:none!important}}</style></head><body>${html}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));</script></body></html>`);
  printWindow.document.close();
  return true;
}

function printMemberIdCard(member, settings) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const qrData = encodeURIComponent(`Preface Fitness | Member ID: ${member.id} | Name: ${member.name}`);
  const html = `
    <div style="width:760px;max-width:100%;margin:30px auto;padding:18px;background:#fff">
      <div style="width:620px;max-width:100%;margin:auto;border:2px solid #171717;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.10)">
        <div style="height:88px;background:#111;color:#fff;display:flex;align-items:center;padding:14px 20px;gap:14px">
          <img src="${LOGO_URL}" style="width:58px;height:58px;object-fit:contain;background:#fff;border-radius:7px;padding:3px" />
          <div style="font-size:25px;font-weight:800;letter-spacing:.02em">${escapeHtml(gymName)}</div>
        </div>
        <div style="text-align:center;padding:12px;border-bottom:1px solid #ddd;font-size:18px;font-weight:800;letter-spacing:.14em">MEMBER ID CARD</div>
        <div style="display:flex;gap:24px;padding:22px">
          <div style="width:150px;height:175px;border:1px solid #ddd;border-radius:10px;overflow:hidden;background:#f5f7f9;flex:0 0 auto;display:grid;place-items:center">
            ${member.photo ? `<img src="${member.photo}" style="width:100%;height:100%;object-fit:cover" />` : `<div style="font-size:42px;font-weight:800;color:#159a91">${escapeHtml(initials(member.name))}</div>`}
          </div>
          <div style="display:grid;grid-template-columns:120px 1fr;gap:10px 16px;align-content:start;font-size:17px;line-height:1.2">
            <span>Name</span><strong>${escapeHtml(member.name)}</strong>
            <span>Member ID</span><strong>${escapeHtml(member.id)}</strong>
            <span>Age</span><strong>${escapeHtml(calculateAge(member.dob))}</strong>
            <span>Birthday</span><strong>${escapeHtml(formatDate(member.dob))}</strong>
            <span>Contact</span><strong>${escapeHtml(member.phone)}</strong>
            <span>Plan</span><strong>${escapeHtml(member.plan)}</strong>
            <span>Diet</span><strong>${escapeHtml(member.dietPreference || 'Not provided')}</strong>
          </div>
        </div>
        <div style="border-top:1px solid #ddd;padding:18px 22px;display:flex;align-items:center;gap:20px">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}" style="width:115px;height:115px" alt="QR" />
          <div><strong style="font-size:16px">Member verification</strong><div style="color:#526274;margin-top:6px">Scan to view the member ID information.</div><div style="font-size:12px;color:#8491a0;margin-top:8px">ID: ${escapeHtml(member.id)}</div></div>
        </div>
        <div style="text-align:center;border-top:1px solid #ddd;background:#f7f7f7;padding:9px;font-size:13px">© ${escapeHtml(gymName)}</div>
      </div>
    </div>`;
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
  const invoiceAmount = Number(payment?.invoiceAmount || (payment?.type === 'Membership' ? member.amount : payment?.amount) || member.amount || 0);
  const rate = gstMode === 'gst' ? Number(payment?.gstRate || settings?.defaultGstRate || 5) : 0;
  const gst = calculateGstBreakdown(invoiceAmount, rate);
  const invoiceNumber = makeInvoiceNumber(payment, settings);
  const invoiceDate = payment?.date || today;
  const received = Number(payment?.paidAmountAtInvoice ?? payment?.amount ?? member.paid ?? 0);
  const balance = Number(payment?.balanceAtInvoice ?? member.due ?? 0);
  const serviceDescription = payment?.description || `${member.plan || 'Membership'} membership`;
  const paymentAmount = Number(payment?.amount || 0);
  const isGst = gstMode === 'gst';
  const html = `
  <div class="invoice-page">
    <div class="invoice-top-rule"></div>
    <header class="invoice-header">
      <div class="seller">
        <div class="brand-row"><img src="${LOGO_URL}" alt="Logo"/><div><div class="seller-name">${escapeHtml(gymName)}</div><div class="seller-tag">GYM & FITNESS SERVICES</div></div></div>
        <div class="seller-address">${escapeHtml(settings?.gymAddress || '')}</div>
        <div class="seller-contact">${escapeHtml(settings?.gymPhone || '')}${settings?.gymEmail ? ` · ${escapeHtml(settings.gymEmail)}` : ''}</div>
        ${isGst && settings?.gstin ? `<div class="seller-gstin">GSTIN: <strong>${escapeHtml(settings.gstin)}</strong></div>` : ''}
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">${isGst ? 'TAX INVOICE' : 'INVOICE / BILL'}</div>
        <div class="invoice-status">${isGst ? 'GST APPLICABLE' : 'NON-GST BILL'}</div>
        <div><span>Invoice No.</span><strong>${escapeHtml(invoiceNumber)}</strong></div>
        <div><span>Invoice Date</span><strong>${escapeHtml(formatDate(invoiceDate))}</strong></div>
      </div>
    </header>

    <section class="invoice-parties">
      <div class="party-box"><div class="party-label">BILL TO</div><strong>${escapeHtml(member.name)}</strong><div>Member ID: ${escapeHtml(member.id)}</div><div>Phone: ${escapeHtml(member.phone || '—')}</div>${member.email ? `<div>Email: ${escapeHtml(member.email)}</div>` : ''}${member.address ? `<div>Address: ${escapeHtml(member.address)}</div>` : ''}</div>
      <div class="party-box"><div class="party-label">MEMBERSHIP DETAILS</div><strong>${escapeHtml(member.plan || 'Membership')}</strong><div>Service period: ${escapeHtml(formatDate(member.start))} to ${escapeHtml(formatDate(member.expiry))}</div><div>Trainer: ${escapeHtml(member.trainer || 'Not assigned')}</div><div>Payment mode: ${escapeHtml(payment?.mode || '—')}</div></div>
    </section>

    <table class="invoice-table"><thead><tr><th>#</th><th>Description</th><th>Service Period</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead><tbody>
      <tr><td>01</td><td><strong>${escapeHtml(serviceDescription)}</strong><small>Membership / fitness service</small></td><td>${escapeHtml(formatDate(member.start))} – ${escapeHtml(formatDate(member.expiry))}</td><td class="right">1</td><td class="right">₹${invoiceAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td class="right">₹${invoiceAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</td></tr>
    </tbody></table>

    <section class="invoice-lower">
      <div class="payment-summary">
        <div class="summary-title">PAYMENT DETAILS</div>
        <div class="summary-row"><span>Payment received</span><strong>₹${paymentAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div>
        <div class="summary-row"><span>Total paid to date</span><strong>₹${received.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div>
        <div class="summary-row"><span>Outstanding balance</span><strong>₹${balance.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div>
        <div class="payment-chip">${escapeHtml(payment?.mode || 'Payment')} · ${escapeHtml(formatDate(invoiceDate))}</div>
      </div>
      <div class="amount-summary">
        <div class="summary-row"><span>Subtotal / Taxable value</span><strong>₹${gst.taxable.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div>
        ${isGst ? `<div class="summary-row"><span>CGST (${(rate/2).toFixed(2)}%)</span><strong>₹${gst.cgst.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div class="summary-row"><span>SGST (${(rate/2).toFixed(2)}%)</span><strong>₹${gst.sgst.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div>` : '<div class="summary-row"><span>GST</span><strong>₹0.00</strong></div>'}
        <div class="summary-row grand"><span>Total invoice value</span><strong>₹${invoiceAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div>
      </div>
    </section>

    <section class="schedule-section"><div class="schedule-title">PAYMENT SCHEDULE</div><table class="schedule-table"><thead><tr><th>Due / Payment Date</th><th>Amount</th><th>Payment Mode</th><th>Status</th></tr></thead><tbody><tr><td>${escapeHtml(formatDate(invoiceDate))}</td><td>₹${paymentAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td>${escapeHtml(payment?.mode || '—')}</td><td><strong class="paid-status">PAID / RECEIVED</strong></td></tr>${balance > 0 ? `<tr><td>${escapeHtml(formatDate(member.expiry))}</td><td>₹${balance.toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td>—</td><td><strong class="due-status">PENDING</strong></td></tr>` : ''}</tbody></table></section>

    <section class="invoice-note"><strong>Amount in words:</strong> ${escapeHtml(amountInWordsIndian(invoiceAmount))}</section>
    <section class="invoice-terms"><div><strong>Notes & terms</strong><ul><li>This document records the membership / fitness service billed by ${escapeHtml(gymName)}.</li><li>Please retain this invoice for your records.</li><li>For GST invoices, the GSTIN and tax breakup shown above should match the billing details configured by the gym.</li></ul></div><div class="signature"><div>For ${escapeHtml(gymName)}</div><div class="signature-line"></div><strong>Authorised Signatory</strong></div></section>
    <footer class="invoice-footer"><span>Thank you for choosing ${escapeHtml(gymName)}.</span><span>${escapeHtml(invoiceNumber)}</span></footer>
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

function MemberModal({ onClose, onSave, member, planPrices, existingMemberIds = [], members = [], trainers = [] }) {
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
    id: member.id || '',
    due: member.due ?? 0,
    amount: member.amount ?? 0,
    paid: member.paid ?? 0,
    paymentMode: member.paymentMode || 'Cash',
    gstMode: member.gstMode || 'without',
    gstRate: Number(member.gstRate || 5),
  } : {
    id: '', attendanceNumber: '', name: '', phone: '', email: '', dob: '', gender: 'Prefer not to say', address: '',
    emergencyContact: '', dietPreference: 'Veg', referredBy: '', plan: 'Monthly', start: today, expiry: addMonthsToDate(today, MEMBERSHIP_PLANS.find((item) => item.name === 'Monthly')?.months || 1), amount: Number(planPrices?.Monthly || 0), paid: 0,
    due: 0, paymentMode: 'Cash', gstMode: 'without', gstRate: 5, height: '', weight: '', bodyFat: '', trainer: '', referral: 'Walk-in', notes: '',
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
  const submit = () => onSave({ ...form, id: String(form.id || '').trim(), amount: Number(form.amount || 0), paid: Number(form.paid || 0), due: Number(form.due || 0) });
  const valid = form.name.trim() && /^[0-9]{10}$/.test(form.phone.replace(/\D/g, '')) && form.expiry && !duplicateId;

  return <Modal title={member ? 'Edit member' : 'Add member'} onClose={onClose} wide>
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
      <FormField label="Referred by member"><select value={form.referredBy || ''} onChange={(e) => { const value = e.target.value; update('referredBy', value); if (value) update('referral', 'Referral'); }}><option value="">None / Walk-in</option>{members.filter((item) => !member || item.id !== member.id).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select></FormField>
    </div>
    <FormField label="Address"><textarea rows="2" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Member address" /></FormField>

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
    <div className="form-grid two">
      <FormField label="Referral source"><select value={form.referral} onChange={(e) => update('referral', e.target.value)}><option>Walk-in</option><option>Instagram</option><option>Facebook</option><option>Google</option><option>Referral</option><option>Website</option><option>Other</option></select></FormField>
      <FormField label="Internal notes"><textarea rows="2" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Anything staff should know..." /></FormField>
    </div>

    {!valid && <div className="form-hint">Enter a name, a valid 10-digit phone number and an expiry date to continue.{duplicateId ? ' This Member ID is already in use.' : ''}</div>}
    <ModalActions onClose={onClose} disabled={!valid} onSave={submit} saveLabel={member ? 'Save changes' : 'Add member'} />
  </Modal>;
}

// NOTE: Duplicate LeadModal removed from here

function InvoiceOptionsModal({ member, payment, settings, onClose, onPrint }) {
  const [gstMode, setGstMode] = useState(payment?.gstApplicable ? 'gst' : (settings?.gstin ? 'gst' : 'without'));
  const [gstRate, setGstRate] = useState(Number(payment?.gstRate || settings?.defaultGstRate || 5));
  const invoiceAmount = Number(payment?.invoiceAmount || (payment?.type === 'Membership' ? member?.amount : payment?.amount) || member?.amount || 0);
  const gst = calculateGstBreakdown(invoiceAmount, gstMode === 'gst' ? gstRate : 0);
  return <Modal title="Generate invoice / bill" onClose={onClose}>
    <div className="invoice-choice-card">
      <div><div className="eyebrow">DOCUMENT TYPE</div><strong>Select how this bill should be generated</strong><span>The selected format will be used by both Payments and the member profile.</span></div>
      <div className="invoice-choice-options">
        <label className={`invoice-choice ${gstMode === 'gst' ? 'selected' : ''}`}><input type="radio" name="invoice-gst-mode" checked={gstMode === 'gst'} onChange={() => setGstMode('gst')} /><div><strong>Tax Invoice with GST</strong><span>Shows GSTIN, taxable value, CGST and SGST.</span></div></label>
        <label className={`invoice-choice ${gstMode === 'without' ? 'selected' : ''}`}><input type="radio" name="invoice-gst-mode" checked={gstMode === 'without'} onChange={() => setGstMode('without')} /><div><strong>Bill without GST</strong><span>Shows the same professional bill without tax breakup.</span></div></label>
      </div>
      <div className="form-grid two">
        <FormField label="GST rate (%)"><input type="number" min="0" step="0.01" disabled={gstMode !== 'gst'} value={gstRate} onChange={(e) => setGstRate(e.target.value)} /></FormField>
        <FormField label="Invoice value"><input readOnly value={`₹${invoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} /></FormField>
      </div>
      <div className="invoice-tax-preview"><div><span>Taxable</span><strong>₹{gst.taxable.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div><span>CGST</span><strong>₹{gst.cgst.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div><span>SGST</span><strong>₹{gst.sgst.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div><div className="grand"><span>Total</span><strong>₹{invoiceAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></div></div>
    </div>
    <ModalActions onClose={onClose} disabled={!member} onSave={() => onPrint(gstMode, Number(gstRate || 0))} saveLabel={gstMode === 'gst' ? 'Generate GST invoice' : 'Generate bill'} />
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
  const invoiceBase = form.type === 'Membership' ? Number(selectedMember?.amount || form.amount || 0) : Number(form.amount || 0);
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
  return <div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={disabled} onClick={onSave}><CheckCircle2 size={17} /> {saveLabel}</button></div>; 
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
  const members = data.members || [];
  const payments = data.payments || [];
  const attendance = data.attendance || [];
  const leads = data.leads || [];
  const trainers = data.trainers || [];
  const sessions = data.ptSessions || [];

  const collected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const dues = members.reduce((sum, m) => sum + Number(m.due || 0), 0);
  const active = members.filter((m) => getMembershipStatus(m.expiry) === 'Active').length;
  const expiring = members.filter((m) => getMembershipStatus(m.expiry) === 'Expiring').length;
  const expired = members.filter((m) => getMembershipStatus(m.expiry) === 'Expired').length;
  const completedPT = sessions.filter((s) => s.status === 'Completed').length;

  return (
    <div className="page">
      <PageTitle title="Reports & Analytics" subtitle="A quick overview of your gym's business and operations." />
      <div className="member-summary">
        <MetricBox label="Total members" value={members.length} tone="green" />
        <MetricBox label="Active members" value={active} />
        <MetricBox label="Revenue collected" value={`₹${collected.toLocaleString('en-IN')}`} tone="teal" />
        <MetricBox label="Outstanding dues" value={`₹${dues.toLocaleString('en-IN')}`} tone="amber" />
      </div>
      <div className="grid-2">
        <section className="card">
          <div className="card-header"><div><h3>Membership overview</h3><p>Current membership status</p></div></div>
          <div className="report-list">
            <div><span>Active</span><strong>{active}</strong></div>
            <div><span>Expiring within 30 days</span><strong>{expiring}</strong></div>
            <div><span>Expired</span><strong>{expired}</strong></div>
          </div>
        </section>
        <section className="card">
          <div className="card-header"><div><h3>Operations</h3><p>Current activity summary</p></div></div>
          <div className="report-list">
            <div><span>Attendance records</span><strong>{attendance.length}</strong></div>
            <div><span>Leads</span><strong>{leads.length}</strong></div>
            <div><span>Trainers</span><strong>{trainers.length}</strong></div>
            <div><span>Completed PT sessions</span><strong>{completedPT}</strong></div>
            <div><span>PT revenue</span><strong>₹{Number(revenue || 0).toLocaleString('en-IN')}</strong></div>
          </div>
        </section>
      </div>
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

function SettingsPage({ exportBackup, importBackup, data, setData, dbReady, resetData }) {
  const current = data.settings || {};
  const [form, setForm] = useState({
    gymName: current.gymName || 'Preface Fitness',
    gymAddress: current.gymAddress || '',
    gymPhone: current.gymPhone || '',
    gymEmail: current.gymEmail || '',
    gstin: current.gstin || '',
    defaultGstRate: Number(current.defaultGstRate ?? 5),
    invoicePrefix: current.invoicePrefix || 'PF-INV',
    referralPointsPerReferral: Number(current.referralPointsPerReferral ?? 10),
    gymLatitude: current.gymLatitude || '',
    gymLongitude: current.gymLongitude || '',
    publicPage: {
      whatsappNumber: current.publicPage?.whatsappNumber || '', instagramUrl: current.publicPage?.instagramUrl || '', facebookUrl: current.publicPage?.facebookUrl || '', websiteUrl: current.publicPage?.websiteUrl || '',
      googleRating: current.publicPage?.googleRating || '5.0', googleReviewCount: current.publicPage?.googleReviewCount || '95', googleMapsUrl: current.publicPage?.googleMapsUrl || '', googleSearchUrl: current.publicPage?.googleSearchUrl || 'https://www.google.com/search?q=preface+fitness', googlePlaceName: current.publicPage?.googlePlaceName || current.gymName || 'Preface Fitness', googlePhone: current.publicPage?.googlePhone || '093692 79056', googleAddress: current.publicPage?.googleAddress || current.gymAddress || 'Preface Fitness, Nadan Mahal Rd. above Hdfc Bank, Yahiyaganj, Lucknow, Uttar Pradesh 226003', hoursText: current.publicPage?.hoursText || 'Mon-Sun · 6 AM - 11 PM',
      trainers: Array.isArray(current.publicPage?.trainers) ? current.publicPage.trainers : [],
      packages: Array.isArray(current.publicPage?.packages) && current.publicPage.packages.length ? current.publicPage.packages : MEMBERSHIP_PLANS.map((plan) => ({ name: plan.name, months: plan.months, price: Number(current.membershipPrices?.[plan.name] || plan.price), description: plan.description })),
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
      invoicePrefix: current.invoicePrefix || 'PF-INV',
      referralPointsPerReferral: Number(current.referralPointsPerReferral ?? 10),
      gymLatitude: current.gymLatitude || '',
      gymLongitude: current.gymLongitude || '',
      publicPage: {
        whatsappNumber: current.publicPage?.whatsappNumber || '', instagramUrl: current.publicPage?.instagramUrl || '', facebookUrl: current.publicPage?.facebookUrl || '', websiteUrl: current.publicPage?.websiteUrl || '',
        googleRating: current.publicPage?.googleRating || '5.0', googleReviewCount: current.publicPage?.googleReviewCount || '95', googleMapsUrl: current.publicPage?.googleMapsUrl || '', googleSearchUrl: current.publicPage?.googleSearchUrl || 'https://www.google.com/search?q=preface+fitness', googlePlaceName: current.publicPage?.googlePlaceName || current.gymName || 'Preface Fitness', googlePhone: current.publicPage?.googlePhone || '093692 79056', googleAddress: current.publicPage?.googleAddress || current.gymAddress || 'Preface Fitness, Nadan Mahal Rd. above Hdfc Bank, Yahiyaganj, Lucknow, Uttar Pradesh 226003', hoursText: current.publicPage?.hoursText || 'Mon-Sun · 6 AM - 11 PM',
        trainers: Array.isArray(current.publicPage?.trainers) ? current.publicPage.trainers : [],
        packages: Array.isArray(current.publicPage?.packages) && current.publicPage.packages.length ? current.publicPage.packages : MEMBERSHIP_PLANS.map((plan) => ({ name: plan.name, months: plan.months, price: Number(current.membershipPrices?.[plan.name] || plan.price), description: plan.description })),
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
  }, [current.gymName, current.gymAddress, current.gymPhone, current.gymEmail, current.gstin, current.defaultGstRate, current.invoicePrefix, current.referralPointsPerReferral, current.gymLatitude, current.gymLongitude, current.publicPage, current.notice?.id, current.notice?.enabled, current.notice?.dashboardEnabled, current.notice?.text, current.notice?.priority, current.noticeHistory, current.auth?.username, current.auth?.passwordHash]);

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
    const publicPage = {
      ...(form.publicPage || {}),
      trainers: (form.publicPage?.trainers || [])
        .filter((t) => String(t.name || '').trim())
        .map((t) => ({
          ...t,
          photo: String(t.photo || ''),
        })),
      packages: (form.publicPage?.packages || []).filter((p) => String(p.name || '').trim()).map((p) => {
        const standardPlan = MEMBERSHIP_PLANS.find((plan) => String(plan.name).trim().toLowerCase() === String(p.name || '').trim().toLowerCase());
        const currentPrice = standardPlan ? Number(data.settings?.membershipPrices?.[standardPlan.name] ?? p.price ?? standardPlan.price) : Number(p.price || 0);
        return { ...p, months: Math.max(1, Number(p.months || standardPlan?.months || 1)), price: Math.max(0, currentPrice) };
      }),
      reviews: (form.publicPage?.reviews || []).filter((r) => String(r.name || r.text || '').trim()),
    };
    const patch = { publicPage: { ...publicPage, updatedAt: new Date().toISOString() } };
    setForm((f) => ({ ...f, publicPage }));
    setData((d) => ({ ...d, settings: { ...(d.settings || {}), ...patch } }));
    try {
      await saveCloudSettings(patch);
      setAuthMessage('Public gym page settings saved successfully.');
      showActionFeedback('Public gym page saved successfully.');
    } catch (error) {
      console.error('Public page settings save failed:', error);
      setAuthMessage(error?.message || 'Public page saved locally, but cloud save failed.');
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
          <div className="card-header"><div><h3>Gym & billing details</h3><p>These details are used on member bills and invoices.</p></div></div>
          <div className="form-grid two">
            <FormField label="Gym name"><input value={form.gymName} onChange={(e) => setForm((f) => ({...f,gymName:e.target.value}))} /></FormField>
            <FormField label="Invoice prefix"><input value={form.invoicePrefix} onChange={(e) => setForm((f) => ({...f,invoicePrefix:e.target.value}))} placeholder="PF-INV" /></FormField>
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
            <FormField label="Google review count"><input value={form.publicPage?.googleReviewCount || ''} onChange={(e) => updatePublicPage('googleReviewCount', e.target.value)} placeholder="95" /></FormField>
            <FormField label="Google phone"><input value={form.publicPage?.googlePhone || ''} onChange={(e) => updatePublicPage('googlePhone', e.target.value)} placeholder="Google listing phone" /></FormField>
            <FormField label="Business name"><input value={form.publicPage?.googlePlaceName || ''} onChange={(e) => updatePublicPage('googlePlaceName', e.target.value)} placeholder="Preface Fitness" /></FormField>
          </div>
          <div className="form-grid two">
            <FormField label="Google Maps URL"><input value={form.publicPage?.googleMapsUrl || ''} onChange={(e) => updatePublicPage('googleMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." /></FormField>
            <FormField label="Google Search URL"><input value={form.publicPage?.googleSearchUrl || ''} onChange={(e) => updatePublicPage('googleSearchUrl', e.target.value)} placeholder="Google business search/listing URL" /></FormField>
            <FormField label="Google address"><input value={form.publicPage?.googleAddress || ''} onChange={(e) => updatePublicPage('googleAddress', e.target.value)} placeholder="Full Google business address" /></FormField>
            <FormField label="Opening hours"><input value={form.publicPage?.hoursText || ''} onChange={(e) => updatePublicPage('hoursText', e.target.value)} placeholder="Mon-Sun · 6 AM - 11 PM" /></FormField>
          </div>

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
              <div className="card-header"><div><h3>Backup & restore</h3><p>Download a JSON backup or restore one later.</p></div></div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                <button className="btn btn-primary" onClick={() => { exportBackup(); showActionFeedback('Backup export started.'); }}><FileDown size={17}/> Export backup</button>
                <label className="btn btn-secondary" style={{cursor:'pointer'}}><FileUp size={17}/> Import backup<input type="file" accept=".json,application/json" onChange={(event) => { importBackup(event); showActionFeedback('Backup import started.'); }} style={{display:'none'}} /></label>
                <button className="btn btn-danger" onClick={() => { resetData(); showActionFeedback('Demo data reset action completed.'); }}>Reset demo data</button>
              </div>
            </section>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

const initialRoute = window.location.hash;
createRoot(document.getElementById('root')).render(initialRoute === '#feedback' ? <PublicFeedbackPage /> : <App />);

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
