import React, { useState, useEffect } from "react";
import { 
  Tenant, 
  LedgerEntry, 
  ElectricityReading, 
  PropertyExpense,
  PaymentReminder
} from "./types";
import { 
  INITIAL_TENANTS, 
  INITIAL_LEDGER, 
  INITIAL_READINGS, 
  INITIAL_EXPENSES 
} from "./data";
import Overview from "./components/Overview";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Zap, 
  TrendingDown, 
  BellRing, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  CheckCircle, 
  DollarSign, 
  X, 
  ChevronRight, 
  Sparkles, 
  Filter, 
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Settings,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  LogIn
} from "lucide-react";

import { onAuthStateChanged, User } from "firebase/auth";
import { 
  auth, 
  loginWithGoogle, 
  logout, 
  fetchUserData, 
  uploadUserData, 
  syncTenant, 
  deleteTenant, 
  syncLedger, 
  syncReading, 
  syncExpense 
} from "./firebase";

export default function App() {
  // Sync states with localStorage
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem("rm_tenants");
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem("rm_ledger");
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });
  const [readings, setReadings] = useState<ElectricityReading[]>(() => {
    const saved = localStorage.getItem("rm_readings");
    return saved ? JSON.parse(saved) : INITIAL_READINGS;
  });
  const [expenses, setExpenses] = useState<PropertyExpense[]>(() => {
    const saved = localStorage.getItem("rm_expenses");
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // Auth and Sync state
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>("");

  // Global Currency State (Default to Rupee per user request)
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem("rm_currency") || "₹";
  });

  // Track if Firebase loaded initially to prevent intermediate empty states
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean>(false);

  // Authentication observer and initial pull-sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsSyncing(true);
        setSyncStatusText("Connecting to secure cloud...");
        try {
          const cloudData = await fetchUserData(currentUser.uid);
          
          if (cloudData.tenants.length > 0 || cloudData.ledger.length > 0 || cloudData.readings.length > 0 || cloudData.expenses.length > 0) {
            // Firestore contains data. Set states
            setTenants(cloudData.tenants);
            setLedger(cloudData.ledger);
            setReadings(cloudData.readings);
            setExpenses(cloudData.expenses);
            setSyncStatusText("Synced all data to cloud.");
          } else {
            // Firestore is empty. Upload existing local cache data
            setSyncStatusText("Uploading local database to cloud...");
            await uploadUserData(currentUser.uid, {
              tenants,
              ledger,
              readings,
              expenses
            });
            setSyncStatusText("Secured to cloud database.");
          }
        } catch (error) {
          console.error("Fetch/Sync Error: ", error);
          setSyncStatusText("Connection error. Offline mode active.");
        } finally {
          setIsSyncing(false);
          setFirebaseInitialized(true);
          setTimeout(() => setSyncStatusText(""), 4000);
        }
      } else {
        // Logged out: re-enable local cache data
        const savedTenants = localStorage.getItem("rm_tenants");
        const savedLedger = localStorage.getItem("rm_ledger");
        const savedReadings = localStorage.getItem("rm_readings");
        const savedExpenses = localStorage.getItem("rm_expenses");

        setTenants(savedTenants ? JSON.parse(savedTenants) : INITIAL_TENANTS);
        setLedger(savedLedger ? JSON.parse(savedLedger) : INITIAL_LEDGER);
        setReadings(savedReadings ? JSON.parse(savedReadings) : INITIAL_READINGS);
        setExpenses(savedExpenses ? JSON.parse(savedExpenses) : INITIAL_EXPENSES);
        setSyncStatusText("");
        setFirebaseInitialized(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Save changes to local storage when state updates
  useEffect(() => {
    localStorage.setItem("rm_tenants", JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem("rm_ledger", JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem("rm_readings", JSON.stringify(readings));
  }, [readings]);

  useEffect(() => {
    localStorage.setItem("rm_expenses", JSON.stringify(expenses));
  }, [expenses]);


  // Navigation Helper
  const handleNavigate = (tab: string, targetId?: string) => {
    setActiveTab(tab);
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // ------------------ CRUD MODALS/FORMS STATE ------------------
  // Tenant Forms
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantFormData, setTenantFormData] = useState({
    name: "",
    phone: "",
    email: "",
    roomNumber: "",
    rentAmount: 1000,
    depositPaid: 1000,
    depositNotes: "",
    depositStatus: "Paid" as "Paid" | "Refunded" | "Partial",
    leaseStart: new Date().toISOString().split("T")[0],
    leaseEnd: new Date(Date.now() + 31536000000).toISOString().split("T")[0], // 1 year
    isActive: true,
    electricityRate: 0.15,
    lastMeterReading: 0,
  });

  // Ledger Forms
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerFormData, setLedgerFormData] = useState({
    tenantId: "",
    date: new Date().toISOString().split("T")[0],
    type: "charge" as "charge" | "payment",
    category: "rent" as "rent" | "electricity" | "deposit" | "maintenance" | "other",
    amount: 100,
    description: "",
    referenceNo: "",
  });

  // Electricity Forms
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [readingFormData, setReadingFormData] = useState({
    tenantId: "",
    currentValue: 0,
    readingDate: new Date().toISOString().split("T")[0],
    billingMonth: "June 2026",
  });

  // Expenses Forms
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "maintenance" as "maintenance" | "repairs" | "utilities" | "taxes" | "insurance" | "other",
    amount: 0,
    description: "",
    paidTo: "",
  });

  // AI Reminder Draft state
  const [loadingDraftId, setLoadingDraftId] = useState<string | null>(null);
  const [activeReminderDraft, setActiveReminderDraft] = useState<PaymentReminder | null>(null);
  const [reminderNote, setReminderNote] = useState<string>("");
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  // Filters State
  const [searchTermTenants, setSearchTermTenants] = useState("");
  const [filterLedgerTenant, setFilterLedgerTenant] = useState("all");
  const [filterLedgerCategory, setFilterLedgerCategory] = useState("all");
  const [filterLedgerType, setFilterLedgerType] = useState("all");


  // ------------------ BUSINESS LOGIC UTILITIES ------------------

  // Tenant Balance Calculation (Unique aggregate Ledger transactions)
  const getTenantBalance = (tenantId: string) => {
    const charges = ledger
      .filter(item => item.tenantId === tenantId && item.type === "charge")
      .reduce((sum, item) => sum + item.amount, 0);

    const payments = ledger
      .filter(item => item.tenantId === tenantId && item.type === "payment")
      .reduce((sum, item) => sum + item.amount, 0);

    return charges - payments;
  };

  // Safe reset forms
  const resetTenantForm = () => {
    setEditingTenant(null);
    setTenantFormData({
      name: "",
      phone: "",
      email: "",
      roomNumber: "",
      rentAmount: 1000,
      depositPaid: 1000,
      depositNotes: "",
      depositStatus: "Paid",
      leaseStart: new Date().toISOString().split("T")[0],
      leaseEnd: new Date(Date.now() + 31536000000).toISOString().split("T")[0],
      isActive: true,
      electricityRate: 0.15,
      lastMeterReading: 0,
    });
  };

  // Submit operations
  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantFormData.name || !tenantFormData.roomNumber) {
      alert("Name and Room Number are required.");
      return;
    }

    if (editingTenant) {
      // Editing
      const updatedTenant: Tenant = { 
        ...editingTenant, 
        ...tenantFormData,
        rentAmount: Number(tenantFormData.rentAmount),
        depositPaid: Number(tenantFormData.depositPaid),
        electricityRate: Number(tenantFormData.electricityRate),
        lastMeterReading: Number(tenantFormData.lastMeterReading)
      };
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? updatedTenant : t));
      if (user) {
        syncTenant(user.uid, updatedTenant);
      }
    } else {
      // Create new tenant
      const newId = `t-${Date.now()}`;
      const newTenant: Tenant = {
        id: newId,
        ...tenantFormData,
        rentAmount: Number(tenantFormData.rentAmount),
        depositPaid: Number(tenantFormData.depositPaid),
        electricityRate: Number(tenantFormData.electricityRate),
        lastMeterReading: Number(tenantFormData.lastMeterReading)
      };
      setTenants(prev => [...prev, newTenant]);
      if (user) {
        syncTenant(user.uid, newTenant);
      }

      // Automatically post deposit charge & payment if configured
      if (newTenant.depositPaid > 0 && newTenant.depositStatus === "Paid") {
        const depositCharge: LedgerEntry = {
          id: `l-ch-${Date.now()}`,
          tenantId: newId,
          date: tenantFormData.leaseStart,
          type: "charge",
          category: "deposit",
          amount: newTenant.depositPaid,
          description: "Security Deposit Charge",
        };
        const depositPayment: LedgerEntry = {
          id: `l-py-${Date.now()}`,
          tenantId: newId,
          date: tenantFormData.leaseStart,
          type: "payment",
          category: "deposit",
          amount: newTenant.depositPaid,
          description: "Security Deposit Paid",
        };
        setLedger(prev => [...prev, depositCharge, depositPayment]);
        if (user) {
          syncLedger(user.uid, depositCharge);
          syncLedger(user.uid, depositPayment);
        }
      }

      // Automatically post first month rent charge
      const firstRent: LedgerEntry = {
        id: `l-rent-${Date.now()}`,
        tenantId: newId,
        date: tenantFormData.leaseStart,
        type: "charge",
        category: "rent",
        amount: newTenant.rentAmount,
        description: `Initial Rent Charge Upon Onboarding (Room ${newTenant.roomNumber})`,
      };
      setLedger(prev => [...prev, firstRent]);
      if (user) {
        syncLedger(user.uid, firstRent);
      }
    }

    setShowTenantModal(false);
    resetTenantForm();
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantFormData({
      name: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      roomNumber: tenant.roomNumber,
      rentAmount: tenant.rentAmount,
      depositPaid: tenant.depositPaid,
      depositNotes: tenant.depositNotes,
      depositStatus: tenant.depositStatus,
      leaseStart: tenant.leaseStart,
      leaseEnd: tenant.leaseEnd,
      isActive: tenant.isActive,
      electricityRate: tenant.electricityRate,
      lastMeterReading: tenant.lastMeterReading,
    });
    setShowTenantModal(true);
  };

  const handleDeleteTenant = (id: string) => {
    if (confirm("Are you sure you want to remove this tenant? This does not delete their historical ledger, but keeps records clean.")) {
      setTenants(prev => prev.filter(t => t.id !== id));
      if (user) {
        deleteTenant(user.uid, id);
      }
    }
  };

  // Submit Ledger Entry
  const handleSaveLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerFormData.tenantId || !ledgerFormData.amount) {
      alert("Please select a tenant and enter direct amount.");
      return;
    }

    const t = tenants.find(x => x.id === ledgerFormData.tenantId);
    const newId = `l-${Date.now()}`;
    const newEntry: LedgerEntry = {
      id: newId,
      tenantId: ledgerFormData.tenantId,
      date: ledgerFormData.date,
      type: ledgerFormData.type,
      category: ledgerFormData.category,
      amount: Number(ledgerFormData.amount),
      description: ledgerFormData.description || `${ledgerFormData.type === "charge" ? "Charge" : "Payment"} of ${ledgerFormData.category} for Room ${t?.roomNumber || ""}`,
      referenceNo: ledgerFormData.referenceNo || undefined,
    };

    setLedger(prev => [newEntry, ...prev]);
    if (user) {
      syncLedger(user.uid, newEntry);
    }
    setShowLedgerModal(false);
    // Reset ledger state
    setLedgerFormData(prev => ({
      ...prev,
      amount: 100,
      description: "",
      referenceNo: "",
    }));
  };

  // Record Electricity Meter Reading
  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    const { tenantId, currentValue, readingDate, billingMonth } = readingFormData;
    if (!tenantId || currentValue === 0) {
      alert("Invalid reading parameters.");
      return;
    }

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    if (currentValue < tenant.lastMeterReading) {
      alert(`Error: New reading (${currentValue}) cannot be lower than previous recorded reading (${tenant.lastMeterReading} kWh).`);
      return;
    }

    const unitsConsumed = currentValue - tenant.lastMeterReading;
    const amount = unitsConsumed * tenant.electricityRate;

    const newReading: ElectricityReading = {
      id: `er-${Date.now()}`,
      tenantId,
      readingDate,
      previousReading: tenant.lastMeterReading,
      currentReading: currentValue,
      unitsConsumed,
      ratePerUnit: tenant.electricityRate,
      amount,
      billingMonth,
      isPostedToLedger: false,
    };

    // Update Readings list
    setReadings(prev => [newReading, ...prev]);
    if (user) {
      syncReading(user.uid, newReading);
    }

    // Update Tenant's internal lastMeterReading marker
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const ut = { ...t, lastMeterReading: currentValue };
        if (user) {
          syncTenant(user.uid, ut);
        }
        return ut;
      }
      return t;
    }));

    setShowReadingModal(false);
    setReadingFormData(prev => ({
      ...prev,
      tenantId: "",
      currentValue: 0,
    }));
  };

  // Post Electricity bill to ledger
  const postReadingToLedger = (reading: ElectricityReading) => {
    const tenant = tenants.find(t => t.id === reading.tenantId);
    if (!tenant) return;

    // Post charge
    const chargeEntry: LedgerEntry = {
      id: `l-ch-elec-${Date.now()}`,
      tenantId: reading.tenantId,
      date: reading.readingDate,
      type: "charge",
      category: "electricity",
      amount: reading.amount,
      description: `Electricity reading charge [${reading.billingMonth}]: ${reading.unitsConsumed} unit(s) consumed. Reading ${reading.previousReading} -> ${reading.currentReading} @ ${currency}${reading.ratePerUnit}/unit`,
    };

    setLedger(prev => [chargeEntry, ...prev]);
    if (user) {
      syncLedger(user.uid, chargeEntry);
    }

    // Mark as posted to prevent double posting
    setReadings(prev => prev.map(r => {
      if (r.id === reading.id) {
        const ur = { ...r, isPostedToLedger: true };
        if (user) {
          syncReading(user.uid, ur);
        }
        return ur;
      }
      return r;
    }));
  };

  // Submit Expense record
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseFormData.amount || !expenseFormData.description) {
      alert("Please fill in amount and description.");
      return;
    }

    const newExp: PropertyExpense = {
      id: `exp-${Date.now()}`,
      date: expenseFormData.date,
      category: expenseFormData.category,
      amount: Number(expenseFormData.amount),
      description: expenseFormData.description,
      paidTo: expenseFormData.paidTo || "Self / Miscellaneous",
    };

    setExpenses(prev => [newExp, ...prev]);
    if (user) {
      syncExpense(user.uid, newExp);
    }
    setShowExpenseModal(false);
    setExpenseFormData(prev => ({
      ...prev,
      amount: 0,
      description: "",
      paidTo: "",
    }));
  };

  // Calculate customized smart metrics for AI reminders
  const generateAIReminder = async (tenant: Tenant) => {
    setLoadingDraftId(tenant.id);
    setActiveReminderDraft(null);

    // Compute metrics
    const outstanding = getTenantBalance(tenant.id);
    const rentDue = tenant.rentAmount;
    
    // Last unposted reading balance
    const unpostedElec = readings
      .filter(r => r.tenantId === tenant.id && !r.isPostedToLedger)
      .reduce((sum, r) => sum + r.amount, 0);

    const otherDue = Math.max(0, outstanding - rentDue - unpostedElec);

    // Fetch from local node server route (fallback to cloud host when running under android container)
    try {
      const isCapacitor = typeof window !== "undefined" && (window as any).Capacitor;
      const apiBase = isCapacitor 
        ? "https://ais-pre-k5vq6a25wn26qwo35tuvh6-969939221440.asia-southeast1.run.app" 
        : "";
      const response = await fetch(`${apiBase}/api/reminders/generate-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantName: tenant.name,
          roomNumber: tenant.roomNumber,
          rentDue,
          electricityDue: unpostedElec,
          otherDue,
          depositDetails: {
            amount: tenant.depositPaid,
            status: tenant.depositStatus
          },
          ledgerSummary: `The total ledger outstanding is ${currency}${outstanding.toFixed(2)}. Unposted electric invoice stands at ${currency}${unpostedElec.toFixed(2)}.`
        })
      });

      if (!response.ok) {
        throw new Error("Server error while generating automated message.");
      }

      const data = await response.json();
      
      const newDraft: PaymentReminder = {
        id: `rem-${Date.now()}`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        roomNumber: tenant.roomNumber,
        email: tenant.email,
        phone: tenant.phone,
        totalDue: outstanding + unpostedElec,
        electricityDue: unpostedElec,
        rentDue,
        otherDue,
        draftSubject: data.subject,
        draftBody: data.body,
        status: 'Draft'
      };

      setActiveReminderDraft(newDraft);
      setReminderNote(data.body);
    } catch (err) {
      console.error(err);
      alert("Failed to contact the automated AI generator. Please verify server state.");
    } finally {
      setLoadingDraftId(null);
    }
  };

  const handleSendReminder = (channel: 'email' | 'phone') => {
    if (!activeReminderDraft) return;

    // Simulate sending email/sms
    const statusText = channel === 'email' ? `Email Notification successfully dispatched to ${activeReminderDraft.email}` : `SMS Reminder successfully sent to ${activeReminderDraft.phone}`;
    setNotificationSuccess(statusText);
    
    // Create actual ledger tracking or update status
    setActiveReminderDraft(prev => prev ? { ...prev, status: 'Sent', sentAt: new Date().toLocaleTimeString() } : null);
    
    setTimeout(() => {
      setNotificationSuccess(null);
      setActiveReminderDraft(null);
    }, 4000);
  };

  // Render variables/lookups
  const tenantsWithDues = tenants.map(t => ({
    ...t,
    currentBalance: getTenantBalance(t.id),
    unpostedElectric: readings.filter(r => r.tenantId === t.id && !r.isPostedToLedger).reduce((sum, x) => sum + x.amount, 0),
  }));

  const filteredTenants = tenantsWithDues.filter(t => 
    t.name.toLowerCase().includes(searchTermTenants.toLowerCase()) ||
    t.roomNumber.toLowerCase().includes(searchTermTenants.toLowerCase())
  );

  const filteredLedger = ledger.filter(item => {
    const matchesTenant = filterLedgerTenant === "all" || item.tenantId === filterLedgerTenant;
    const matchesCategory = filterLedgerCategory === "all" || item.category === filterLedgerCategory;
    const matchesType = filterLedgerType === "all" || item.type === filterLedgerType;
    return matchesTenant && matchesCategory && matchesType;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden" id="main-view-container">
      {/* SIDEBAR NAVIGATION - MATCHING PROFESSIONAL POLISH THEME */}
      {isSidebarOpen && (
        <aside className="w-64 bg-slate-900 flex flex-col h-full shrink-0 border-r border-slate-800" id="sidebar-panel">
        <div className="p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs shadow-indigo-500/50">RM</div>
            <div>
              <span className="text-white font-semibold text-base tracking-tight block">RentMaster Pro</span>
              <span className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase">Automation Engine</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" id="sidebar-nav">
          <button
            onClick={() => handleNavigate("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "dashboard" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => handleNavigate("tenants")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tenants" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Tenants & Deposits
          </button>

          <button
            onClick={() => handleNavigate("ledger")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "ledger" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            General Ledger
          </button>

          <button
            onClick={() => handleNavigate("electricity")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "electricity" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            Utility Meters
          </button>

          <button
            onClick={() => handleNavigate("expenses")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "expenses" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Expense Journal
          </button>

          <button
            onClick={() => handleNavigate("reminders")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "reminders" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BellRing className="w-4 h-4" />
            AI rent reminders
          </button>

          <button
            onClick={() => handleNavigate("settings")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "settings" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            id="settings-tab-btn"
          >
            <Settings className="w-4 h-4" />
            System Settings
          </button>
        </nav>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950/40">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Automation Status</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-white font-medium">Auto-Reminders Ready</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1.5 font-mono">UTC: 2026-06-11</p>
          </div>
        </div>
      </aside>
      )}

      {/* MAIN CONTENT SPACE */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center border border-slate-200 mr-2"
              title="Toggle Navigation"
              id="settings-sidebar-toggle-btn"
            >
              <Settings className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight capitalize">{activeTab}</h1>
            <span className="text-[11px] font-mono text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-sm">ADMIN PORTAL</span>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "tenants" && (
              <button 
                onClick={() => { resetTenantForm(); setShowTenantModal(true); }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Register Tenant
              </button>
            )}
            {activeTab === "ledger" && (
              <button 
                onClick={() => setShowLedgerModal(true)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Book Ledger Item
              </button>
            )}
            {activeTab === "electricity" && (
              <button 
                onClick={() => setShowReadingModal(true)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Log sub-meter
              </button>
            )}
            {activeTab === "expenses" && (
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Book Expense
              </button>
            )}
            {/* GOOGLE CLOUD SYNC CONTROLS */}
            <div className="flex items-center gap-3">
              {syncStatusText && (
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-500 font-medium font-mono">{syncStatusText}</span>
                </div>
              )}

              {user ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl pr-3 shadow-3xs" id="synced-user-widget">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      className="w-7 h-7 rounded-md object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase">
                      {user.email?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-slate-700 max-w-[120px] truncate leading-tight">
                      {user.displayName || user.email || "Active User"}
                    </span>
                    <span className="text-[8.5px] text-emerald-600 font-mono font-bold flex items-center gap-0.5">
                      <Cloud className="w-2.5 h-2.5 shrink-0" /> CLOUD ACTIVE
                    </span>
                  </div>
                  <button 
                    onClick={logout}
                    className="ml-2 p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-all"
                    title="Disconnect Sync Account"
                    id="signout-sync-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={loginWithGoogle}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all border border-indigo-500/30"
                  title="Sign In with Google to Sync Across Devices"
                  id="google-signin-btn"
                >
                  <LogIn className="w-3.5 h-3.5" /> 
                  <span className="hidden sm:inline">Connect Google Backup</span>
                  <span className="inline sm:hidden">Cloud Sync</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* ACTIVE TAB RENDER ENGINE */}
          {activeTab === "dashboard" && (
            <Overview 
              tenants={tenants} 
              ledger={ledger} 
              expenses={expenses} 
              onNavigate={handleNavigate} 
              currency={currency}
            />
          )}

          {/* TENANTS MANAGEMENT SCREEN */}
          {activeTab === "tenants" && (
            <div className="space-y-6" id="tenants-screen">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Registered Renters</h3>
                    <p className="text-xs text-slate-500">Add, view, and organize leases and safety deposit status.</p>
                  </div>
                  {/* Search bar */}
                  <div className="relative max-w-sm w-full">
                    <input 
                      type="text" 
                      placeholder="Search name, room or contact..." 
                      value={searchTermTenants}
                      onChange={(e) => setSearchTermTenants(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-slate-50 pl-3 pr-10 py-2 border border-slate-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                        <th className="px-6 py-4">Renter & Unit</th>
                        <th className="px-6 py-4">Contact Info</th>
                        <th className="px-6 py-4">Security Deposit Details</th>
                        <th className="px-6 py-4">Monthly Rent Basis</th>
                        <th className="px-6 py-4">Account Balance</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {filteredTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/55 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${t.isActive ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                                <div className="text-xs text-slate-500 font-medium font-mono">{t.roomNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-mono text-slate-700">{t.email}</div>
                            <div className="text-[11px] text-slate-400">{t.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold font-mono text-slate-800">{currency}{t.depositPaid.toFixed(2)}</span>
                              <span className={`text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 border ${
                                t.depositStatus === 'Paid' 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                  : t.depositStatus === 'Partial' 
                                    ? "bg-amber-50 text-amber-700 border-amber-100" 
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}>
                                {t.depositStatus}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 max-w-[170px] truncate" title={t.depositNotes}>
                              {t.depositNotes || "No deposit notes documented."}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 font-mono">{currency}{t.rentAmount.toFixed(2)}/mo</div>
                            <div className="text-[10px] text-slate-400">
                              Lease: {t.leaseStart} to {t.leaseEnd}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-semibold font-mono text-xs ${t.currentBalance > 0 ? "text-amber-600" : t.currentBalance < 0 ? "text-emerald-600" : "text-slate-500"}`}>
                              {t.currentBalance > 0 
                                ? `Due ${currency}${t.currentBalance.toFixed(2)}` 
                                : t.currentBalance < 0 
                                  ? `Overpaid ${currency}${Math.abs(t.currentBalance).toFixed(2)}` 
                                  : "Fully Cleared"
                              }
                            </div>
                            {t.unpostedElectric > 0 && (
                              <div className="text-[10px] text-indigo-500 font-semibold font-mono mt-0.5 flex items-center gap-0.5">
                                <Zap className="h-2.5 w-2.5" /> +{currency}{t.unpostedElectric.toFixed(2)} electricity pending
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => handleEditTenant(t)}
                              className="p-1 px-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-[11px] font-medium transition-all"
                            >
                              Edit/Deposit
                            </button>
                            <button 
                              onClick={() => handleDeleteTenant(t.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredTenants.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 italic text-xs">
                            No registered renters matched your search parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* GENERAL LEDGER SCREEN */}
          {activeTab === "ledger" && (
            <div className="space-y-6" id="ledger-screen">
              {/* Filter controls bar */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Filter className="h-3.5 w-3.5 text-indigo-500" /> Filters:
                  </div>

                  {/* Tenant lookup */}
                  <select 
                    value={filterLedgerTenant} 
                    onChange={(e) => setFilterLedgerTenant(e.target.value)}
                    className="bg-slate-50 text-xs border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Renters</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.roomNumber})</option>
                    ))}
                  </select>

                  {/* Category lookup */}
                  <select 
                    value={filterLedgerCategory} 
                    onChange={(e) => setFilterLedgerCategory(e.target.value)}
                    className="bg-slate-50 text-xs border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="rent">Rent</option>
                    <option value="electricity">Electricity</option>
                    <option value="deposit">Deposit</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>

                  {/* Type Filter */}
                  <select 
                    value={filterLedgerType} 
                    onChange={(e) => setFilterLedgerType(e.target.value)}
                    className="bg-slate-50 text-xs border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">Charges & Payments</option>
                    <option value="charge">Charges (Bills) Only</option>
                    <option value="payment">Payments Received Only</option>
                  </select>
                </div>

                <div className="text-xs text-slate-500 font-mono font-semibold">
                  Filtered Items: {filteredLedger.length}
                </div>
              </div>

              {/* Core Ledger table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                      <th className="px-6 py-4">Transaction Date</th>
                      <th className="px-6 py-4">Renter / Space</th>
                      <th className="px-6 py-4">Flow/Type</th>
                      <th className="px-6 py-4">category</th>
                      <th className="px-6 py-4">Invoice / payment Info</th>
                      <th className="px-6 py-4 text-right">Amnt USD</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 font-mono">
                    {filteredLedger.map((item) => {
                      const t = tenants.find(x => x.id === item.tenantId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                            {item.date}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-sans font-semibold text-slate-900">{t?.name || "Historical Tenant"}</div>
                            <div className="text-xs text-slate-400 font-mono italic">{t?.roomNumber || "Removed Room"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase rounded-md px-2 py-0.5 border ${
                              item.type === "charge" 
                                ? "bg-amber-50 text-amber-700 border-amber-100" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs capitalize font-sans font-medium text-slate-600">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 text-xs font-sans text-slate-700">
                            <div className="font-medium">{item.description}</div>
                            {item.referenceNo && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {item.referenceNo}</div>
                            )}
                          </td>
                          <td className={`px-6 py-4 text-right font-bold font-mono ${
                            item.type === "charge" ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {item.type === "charge" ? "+" : "-"}{currency}{item.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLedger.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 italic text-xs font-sans">
                          No transactions documented under chosen search parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ELECTRICITY METERS SCREEN */}
          {activeTab === "electricity" && (
            <div className="space-y-6" id="electricity-screen">
              {/* Alert notice */}
              <div className="bg-sky-50 border border-sky-250 p-4 rounded-xl flex items-start gap-3">
                <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <h4 className="font-bold text-slate-800">Sub-Meter Electricity Tracking Guidance</h4>
                  <p>Each room has a digital electricity meter. To calculate billing correctly, periodically input reading values here. Usage units consume energy relative to the renter's defined rate per unit ({currency}/kWh).</p>
                  <p className="font-semibold text-indigo-700">Once recorded, make sure to click "Post to Ledger" to charge the tenant's invoice account balance.</p>
                </div>
              </div>

              {/* Grid of rooms and state */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tenants.filter(t => t.isActive).map(t => {
                  const unpostedReadingsCount = readings.filter(r => r.tenantId === t.id && !r.isPostedToLedger).length;
                  return (
                    <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-full">{t.roomNumber}</span>
                          <h4 className="font-bold text-slate-800 mt-1.5">{t.name}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Rate</p>
                          <p className="text-xs font-bold font-mono text-slate-700">{currency}{t.electricityRate}/kWh</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium font-sans uppercase">Previous Reading</p>
                          <p className="text-sm font-bold font-mono text-slate-800">{t.lastMeterReading} kWh</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-600 font-semibold uppercase">Pending Charges</p>
                          <p className="text-sm font-bold font-mono text-indigo-700">
                            {unpostedReadingsCount} item(s)
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setReadingFormData({
                            tenantId: t.id,
                            currentValue: t.lastMeterReading,
                            readingDate: new Date().toISOString().split("T")[0],
                            billingMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                          });
                          setShowReadingModal(true);
                        }}
                        className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all"
                      >
                        Enter New Meter Value
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Readings list table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                <h3 className="text-base font-bold text-slate-900">Historical Meter Logs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                        <th className="px-6 py-3">Log Date</th>
                        <th className="px-6 py-3">Tenant & Room</th>
                        <th className="px-6 py-3">Prev kWh</th>
                        <th className="px-6 py-3">Curr kWh</th>
                        <th className="px-6 py-3">Consumption</th>
                        <th className="px-6 py-3">Calculated Cost</th>
                        <th className="px-6 py-3 text-right">ledger Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-100 font-mono">
                      {readings.map((r) => {
                        const t = tenants.find(x => x.id === r.tenantId);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3 text-slate-500 font-semibold">{r.readingDate}</td>
                            <td className="px-6 py-3">
                              <span className="font-sans font-semibold text-slate-800">{t?.name || "Deactivated"}</span>
                              <span className="text-[10px] font-mono block text-slate-400">{t?.roomNumber || "N/A"}</span>
                            </td>
                            <td className="px-6 py-3 text-slate-600">{r.previousReading} kWh</td>
                            <td className="px-6 py-3 text-slate-800">{r.currentReading} kWh</td>
                            <td className="px-6 py-3 font-semibold text-slate-700">+{r.unitsConsumed} unit(s)</td>
                            <td className="px-6 py-3 font-bold text-indigo-700">{currency}{r.amount.toFixed(2)}</td>
                            <td className="px-6 py-3 text-right">
                              {r.isPostedToLedger ? (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md px-2 py-1 border border-emerald-150 inline-flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Posted
                                </span>
                              ) : (
                                <button 
                                  onClick={() => postReadingToLedger(r)}
                                  className="px-2.5 py-1 bg-indigo-550 hover:bg-indigo-650 font-bold bg-indigo-600 text-white rounded-md text-[10px] uppercase shadow-xs transition-all"
                                >
                                  Post to Ledger
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {readings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-6 italic text-slate-400 text-xs font-sans">
                            No meter reading entries have been logged in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* EXPENSES SCREEN */}
          {activeTab === "expenses" && (
            <div className="space-y-6" id="expenses-screen">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Property Expenses Journal</h3>
                    <p className="text-xs text-slate-500">Record maintenance hardware cost, taxes, utilities, and locks.</p>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold font-mono">
                    Total Overhead Outlay: {currency}{expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                        <th className="px-6 py-4">Expense Date</th>
                        <th className="px-6 py-4">overhead category</th>
                        <th className="px-6 py-4">Overhead Description</th>
                        <th className="px-6 py-4 font-mono">Paid To service</th>
                        <th className="px-6 py-4 text-right">Debit Cash out</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-100 font-mono">
                      {expenses.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-500">{e.date}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase rounded-md px-2.5 py-0.5 border ${
                              e.category === 'repairs' 
                                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                : e.category === 'maintenance' 
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {e.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-sans text-slate-800 font-medium">
                            {e.description}
                          </td>
                          <td className="px-6 py-4 font-sans text-slate-600">
                            {e.paidTo}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-rose-600 font-mono">
                            -{currency}{e.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-400 italic text-xs font-sans">
                            No building expenses have been loaded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RENT REMINDERS TAB - AI POWERED */}
          {activeTab === "reminders" && (
            <div className="space-y-6" id="reminders-screen">
              {/* Feature card description */}
              <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-550 rounded-xl bg-indigo-750">
                    <Sparkles className="h-5 w-5 text-indigo-300 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Automated AI Monthly Rent Reminders</h3>
                    <p className="text-xs text-indigo-200">Review ledger outstanding, verify submeters, and trigger customized tenant notifications using Gemini intelligence.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-indigo-950 font-sans text-xs">
                  <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-800 text-white">
                    <h5 className="font-bold flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400"></span> 1. Complete Ledger Checks</h5>
                    <p className="text-[11px] text-indigo-200 mt-1">Outstanding calculations include electricity posted bills.</p>
                  </div>
                  <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-800 text-white">
                    <h5 className="font-bold flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-400"></span> 2. Customize Drafts</h5>
                    <p className="text-[11px] text-indigo-200 mt-1">Review the AI writing to modify messages before hitting send.</p>
                  </div>
                  <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-800 text-white">
                    <h5 className="font-bold flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400"></span> 3. Copy / Dispatch Logs</h5>
                    <p className="text-[11px] text-indigo-200 mt-1">Mark messages as sent to track notification history details.</p>
                  </div>
                </div>
              </div>

              {/* Content Split: Left list, Right draft preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Active Tenant list */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="font-bold text-slate-800">Draft Status Tracker</h4>
                  
                  <div className="space-y-3">
                    {tenants.filter(t => t.isActive).map(t => {
                      const rentBasis = t.rentAmount;
                      const balance = getTenantBalance(t.id);
                      const isGenerating = loadingDraftId === t.id;

                      return (
                        <div key={t.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-150 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm">{t.roomNumber}</span>
                              <h5 className="font-bold text-slate-800">{t.name}</h5>
                            </div>
                            
                            <div className="flex gap-4 mt-2 text-[11px] text-slate-500 font-mono">
                              <span>Rent: <b>{currency}{rentBasis}</b></span>
                              <span>Ledger Bal: <b className={balance > 0 ? "text-amber-600" : "text-emerald-600"}>{currency}{balance.toFixed(2)}</b></span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isGenerating ? (
                              <button disabled className="px-4 py-2 bg-slate-150 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1 border border-slate-200">
                                <span className="h-2 w-2 rounded-full bg-slate-400 animate-ping"></span>
                                Drafting with Gemini...
                              </button>
                            ) : (
                              <button 
                                onClick={() => generateAIReminder(t)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                                Draft AI reminder
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Draft Workspace & Sender */}
                <div className="lg:col-span-5 space-y-6">
                  {notificationSuccess && (
                     <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{notificationSuccess}</span>
                     </div>
                  )}

                  {activeReminderDraft ? (
                    <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">AI Draft Workspace</p>
                          <h4 className="font-bold text-slate-800">Room {activeReminderDraft.roomNumber} - {activeReminderDraft.tenantName}</h4>
                        </div>
                        <button 
                          onClick={() => setActiveReminderDraft(null)}
                          className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Info Summary */}
                      <div className="bg-indigo-50/50 p-3 rounded-lg text-[11px] text-slate-700 space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span>Computed Rent:</span>
                          <span>{currency}{activeReminderDraft.rentDue.toFixed(2)}</span>
                        </div>
                        {activeReminderDraft.electricityDue > 0 && (
                          <div className="flex justify-between text-indigo-700 font-semibold">
                            <span>Electricity sub-meter total:</span>
                            <span>+{currency}{activeReminderDraft.electricityDue.toFixed(2)}</span>
                          </div>
                        )}
                        {activeReminderDraft.otherDue > 0 && (
                          <div className="flex justify-between">
                            <span>Other balance adjustments:</span>
                            <span>+{currency}{activeReminderDraft.otherDue.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-indigo-100/80 my-1 pt-1 flex justify-between font-bold text-xs text-slate-850">
                          <span>Total Statement Balance:</span>
                          <span>{currency}{activeReminderDraft.totalDue.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Custom input fields */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Generated Subject</label>
                          <input 
                            type="text" 
                            value={activeReminderDraft.draftSubject}
                            onChange={(e) => setActiveReminderDraft(prev => prev ? { ...prev, draftSubject: e.target.value } : null)}
                            className="w-full text-xs text-slate-800 bg-slate-50 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-mono">Generative body template</label>
                          <textarea 
                            rows={8}
                            value={reminderNote}
                            onChange={(e) => setReminderNote(e.target.value)}
                            className="w-full text-xs text-slate-800 bg-slate-50 p-2.5 border border-slate-200 rounded-lg font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white leading-relaxed font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                          onClick={() => handleSendReminder('email')}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all"
                        >
                          Email Copy Statement
                        </button>
                        <button 
                          onClick={() => handleSendReminder('phone')}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all"
                        >
                          SMS Text dispatch
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100 rounded-2xl p-6 text-center border border-dashed border-slate-300">
                      <p className="text-slate-400 text-xs italic">Select any tenant to generate a custom statement draft with Gemini model.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* SYSTEM SETTINGS SCREEN */}
          {activeTab === "settings" && (
            <div className="space-y-6" id="settings-screen">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-base font-bold text-slate-900">System Preferences</h3>
                  <p className="text-xs text-slate-500">Configure global app options, preferred currencies, and cloud connectivity.</p>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">Global Currency Preference</label>
                    <p className="text-slate-500 text-xs mb-3">Select the default currency symbol utilized across the dashboard, financial statements, and receipts.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { symbol: "₹", name: "Indian Rupee (₹)", code: "INR" },
                        { symbol: "$", name: "US Dollar ($)", code: "USD" },
                        { symbol: "€", name: "Euro (€)", code: "EUR" },
                        { symbol: "£", name: "British Pound (£)", code: "GBP" },
                        { symbol: "¥", name: "Yen (¥)", code: "JPY" },
                        { symbol: "AED", name: "UAE Dirham (AED)", code: "AED" },
                        { symbol: "A$", name: "Australian Dollar (A$)", code: "AUD" },
                        { symbol: "C$", name: "Canadian Dollar (C$)", code: "CAD" },
                      ].map((curr) => (
                        <button
                          key={curr.symbol}
                          onClick={() => {
                            setCurrency(curr.symbol);
                            localStorage.setItem("rm_currency", curr.symbol);
                          }}
                          className={`p-4 rounded-xl border text-left font-sans transition-all flex flex-col justify-between h-24 ${
                            currency === curr.symbol
                              ? "bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-xs scale-[1.02]"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-medium"
                          }`}
                          id={`currency-btn-${curr.code}`}
                        >
                          <span className="text-xl font-mono block font-bold">{curr.symbol}</span>
                          <div>
                            <span className="text-[11px] block tracking-tight">{curr.name}</span>
                            <span className="text-[8.5px] font-mono text-slate-400 block uppercase">{curr.code}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2 mt-4 font-mono text-xs">
                    <p className="font-sans font-bold text-slate-705 text-slate-700">Preview Layout (Real-time formatting):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-sans">Monthly Rent</span>
                        <span className="text-sm font-bold text-slate-800">{currency}12,500.00</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-sans">Overdue Balance</span>
                        <span className="text-sm font-bold text-amber-600">Due {currency}350.00</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-sans">Collected Funds</span>
                        <span className="text-sm font-bold text-emerald-600">{currency}85,200.00</span>
                      </div>
                    </div>
                  </div>

                  {user && (
                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 mt-6">
                      <Cloud className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <h4 className="font-bold text-emerald-950 text-xs">Cloud Preference Protection</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          Settings preferences are stored locally and will sync as the baseline for room accounts managed under <strong>{user?.email}</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ------------------- CORE EDITING & CREATING FLOW MODALS ------------------- */}
      
      {/* 1. REGISTER/EDIT TENANT MODAL */}
      {showTenantModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">
                {editingTenant ? "Modify Renter & Leases" : "Register New Renter Space"}
              </h3>
              <button 
                onClick={() => { setShowTenantModal(false); resetTenantForm(); }}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Renter Legal Name</label>
                  <input 
                    type="text"
                    required
                    value={tenantFormData.name}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned Room / Unit</label>
                  <input 
                    type="text"
                    required
                    value={tenantFormData.roomNumber}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Apt 305"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Primary Email Address</label>
                  <input 
                    type="email"
                    value={tenantFormData.email}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mobile Contact Phone</label>
                  <input 
                    type="text"
                    value={tenantFormData.phone}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="+1 (555) 0122-392"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Monthly Rent Basis ({currency}/mo)</label>
                  <input 
                    type="number"
                    required
                    value={tenantFormData.rentAmount}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, rentAmount: Number(e.target.value) }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sub-meter Electricity Rate ({currency}/kWh)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={tenantFormData.electricityRate}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, electricityRate: Number(e.target.value) }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Security Deposit Area */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Deposit Paid Amount ({currency})</label>
                    <input 
                      type="number"
                      value={tenantFormData.depositPaid}
                      onChange={(e) => setTenantFormData(prev => ({ ...prev, depositPaid: Number(e.target.value) }))}
                      className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Deposit Status</label>
                    <select 
                      value={tenantFormData.depositStatus}
                      onChange={(e) => setTenantFormData(prev => ({ ...prev, depositStatus: e.target.value as any }))}
                      className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Paid">Paid in Full</option>
                      <option value="Partial">Partial / Pending</option>
                      <option value="Refunded">Refunded / Returned</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Deposit Safe & Escrow Notes</label>
                  <input 
                    type="text"
                    value={tenantFormData.depositNotes}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, depositNotes: e.target.value }))}
                    placeholder="Reference bank receipt or cash details..."
                    className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Lease Start Date</label>
                  <input 
                    type="date"
                    value={tenantFormData.leaseStart}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, leaseStart: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Lease End Date</label>
                  <input 
                    type="date"
                    value={tenantFormData.leaseEnd}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, leaseEnd: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Current meter start value (kWh)</label>
                  <input 
                    type="number"
                    value={tenantFormData.lastMeterReading}
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, lastMeterReading: Number(e.target.value) }))}
                    className="w-full text-xs text-slate-800 p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input 
                    type="checkbox"
                    checked={tenantFormData.isActive}
                    id="isActiveCheckbox"
                    onChange={(e) => setTenantFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="accent-indigo-600 h-4 w-4"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Active Lease Occupied
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => { setShowTenantModal(false); resetTenantForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold rounded-lg hover:bg-slate-50 transition-all text-xs"
                >
                  Dismiss
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all text-xs"
                >
                  Save Lease Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. POST GENERAL LEDGER MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Post Transaction</h3>
              <button 
                onClick={() => setShowLedgerModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLedger} className="space-y-4 font-sans text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Active Tenant</label>
                <select 
                  required
                  value={ledgerFormData.tenantId}
                  onChange={(e) => setLedgerFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose lease --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Flow Type</label>
                  <select 
                    value={ledgerFormData.type}
                    onChange={(e) => setLedgerFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="charge">Charge (Due Balance addition)</option>
                    <option value="payment">Payment Received (Rent collected)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category</label>
                  <select 
                    value={ledgerFormData.category}
                    onChange={(e) => {
                      const computedDesc = e.target.value === "rent" ? "Monthly Rent Bill" : e.target.value === "electricity" ? "Electricity service utility bill" : "";
                      setLedgerFormData(prev => ({ ...prev, category: e.target.value as any, description: computedDesc }));
                    }}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="rent">Rent</option>
                    <option value="electricity">Electricity</option>
                    <option value="deposit">Deposit</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Transaction Amount ({currency})</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={ledgerFormData.amount}
                    onChange={(e) => setLedgerFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Transaction Date</label>
                  <input 
                    type="date"
                    required
                    value={ledgerFormData.date}
                    onChange={(e) => setLedgerFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Statement Description</label>
                <input 
                  type="text"
                  required
                  value={ledgerFormData.description}
                  onChange={(e) => setLedgerFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Rent Payment June 2026 - Chase check #334"
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Internal Reference / Receipt #</label>
                <input 
                  type="text"
                  value={ledgerFormData.referenceNo}
                  onChange={(e) => setLedgerFormData(prev => ({ ...prev, referenceNo: e.target.value }))}
                  placeholder="e.g. Bank Ref #S19283"
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowLedgerModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold rounded-lg hover:bg-slate-50 transition-all text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all text-xs"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. LOG ELECTRICITY READING MODAL */}
      {showReadingModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Record Electricity sub-meter</h3>
              <button 
                onClick={() => setShowReadingModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddReading} className="space-y-4 font-sans text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Renter Space</label>
                <select 
                  required
                  value={readingFormData.tenantId}
                  onChange={(e) => {
                    const sel = tenants.find(x => x.id === e.target.value);
                    setReadingFormData(prev => ({ 
                      ...prev, 
                      tenantId: e.target.value,
                      currentValue: sel ? sel.lastMeterReading : 0
                    }));
                  }}
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">-- Select custom space --</option>
                  {tenants.filter(t => t.isActive).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.roomNumber})</option>
                  ))}
                </select>
                {readingFormData.tenantId && (
                  <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                    Previous meter reading value: {tenants.find(t => t.id === readingFormData.tenantId)?.lastMeterReading} kWh
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Current Meter Reading Value (kWh)</label>
                <input 
                  type="number"
                  required
                  value={readingFormData.currentValue}
                  onChange={(e) => setReadingFormData(prev => ({ ...prev, currentValue: Number(e.target.value) }))}
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Reading Log Date</label>
                  <input 
                    type="date"
                    required
                    value={readingFormData.readingDate}
                    onChange={(e) => setReadingFormData(prev => ({ ...prev, readingDate: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Billing cycle Month</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. June 2026"
                    value={readingFormData.billingMonth}
                    onChange={(e) => setReadingFormData(prev => ({ ...prev, billingMonth: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowReadingModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Dismiss
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. BOOK PROPERTY EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Record Overhead Expense</h3>
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expense Date</label>
                  <input 
                    type="date"
                    required
                    value={expenseFormData.date}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Flow Category</label>
                  <select 
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="repairs">Repairs</option>
                    <option value="utilities">Utilities</option>
                    <option value="taxes">Taxes</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Debit Cash Amount ({currency})</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={expenseFormData.amount || ""}
                  onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="0.00"
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Service Paid To</label>
                <input 
                  type="text"
                  required
                  value={expenseFormData.paidTo}
                  onChange={(e) => setExpenseFormData(prev => ({ ...prev, paidTo: e.target.value }))}
                  placeholder="e.g. City Power Grid / plumbing agency name"
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Transaction Description</label>
                <textarea 
                  rows={3}
                  required
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Roof leaks fixed on second floor main stairs"
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Dismiss
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
