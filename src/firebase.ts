import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Tenant, LedgerEntry, ElectricityReading, PropertyExpense } from "./types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard login / logout functions
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login Error: ", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error: ", error);
    throw error;
  }
};

// Error handling types and helpers as required by guidelines
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection on Boot as requested by Guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// --- CLOUD SYNC OPERATIONS ---

// Fetch all rent data for the given user from Firestore
export async function fetchUserData(userId: string) {
  const results = {
    tenants: [] as Tenant[],
    ledger: [] as LedgerEntry[],
    readings: [] as ElectricityReading[],
    expenses: [] as PropertyExpense[]
  };

  try {
    // 1. Fetch tenants
    const tenantsRef = collection(db, "users", userId, "tenants");
    const tenantsSnap = await getDocs(tenantsRef);
    tenantsSnap.forEach((doc) => {
      results.tenants.push(doc.data() as Tenant);
    });

    // 2. Fetch ledger
    const ledgerRef = collection(db, "users", userId, "ledger");
    const ledgerSnap = await getDocs(ledgerRef);
    ledgerSnap.forEach((doc) => {
      results.ledger.push(doc.data() as LedgerEntry);
    });

    // 3. Fetch readings
    const readingsRef = collection(db, "users", userId, "readings");
    const readingsSnap = await getDocs(readingsRef);
    readingsSnap.forEach((doc) => {
      results.readings.push(doc.data() as ElectricityReading);
    });

    // 4. Fetch expenses
    const expensesRef = collection(db, "users", userId, "expenses");
    const expensesSnap = await getDocs(expensesRef);
    expensesSnap.forEach((doc) => {
      results.expenses.push(doc.data() as PropertyExpense);
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    throw error;
  }
}

// Upload/push all local rent data to Firestore (for first-time sync)
export async function uploadUserData(
  userId: string, 
  data: { 
    tenants: Tenant[]; 
    ledger: LedgerEntry[]; 
    readings: ElectricityReading[]; 
    expenses: PropertyExpense[]; 
  }
) {
  try {
    // Upload tenants
    for (const tenant of data.tenants) {
      await setDoc(doc(db, "users", userId, "tenants", tenant.id), tenant);
    }
    // Upload ledger
    for (const entry of data.ledger) {
      await setDoc(doc(db, "users", userId, "ledger", entry.id), entry);
    }
    // Upload readings
    for (const reading of data.readings) {
      await setDoc(doc(db, "users", userId, "readings", reading.id), reading);
    }
    // Upload expenses
    for (const expense of data.expenses) {
      await setDoc(doc(db, "users", userId, "expenses", expense.id), expense);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    throw error;
  }
}

// Sync individual Tenant
export async function syncTenant(userId: string, tenant: Tenant) {
  const path = `users/${userId}/tenants/${tenant.id}`;
  try {
    await setDoc(doc(db, "users", userId, "tenants", tenant.id), tenant);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete individual Tenant
export async function deleteTenant(userId: string, tenantId: string) {
  const path = `users/${userId}/tenants/${tenantId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "tenants", tenantId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Sync individual Ledger Entry
export async function syncLedger(userId: string, entry: LedgerEntry) {
  const path = `users/${userId}/ledger/${entry.id}`;
  try {
    await setDoc(doc(db, "users", userId, "ledger", entry.id), entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync individual Electricity Reading
export async function syncReading(userId: string, reading: ElectricityReading) {
  const path = `users/${userId}/readings/${reading.id}`;
  try {
    await setDoc(doc(db, "users", userId, "readings", reading.id), reading);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Sync individual Property Expense
export async function syncExpense(userId: string, expense: PropertyExpense) {
  const path = `users/${userId}/expenses/${expense.id}`;
  try {
    await setDoc(doc(db, "users", userId, "expenses", expense.id), expense);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Run initial connection test
testConnection();
