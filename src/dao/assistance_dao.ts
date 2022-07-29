import { Assistance } from '../models/assistance/assistance'

import { databaseConnection } from '../utils/database'

export class AssistanceDAO {
  /**
   * Function to get an {@link Assistance} of a user for an event
   * from the database.
   * @param {number} userId - ID of a user.
   * @param {number} eventId - ID of an event.
   * @returns {Promise<Assistance[]>} Assistance of a user for an event.
   */
  async getUserAssistanceForEvent (userId: number, eventId: number): Promise<Assistance[]> {
    let result: Assistance[]

    return await Promise<Assistance[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM assistances WHERE user_id = ? AND event_id = ?',
        [userId, eventId]
      ).then(([rows]) => {
        // Convert from database result object to assistance
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to delete an {@link Assistance} of a {@link User} for an {@link Event}
   * from the database.
   * @param {number} userId - ID of the user.
   * @param {number} eventId - ID of the event.
   */
  async deleteUserAssistanceForEvent (userId: number, eventId: number): Promise<any> {
    return await Promise<any>.resolve(
      // Delete event with the specified ID from the database
      databaseConnection.promise().query(
        'DELETE FROM assistances WHERE user_id = ? AND event_id = ?',
        [userId, eventId]
      )
    )
  }
}
