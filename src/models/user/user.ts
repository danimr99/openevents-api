export interface User {
  name: string
  last_name: string
  email: string
  password: string
  image_url: string
}

export interface UserWithId extends User {
  id: number
}

export type UserKey = keyof User
