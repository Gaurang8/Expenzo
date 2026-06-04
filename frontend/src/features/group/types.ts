export interface Group {
  id: number
  name: string
  description: string
  avatar?: string
  created_at: string
  updated_at: string
  current_user_role: 'owner' | 'admin' | 'member' | null
  user_balance: string
  settings: {
    invite_members: 'owner' | 'admin' | 'member'
    remove_members: 'owner' | 'admin' | 'member'
    update_group: 'owner' | 'admin' | 'member'
    add_expense: 'owner' | 'admin' | 'member'
    manage_expenses: 'owner' | 'admin' | 'member'
  }
  permissions: {
    can_invite_members: boolean
    can_remove_members: boolean
    can_update_roles: boolean
    can_update_group: boolean
    can_transfer_ownership: boolean
    can_delete_group: boolean
    can_leave_group: boolean
    can_add_expense: boolean
    can_manage_expenses: boolean
  }
}

export interface GroupMember {
  id: number
  user: number
  user_info: {
    id: number
    name: string
    email: string
    avatar?: string
  }
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export interface GroupInvitation {
  id: number
  group: number
  group_name: string
  email: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface CreateGroupPayload {
  name: string
  description?: string
  avatar?: string
  settings?: Partial<Group['settings']>
}
