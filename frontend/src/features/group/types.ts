export interface Group {
  id: number
  name: string
  description: string
  created_at: string
}

export interface GroupMember {
  id: number
  user: number
  user_email: string
  full_name: string
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
}
