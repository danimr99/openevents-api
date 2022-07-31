import { Assistance } from '../models/assistance/assistance'
import { APIMessage } from '../models/enums/api_messages'

import { AssistanceDAO } from '../dao/assistance_dao'

import { validateAssistance } from '../utils/validator'

const assistanceDAO = new AssistanceDAO()

/**
 * Function to get an assistance of a user for an event.
 * @param {number} userId - ID of a user.
 * @param {number} eventId - ID of an event.
 * @returns {Promise<Assistance>} Assistance of a user for an event.
 */
export const getUserAssistanceForEvent = async (userId: number, eventId: number): Promise<Assistance> => {
  return await assistanceDAO.getUserAssistanceForEvent(userId, eventId).then((assistances) => assistances[0])
}

/**
 * Function to check if exists an assistance of a user for an event.
 * @param {number} userId - ID of a user.
 * @param {number} eventId - ID of an event.
 * @returns {Promise<Boolean>} True if exists an assistance of a user for an event, false otherwise.
 */
export const existsAssistance = async (userId: number, eventId: number): Promise<boolean> => {
  return await getUserAssistanceForEvent(userId, eventId)
    .then((assistance) => {
      // Check if exists assistance
      if (assistance != null) {
        // Assistance exists
        return true
      } else {
        // Assistance does not exist
        return false
      }
    }).catch(() => {
      return false
    })
}

/**
 * Function to delete an assistance of a user for an event.
 * @param {number} userId - ID of a user.
 * @param {number} eventId - ID of an event.
 */
export const deleteUserAssistanceForEvent = async (userId: number, eventId: number): Promise<void> => {
  await assistanceDAO.deleteUserAssistanceForEvent(userId, eventId)
}

/**
 * Function to get all assistances of an event.
 * @param {number} eventId -  ID of the event.
 * @returns {Promise<Assistance[]>} List of assistances of an event.
 */
export const getEventAssistances = async (eventId: number): Promise<Assistance[]> => {
  return await assistanceDAO.getEventAssistances(eventId)
}

/**
 * Function to create an assistance of a user for an event.
 * @param userId - ID of a user.
 * @param eventId - ID of an event.
 * @returns {Promise<string>} Notification informing the result of the operation.
 */
export const createUserAssistanceForEvent = async (userId: number, eventId: number): Promise<string> => {
  // Check if already exists an assistance of a user for an event
  return await existsAssistance(userId, eventId)
    .then(async (existsAssistance) => {
      if (existsAssistance) {
        // Assistance exists
        return APIMessage.ASSISTANCE_ALREADY_EXISTS
      } else {
        // Assistance does not exist
        return await assistanceDAO.createUserAssistanceForEvent(userId, eventId)
          .then(() => APIMessage.ASSISTANCE_CREATED)
      }
    })
}

/**
 * Function to update an assistance.
 * @param {Assistance} assistance - Assistance with new information.
 * @returns {Promise<Assistance>} Updated assistance.
 */
export const updateAssistance = async (assistance: Assistance): Promise<Assistance> => {
  // Get assistance with the existing information
  const existingAssistance = await getUserAssistanceForEvent(assistance.user_id, assistance.event_id)

  // Get the assistance fields that are not marked as updatable
  const notUpdatableFields = validateAssistance(assistance, false)

  // Set new values for the updated assistance
  const updatedAssistance: Assistance = assistance

  // Set old values to those fields that are not marked as updatable
  notUpdatableFields.forEach((field) => {
    switch (field) {
      case 'comment':
        updatedAssistance.comment = (existingAssistance).comment
        break
      case 'rating':
        updatedAssistance.rating = (existingAssistance).rating
        break
    }
  })

  // Update assistance
  await assistanceDAO.updateAssistance(updatedAssistance)

  return updatedAssistance
}

/**
 * Function to get all assistances of a user.
 * @param {number} userId - ID of a user.
 * @returns {Promise<Assistance[]>} List of assistances of a user.
 */
export const getAssistancesByUser = async (userId: number): Promise<Assistance[]> => {
  return await assistanceDAO.getAssistancesByUser(userId)
}
