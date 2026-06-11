import { Tenant, LedgerEntry, ElectricityReading, PropertyExpense } from "./types";

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: "t-1",
    name: "Sarah Jenkins",
    phone: "+1 (555) 0192-384",
    email: "sarah.j@example.com",
    roomNumber: "Apt 301",
    rentAmount: 1200,
    depositPaid: 1200,
    depositNotes: "Fully paid on booking. Bank transfer.",
    depositStatus: 'Paid',
    leaseStart: "2026-01-01",
    leaseEnd: "2026-12-31",
    isActive: true,
    electricityRate: 0.15, // $0.15 per kWh
    lastMeterReading: 1450,
  },
  {
    id: "t-2",
    name: "Marcus Aurelius",
    phone: "+1 (555) 0148-293",
    email: "marcus.a@example.com",
    roomNumber: "Apt 102",
    rentAmount: 1400,
    depositPaid: 1400,
    depositNotes: "Paid in cash of $1000 and check $400.",
    depositStatus: 'Paid',
    leaseStart: "2026-03-15",
    leaseEnd: "2027-03-14",
    isActive: true,
    electricityRate: 0.18,
    lastMeterReading: 8200,
  },
  {
    id: "t-3",
    name: "Elena Rostova",
    phone: "+1 (555) 0177-493",
    email: "elena.r@example.com",
    roomNumber: "Apt 205",
    rentAmount: 950,
    depositPaid: 950,
    depositNotes: "Secured. Active lease.",
    depositStatus: 'Paid',
    leaseStart: "2025-06-01",
    leaseEnd: "2026-05-31",
    isActive: true,
    electricityRate: 0.15,
    lastMeterReading: 3100,
  }
];

export const INITIAL_LEDGER: LedgerEntry[] = [
  // Sarah Jenkins (t-1)
  {
    id: "l-s1",
    tenantId: "t-1",
    date: "2026-05-01",
    type: "charge",
    category: "rent",
    amount: 1200,
    description: "Rent for May 2026",
  },
  {
    id: "l-s2",
    tenantId: "t-1",
    date: "2026-05-02",
    type: "payment",
    category: "rent",
    amount: 1200,
    description: "Rent Payment May 2026 - Bank transfer ref: #S8394"
  },
  {
    id: "l-s3",
    tenantId: "t-1",
    date: "2026-05-15",
    type: "charge",
    category: "electricity",
    amount: 52.5,
    description: "Electricity Charge (May) - Usage: 350 Units @ $0.15"
  },
  {
    id: "l-s4",
    tenantId: "t-1",
    date: "2026-05-18",
    type: "payment",
    category: "electricity",
    amount: 52.5,
    description: "Electricity bill May paid via mobile transfer"
  },
  {
    id: "l-s5",
    tenantId: "t-1",
    date: "2026-06-01",
    type: "charge",
    category: "rent",
    amount: 1200,
    description: "Rent for June 2026",
  },
  // Marcus Aurelius (t-2)
  {
    id: "l-m1",
    tenantId: "t-2",
    date: "2026-05-01",
    type: "charge",
    category: "rent",
    amount: 1400,
    description: "Rent for May 2026",
  },
  {
    id: "l-m2",
    tenantId: "t-2",
    date: "2026-05-03",
    type: "payment",
    category: "rent",
    amount: 1400,
    description: "Rent Payment May 2026 - Check #4401"
  },
  {
    id: "l-m3",
    tenantId: "t-2",
    date: "2026-06-01",
    type: "charge",
    category: "rent",
    amount: 1400,
    description: "Rent for June 2026",
  },
  // Elena Rostova (t-3)
  {
    id: "l-e1",
    tenantId: "t-3",
    date: "2026-05-01",
    type: "charge",
    category: "rent",
    amount: 950,
    description: "Rent for May 2026",
  },
  {
    id: "l-e2",
    tenantId: "t-3",
    date: "2026-05-05",
    type: "payment",
    category: "rent",
    amount: 950,
    description: "Rent payment - Venmo transfer Elena R."
  },
  {
    id: "l-e3",
    tenantId: "t-3",
    date: "2026-06-01",
    type: "charge",
    category: "rent",
    amount: 950,
    description: "Rent for June 2026",
  },
];

export const INITIAL_READINGS: ElectricityReading[] = [
  {
    id: "er-1",
    tenantId: "t-1",
    readingDate: "2026-05-15",
    previousReading: 1100,
    currentReading: 1450,
    unitsConsumed: 350,
    ratePerUnit: 0.15,
    amount: 52.5,
    billingMonth: "May 2026",
    isPostedToLedger: true
  },
  {
    id: "er-2",
    tenantId: "t-2",
    readingDate: "2026-05-15",
    previousReading: 7950,
    currentReading: 8200,
    unitsConsumed: 250,
    ratePerUnit: 0.18,
    amount: 45.0,
    billingMonth: "May 2026",
    isPostedToLedger: false // Not posted yet as demo
  },
  {
    id: "er-3",
    tenantId: "t-3",
    readingDate: "2026-05-15",
    previousReading: 2980,
    currentReading: 3100,
    unitsConsumed: 120,
    ratePerUnit: 0.15,
    amount: 18.0,
    billingMonth: "May 2026",
    isPostedToLedger: false // Not posted yet as demo
  }
];

export const INITIAL_EXPENSES: PropertyExpense[] = [
  {
    id: "exp-1",
    date: "2026-05-10",
    category: "repairs",
    amount: 180,
    description: "Leaky pipe repair in Apt 102 bathroom",
    paidTo: "Plumb-Perfect Ltd.",
  },
  {
    id: "exp-2",
    date: "2026-05-25",
    category: "utilities",
    amount: 157.2,
    description: "Common corridor and staircase lighting",
    paidTo: "City Power Grid",
  },
  {
    id: "exp-3",
    date: "2026-06-04",
    category: "maintenance",
    amount: 75.00,
    description: "Main door lock oiling and keys duplication",
    paidTo: "Master Key Locksmiths",
  }
];
