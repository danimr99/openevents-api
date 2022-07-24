import { Message } from '../models/message/message'

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
}
