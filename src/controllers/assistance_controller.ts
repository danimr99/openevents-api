import { Assistance } from '../models/assistance/assistance'

import { AssistanceDAO } from '../dao/assistance_dao'

const assistanceDAO = new AssistanceDAO()

/**
 * Function to get an {@link Assistance} of a user for an event.
 * @param {number} userId - ID of a user.
 * @param eventId - ID of an event.
 * @returns {Promise<Assistance[]>} List containing the assistance of a user for an event.
 */
export const getUserAssistanceForEvent = async (userId: number, eventId: number): Promise<Assistance[]> => {
  return await assistanceDAO.getUserAssistanceForEvent(userId, eventId).then((assistances) => assistances)
}

/**
 * Function to check if exists an {@link Assistance} of a {@link User} for an {@link Event}.
 * @param userId - ID of the user.
 * @param eventId - ID of the event.
 * @returns {Promise<Boolean>} True if exists an assistance of the specified user for the specified event,
 * false otherwise.
 */
export const existsAssistance = async (userId: number, eventId: number): Promise<boolean> => {
  return await getUserAssistanceForEvent(userId, eventId)
    .then((assistances) => {
    // Check if exists assistance
      if (assistances.length > 0) {
        return true
      } else {
        return false
      }
    }).catch(() => {
      return false
    })
}

/**
 * Function to delete an {@link Assistance} of a {@link User} for an {@link Event}.
 * @param {number} userId - ID of the user.
 * @param {number} eventId - ID of the event.
 */
export const deleteUserAssistanceForEvent = async (userId: number, eventId: number): Promise<any> => {
  return await assistanceDAO.deleteUserAssistanceForEvent(userId, eventId)
}