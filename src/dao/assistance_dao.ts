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

  /**
   * Function to get all assistances of an {@link Event} from the database.
   * @param {number} eventId - ID of the event.
   * @returns {Promise<Assistance[]>} List of assistances of the specified event.
   */
  async getEventAssistances (eventId: number): Promise<Assistance[]> {
    let result: Assistance[]

    return await Promise<Assistance[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM assistances WHERE event_id = ?',
        [eventId]
      ).then(([rows]) => {
        // Convert from database result object to assistance
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to create an {@link Assistance} of a {@link User} for an {@link Event}
   * on the database.
   * @param {number} userId - ID of the user.
   * @param {number} eventId - ID of the event.
   */
  async createUserAssistanceForEvent (userId: number, eventId: number): Promise<any> {
    return await Promise<any>.resolve(
      // Insert into database
      databaseConnection.promise().query(
        'INSERT INTO assistances (user_id, event_id) VALUES (?, ?)',
        [userId, eventId]
      )
    )
  }

  /**
   * Function to update an {@link Assistance} from the database.
   * @param {Assistance} assistance - Assistance to update.
   */
  async updateAssistance (assistance: Assistance): Promise<any> {
    return await Promise<any>.resolve(
      // Update assistance on the database
      databaseConnection.promise().query(
        'UPDATE assistances SET comment = ?, rating = ? WHERE user_id = ? AND event_id = ?',
        [assistance.comment, assistance.rating, assistance.user_id, assistance.event_id]
      )
    )
  }
}
