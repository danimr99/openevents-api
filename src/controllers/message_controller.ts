import { Message } from '../models/message/message'

import { MessageDAO } from '../dao/message_dao'

const messageDAO = new MessageDAO()

/**
 * Function to create a {@link Message}.
 * @param {Message} message - Message to create.
 */
export const createMessage = async (message: Message): Promise<void> => {
  await messageDAO.insertMessage(message)
}
