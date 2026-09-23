import React, { useEffect, useMemo, useState } from 'react';
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

function addMonthsToDate(dateString, months) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
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

function getCheckInPath() {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/check-in`;
}

function getCheckInUrl() {
  return `${window.location.origin}${getCheckInPath()}`;
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

  settings: { gymName: 'Preface Fitness', currency: '₹', gymAddress: '', gymPhone: '', gymEmail: '', gstin: '', invoicePrefix: 'PF-INV', referralPointsPerReferral: 10, gymLatitude: '', gymLongitude: '', auth: { username: 'admin', passwordHash: '' } },
};

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

function App() {
  const [data, setData] = useState(seed);
  const [dbReady, setDbReady] = useState(false);
  const [active, setActive] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await readState(null);
      if (cancelled) return;
      if (stored) {
        const normalized = { ...stored, workoutPlans: Array.isArray(stored.workoutPlans) ? stored.workoutPlans : [], dietPlans: Array.isArray(stored.dietPlans) ? stored.dietPlans : seed.dietPlans, settings: { ...seed.settings, ...(stored.settings || {}), auth: { ...seed.settings.auth, ...((stored.settings || {}).auth || {}) } } };
        setData(normalized);
        await writeState(normalized);
      }
      else {
        const legacy = loadLegacyData();
        if (legacy) {
          const normalized = { ...legacy, workoutPlans: Array.isArray(legacy.workoutPlans) ? legacy.workoutPlans : [], dietPlans: Array.isArray(legacy.dietPlans) ? legacy.dietPlans : seed.dietPlans, settings: { ...seed.settings, ...(legacy.settings || {}), auth: { ...seed.settings.auth, ...((legacy.settings || {}).auth || {}) } } };
          setData(normalized);
          await writeState(normalized);
        }
        else await writeState(seed);
      }
      setDbReady(true);

      try {
        const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
        if (rawSession) {
          const session = JSON.parse(rawSession);
          if (session?.expiresAt && Number(session.expiresAt) > Date.now()) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(AUTH_SESSION_KEY);
          }
        }
      } catch {
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  const addMember = (member) => {
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
      createdAt: new Date().toISOString(),
    };
    setData((d) => ({ ...d, members: [clean, ...d.members] }));
    setModal(null);
    setToast('Member added successfully');
  };

  const updateMember = (updated) => {
    setData((d) => ({
      ...d,
      members: d.members.map((m) => m.id === updated.id
        ? { ...m, ...updated, due: Number(updated.due || 0), amount: Number(updated.amount || 0), paid: Number(updated.paid || 0), status: getMemberStatus(updated.expiry) }
        : m),
    }));
    setModal(null);
    setToast('Member updated successfully');
  };

  const renewMembership = (member, renewal) => {
    const plan = MEMBERSHIP_PLANS.find((item) => item.name === renewal.plan);
    if (!plan) return;

    const currentDays = getDaysRemaining(member.expiry);
    const renewalStart = currentDays >= 0 && member.expiry ? member.expiry : today;
    const newExpiry = addMonthsToDate(renewalStart, plan.months);
    const renewalAmount = Number(renewal.amount || planPrices[plan.name] || plan.price);
    const renewalPaid = Number(renewal.paid || 0);
    const oldDue = Number(member.due || 0);
    const renewalDue = Math.max(0, renewalAmount - renewalPaid);

    setData((d) => ({
      ...d,
      members: d.members.map((m) => m.id === member.id
        ? {
            ...m,
            plan: plan.name,
            start: renewalStart,
            expiry: newExpiry,
            amount: renewalAmount,
            paid: renewalPaid,
            due: oldDue + renewalDue,
            status: getMembershipStatus(newExpiry),
          }
        : m),
    }));

    setModal(null);
    setToast(`${member.name}'s membership renewed successfully`);
  };

  const addLead = (lead) => {
    const id = `L-${101 + data.leads.length}`;
    setData((d) => ({ ...d, leads: [{ ...lead, id, stage: 'New' }, ...d.leads] }));
    setModal(null);
    setToast('Lead added successfully');
  };

  const addPayment = (payment) => {
    const id = `PAY-${1001 + data.payments.length}`;
    const amount = Number(payment.amount || 0);

    setData((d) => {
      const nextPayments = [
        { ...payment, id, amount, createdAt: new Date().toISOString() },
        ...d.payments,
      ];

      const nextMembers = d.members.map((member) => {
        if (member.name !== payment.member || payment.type !== 'Membership') return member;

        const currentPaid = Number(member.paid || 0);
        const currentDue = Number(member.due || 0);
        const paidAgainstDue = Math.min(currentDue, amount);

        return {
          ...member,
          paid: currentPaid + amount,
          due: Math.max(0, currentDue - paidAgainstDue),
        };
      });

      return { ...d, payments: nextPayments, members: nextMembers };
    });

    setModal(null);
    setToast('Payment recorded');
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


  const addTrainer = (trainer) => {
    const clean = {
      ...trainer,
      id: `TR-${Date.now()}`,
      experience: Number(trainer.experience || 0),
      monthlySalary: Number(trainer.monthlySalary || 0),
      status: trainer.status || 'Active',
    };

    setData((d) => ({
      ...d,
      trainers: [clean, ...(d.trainers || [])],
    }));
    setModal(null);
    setToast('Trainer added');
  };

  const updateTrainer = (trainer) => {
    const clean = {
      ...trainer,
      experience: Number(trainer.experience || 0),
      monthlySalary: Number(trainer.monthlySalary || 0),
    };

    setData((d) => ({
      ...d,
      trainers: (d.trainers || []).map((item) =>
        item.id === clean.id ? clean : item
      ),
    }));
    setModal(null);
    setToast('Trainer updated');
  };

  const deleteTrainer = (id) => {
    const trainer = (data.trainers || []).find((item) => item.id === id);
    if (!trainer || !window.confirm(`Delete ${trainer.name}?`)) return;

    setData((d) => ({
      ...d,
      trainers: (d.trainers || []).filter((item) => item.id !== id),
      ptSessions: (d.ptSessions || []).filter((session) => session.trainerId !== id),
    }));
    setToast('Trainer deleted');
  };

  const addPTSession = (session) => {
    const clean = {
      ...session,
      id: `PT-${Date.now()}`,
      duration: Number(session.duration || 60),
      fee: Number(session.fee || 0),
      status: session.status || 'Scheduled',
      date: session.date || today,
    };

    setData((d) => ({
      ...d,
      ptSessions: [clean, ...(d.ptSessions || [])],
    }));
    setModal(null);
    setToast('PT session scheduled');
  };

  const updatePTSessionStatus = (id, status) => {
    setData((d) => ({
      ...d,
      ptSessions: (d.ptSessions || []).map((session) =>
        session.id === id ? { ...session, status } : session
      ),
    }));
    setToast(`Session marked ${status.toLowerCase()}`);
  };

  const deletePTSession = (id) => {
    if (!window.confirm('Delete this PT session?')) return;

    setData((d) => ({
      ...d,
      ptSessions: (d.ptSessions || []).filter((session) => session.id !== id),
    }));
    setToast('PT session deleted');
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

  const deleteMember = (id) => {
    const member = data.members.find((m) => m.id === id);
    if (!member || !window.confirm(`Delete ${member.name}? This cannot be undone.`)) return;
    setData((d) => ({ ...d, members: d.members.filter((m) => m.id !== id) }));
    setToast('Member deleted');
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

  const deletePayment = (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    setData((d) => ({ ...d, payments: d.payments.filter((p) => p.id !== id) }));
    setToast('Payment deleted');
  };

  const nav = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Performance', icon: BarChart3 },
    { label: 'Members', icon: Users },
    { label: 'Leads', icon: Target },
    { label: 'Memberships', icon: ShieldCheck },
    { label: 'Attendance', icon: CheckCircle2 },
    { label: 'Payments', icon: CreditCard },
    { label: 'Training', icon: Dumbbell },
    { label: 'Trainers & PT', icon: Users },
  { label: 'Progress', icon: TrendingUp },
    { label: 'Diet & Nutrition', icon: Target },
    { label: 'Communication', icon: MessageCircle },
    { label: 'Reports', icon: ClipboardList },
  ];

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.members;
    return data.members.filter((m) => [m.name, m.phone, m.email, m.id, m.plan].join(' ').toLowerCase().includes(q));
  }, [data.members, query]);

  const navigate = (label) => {
    setActive(label);
    setQuery('');
    setSidebarOpen(false);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
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

  const isPublicCheckInRoute = window.location.pathname.replace(/\/+$/, '').endsWith('/check-in');

  if (isPublicCheckInRoute) {
    return <PublicAttendancePage data={data} setData={setData} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        settings={data.settings || {}}
        onLogin={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          height: '100vh',
          maxHeight: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'thin',
        }}
      >
        <div className="brand-block">
          <div className="brand-logo"><img src={LOGO_URL} alt="Preface Fitness logo" /></div>
          <div>
            <div className="brand-name">Preface Fitness</div>
            <div className="brand-sub">GYM MANAGEMENT</div>
          </div>
          <button className="icon-btn mobile-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <div className="nav-section-title">MAIN MENU</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => navigate(label)}>
              <Icon size={18} strokeWidth={2} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${active === 'Settings' ? 'active' : ''}`} onClick={() => navigate('Settings')}><Settings size={18} /><span>Settings</span></button>
          <div className="storage-card">
            <div className="storage-icon"><ShieldCheck size={16} /></div>
            <div><strong>Local mode</strong><span>Your data is saved in this browser.</span></div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
            <div className="breadcrumb"><span>Preface Fitness</span><ChevronDown size={14} /><strong>{active}</strong></div>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" title="Logout" onClick={logout}><LogOut size={18} /></button>
            <button className="icon-btn" title="Notifications"><Bell size={19} /><span className="notification-dot" /></button>
            <div className="admin-chip"><div className="avatar">A</div><div><strong>Administrator</strong><span>Owner</span></div><ChevronDown size={15} /></div>
          </div>
        </header>

        <div className="content">
          {active === 'Performance' && <PerformancePage data={data} />}
          {active === 'Dashboard' && <Dashboard {...{ activeMembers, expiringMembers, overdue, revenue, data, navigate, setModal, markAttendance }} />}
          {active === 'Members' && <MembersPage members={data.members} query={query} setQuery={setQuery} setModal={setModal} markAttendance={markAttendance} deleteMember={deleteMember} settings={data.settings || {}} />}
          {active === 'Leads' && <LeadsPage leads={data.leads} members={data.members} setModal={setModal} updateLeadStage={updateLeadStage} updateLeadDetails={updateLeadDetails} deleteLead={deleteLead} convertLeadToMember={convertLeadToMember} />}
          {active === 'Memberships' && <MembershipsPage members={data.members} setModal={setModal} planPrices={planPrices} setData={setData} setToast={setToast} />}
          {active === 'Attendance' && <AttendancePage attendance={data.attendance} members={data.members} markAttendance={markAttendance} />}
          {active === 'Payments' && <PaymentsPage payments={data.payments} overdue={overdue} setModal={setModal} deletePayment={deletePayment} />}
          {active === 'Progress' && <ProgressPage progressRecords={data.progressRecords || []} members={data.members} setModal={setModal} deleteProgressRecord={deleteProgressRecord} />}
          {active === 'Trainers & PT' && <TrainersPTPage trainers={data.trainers || []} sessions={data.ptSessions || []} members={data.members} setModal={setModal} updatePTSessionStatus={updatePTSessionStatus} deletePTSession={deletePTSession} deleteTrainer={deleteTrainer} />}
          {active === 'Training' && <TrainingPage plans={data.workoutPlans || []} members={data.members} setModal={setModal} deleteWorkoutPlan={deleteWorkoutPlan} />}
          {active === 'Diet & Nutrition' && <DietPage plans={data.dietPlans || []} members={data.members} setModal={setModal} deleteDietPlan={deleteDietPlan} />}
          {active === 'Communication' && <CommunicationPage members={data.members} logs={data.communicationLogs || []} setModal={setModal} deleteCommunicationLog={deleteCommunicationLog} />}
          {active === 'Reports' && <ReportsPage data={data} revenue={revenue} />}
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
        </div>
      </main>

      {modal === 'member' && <MemberModal onClose={() => setModal(null)} onSave={addMember} planPrices={planPrices} members={data.members} existingMemberIds={data.members.map((m) => m.id)} />}
      {modal?.type === 'editMember' && <MemberModal member={modal.member} onClose={() => setModal(null)} onSave={updateMember} planPrices={planPrices} members={data.members} existingMemberIds={data.members.map((m) => m.id)} />}
      {modal?.type === 'renewMembership' && <RenewalModal member={modal.member} onClose={() => setModal(null)} onRenew={renewMembership} planPrices={planPrices} />}
      {modal === 'lead' && <LeadModal onClose={() => setModal(null)} onSave={addLead} />}
      {modal?.type === 'editLead' && <LeadModal lead={modal.lead} onClose={() => setModal(null)} onSave={updateLeadDetails} />}
      {modal === 'trainer' && <TrainerModal onClose={() => setModal(null)} onSave={addTrainer} />}
      {modal?.type === 'editTrainer' && <TrainerModal trainer={modal.trainer} onClose={() => setModal(null)} onSave={updateTrainer} />}
      {modal === 'ptSession' && <PTSessionModal trainers={data.trainers || []} members={data.members} onClose={() => setModal(null)} onSave={addPTSession} />}
      {modal === 'communication' && <CommunicationModal members={data.members} onClose={() => setModal(null)} onSave={addCommunicationLog} />}
      {modal === 'progress' && <ProgressModal members={data.members} onClose={() => setModal(null)} onSave={addProgressRecord} />}
      {modal === 'payment' && <PaymentModal members={data.members} onClose={() => setModal(null)} onSave={addPayment} />}
      {(modal === 'workoutPlan' || modal?.type === 'editWorkoutPlan') && <WorkoutPlanModal members={data.members} plan={modal?.type === 'editWorkoutPlan' ? modal.plan : null} onClose={() => setModal(null)} onSave={modal?.type === 'editWorkoutPlan' ? updateWorkoutPlan : createWorkoutPlan} />}
      {(modal === 'dietPlan' || modal?.type === 'editDietPlan') && <DietPlanModal members={data.members} plan={modal?.type === 'editDietPlan' ? modal.plan : null} onClose={() => setModal(null)} onSave={modal?.type === 'editDietPlan' ? updateDietPlan : createDietPlan} />}
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}


function LoginScreen({ settings, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const auth = settings.auth || {};
  const configuredUsername = auth.username || 'admin';

  const submit = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }

    setBusy(true);
    const hash = await hashPassword(password);
    const valid =
      username.trim().toLowerCase() === configuredUsername.toLowerCase() &&
      (auth.passwordHash ? hash === auth.passwordHash : password === 'admin123');

    setBusy(false);

    if (!valid) {
      setError('Invalid username or password.');
      return;
    }

    setError('');

    try {
      localStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify({
          authenticatedAt: Date.now(),
          expiresAt: Date.now() + AUTH_SESSION_MS,
        })
      );
    } catch {
      // If browser storage is unavailable, the login still works for the current page.
    }

    onLogin();
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
            OWNER LOGIN
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
              Username
            </label>
            <input
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={configuredUsername}
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
          Login credentials can be changed from Settings after signing in.
        </div>
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
          <div className="form-grid">
            <label>
              Name *
              <input value={form.name} onChange={(e) => update('name', e.target.value)} />
            </label>

            <label>
              Phone
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>

            <label>
              Specialization *
              <input
                value={form.specialization}
                onChange={(e) => update('specialization', e.target.value)}
                placeholder="e.g. Strength & Conditioning"
              />
            </label>

            <label>
              Experience (years)
              <input
                type="number"
                min="0"
                value={form.experience}
                onChange={(e) => update('experience', e.target.value)}
              />
            </label>

            <label>
              Monthly salary
              <input
                type="number"
                min="0"
                value={form.monthlySalary}
                onChange={(e) => update('monthlySalary', e.target.value)}
              />
            </label>

            <label>
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
          <div className="form-grid">
            <label>
              Trainer
              <select value={form.trainerId} onChange={(e) => update('trainerId', e.target.value)}>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                ))}
              </select>
            </label>

            <label>
              Member
              <select value={form.memberId} onChange={(e) => update('memberId', e.target.value)}>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
            </label>

            <label>
              Time
              <input value={form.time} onChange={(e) => update('time', e.target.value)} placeholder="07:00 PM" />
            </label>

            <label>
              Duration (minutes)
              <input type="number" min="15" step="15" value={form.duration} onChange={(e) => update('duration', e.target.value)} />
            </label>

            <label>
              Session fee
              <input type="number" min="0" value={form.fee} onChange={(e) => update('fee', e.target.value)} />
            </label>

            <label>
              Session type
              <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                <option>Personal Training</option>
                <option>Assessment</option>
                <option>Trial PT</option>
                <option>Consultation</option>
              </select>
            </label>

            <label>
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
  const todayAttendance = data.attendance.filter((a) => a.date === today);
  const attention = [
    expiringMembers ? { tone: 'amber', icon: ShieldCheck, title: `${expiringMembers} membership${expiringMembers > 1 ? 's' : ''} expiring`, sub: 'Open membership list', action: () => navigate('Memberships') } : null,
    overdue ? { tone: 'red', icon: CreditCard, title: `₹${overdue.toLocaleString('en-IN')} pending`, sub: 'Review outstanding payments', action: () => navigate('Payments') } : null,
    data.leads.filter((l) => l.followUp <= today).length ? { tone: 'blue', icon: Target, title: `${data.leads.filter((l) => l.followUp <= today).length} lead follow-ups due`, sub: 'Contact leads today', action: () => navigate('Leads') } : null,
    { tone: 'purple', icon: Activity, title: `${data.members.filter((m) => m.visits < 8).length} low-attendance members`, sub: 'Potential retention risk', action: () => navigate('Members') },
  ].filter(Boolean);

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">Wednesday, 23 September 2026</div><h1>Good afternoon, Administrator <span>👋</span></h1><p>Here’s what needs your attention at Preface Fitness today.</p></div>
        <div className="heading-actions"><button className="btn btn-secondary" onClick={() => setModal('lead')}><Target size={17} /> New lead</button><button className="btn btn-primary" onClick={() => setModal('member')}><Plus size={18} /> Add member</button></div>
      </div>

      <section className="stats-grid">
        <StatCard label="Total members" value={data.members.length} change="5.8%" positive icon={Users} tone="teal" />
        <StatCard label="Active members" value={activeMembers} change="3.2%" positive icon={Activity} tone="green" />
        <StatCard label="Revenue recorded" value={`₹${revenue.toLocaleString('en-IN')}`} change="8.4%" positive icon={CircleDollarSign} tone="purple" />
        <StatCard label="Pending payments" value={`₹${overdue.toLocaleString('en-IN')}`} change="Needs action" icon={CreditCard} tone="orange" />
      </section>

      <section className="dashboard-grid">
        <div className="panel attention-panel">
          <PanelHeader title="Needs attention" subtitle="Actions that matter today" icon={AlertCircle} />
          <div className="attention-list">
            {attention.map((item, i) => <button className="attention-item" key={i} onClick={item.action}><div className={`attention-icon ${item.tone}`}><item.icon size={18} /></div><div><strong>{item.title}</strong><span>{item.sub}</span></div><ArrowUpRight size={17} /></button>)}
            {!attention.length && <EmptyState title="Everything looks good" text="No urgent actions for today." />}
          </div>
        </div>

        <div className="panel attendance-panel">
          <PanelHeader title="Today's attendance" subtitle={`${todayAttendance.length} check-ins`} icon={CheckCircle2} />
          <div className="attendance-number"><strong>{todayAttendance.length}</strong><span>members present</span></div>
          <div className="mini-bars"><span style={{ height: '34%' }} /><span style={{ height: '52%' }} /><span style={{ height: '43%' }} /><span style={{ height: '76%' }} /><span style={{ height: '92%' }} /><span style={{ height: '68%' }} /><span style={{ height: '81%' }} /><span style={{ height: '59%' }} /></div>
          <button className="link-btn" onClick={() => navigate('Attendance')}>Open attendance <ArrowUpRight size={15} /></button>
        </div>
      </section>

      <section className="dashboard-grid lower-grid">
        <div className="panel">
          <PanelHeader title="Expiring memberships" subtitle="Members who may need a renewal message" icon={ShieldCheck} action="View all" onAction={() => navigate('Memberships')} />
          <div className="table-wrap compact-table"><table><thead><tr><th>Member</th><th>Plan</th><th>Expires</th><th>Status</th></tr></thead><tbody>{data.members.filter((m) => m.status === 'Expiring').map((m) => <tr key={m.id}><td><div className="member-cell"><div className="avatar soft">{initials(m.name)}</div><div><strong>{m.name}</strong><span>{m.phone}</span></div></div></td><td>{m.plan}</td><td>{formatDate(m.expiry)}</td><td><StatusBadge status={m.status} /></td></tr>)}</tbody></table></div>
        </div>
        <div className="panel">
          <PanelHeader title="Quick actions" subtitle="Common front-desk tasks" icon={Sparkles} />
          <div className="quick-grid"><QuickAction icon={UserPlus} label="Add member" onClick={() => setModal('member')} /><QuickAction icon={Target} label="New lead" onClick={() => setModal('lead')} /><QuickAction icon={CreditCard} label="Record payment" onClick={() => setModal('payment')} /><QuickAction icon={CheckCircle2} label="Mark attendance" onClick={() => data.members[0] && markAttendance(data.members[0].name)} /></div>
        </div>
      </section>
    </>
  );
}

function MembersPage({ members, query, setQuery, setModal, markAttendance, deleteMember, settings }) {
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
              <button className="quick-action" onClick={() => printMemberBill(member, settings)}><span><CreditCard size={18} /></span><strong>Bill / PDF</strong><ArrowUpRight size={15} /></button>
              <button className="quick-action" onClick={() => shareBillWhatsApp(member, settings)}><span><MessageCircle size={18} /></span><strong>Share bill on WhatsApp</strong><ArrowUpRight size={15} /></button>
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
  const [memberNumber, setMemberNumber] = useState('');
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Requesting your location…');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const gymLat = Number(settings.gymLatitude);
  const gymLng = Number(settings.gymLongitude);
  const hasGymLocation = Number.isFinite(gymLat) && Number.isFinite(gymLng) && settings.gymLatitude !== '' && settings.gymLongitude !== '';

  const requestLocation = () => {
    setResult(null);
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported by this browser.');
      return;
    }
    setLocationStatus('Requesting your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
        setLocationStatus(`Location detected (accuracy ±${Math.round(position.coords.accuracy || 0)} m)`);
      },
      (error) => {
        const message = error.code === 1 ? 'Location permission was denied. Please allow location access and try again.' : 'Could not detect your location. Please try again.';
        setLocationStatus(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  const markPresent = () => {
    setResult(null);
    const number = String(memberNumber || '').trim();
    if (!number) {
      setResult({ type: 'error', message: 'Enter your member number.' });
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

    const member = (data.members || []).find((item) => String(item.attendanceNumber || item.id || '').trim().toLowerCase() === number.toLowerCase());
    if (!member) {
      setResult({ type: 'error', message: 'Member number not found.' });
      return;
    }
    if (getMembershipStatus(member.expiry) === 'Expired') {
      setResult({ type: 'error', message: 'Attendance denied. Your membership has expired.' });
      return;
    }

    const already = (data.attendance || []).some((record) => record.memberId === member.id && record.date === today);
    if (already) {
      setResult({ type: 'success', message: `${member.name} is already marked present today.` });
      return;
    }

    setSubmitting(true);
    const now = new Date();
    const record = {
      id: `A-${Date.now()}`,
      member: member.name,
      memberId: member.id,
      memberNumber: member.attendanceNumber || number,
      date: today,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'QR check-in',
      latitude: location.latitude,
      longitude: location.longitude,
      distanceMeters: Math.round(distance),
    };

    setData((current) => ({
      ...current,
      attendance: [record, ...(current.attendance || [])],
      members: (current.members || []).map((item) => item.id === member.id ? { ...item, visits: Number(item.visits || 0) + 1 } : item),
    }));
    setSubmitting(false);
    setResult({ type: 'success', message: `Attendance marked successfully for ${member.name}.` });
    setMemberNumber('');
  };

  return (
    <div className="auth-screen" style={{ padding: '24px', minHeight: '100vh', background: '#f5f8fa' }}>
      <div className="auth-card" style={{ width: 'min(460px, 100%)' }}>
        <img src={LOGO_URL} alt="Preface Fitness" className="auth-logo" />
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <div className="eyebrow">PREFACE FITNESS</div>
          <h2 style={{ margin: '6px 0 8px' }}>Mark Attendance</h2>
          <p style={{ color: '#718096', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>Scan at the gym entrance and mark your attendance without logging into the owner dashboard.</p>
        </div>

        <div style={{ marginTop: '22px', padding: '12px 14px', borderRadius: '12px', background: location ? '#f0faf7' : '#fff8ed', border: `1px solid ${location ? '#cfece3' : '#f0dfbf'}`, color: '#53656f', fontSize: '13px' }}>
          <strong>{location ? '✓ Location detected' : 'Location required'}</strong>
          <div style={{ marginTop: '3px' }}>{locationStatus}</div>
        </div>

        <div style={{ marginTop: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '7px' }}>Member number</label>
          <input value={memberNumber} onChange={(e) => setMemberNumber(e.target.value.replace(/\D/g, '').slice(0, 8))} onKeyDown={(e) => { if (e.key === 'Enter') markPresent(); }} inputMode="numeric" autoFocus placeholder="e.g. 23" style={{ width: '100%', fontSize: '22px', textAlign: 'center', letterSpacing: '3px', padding: '13px 14px' }} />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '14px', minHeight: '48px' }} onClick={markPresent} disabled={submitting}>
          <CheckCircle2 size={18} /> {submitting ? 'Marking…' : 'Mark Present'}
        </button>

        <button className="link-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={requestLocation}>Refresh location</button>

        {result && (
          <div style={{ marginTop: '14px', padding: '13px 14px', borderRadius: '12px', background: result.type === 'success' ? '#f0faf7' : '#fff4f3', border: `1px solid ${result.type === 'success' ? '#cfece3' : '#f2d1ce'}`, color: result.type === 'success' ? '#26735f' : '#a33a32', fontSize: '13px', lineHeight: 1.5 }}>
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


function PaymentsPage({ payments, overdue, setModal, deletePayment }) {
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
              <td><button className="btn btn-danger btn-sm" onClick={() => deletePayment(payment.id)}>Delete</button></td>
            </tr>)}
            {!filteredPayments.length && <tr><td colSpan="7"><EmptyState title="No payments found" text="Try changing the filters or record a new payment." /></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}

function MembershipsPage({ members, setModal, planPrices, setData, setToast }) {
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

  const savePrices = () => {
    const cleaned = {};
    MEMBERSHIP_PLANS.forEach((plan) => {
      cleaned[plan.name] = Math.max(0, Number(draftPrices[plan.name] || 0));
    });
    setData((current) => ({
      ...current,
      settings: { ...(current.settings || {}), membershipPrices: cleaned },
    }));
    setEditingPrices(false);
    setToast('Membership plan prices updated');
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

      <div className="table-wrap">
        <table>
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
                <td><button className="btn btn-secondary btn-sm" onClick={() => setModal({ type:'renewMembership', member })}>Renew</button></td>
              </tr>;
            })}
            {!filteredMembers.length && <tr><td colSpan="8"><EmptyState title="No memberships found" text="Try changing the filters." /></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </>;
}

function RenewalModal({ member, onClose, onRenew, planPrices }) {
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

    <ModalActions onClose={onClose} disabled={!form.plan} onSave={() => onRenew({ ...form, amount:Number(form.amount || 0), paid:Number(form.paid || 0) })} saveLabel="Renew membership" />
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

function openPrintWindow(title, html) {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><meta charset="utf-8"><style>body{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#152238}*{box-sizing:border-box}@media print{.no-print{display:none!important}}</style></head><body>${html}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));</script></body></html>`);
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

function printMemberBill(member, settings) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const prefix = settings?.invoicePrefix || 'PF-INV';
  const invoice = `${prefix}-${String(member.id || '').replace(/[^a-zA-Z0-9-]/g,'')}-${today.replaceAll('-','')}`;
  const html = `
    <div style="width:820px;max-width:100%;margin:24px auto;border:1px solid #dbe3ea;border-radius:14px;overflow:hidden">
      <div style="padding:24px;background:#10233f;color:#fff;display:flex;justify-content:space-between;gap:20px"><div><div style="font-size:25px;font-weight:800">${escapeHtml(gymName)}</div><div style="margin-top:7px;opacity:.85">${escapeHtml(settings?.gymAddress || '')}</div><div style="margin-top:4px;opacity:.85">${escapeHtml(settings?.gymPhone || '')} ${settings?.gymEmail ? ' · '+escapeHtml(settings.gymEmail) : ''}</div></div><div style="text-align:right"><div style="font-size:24px;font-weight:800">INVOICE</div><div style="margin-top:8px">${escapeHtml(invoice)}</div><div>${escapeHtml(formatDate(today))}</div></div></div>
      <div style="padding:22px"><div style="font-size:13px;color:#7b899a;text-transform:uppercase;letter-spacing:.08em;font-weight:700">Bill to</div><div style="font-size:20px;font-weight:800;margin-top:5px">${escapeHtml(member.name)}</div><div style="color:#536477;margin-top:4px">Member ID: ${escapeHtml(member.id)} · ${escapeHtml(member.phone)}</div>
      <table style="width:100%;border-collapse:collapse;margin-top:24px"><thead><tr><th style="text-align:left;padding:11px;border-bottom:2px solid #dfe6ec">Description</th><th style="text-align:left;padding:11px;border-bottom:2px solid #dfe6ec">Period</th><th style="text-align:right;padding:11px;border-bottom:2px solid #dfe6ec">Amount</th></tr></thead><tbody><tr><td style="padding:14px 11px;border-bottom:1px solid #e7edf2">${escapeHtml(member.plan)} Membership</td><td style="padding:14px 11px;border-bottom:1px solid #e7edf2">${escapeHtml(formatDate(member.start))} – ${escapeHtml(formatDate(member.expiry))}</td><td style="padding:14px 11px;border-bottom:1px solid #e7edf2;text-align:right">₹${Number(member.amount||0).toLocaleString('en-IN')}</td></tr></tbody></table>
      <div style="width:330px;margin:20px 0 0 auto"><div style="display:flex;justify-content:space-between;padding:7px 0"><span>Total</span><strong>₹${Number(member.amount||0).toLocaleString('en-IN')}</strong></div><div style="display:flex;justify-content:space-between;padding:7px 0"><span>Paid</span><strong>₹${Number(member.paid||0).toLocaleString('en-IN')}</strong></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #10233f;font-size:18px"><span>Balance due</span><strong>₹${Number(member.due||0).toLocaleString('en-IN')}</strong></div></div>
      ${settings?.gstin ? `<div style="margin-top:24px;color:#66768a;font-size:12px">GSTIN: ${escapeHtml(settings.gstin)}</div>` : ''}</div>
      <div style="padding:14px 22px;background:#f7fafc;color:#657589;font-size:12px">Thank you for choosing ${escapeHtml(gymName)}.</div>
    </div>`;
  return openPrintWindow(`${gymName} - Bill ${invoice}`, html);
}

function shareBillWhatsApp(member, settings) {
  const gymName = settings?.gymName || 'Preface Fitness';
  const text = `Bill from ${gymName}%0A%0AMember: ${encodeURIComponent(member.name)}%0AMember ID: ${encodeURIComponent(member.id)}%0APlan: ${encodeURIComponent(member.plan || '')}%0ATotal: ₹${Number(member.amount||0).toLocaleString('en-IN')}%0APaid: ₹${Number(member.paid||0).toLocaleString('en-IN')}%0ABalance due: ₹${Number(member.due||0).toLocaleString('en-IN')}`;
  const phone = String(member.phone || '').replace(/\D/g, '');
  const target = phone.length === 10 ? `91${phone}` : phone;
  window.open(`https://wa.me/${target}?text=${text}`, '_blank');
}


function MemberModal({ onClose, onSave, member, planPrices, existingMemberIds = [], members = [] }) {
  const [form, setForm] = useState(() => member ? {
    ...member,
    id: member.id || '',
    due: member.due ?? 0,
    amount: member.amount ?? 0,
    paid: member.paid ?? 0,
  } : {
    id: '', attendanceNumber: '', name: '', phone: '', email: '', dob: '', gender: 'Prefer not to say', address: '',
    emergencyContact: '', dietPreference: 'Veg', referredBy: '', plan: 'Monthly', start: today, expiry: '', amount: Number(planPrices?.Monthly || 0), paid: 0,
    due: 0, height: '', weight: '', bodyFat: '', trainer: '', referral: 'Walk-in', notes: '',
  });

  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'amount' || key === 'paid') next.due = Math.max(0, Number(next.amount || 0) - Number(next.paid || 0));
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
        <label
          className="btn btn-secondary btn-sm"
          style={{ cursor: 'pointer', display: 'inline-flex' }}
        >
          {form.photo ? 'Change photo' : 'Choose photo'}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoChange(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </label>
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
    <div className="form-grid three">
      <FormField label="Membership amount"><input type="number" min="0" value={form.amount} onChange={(e) => update('amount', e.target.value)} /></FormField>
      <FormField label="Amount paid"><input type="number" min="0" value={form.paid} onChange={(e) => update('paid', e.target.value)} /></FormField>
      <FormField label="Outstanding"><input type="number" value={form.due} readOnly /></FormField>
    </div>

    <div className="form-section-title">Fitness profile</div>
    <div className="form-grid four">
      <FormField label="Height (cm)"><input type="number" min="0" value={form.height} onChange={(e) => update('height', e.target.value)} placeholder="170" /></FormField>
      <FormField label="Weight (kg)"><input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => update('weight', e.target.value)} placeholder="75" /></FormField>
      <FormField label="Body fat %"><input type="number" min="0" max="100" step="0.1" value={form.bodyFat} onChange={(e) => update('bodyFat', e.target.value)} placeholder="20" /></FormField>
      <FormField label="Trainer"><input value={form.trainer} onChange={(e) => update('trainer', e.target.value)} placeholder="Not assigned" /></FormField>
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

function PaymentModal({ members, onClose, onSave }) { 
  const [form, setForm] = useState({ member: members[0]?.name || '', amount: '', type: 'Membership', mode: 'UPI', date: today }); 
  return <Modal title="Record payment" onClose={onClose}>
    <FormField label="Member"><select value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })}>{members.map((m) => <option key={m.id}>{m.name}</option>)}</select></FormField>
    <div className="form-grid"><FormField label="Amount"><input autoFocus type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="5000" /></FormField><FormField label="Payment mode"><select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option>UPI</option><option>Cash</option><option>Card</option><option>Bank transfer</option></select></FormField></div>
    <div className="form-grid"><FormField label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Membership</option><option>PT</option><option>Class</option><option>Other</option></select></FormField><FormField label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FormField></div>
    <ModalActions onClose={onClose} disabled={!form.amount} onSave={() => onSave(form)} saveLabel="Record payment" />
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

function SettingsPage({ exportBackup, importBackup, data, setData, dbReady, resetData }) {
  const current = data.settings || {};
  const [form, setForm] = useState({
    gymName: current.gymName || 'Preface Fitness',
    gymAddress: current.gymAddress || '',
    gymPhone: current.gymPhone || '',
    gymEmail: current.gymEmail || '',
    gstin: current.gstin || '',
    invoicePrefix: current.invoicePrefix || 'PF-INV',
    referralPointsPerReferral: Number(current.referralPointsPerReferral ?? 10),
    gymLatitude: current.gymLatitude || '',
    gymLongitude: current.gymLongitude || '',
  });
  const [authForm, setAuthForm] = useState({
    username: current.auth?.username || 'admin',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    setForm({
      gymName: current.gymName || 'Preface Fitness',
      gymAddress: current.gymAddress || '',
      gymPhone: current.gymPhone || '',
      gymEmail: current.gymEmail || '',
      gstin: current.gstin || '',
      invoicePrefix: current.invoicePrefix || 'PF-INV',
      referralPointsPerReferral: Number(current.referralPointsPerReferral ?? 10),
      gymLatitude: current.gymLatitude || '',
      gymLongitude: current.gymLongitude || '',
    });
    setAuthForm((form) => ({
      ...form,
      username: current.auth?.username || 'admin',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    setAuthMessage('');
  }, [current.gymName, current.gymAddress, current.gymPhone, current.gymEmail, current.gstin, current.invoicePrefix, current.referralPointsPerReferral, current.gymLatitude, current.gymLongitude, current.auth?.username, current.auth?.passwordHash]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return setAuthMessage('This browser does not support location detection.');
    navigator.geolocation.getCurrentPosition(
      (position) => setForm((f) => ({ ...f, gymLatitude: position.coords.latitude.toFixed(7), gymLongitude: position.coords.longitude.toFixed(7) })),
      () => setAuthMessage('Could not read the current location. Allow location access and try again.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const saveGymLocation = () => {
    const lat = Number(form.gymLatitude);
    const lng = Number(form.gymLongitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setAuthMessage('Enter valid gym latitude and longitude first.');
      return;
    }
    setData((d) => ({ ...d, settings: { ...(d.settings || {}), gymLatitude: String(form.gymLatitude).trim(), gymLongitude: String(form.gymLongitude).trim() } }));
    setAuthMessage('Gym location saved.');
  };

  const qrUrl = getCheckInUrl();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=20&data=${encodeURIComponent(qrUrl)}`;

  const openQr = () => window.open(qrImageUrl, '_blank', 'noopener,noreferrer');

  const saveSettings = () => {
    setData((d) => ({
      ...d,
      settings: {
        ...(d.settings || {}),
        ...form,
        referralPointsPerReferral: Math.max(0, Number(form.referralPointsPerReferral || 0)),
      },
    }));
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
  };


  return (
    <div className="page">
      <PageTitle title="Settings" subtitle="Manage gym identity, billing details, referral rewards and local app data." />
      <div className="grid-2">
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
          <FormField label="GSTIN (optional)"><input value={form.gstin} onChange={(e) => setForm((f) => ({...f,gstin:e.target.value}))} placeholder="GSTIN" /></FormField>
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

        <section className="card">
          <div className="card-header"><div><h3>Attendance QR code</h3><p>This QR opens the password-free member check-in page.</p></div></div>
          <div style={{padding:'12px 14px',borderRadius:'12px',background:'#f7fafc',border:'1px solid #e5ebf0',fontSize:'12px',color:'#64748b',wordBreak:'break-all',lineHeight:1.5}}>{qrUrl}</div>
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'12px'}}>
            <button className="btn btn-primary" onClick={openQr}><QrCode size={17}/> Generate / open QR</button>
            <button className="btn btn-secondary" onClick={() => window.print()}><FileDown size={17}/> Print QR</button>
          </div>
          <p style={{margin:'12px 0 0',fontSize:'12px',color:'#7b8794',lineHeight:1.5}}>Print the QR and place it at the gym entrance. Members scan it with their phone camera; no owner password is required.</p>
          <div style={{marginTop:'12px',padding:'12px 14px',borderRadius:'12px',background:'#fff8ed',border:'1px solid #f0dfbf',fontSize:'12px',color:'#7a5b22',lineHeight:1.5}}><strong>Phase 1 limitation:</strong> your current app stores data in each browser's local IndexedDB. A member scanning this QR from their own phone will not write into the owner's browser database. Shared cross-device attendance needs the Phase 2 backend/database.</div>
        </section>
        <section className="card">
          <div className="card-header"><div><h3>Local database</h3><p>Data is stored in this browser.</p></div></div>
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
            <button className="btn btn-primary" onClick={exportBackup}><FileDown size={17}/> Export backup</button>
            <label className="btn btn-secondary" style={{cursor:'pointer'}}><FileUp size={17}/> Import backup<input type="file" accept=".json,application/json" onChange={importBackup} style={{display:'none'}} /></label>
            <button className="btn btn-danger" onClick={resetData}>Reset demo data</button>
          </div>
        </section>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);