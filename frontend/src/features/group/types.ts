export interface Group {
  id: string
  name: string
  description: string
  created_at: string
}

export interface CreateGroupPayload {
  name: string
  description?: string
}
