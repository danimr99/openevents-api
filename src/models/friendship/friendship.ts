import { FriendshipStatus } from './friendship_status'

export interface Friendship {
  user_id: number
  friend_user_id: number
  status: FriendshipStatus
}

export type FriendshipKey = keyof Friendship
