import { Message } from '../models/message/message'
import { PublicUser } from '../models/user/user'

import { databaseConnection } from '../utils/database'

export class MessageDAO {
  /**
   * Function to insert a new message to the database.
   * @param {Message} message - Message to add.
   */
  async insertMessage (message: Message): Promise<void> {
    // Insert message
    await databaseConnection.promise().query(
      'INSERT INTO messages (content, sender_user_id, receiver_user_id, timestamp) ' +
          'VALUES (?, ?, ?, ?)',
      [message.content, message.senderUserId, message.receiverUserId, message.timestamp]
    )
  }

  /**
   * Function to get all contacts from a user from the database.
   * @param {number} userId - ID of a user to get contacts from.
   * @returns {Promise<PublicUser[]>} List of contacts from a user.
   */
  async getUserContacts (userId: number): Promise<PublicUser[]> {
    // Get user information of users that have exchanged messages with a user
    return await databaseConnection.promise().query(
      'SELECT u.id, u.name, u.last_name, u.email, u.image_url FROM users AS u ' +
        'WHERE u.id IN (SELECT DISTINCT m1.sender_user_id FROM messages AS m1 WHERE m1.receiver_user_id = ?) ' +
          'OR u.id IN (SELECT DISTINCT m2.receiver_user_id FROM messages AS m2 WHERE m2.sender_user_id = ?)',
      [userId, userId]
    ).then(([rows]) => {
      // Convert from database result object to list of users
      return JSON.parse(JSON.stringify(rows)) as PublicUser[]
    })
  }

  /**
   * Function to get all messages exchanged between two users from the database.
   * @param {number} userId - ID of a user.
   * @param {number} externalUserId - ID of another user.
   * @returns {Promise<Message[]>} List of messages exchanged between users.
   */
  async getChat (userId: number, externalUserId: number): Promise<Message[]> {
    // Select messages exchanged between two users
    return await databaseConnection.promise().query(
      'SELECT * FROM messages WHERE (sender_user_id = ? AND receiver_user_id = ?) ' +
        'OR (sender_user_id = ? OR receiver_user_id = ?)',
      [userId, externalUserId, externalUserId, userId]
    ).then(([rows]) => {
      // Convert from database result object to list of messages
      return JSON.parse(JSON.stringify(rows)) as Message[]
    })
  }

  /**
   * Function to delete a chat between users from the database.
   * @param {number} userId - ID of a user.
   * @param {number} externalUserId - ID of another user.
   */
  async deleteChat (userId: number, externalUserId: number): Promise<void> {
    // Delete messages exchanged between users
    await databaseConnection.promise().query(
      'DELETE FROM messages WHERE (sender_user_id = ? AND receiver_user_id = ?) ' +
        'OR (sender_user_id = ? AND receiver_user_id = ?)',
      [userId, externalUserId, externalUserId, userId]
    )
  }
}
