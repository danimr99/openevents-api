import { Message } from '../models/message/message'

import { MessageDAO } from '../dao/message_dao'
import { PublicUser } from '../models/user/user'

const messageDAO = new MessageDAO()

/**
 * Function to create a {@link Message}.
 * @param {Message} message - Message to create.
 */
export const createMessage = async (message: Message): Promise<void> => {
  await messageDAO.insertMessage(message)
}

/**
 * Function to get all contacts from a {@link User}.
 * @param {number} userId - ID of the user to get contacts from.
 * @returns {Promise<PublicUser[]>} List of contacts from the specified user.
 */
export const getUserContacts = async (userId: number): Promise<PublicUser[]> => {
  return await messageDAO.getUserContacts(userId).then((users) => users)
}
