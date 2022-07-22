import { Event, EventWithId } from '../models/event/event'

import { EventDAO } from '../dao/event_dao'
import { validateString } from '../utils/validator'

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

/**
 * Function to get an event by ID.
 * @param {number} id - ID to search.
 * @returns {Promise<EventWithId[]>} List of events by ID.
 */
export const getEventsById = async (id: number): Promise<EventWithId[]> => {
  return await eventDAO.getEventById(id).then((result) => result)
}

/**
 * Function to get all the {@link EventWithId} from the database that its title and/or
 * location contains the specified search parameters.
 * @param {string} title - Title to search.
 * @param {string} location - Location to search.
 * @returns {Promise<EventWithId[]>} List of events that matches with the search parameters.
 */
export const getEventsBySearch = async (title: string, location: string): Promise<EventWithId[]> => {
  // Check which fields are fulfilled
  const titleHasValue = validateString(title)
  const locationHasValue = validateString(location)

  // Check which database query should be executed
  if (titleHasValue && locationHasValue) {
    return await eventDAO.getEventsByCompleteSearch(title, location).then((result) => result)
  } else if (titleHasValue) {
    return await eventDAO.getEventsByTitleSearch(title).then((result) => result)
  } else if (locationHasValue) {
    return await eventDAO.getEventsByLocationSearch(location).then((result) => result)
  } else {
    return []
  }
}
