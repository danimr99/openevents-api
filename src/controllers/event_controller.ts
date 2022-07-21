import { Event, EventWithId } from '../models/event/event'

import { EventDAO } from '../dao/event_dao'

const eventDAO = new EventDAO()

/**
 * Function to get all the future {@link EventWithId} from the database.
 * @returns {Promise<EventWithId[]>} List of all the events.
 */
export const getAllEvents = async (): Promise<EventWithId[]> => {
  return await eventDAO.getAllEvents().then((result) => result)
}

/**
 * Function to create an {@link Event}.
 * @param {Event} event - Event to create.
 */
export const createEvent = async (event: Event): Promise<void> => {
  await eventDAO.insertEvent(event)
}
