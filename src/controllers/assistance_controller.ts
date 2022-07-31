import { Assistance } from '../models/assistance/assistance'
import { APIMessage } from '../models/enums/api_messages'

import { AssistanceDAO } from '../dao/assistance_dao'

import { validateAssistance } from '../utils/validator'

const assistanceDAO = new AssistanceDAO()

/**
 * Function to get an assistance of a user for an event.
 * @param {number} userId - ID of a user.
 * @param {number} eventId - ID of an event.
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

/**
 * Function to get all assistances of an {@link Event}.
 * @param {number} eventId -  ID of the event.
 * @returns {Promise<Assistance[]>} List of assistances of the specified event.
 */
export const getEventAssistances = async (eventId: number): Promise<Assistance[]> => {
  return await assistanceDAO.getEventAssistances(eventId).then((assistances) => assistances)
}

/**
 * Function to create an {@link Assistance} of a {@link User} for an {@link Event}.
 * @param userId - ID of the user.
 * @param eventId - ID of the event.
 * @returns {Promise<string>} Notification informing of the result of the operation.
 */
export const createUserAssistanceForEvent = async (userId: number, eventId: number): Promise<string> => {
  // Check if already exists an assistance of the user for the event
  return await assistanceDAO.getUserAssistanceForEvent(userId, eventId)
    .then(async (assistances) => {
      if (assistances.length === 0) {
        // Assistance does not exist
        return await assistanceDAO.createUserAssistanceForEvent(userId, eventId)
          .then(() => APIMessage.ASSISTANCE_CREATED)
      } else {
        // Assistance already exists
        return APIMessage.ASSISTANCE_ALREADY_EXISTS
      }
    })
}

/**
 * Function to update the information of an {@link Assistance}.
 * @param {Assistance} assistance
 * @returns {Promise<Assistance>} Assistance with the updated information.
 */
export const updateAssistance = async (assistance: Assistance): Promise<Assistance> => {
  // Get assistance with the existing information
  const existingAssistance = await getUserAssistanceForEvent(assistance.user_id, assistance.event_id)
    .then((assistances) => {
      return assistances[0]
    })

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

  await assistanceDAO.updateAssistance(updatedAssistance)

  return updatedAssistance
}

/**
 * Function to get all the assistances of a user.
 * @param {number} userId - ID of the user.
 * @returns {Promise<Assistance[]>} List of assistances of a user.
 */
export const getAssistancesByUser = async (userId: number): Promise<Assistance[]> => {
  return await assistanceDAO.getAssistancesByUser(userId)
}
