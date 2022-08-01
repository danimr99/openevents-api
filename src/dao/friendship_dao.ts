import { Friendship } from '../models/friendship/friendship'
import { FriendshipStatus } from '../models/friendship/friendship_status'
import { PublicUser } from '../models/user/user'

import { databaseConnection } from '../utils/database'

export class FriendshipDAO {
  /**
   * Function to get all pending friendships requests
   * to be accepted by a user from the database.
   * @param {number} userId - ID of a user to get friendship requests from.
   * @returns {Promise<Friendship[]>} List of friendship requests.
   */
  async getFriendshipRequests (userId: number): Promise<Friendship[]> {
    // Select user information of friend requests received by a user
    return await databaseConnection.promise().query(
      'SELECT * FROM users AS u WHERE u.id IN (SELECT user_id FROM friendships AS ' +
        'f WHERE f.friend_user_id = ? AND f.status = ?)',
      [userId, FriendshipStatus.REQUESTED]
    ).then(([rows]) => {
      // Convert from database result object to list of friendships
      return JSON.parse(JSON.stringify(rows)) as Friendship[]
    })
  }

  /**
   * Function to get all friends of a user from the database.
   * @param {number} userId - ID of a user to check.
   * @returns {Promise<PublicUser[]>} List of friends from a user.
   */
  async getFriends (userId: number): Promise<PublicUser[]> {
    // Select friends of a user
    return await databaseConnection.promise().query(
      'SELECT u.id, u.name, u.last_name, u.email, u.image_url FROM users AS u ' +
          'WHERE u.id = (SELECT user_id FROM friendships AS f WHERE f.friend_user_id = ? AND f.status = ?) OR ' +
            'u.id = (SELECT friend_user_id FROM friendships AS f2 WHERE f2.user_id = ? AND f2.status = ?)',
      [userId, FriendshipStatus.ACCEPTED, userId, FriendshipStatus.ACCEPTED]
    ).then(([rows]) => {
      // Convert from database result object to list of users
      return JSON.parse(JSON.stringify(rows)) as PublicUser[]
    })
  }

  /**
   * Function to get a friend request between two users
   * from the database.
   * @param {number} userId - ID of a user.
   * @param {number} externalUserId - ID of another user.
   * @returns {Promise<Friendship>} Friendship between both users.
   */
  async getFriendRequest (userId: number, externalUserId: number): Promise<Friendship> {
    // Select friend request between two users
    return await databaseConnection.promise().query(
      'SELECT * FROM friendships WHERE (user_id = ? AND friend_user_id = ?) OR (user_id = ? AND friend_user_id = ?)',
      [userId, externalUserId, externalUserId, userId]
    ).then(([rows]) => {
      // Convert from database result object to friendship
      return JSON.parse(JSON.stringify(rows)) as Friendship
    })
  }

  /**
   * Function to accept a friend request between users from the database.
   * @param userId - ID of a user.
   * @param externalUserId - ID of another user.
   */
  async acceptFriendRequest (userId: number, externalUserId: number): Promise<void> {
    // Update friend request
    await databaseConnection.promise().query(
      'UPDATE friendships SET status = ? WHERE user_id = ? AND friend_user_id = ?',
      [FriendshipStatus.ACCEPTED, externalUserId, userId]
    )
  }

  /**
   * Function to create a friend request between users from the database.
   * @param {number} userId - ID of a user.
   * @param {number} externalUserId - ID of another user.
   */
  async createFriendRequest (userId: number, externalUserId: number): Promise<void> {
    // Insert friend request
    await databaseConnection.promise().query(
      'INSERT INTO friendships (user_id, friend_user_id, status) VALUES (?, ?, ?)',
      [userId, externalUserId, FriendshipStatus.REQUESTED]
    )
  }

  /**
   * Function to delete a friend request or a friendship between users from the database.
   * @param {number} userId - ID of a user.
   * @param {number} externalUserId - ID of another user.
   */
  async deleteFriendRequest (userId: number, externalUserId: number): Promise<void> {
    // Delete friend request
    await databaseConnection.promise().query(
      'DELETE FROM friendships WHERE (user_id = ? AND friend_user_id = ?) OR (user_id = ? AND friend_user_id = ?)',
      [userId, externalUserId, externalUserId, userId]
    )
  }

  /**
   * Function to delete all friendships of a user from the database.
   * @param {number} userId - ID of a user.
   */
  async deleteUserFriendships (userId: number): Promise<void> {
    // Delete all friendships of a user
    await databaseConnection.promise().query(
      'DELETE FROM friendships WHERE user_id = ? OR friend_user_id = ?',
      [userId, userId]
    )
  }
}
