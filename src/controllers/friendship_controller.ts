import { Friendship } from '../models/friendship/friendship'
import { FriendshipStatus } from '../models/friendship/friendship_status'
import { PublicUser } from '../models/user/user'
import { APIMessage } from '../models/enums/api_messages'

import { FriendshipDAO } from '../dao/friendship_dao'

import { deleteChat } from './message_controller'

const friendshipDAO = new FriendshipDAO()

/**
 * Function to get all pending friendship requests to be accepted by a user.
 * @param {number} userId - ID of a user to get friendship requests from.
 * @returns {Promise<Friendship[]>} List of friendship requests.
 */
export const getFriendshipRequests = async (userId: number): Promise<Friendship[]> => {
  return await friendshipDAO.getFriendshipRequests(userId)
}

/**
 * Function to get all friends of a user.
 * @param {number} userId - ID of a user to check.
 * @returns {Promise<PublicUser[]>} List of friends of the user specified.
 */
export const getFriends = async (userId: number): Promise<PublicUser[]> => {
  return await friendshipDAO.getFriends(userId)
}

/**
 * Function to check whether exists or not a friend request between two users.
 * @param {number} userId - ID of a user.
 * @param {number} externalUserId - ID of another user.
 * @returns {Promise<Boolean>} True if exists a friend request between both users, false otherwise.
 */
export const existsFriendRequest = async (userId: number, externalUserId: number): Promise<boolean> => {
  return await friendshipDAO.getFriendRequest(userId, externalUserId)
    .then((friendRequest) => {
      // Check if exists a friend request
      if (friendRequest != null) {
        return true
      } else {
        return false
      }
    }).catch(() => {
      return false
    })
}

/**
 * Function to create a friend request.
 * @param userId - ID of a user.
 * @param externalUserId - ID of another user.
 * @returns {Promise<string>} Message notification informing of the action completed.
 */
export const createFriendRequest = async (userId: number, externalUserId: number): Promise<string> => {
  return await friendshipDAO.getFriendRequest(userId, externalUserId)
    .then(async (friendRequest) => {
      // Check if exists friend request between users
      if (friendRequest != null) {
        // Friend request exists
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
 * Function to accept a friend request.
 * @param userId - ID of a user.
 * @param externalUserId - ID of another user.
 * @returns {Promise<string>} Message notification informing of the action completed.
 */
export const acceptFriendRequest = async (userId: number, externalUserId: number): Promise<string> => {
  return await friendshipDAO.getFriendRequest(userId, externalUserId)
    .then(async (friendRequest) => {
      // Check if exists friend request between users
      if (friendRequest != null) {
        // Friend request exists
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
    .then(async (friendRequest) => {
      // Check if exists friend request between users
      if (friendRequest != null) {
        // Friend request exists
        // Delete friend request
        await friendshipDAO.deleteFriendRequest(userId, externalUserId)

        // Delete chat between users
        await deleteChat(userId, externalUserId)

        return APIMessage.FRIEND_REQUEST_DELETED
      } else {
        // Friend request does not exist
        return APIMessage.FRIEND_REQUEST_NOT_FOUND
      }
    })
}

/**
 * Function to delete all friendships of a user.
 * @param {number} userId - ID of a user.
 */
export const deleteUserFriendships = async (userId: number): Promise<void> => {
  await friendshipDAO.deleteUserFriendships(userId)
}
