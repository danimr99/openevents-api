import { Assistance } from '../models/assistance/assistance'

import { databaseConnection } from '../utils/database'

export class AssistanceDAO {
  /**
   * Function to get an assistance of a user for an event from the database.
   * @param {number} userId - ID of a user.
   * @param {number} eventId - ID of an event.
   * @returns {Promise<Assistance[]>} Assistance of a user for an event.
   */
  async getUserAssistanceForEvent (userId: number, eventId: number): Promise<Assistance[]> {
    // Select assistance of a user for an event
    return await databaseConnection.promise().query(
      'SELECT * FROM assistances WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    ).then(([rows]) => {
      // Convert from database result object to list of assistances
      return JSON.parse(JSON.stringify(rows)) as Assistance[]
    })
  }

  /**
   * Function to delete an assistance of a user for an event from the database.
   * @param {number} userId - ID of a user.
   * @param {number} eventId - ID of an event.
   */
  async deleteUserAssistanceForEvent (userId: number, eventId: number): Promise<void> {
    // Delete event with the specified ID
    await databaseConnection.promise().query(
      'DELETE FROM assistances WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    )
  }

  /**
   * Function to get all assistances of an event from the database.
   * @param {number} eventId - ID of an event.
   * @returns {Promise<Assistance[]>} List of assistances of an event.
   */
  async getEventAssistances (eventId: number): Promise<Assistance[]> {
    // Select all assistance of a specified event
    return await databaseConnection.promise().query(
      'SELECT * FROM assistances WHERE event_id = ?',
      [eventId]
    ).then(([rows]) => {
      // Convert from database result object to list of assistances
      return JSON.parse(JSON.stringify(rows)) as Assistance[]
    })
  }

  /**
   * Function to create an assistance of a user for an event on the database.
   * @param {number} userId - ID of a user.
   * @param {number} eventId - ID of an event.
   */
  async createUserAssistanceForEvent (userId: number, eventId: number): Promise<void> {
    // Create an assistance of a user for an event
    await databaseConnection.promise().query(
      'INSERT INTO assistances (user_id, event_id) VALUES (?, ?)',
      [userId, eventId]
    )
  }

  /**
   * Function to update an assistance from the database.
   * @param {Assistance} assistance - Assistance to update.
   */
  async updateAssistance (assistance: Assistance): Promise<void> {
    // Update comment and rating of an assistance
    await databaseConnection.promise().query(
      'UPDATE assistances SET comment = ?, rating = ? WHERE user_id = ? AND event_id = ?',
      [assistance.comment, assistance.rating, assistance.user_id, assistance.event_id]
    )
  }

  /**
   * Function to get all assistances of a user from the database.
   * @param {number} userId - ID of a user.
   * @returns {Promise<Assistance[]>} List of assistances of a user.
   */
  async getAssistancesByUser (userId: number): Promise<Assistance[]> {
    // Select all assistances of a user
    return await databaseConnection.promise().query(
      'SELECT * FROM assistances WHERE user_id = ?',
      [userId]
    ).then(([rows]) => {
      // Convert from database result object to list of assistances
      return JSON.parse(JSON.stringify(rows)) as Assistance[]
    })
  }

  /**
   * Function to delete all assistances of an event from the database.
   * @param eventId - ID of an event.
   */
  async deleteAssistancesOfEvent (eventId: number): Promise<void> {
    // Delete assistances of an event
    await databaseConnection.promise().query(
      'DELETE FROM assistances WHERE event_id = ?',
      [eventId]
    )
  }

  /**
   * Function to delete all assistances of a user from the database.
   * @param userId - ID of a user.
   */
  async deleteUserAssistances (userId: number): Promise<void> {
    // Delete assistances of a user
    await databaseConnection.promise().query(
      'DELETE FROM assistances WHERE user_id = ?',
      [userId]
    )
  }
}
