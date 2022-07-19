import { FriendshipStatus } from './friendship_status'

export interface Friendship {
  userId: number
  friendUserId: number
  status: FriendshipStatus
}

export type FriendshipKey = keyof Friendship
