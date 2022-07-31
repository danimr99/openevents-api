import { Message } from '../models/message/message'

import { MessageDAO } from '../dao/message_dao'
import { PublicUser } from '../models/user/user'

const messageDAO = new MessageDAO()

/**
 * Function to create a message.
 * @param {Message} message - Message to create.
 */
export const createMessage = async (message: Message): Promise<void> => {
  await messageDAO.insertMessage(message)
}

/**
 * Function to get all contacts from a user.
 * @param {number} userId - ID of a user to get contacts from.
 * @returns {Promise<PublicUser[]>} List of contacts from a user.
 */
export const getUserContacts = async (userId: number): Promise<PublicUser[]> => {
  return await messageDAO.getUserContacts(userId)
}

/**
 * Function to get all the messages exchanged between two users.
 * @param {number} userId - ID of a user.
 * @param {number} externalUserId - ID of an external user.
 * @returns {Promise<Message[]>} List of messages exchanged between both users.
 */
export const getChat = async (userId: number, externalUserId: number): Promise<Message[]> => {
  return await messageDAO.getChat(userId, externalUserId)
}

/**
 * Function delete all messages exchanged between users.
 * @param {number} userId - ID of a user.
 * @param {number} externalUserId - ID of another user.
 */
export const deleteChat = async (userId: number, externalUserId: number): Promise<void> => {
  await messageDAO.deleteChat(userId, externalUserId)
}
