import { Message } from '../models/message/message'
import { PublicUser } from '../models/user/user'

import { databaseConnection } from '../utils/database'

export class MessageDAO {
  /**
   * Function to insert a new {@link Message} to the database.
   * @param {Message} message - Message to add into database.
   */
  async insertMessage (message: Message): Promise<any> {
    return await Promise<any>.resolve(
      // Insert into database
      databaseConnection.promise().query(
        'INSERT INTO messages (content, sender_user_id, receiver_user_id, timestamp) ' +
        'VALUES (?, ?, ?, ?)',
        [message.content, message.senderUserId, message.receiverUserId, message.timestamp]
      )
    )
  }

  /**
   * Function to get all the contacts from a {@link User} from the database.
   * @param {number} userId - ID of the user to get contacts from.
   * @returns {Promise<PublicUser[]>} List of contacts from the specified user.
   */
  async getUserContacts (userId: number): Promise<PublicUser[]> {
    let result: PublicUser[]

    return await Promise<PublicUser[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT u.id, u.name, u.last_name, u.email, u.image_url FROM users AS u ' +
        'WHERE u.id IN (SELECT DISTINCT m1.sender_user_id FROM messages AS m1 WHERE m1.receiver_user_id = ?) ' +
        'OR u.id IN (SELECT DISTINCT m2.receiver_user_id FROM messages AS m2 WHERE m2.sender_user_id = ?)',
        [userId, userId]
      ).then(([rows]) => {
        // Convert from database result object to user
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }
}
