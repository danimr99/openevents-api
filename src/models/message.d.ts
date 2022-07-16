export interface Message {
  id: number
  senderUserId: number
  receiverUserId: number
  content: string
  timestamp: Date
}

export type MessageKey = keyof Message
