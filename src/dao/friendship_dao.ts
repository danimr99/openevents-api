import { Friendship } from '../models/friendship/friendship'
import { FriendshipStatus } from '../models/friendship/friendship_status'
import { PublicUser } from '../models/user/user'

import { databaseConnection } from '../utils/database'

export class FriendshipDAO {
  /**
   * Function to get all the pending {@link Friendship} requests
   * to be accepted by a user from the database.
   * @param {number} userId - ID of the user to get friendship requests from.
   * @returns {Promise<Friendship[]>} List of friendship requests.
   */
  async getFriendshipRequests (userId: number): Promise<Friendship[]> {
    let result: Friendship[]

    return await Promise<Friendship[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM users AS u WHERE u.id IN (SELECT user_id FROM friendships AS ' +
        'f WHERE f.friend_user_id = ? AND f.status = ?)',
        [userId, FriendshipStatus.REQUESTED]
      ).then(([rows]) => {
        // Convert from database result object to friendship
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get all the friends of a {@link User} from the database.
   * @param {number} userId - ID of the user to check.
   * @returns {Promise<PublicUser[]>} List of friends of the user specified.
   */
  async getFriends (userId: number): Promise<PublicUser[]> {
    let result: PublicUser[]

    return await Promise<PublicUser[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT u.id, u.name, u.last_name, u.email, u.image_url FROM users AS u ' +
        'WHERE u.id = (SELECT user_id FROM friendships AS f WHERE f.friend_user_id = ? AND f.status = ?) OR ' +
        'u.id = (SELECT friend_user_id FROM friendships AS f2 WHERE f2.user_id = ? AND f2.status = ?)',
        [userId, FriendshipStatus.ACCEPTED, userId, FriendshipStatus.ACCEPTED]
      ).then(([rows]) => {
        // Convert from database result object to user
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get a friend request between two {@link User}
   * from the database.
   * @param {number} userId - ID of a user.
   * @param {number} externalUserId - ID of another user.
   * @returns {Promise<Friendship[]>} Frienship between both users.
   */
  async getFriendRequest (userId: number, externalUserId: number): Promise<Friendship[]> {
    let result: Friendship[]

    return await Promise<Friendship[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM friendships WHERE (user_id = ? AND friend_user_id = ?) OR (user_id = ? AND friend_user_id = ?)',
        [userId, externalUserId, externalUserId, userId]
      ).then(([rows]) => {
        // Convert from database result object to friendship
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to accept a friend request between users.
   * @param userId - ID of a user.
   * @param externalUserId - ID of another user.
   */
  async acceptFriendRequest (userId: number, externalUserId: number): Promise<any> {
    return await Promise<any>.resolve(
      // Update friend request from the database
      databaseConnection.promise().query(
        'UPDATE friendships SET status = ? WHERE user_id = ? AND friend_user_id = ?',
        [FriendshipStatus.ACCEPTED, externalUserId, userId]
      )
    )
  }

  /**
   * Function to create a friend request between users.
   * @param {number} userId - ID of a user.
   * @param {number} externalUserId - ID of another user.
   */
  async createFriendRequest (userId: number, externalUserId: number): Promise<any> {
    return await Promise<any>.resolve(
      // Insert friend request to the database
      databaseConnection.promise().query(
        'INSERT INTO friendships (user_id, friend_user_id, status) VALUES (?, ?, ?)',
        [userId, externalUserId, FriendshipStatus.REQUESTED]
      )
    )
  }

  /**
   * Function to delete a friend request or a friendship between users.
   * @param {number} userId - ID of a user.
   * @param {number} externalUserId - ID of another user.
   */
  async deleteFriendRequest (userId: number, externalUserId: number): Promise<any> {
    return await Promise<any>.resolve(
      // Insert friend request to the database
      databaseConnection.promise().query(
        'DELETE FROM friendships WHERE (user_id = ? AND friend_user_id = ?) OR (user_id = ? AND friend_user_id = ?)',
        [userId, externalUserId, externalUserId, userId]
      )
    )
  }
}
