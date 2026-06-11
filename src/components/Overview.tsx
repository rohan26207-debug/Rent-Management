import React from "react";
import { Tenant, LedgerEntry, PropertyExpense } from "../types";
import { 
  Users, 
  Home, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Zap, 
  Lock
} from "lucide-react";

interface OverviewProps {
  tenants: Tenant[];
  ledger: LedgerEntry[];
  expenses: PropertyExpense[];
  onNavigate: (view: string, targetId?: string) => void;
}

export default function Overview({ tenants, ledger, expenses, onNavigate }: OverviewProps) {
  // Calculations
  const activeTenants = tenants.filter(t => t.isActive);
  const totalRooms = 12; // Sample limit
  const occupancyRate = totalRooms > 0 ? Math.round((activeTenants.length / totalRooms) * 100) : 0;

  // Ledger summary
  const totalCharges = ledger
    .filter(item => item.type === "charge")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalPayments = ledger
    .filter(item => item.type === "payment")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalOutstanding = totalCharges - totalPayments;

  // Deposits summary
  const totalDeposits = tenants.reduce((sum, t) => sum + (t.depositStatus === 'Paid' ? t.depositPaid : 0), 0);

  // Property expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Net cash flow
  const netCashFlow = totalPayments - totalExpenses;

  // Let's group ledger payments and expenses by category for a micro details chart
  const incomeCategories = ledger
    .filter(entry => entry.type === "payment")
    .reduce((acc: Record<string, number>, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
      return acc;
    }, {});

  const expenseCategories = expenses.reduce((acc: Record<string, number>, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6" id="overview-dashboard">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm">Real-time status of rent collections, property overhead, and tenants.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs text-xs font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          System Online
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Card */}
        <button 
          onClick={() => onNavigate("tenants")}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-indigo-100 transition-all text-left group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {occupancyRate}% Full
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-4 uppercase tracking-wider">Occupancy</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{activeTenants.length}</span>
            <span className="text-slate-400 text-sm">/ {totalRooms} rooms</span>
          </div>
          <p className="text-indigo-600 text-xs font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Manage tenants &rarr;
          </p>
        </button>

        {/* Rent Collections / Payments Card */}
        <button 
          onClick={() => onNavigate("ledger")}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-100 transition-all text-left group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> Collected
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-4 uppercase tracking-wider">Payments Collected</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">${totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <p className="text-emerald-600 text-xs font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View finance statements &rarr;
          </p>
        </button>

        {/* Liabilities Card */}
        <button 
          onClick={() => onNavigate("ledger")}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-amber-100 transition-all text-left group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
              Due
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-4 uppercase tracking-wider">Unresolved Balance</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600">${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <p className="text-amber-600 text-xs font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Collect outstanding balances &rarr;
          </p>
        </button>

        {/* Property Expenses Card */}
        <button 
          onClick={() => onNavigate("expenses")}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-rose-100 transition-all text-left group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownRight className="h-5 w-5" />
            </div>
            <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-full font-medium">
              Bills
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-4 uppercase tracking-wider">Property Expenses</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <p className="text-rose-600 text-xs font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View expense journal &rarr;
          </p>
        </button>
      </div>

      {/* Advanced Double Visualizer Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Cashflow Graph with Custom SVG */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-950 mb-1">Financial Analysis</h3>
          <p className="text-xs text-slate-500 mb-6 font-mono">Comparison of Total Charges, Revenue Received, and Overhead Expenses</p>

          <div className="space-y-6">
            {/* Total Dues Invoiced */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Charges Generated (Dues Invoiced)</span>
                <span className="font-mono font-bold">${totalCharges.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Total Collected */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>Payments Cash-in</span>
                <span className="font-mono font-bold text-emerald-600">${totalPayments.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalCharges > 0 ? (totalPayments / totalCharges) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>Collection recovery rate</span>
                <span>{totalCharges > 0 ? Math.round((totalPayments / totalCharges) * 100) : 0}%</span>
              </div>
            </div>

            {/* Total Expenses */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block"></span>Out-of-Pocket Expenses</span>
                <span className="font-mono font-bold text-rose-600">${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalPayments > 0 ? Math.min(100, (totalExpenses / totalPayments) * 100) : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>Overhead relative to collection cash-in</span>
                <span>{totalPayments > 0 ? Math.round((totalExpenses / totalPayments) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
              <p className="text-[11px] text-slate-500 font-medium">SECURITY DEPOSITS HELD</p>
              <p className="text-lg font-bold text-slate-800 tracking-tight font-mono mt-0.5">${totalDeposits.toFixed(2)}</p>
            </div>
            <div className={`p-3 rounded-xl border ${netCashFlow >= 0 ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}>
              <p className="text-[11px] text-slate-500 font-medium">NET CASH BALANCE</p>
              <p className={`text-lg font-bold tracking-tight font-mono mt-0.5 ${netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                ${netCashFlow.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Property Revenue Splittage Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950 mb-1">Rent vs Utility Income</h3>
            <p className="text-xs text-slate-500 mb-6">Categorical split of all collected payments.</p>

            <div className="space-y-4">
              {Object.entries(incomeCategories).map(([cat, amount]) => {
                const total = Object.values(incomeCategories).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100 font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${cat === "rent" ? "bg-indigo-500" : cat === "electricity" ? "bg-indigo-400" : "bg-indigo-300"}`}></span>
                      <span className="capitalize font-sans font-medium text-slate-700">{cat}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-800 font-bold font-mono">${amount.toFixed(2)}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(incomeCategories).length === 0 && (
                <p className="text-slate-400 text-xs italic py-4 text-center">No payment history logged yet.</p>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-indigo-50/70 border border-slate-100 text-left text-xs text-indigo-950 space-y-2">
            <h4 className="font-semibold flex items-center gap-1 text-slate-900">
              <Zap className="h-3.5 w-3.5 text-indigo-600" /> Meter Utilities Advice
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Unposted readings detected for tenants. Update readings monthly to bill for electricity correctly.
            </p>
            <button 
              onClick={() => onNavigate("electricity")}
              className="text-xs text-indigo-700 font-bold hover:underline"
            >
              Update Meter Readings &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Actions Header */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Interactive Quick Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={() => onNavigate("reminders")}
            className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all text-left"
          >
            <div>
              <p className="font-semibold text-sm">Send Monthly Reminders</p>
              <p className="text-indigo-100 text-xs mt-0.5">Let AI draft due statements</p>
            </div>
            <span className="bg-indigo-500 text-xs px-2 py-1 rounded-md font-mono font-bold">Launch</span>
          </button>

          <button 
            onClick={() => onNavigate("electricity")}
            className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-sm transition-all text-left"
          >
            <div>
              <p className="font-semibold text-sm">Electricity Meter Utility</p>
              <p className="text-slate-300 text-xs mt-0.5">Calculate sub-meter units</p>
            </div>
            <span className="bg-slate-800 text-xs px-2 py-1 rounded-md font-mono font-semibold text-amber-400">Record</span>
          </button>

          <button 
            onClick={() => onNavigate("ledger")}
            className="flex items-center justify-between p-4 bg-white text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-all text-left"
          >
            <div>
              <p className="font-semibold text-sm text-slate-900">General Ledger ledger</p>
              <p className="text-slate-400 text-xs mt-0.5">Post new rent charge / payments</p>
            </div>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md font-mono font-bold">Access</span>
          </button>
        </div>
      </div>
    </div>
  );
}
