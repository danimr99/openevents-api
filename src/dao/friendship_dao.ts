import { Friendship } from '../models/friendship/friendship'
import { FriendshipStatus } from '../models/friendship/friendship_status'

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
}
