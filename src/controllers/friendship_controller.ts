import { Friendship } from '../models/friendship/friendship'
import { FriendshipStatus } from '../models/friendship/friendship_status'
import { PublicUser } from '../models/user/user'
import { APIMessage } from '../models/enums/api_messages'

import { FriendshipDAO } from '../dao/friendship_dao'
import { MessageDAO } from '../dao/message_dao'

const friendshipDAO = new FriendshipDAO()
const messageDAO = new MessageDAO()

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
 * Function to get all the friends of a user.
 * @param {number} userId - ID of the user to check.
 * @returns {Promise<PublicUser[]>} List of friends of the user specified.
 */
export const getFriends = async (userId: number): Promise<PublicUser[]> => {
  return await friendshipDAO.getFriends(userId).then((friends) => friends)
}

/**
 * Function to check whether exists or not a friend request between two {@link User}s.
 * @param {number} userId - ID of a user.
 * @param {number} externalUserId - ID of another user.
 * @returns {Promise<Boolean>} True if exists a friend request between both users, false otherwise.
 */
export const existsFriendRequest = async (userId: number, externalUserId: number): Promise<boolean> => {
  return await friendshipDAO.getFriendRequest(userId, externalUserId)
    .then((friendRequests) => {
      // Check if exists or not a friend request
      return friendRequests.length === 1
    }).catch(() => {
      return false
    })
}

/**
 * Function to create a friend request
 * @param userId - ID of a user.
 * @param externalUserId - ID of another user.
 * @returns {Promise<string>} Message notification informing of the action completed.
 */
export const createFriendRequest = async (userId: number, externalUserId: number): Promise<string> => {
  return await friendshipDAO.getFriendRequest(userId, externalUserId)
    .then(async (friendRequests) => {
      // Check if exists friend request between users
      if (friendRequests.length === 1) {
        // Friend request exists
        const friendRequest = friendRequests[0]

        // Check the friend request status
        if (friendRequest.status === FriendshipStatus.ACCEPTED) {
          // Friend request is already accepted
          return APIMessage.ALREADY_FRIENDS
        } else {
          // Friend request status is requested
          // Check friend request sender
          if (friendRequest.user_id === userId) {
            // User resending friend request to external user
            return APIMessage.FRIEND_REQUEST_ALREADY_SENT
          } else {
            // External user sent friend request to user
            // User accepts friend request from external user
            await friendshipDAO.acceptFriendRequest(userId, externalUserId)

            return APIMessage.FRIEND_REQUEST_ACCEPTED
          }
        }
      } else {
        // Friend request does not exist
        // Create friend request
        await friendshipDAO.createFriendRequest(userId, externalUserId)

        return APIMessage.FRIEND_REQUEST_SENT
      }
    })
}

/**
 * Function to accept a friend request
 * @param userId - ID of a user.
 * @param externalUserId - ID of another user.
 * @returns {Promise<string>} Message notification informing of the action completed.
 */
export const acceptFriendRequest = async (userId: number, externalUserId: number): Promise<string> => {
  return await friendshipDAO.getFriendRequest(userId, externalUserId)
    .then(async (friendRequests) => {
      // Check if exists friend request between users
      if (friendRequests.length === 1) {
        // Friend request exists
        const friendRequest = friendRequests[0]

        // Check friend request status
        if (friendRequest.status === FriendshipStatus.ACCEPTED) {
          // Friend request is already accepted
          return APIMessage.ALREADY_FRIENDS
        } else {
          // Friend request status is requested
          // Check friend request sender
          if (friendRequest.user_id === userId) {
            // User trying to accept a friend request to external user
            return APIMessage.FRIEND_REQUEST_MUST_BE_ACCEPTED_BY_EXTERNAL_USER
          } else {
            // External user sent friend request to user
            // User accepts friend request from external user
            await friendshipDAO.acceptFriendRequest(userId, externalUserId)

            return APIMessage.FRIEND_REQUEST_ACCEPTED
          }
        }
      } else {
        // Friend request does not exist
        return APIMessage.FRIEND_REQUEST_NOT_FOUND
      }
    })
}

/**
 * Function to delete a friend request or a friendship.
 * @param userId - ID of a user.
 * @param externalUserId - ID of another user.
 * @returns {Promise<string>} Message notification informing of the action completed.
 */
export const deleteFriendRequest = async (userId: number, externalUserId: number): Promise<string> => {
  return await friendshipDAO.getFriendRequest(userId, externalUserId)
    .then(async (friendRequests) => {
    // Check if exists friend request between users
      if (friendRequests.length === 1) {
        // Friend request exists
        // Delete friend request
        await friendshipDAO.deleteFriendRequest(userId, externalUserId)

        // Delete chat between users
        await messageDAO.deleteChat(userId, externalUserId)

        return APIMessage.FRIEND_REQUEST_DELETED
      } else {
        // Friend request does not exist
        return APIMessage.FRIEND_REQUEST_NOT_FOUND
      }
    })
}
