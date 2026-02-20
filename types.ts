
export enum UserRole {
  ADMIN = 'ADMIN',
  REVIEWER = 'REVIEWER',
  SUPERVISOR = 'SUPERVISOR',
  REQUESTER = 'REQUESTER'
}

export type Permission =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'APPROVE'
  | 'SYSTEM_CONFIG'
  | 'FINANCIAL_RECON'
  | 'USER_PROVISION'
  | 'VIEW_OWN'
  | 'EDIT_OWN'
  | 'COMMENT';

export interface User {
  id: string;
  username: string;
  email: string;
  department: string;
  title: string;
  role: UserRole;
  avatar?: string;
  deletedAt?: string;
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REVISION = 'REVISION',
  DENIED = 'DENIED',
  SUBMITTED = 'SUBMITTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface RequestItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface RequestForm {
  id: string;
  requesterId?: string;
  name: string;
  category: string;
  eventDate: string;
  budgetSource: string;
  items: RequestItem[];
  totalCost: number;
  cashAdvance: number;
  status: RequestStatus;
  createdAt: string;
  deletedAt?: string;
}

export interface SystemLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface RequestFilters {
  dateExact?: string;
  dateFrom?: string;
  dateTo?: string;
  categories?: string[];
  costMode?: 'exact' | 'range' | 'lt' | 'gt';
  costExact?: number;
  costMin?: number;
  costMax?: number;
  statuses?: RequestStatus[];
}
