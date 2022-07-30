import { Event, EventWithId } from '../models/event/event'

import { EventDAO } from '../dao/event_dao'

import { isNumber, isObject, validateEvent, validateString } from '../utils/validator'
import { toDate } from '../utils/dates'

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
 * @param {number} eventId - ID to search.
 * @returns {Promise<EventWithId[]>} List of events by ID.
 */
export const getEventsById = async (eventId: number): Promise<EventWithId[]> => {
  return await eventDAO.getEventById(eventId).then((result) => result)
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

/**
 * Function to update the information of an {@link Event} on the database.
 * @param {number} eventId - ID of the event to update.
 * @param {Event} event - Event with the updated information.
 */
export const updateEventInformation = async (eventId: number, event: Event): Promise<EventWithId> => {
  // Get user by ID with the existing information
  const existingEvent = await getEventsById(eventId)
    .then((events) => {
      return events[0]
    })

  // Get the user fields that are not marked as updatable
  const notUpdatableFields = validateEvent(event, false)

  // Set new values for the updated user
  const updatedEvent: EventWithId = event as EventWithId
  updatedEvent.id = existingEvent.id

  // Set old values to those fields that are not marked as updatable
  notUpdatableFields.forEach((field) => {
    switch (field) {
      case 'title':
        updatedEvent.title = existingEvent.title
        break
      case 'image_url':
        updatedEvent.image_url = existingEvent.image_url
        break
      case 'format':
        updatedEvent.format = (existingEvent).format
        break
      case 'link':
        updatedEvent.link = existingEvent.link
        break
      case 'location':
        updatedEvent.location = existingEvent.location
        break
      case 'description':
        updatedEvent.description = existingEvent.description
        break
      case 'start_date':
        updatedEvent.start_date = toDate(existingEvent.start_date)
        break
      case 'end_date':
        updatedEvent.end_date = toDate(existingEvent.end_date)
        break
      case 'max_attendees':
        updatedEvent.max_attendees = existingEvent.max_attendees
        break
      case 'ticket_price':
        updatedEvent.ticket_price = existingEvent.ticket_price
        break
      case 'category':
        updatedEvent.category = existingEvent.category
        break
    }
  })

  await eventDAO.updateEventById(updatedEvent)

  return updatedEvent
}

/**
 * Function to check if an {@link Event} exists by ID.
 * @param {number} eventId - ID of the event to check.
 * @returns {boolean} True if an event with the specified ID exists, false otherwise.
 */
export const existsEventById = async (eventId: number): Promise<boolean> => {
  if (isNumber(eventId)) {
    // Get event by id
    const eventsList = await getEventsById(eventId)

    // Check if user has data
    if (isObject(eventsList) && eventsList.length > 0) {
      // Check if ID matches
      return eventsList[0].id === eventId
    }
  }

  return false
}

/**
 * Function to check if a {@link User} is the owner of an {@link Event}.
 * @param {number} userId - ID of the user to check.
 * @param {number} eventId - ID of the event to check.
 * @returns {Promise<Boolean>} True if the specified user ID is the owner of the event, false otherwise.
 */
export const isUserEventOwner = async (userId: number, eventId: number): Promise<boolean> => {
  return await Promise<boolean>.resolve(
    existsEventById(eventId)
      .then(async (existsEvent) => {
        // Check if exists event with the specified ID
        if (existsEvent) {
          // Get event by ID
          return await getEventsById(eventId)
            .then((events) => {
              const event = events[0]

              // Check if the user is the owner of the event
              return event.owner_id === userId
            }).catch(() => {
              return false
            })
        } else {
          return false
        }
      }).catch(() => {
        return false
      })
  )
}

/**
 * Fucntion to delete an {@link EventWithId} from the database.
 * @param {number} eventId - ID of the event to delete.
 */
export const deleteEvent = async (eventId: number): Promise<void> => {
  await eventDAO.deleteEventById(eventId)
}

/**
 * Function to get all {@link EventWithId} where a specified user is the owner.
 * @param ownerId - ID of the owner of the event.
 * @returns {Promise<EventWithId[]>} List of events where the specified user is the owner.
 */
export const getEventsByOwnerId = async (ownerId: number): Promise<EventWithId[]> => {
  return await eventDAO.getEventsByOwner(ownerId).then((events) => events)
}

/**
 * Function to get all future {@link EventWithId} where a specified user is the owner.
 * @param ownerId - ID of the owner of the event.
 * @returns {Promise<EventWithId[]>} List of future events where the specified user is the owner.
 */
export const getFutureEventsByOwnerId = async (ownerId: number): Promise<EventWithId[]> => {
  return await eventDAO.getFutureEventsByOwner(ownerId).then((events) => events)
}

/**
 * Function to get all finished {@link EventWithId} where a specified user is the owner.
 * @param ownerId - ID of the owner of the event.
 * @returns {Promise<EventWithId[]>} List of finished events where the specified user is the owner.
 */
export const getFinishedEventsByOwnerId = async (ownerId: number): Promise<EventWithId[]> => {
  return await eventDAO.getFinishedEventsByOwner(ownerId).then((events) => events)
}

/**
 * Function to get all active {@link EventWithId} where a specified user is the owner.
 * @param ownerId - ID of the owner of the event.
 * @returns {Promise<EventWithId[]>} List of active events where the specified user is the owner.
 */
export const getActiveEventsByOwnerId = async (ownerId: number): Promise<EventWithId[]> => {
  return await eventDAO.getActiveEventsByOwner(ownerId).then((events) => events)
}

/**
 * Function to get all events where a user is attending along with the comment and rating given to them.
 * @param userId - ID of the user.
 * @returns {Promise<object[]>} List of events with the comment and rating a user is attending to.
 */
export const getEventsAttendedByUserId = async (userId: number): Promise<object[]> => {
  return await eventDAO.getEventsAttendedByUserId(userId).then((events) => events)
}

/**
 * Function to get all future events where a user is attending along with the comment and rating given to them.
 * @param userId - ID of the user.
 * @returns {Promise<object[]>} List of future events with the comment and rating a user is attending to.
 */
export const getFutureEventsAttendedByUserId = async (userId: number): Promise<object[]> => {
  return await eventDAO.getFutureEventsAttendedByUserId(userId).then((events) => events)
}

/**
 * Function to get all finished events where a user is attending along with the comment and rating given to them.
 * @param userId - ID of the user.
 * @returns {Promise<object[]>} List of finished events with the comment and rating a user is attending to.
 */
export const getFinishedEventsAttendedByUserId = async (userId: number): Promise<object[]> => {
  return await eventDAO.getFinishedEventsAttendedByUserId(userId).then((events) => events)
}

/**
 * Function to get all active events where a user is attending along with the comment and rating given to them.
 * @param userId - ID of the user.
 * @returns {Promise<object[]>} List of active events with the comment and rating a user is attending to.
 */
export const getActiveEventsAttendedByUserId = async (userId: number): Promise<object[]> => {
  return await eventDAO.getActiveEventsAttendedByUserId(userId).then((events) => events)
}
