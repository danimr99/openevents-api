import { EventFormat } from './event_format'
import { EventCategory } from './event_category'

export interface Event {
  title: string
  owner_id: number
  creation_date: Date
  image_url: string
  format: EventFormat
  link: string
  location: string
  description: string
  start_date: Date
  end_date: Date
  max_attendees: number
  ticket_price: number
  category: EventCategory
}

export interface EventWithId extends Event {
  id: number
}

export type EventKey = keyof Event
