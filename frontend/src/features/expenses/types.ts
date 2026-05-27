export type SplitType = "equal" | "exact" | "percentage"

export interface UserInfo {
  id: number
  name: string
  email: string
}

export interface ExpensePayerPayload {
  user: number
  paid_amount: string
}

export interface ExpenseParticipantPayload {
  user: number
  owed_amount?: string
  percentage?: string
}

export interface CreateExpensePayload {
  title: string
  description?: string
  total_amount: string
  currency?: string
  split_type: SplitType
  expense_date: string
  payers: ExpensePayerPayload[]
  participants: ExpenseParticipantPayload[]
}

export interface CreateSettlementPayload {
  paid_by: number
  paid_to: number
  amount: string
  description?: string
  settled_at: string
}


export interface ExpensePayer {
  id: number
  user: number
  user_info: UserInfo
  paid_amount: string
}

export interface ExpenseParticipant {
  id: number
  user: number
  user_info: UserInfo
  owed_amount: string
  percentage: string | null
  is_settled: boolean
}

export interface Expense {
  id: number
  group: number
  title: string
  description: string | null
  total_amount: string
  currency: string
  split_type: SplitType
  expense_date: string
  created_by: number
  created_by_info: UserInfo
  created_at: string
  payers: ExpensePayer[]
  participants: ExpenseParticipant[]
}

export interface Settlement {
  id: number
  group: number
  paid_by: number
  paid_by_info: UserInfo
  paid_to: number
  paid_to_info: UserInfo
  created_by: number
  created_by_info: UserInfo
  amount: string
  description: string | null
  settled_at: string
  created_at: string
}


export interface ExpenseActivity {
  type: "expense"
  id: number
  group: number
  group_name?: string
  title: string
  description: string | null
  total_amount: string
  currency: string
  split_type: SplitType
  expense_date: string
  created_at: string
  created_by: number
  created_by_info: UserInfo
  primary_payer_info: UserInfo | null
  my_net: string
  my_paid: string
  my_owed: string
  is_involved: boolean
  payers_count: number
}

export interface SettlementActivity {
  type: "settlement"
  id: number
  group: number
  group_name?: string
  amount: string
  description: string | null
  settled_at: string
  created_at: string
  paid_by: number
  paid_by_info: UserInfo
  paid_to: number
  paid_to_info: UserInfo
  created_by: number
  my_role: "payer" | "receiver" | "none"
}

export type ActivityItem = ExpenseActivity | SettlementActivity

export interface MemberBalance {
  user_id: number
  email: string
  name: string
  balance: string
}

export interface GroupBalance {
  from_user: number
  from_user_info: UserInfo
  to_user: number
  to_user_info: UserInfo
  amount: string
}

export interface GroupBalancesResponse {
  individual_balances: MemberBalance[]
  simplified_transactions: GroupBalance[]
}

export type EditActivity = (Expense & { type: 'expense' }) | (Settlement & { type: 'settlement' })
