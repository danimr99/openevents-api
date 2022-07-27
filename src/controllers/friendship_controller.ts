import { Friendship } from '../models/friendship/friendship'

import { FriendshipDAO } from '../dao/friendship_dao'

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
