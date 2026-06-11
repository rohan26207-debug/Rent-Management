export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  roomNumber: string;
  rentAmount: number;
  depositPaid: number;
  depositNotes: string;
  depositStatus: 'Paid' | 'Refunded' | 'Partial';
  leaseStart: string;
  leaseEnd: string;
  isActive: boolean;
  electricityRate: number; // e.g. $0.15 or $10 per unit
  lastMeterReading: number;
}

export interface LedgerEntry {
  id: string;
  tenantId: string;
  date: string;
  type: 'charge' | 'payment';
  category: 'rent' | 'electricity' | 'deposit' | 'maintenance' | 'other';
  amount: number;
  description: string;
  referenceNo?: string;
}

export interface ElectricityReading {
  id: string;
  tenantId: string;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  amount: number;
  billingMonth: string; // e.g., "June 2026"
  isPostedToLedger: boolean;
}

export interface PropertyExpense {
  id: string;
  tenantId?: string; // Optional if tied to room/tenant
  date: string;
  category: 'maintenance' | 'repairs' | 'utilities' | 'taxes' | 'insurance' | 'other';
  amount: number;
  description: string;
  paidTo: string;
}

export interface PaymentReminder {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  email: string;
  phone: string;
  totalDue: number;
  electricityDue: number;
  rentDue: number;
  otherDue: number;
  draftSubject: string;
  draftBody: string;
  status: 'Draft' | 'Sent' | 'Failed';
  sentAt?: string;
}
