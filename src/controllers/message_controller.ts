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

/**
 * Function to get all the {@link Message}s exchanged between the
 * authenticated {@link User} and an external {@link User}.
 * @param {number} userId - ID of a user.
 * @param {number} externalUserId - ID of the external user.
 * @returns {Promise<Message[]>} List of messages exchanged between specified users.
 */
export const getChat = async (userId: number, externalUserId: number): Promise<Message[]> => {
  return await messageDAO.getChat(userId, externalUserId).then((messages) => messages)
}

/**
 * Function delete all messages exchanged between users.
 * @param {number} userId - ID of a user.
 * @param {number} externalUserId - ID of another user.
 */
export const deleteChat = async (userId: number, externalUserId: number): Promise<any> => {
  return await messageDAO.deleteChat(userId, externalUserId)
}
