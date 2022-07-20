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

export type UserCredentials = Omit<User, 'name' | 'last_name' | 'image_url'>

export type PublicUser = Omit<UserWithId, 'password'>

export type UserKey = keyof User
