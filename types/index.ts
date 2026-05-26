// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  apiKey?: string;
  displayName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface AuthState {
  token: string | null;
  profile: AdminProfile | null;
  loading: boolean;
  error: string | null;
}

// ─── Overview ────────────────────────────────────────────────────────────────

export interface OverviewStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  pendingApprovals: number;
  totalSubscriptions: number;
  trialSubscriptions: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
}

// ─── Company ─────────────────────────────────────────────────────────────────

export interface CompanySubscription {
  status: SubscriptionStatus;
  planCode: string;
  trialEndsAt: string | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  accountType: string;
  countryCode: string;
  defaultCurrency: string;
  isActive: boolean;
  createdAt: string;
  subscription?: CompanySubscription | null;
  ownerEmail?: string;
  _count?: { users: number; projects: number };
}

export interface CompanyDetailPayment {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
}

export interface CompanyDetailSubscription {
  id: string;
  status: SubscriptionStatus;
  billingCycle: string;
  currentPeriodFrom: string;
  currentPeriodTo: string;
  plan?: {
    id: string;
    code: string;
    name: string;
  };
  platformPlan?: {
    id: string;
    code: string;
    name: string;
  };
  payments: CompanyDetailPayment[];
}

export interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  accountType?: string;
  countryCode?: string;
  defaultCurrency?: string;
  timezone?: string;
  subscriptions: CompanyDetailSubscription[];
  _count?: {
    users?: number;
    projects?: number;
    subscriptions?: number;
    invoices?: number;
  };
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export interface PlatformPlan {
  code: string;
  name: string;
  monthlyPrice: number;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  billingCycle: string;
  currentPeriodFrom: string;
  currentPeriodTo: string;
  trialEndsAt: string | null;
  company: { id: string; name: string; slug: string };
  platformPlan: PlatformPlan;
}

// ─── RBAC ───────────────────────────────────────────────────────────────────

export interface RbacPermissionItem {
  key: string;
}

export interface RbacRole {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions: string[];
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = "PENDING" | "COMPLETED" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  transactionRef: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  currency?: string;
  createdAt: string;
  companyId?: string;
  company?: { id: string; name: string };
  subscriptionId?: string;
  subscription?: { id: string; planCode: string };
  notes?: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
