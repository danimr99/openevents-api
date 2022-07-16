export interface User {
  id?: number
  name?: string
  last_name?: string
  email?: string
  password?: string
  image_url?: string
}

export type UserKey = keyof User
