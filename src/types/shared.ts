import type { Profile, Transaction } from './database.ts';

// ---- Enums ----
export type SplitMethod = 'equal' | 'custom' | 'percentage';
export type ParticipantStatus = 'pending' | 'accepted' | 'rejected';
export type GroupStatus = 'active' | 'settled' | 'archived';
export type GroupRole = 'admin' | 'member';
export type SettlementStatus = 'pending' | 'confirmed';

// ---- Flow 1: Split Transaction ----
export interface SharedTransaction {
  id: string;
  transaction_id: string;
  owner_id: string;
  split_method: SplitMethod;
  total_amount: number;
  note: string | null;
  created_at: string;
}

export interface SharedTransactionParticipant {
  id: string;
  shared_transaction_id: string;
  user_id: string;
  amount: number;
  percentage: number | null;
  status: ParticipantStatus;
  created_transaction_id: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface SharedTransactionWithDetails extends SharedTransaction {
  transaction: Transaction;
  owner: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
  participants: (SharedTransactionParticipant & {
    user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
  })[];
}

// ---- Flow 2: La Vaquita (Groups) ----
export interface Group {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  status: GroupStatus;
  currency: string;
  created_at: string;
  settled_at: string | null;
  archived_at: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  group_id: string | null;
  shared_transaction_id: string | null;
  status: SettlementStatus;
  note: string | null;
  created_at: string;
  confirmed_at: string | null;
}

// ---- Composed types for UI ----
export interface GroupWithMembers extends Group {
  members: (GroupMember & {
    user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
  })[];
}

export interface GroupExpenseWithPayer extends GroupExpense {
  payer: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
}

export interface GroupDetail extends GroupWithMembers {
  expenses: GroupExpenseWithPayer[];
  total: number;
  settlements: SettlementWithUsers[];
}

export interface SettlementWithUsers extends Settlement {
  from_user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
  to_user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
}

export interface SettlementTransfer {
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  amount: number;
}

export interface MemberBalance {
  userId: string;
  userName: string;
  paid: number;
  fairShare: number;
  netBalance: number;
}

export interface UserBalance {
  userId: string;
  userName: string;
  amount: number;
  direction: 'owes_you' | 'you_owe';
}

// ---- API Params ----
export interface CreateSharedTransactionParams {
  transaction_id: string;
  split_method: SplitMethod;
  participants: {
    user_id: string;
    amount: number;
    percentage?: number;
  }[];
  note?: string;
}

export interface RespondToSharedExpenseParams {
  participant_id: string;
  status: 'accepted' | 'rejected';
}

export interface CreateGroupParams {
  name: string;
  description?: string;
  member_emails: string[];
  currency?: string;
}

export interface AddGroupExpenseParams {
  group_id: string;
  amount: number;
  description: string;
  date: string;
}

export interface CreateSettlementParams {
  to_user_id: string;
  amount: number;
  group_id?: string;
  shared_transaction_id?: string;
  note?: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}
