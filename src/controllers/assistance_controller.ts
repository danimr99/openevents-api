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
