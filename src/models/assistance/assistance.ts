import { AssistanceFormat } from './assistance_format'

export interface Assistance {
  user_id: number
  event_id: number
  format: AssistanceFormat
  rating: number
  comment: string
}

export type AssistanceKey = keyof Assistance
