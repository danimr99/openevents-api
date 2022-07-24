export interface Message {
  senderUserId: number
  receiverUserId: number
  content: string
  timestamp: Date
}

export interface MessageWithId extends Message {
  id: number
}

export type MessageKey = keyof Message
