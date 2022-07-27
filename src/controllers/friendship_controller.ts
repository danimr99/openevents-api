import { Friendship } from '../models/friendship/friendship'

import { FriendshipDAO } from '../dao/friendship_dao'
import { PublicUser } from '../models/user/user'

const friendshipDAO = new FriendshipDAO()

/**
 * Function to get all the pending {@link Friendship} requests
 * to be accepted by a user.
 * @param {number} userId - ID of the user to get friendship requests from.
 * @returns {Promise<Friendship[]>} List of friendship requests.
 */
export const getFriendshipRequests = async (userId: number): Promise<Friendship[]> => {
  return await friendshipDAO.getFriendshipRequests(userId).then((friendRequests) => friendRequests)
}

/**
 * Function to get all the friends of a {@link User}.
 * @param {number} userId - ID of the user to check.
 * @returns {Promise<PublicUser[]>} List of friends of the user specified.
 */
export const getFriends = async (userId: number): Promise<PublicUser[]> => {
  return await friendshipDAO.getFriends(userId).then((friends) => friends)
}
