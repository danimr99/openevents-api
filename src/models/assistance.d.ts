export interface Assistance {
  user_id: number
  event_id: number
  rating: number
  comment: string
}

export type AssistanceKey = keyof Assistance
