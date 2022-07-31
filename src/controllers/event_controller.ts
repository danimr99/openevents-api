import { Event, EventWithId } from '../models/event/event'

import { EventDAO } from '../dao/event_dao'

import { isNumber, isObject, validateEvent, validateString } from '../utils/validator'
import { getCurrentDate, toDate } from '../utils/dates'
import { deleteAssistancesOfEvent } from './assistance_controller'

const eventDAO = new EventDAO()

/**
 * Function to get all future events.
 * @returns {Promise<EventWithId[]>} List of all future events.
 */
export const getAllEvents = async (): Promise<EventWithId[]> => {
  return await eventDAO.getAllEvents()
}

/**
 * Function to create an event.
 * @param {Event} event - Event to create.
 */
export const createEvent = async (event: Event): Promise<void> => {
  await eventDAO.insertEvent(event)
}

/**
 * Function to get an event by ID.
 * @param {number} eventId - ID of an event to search.
 * @returns {Promise<EventWithId[]>} List of events by ID.
 */
export const getEventById = async (eventId: number): Promise<EventWithId> => {
  return await eventDAO.getEventById(eventId)
}

/**
 * Function to get all events that its title and/or location contains the specified search parameters.
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
    return await eventDAO.getEventsByCompleteSearch(title, location)
  } else if (titleHasValue) {
    return await eventDAO.getEventsByTitleSearch(title)
  } else if (locationHasValue) {
    return await eventDAO.getEventsByLocationSearch(location)
  } else {
    return []
  }
}

/**
 * Function to update an event.
 * @param {number} eventId - ID of an event to update.
 * @param {Event} event - Event with updated information.
 * @returns {Event} Updated event.
 */
export const updateEventInformation = async (eventId: number, event: Event): Promise<EventWithId> => {
  // Get user by ID with the existing information
  const existingEvent = await getEventById(eventId)

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

  // Update event
  await eventDAO.updateEventById(updatedEvent)

  return updatedEvent
}

/**
 * Function to check if an event exists by ID.
 * @param {number} eventId - ID of an event to check.
 * @returns {boolean} True if an event with the specified ID exists, false otherwise.
 */
export const existsEventById = async (eventId: number): Promise<boolean> => {
  // Check if event ID is a number
  if (isNumber(eventId)) {
    // Get event by ID
    const event = await getEventById(eventId)

    // Check if user has data
    if (isObject(event) && event != null) {
      // Check if ID matches
      return event.id === eventId
    }
  }

  return false
}

/**
 * Function to check if a user is the owner of an event.
 * @param {number} userId - ID of a user to check.
 * @param {number} eventId - ID of an event to check.
 * @returns {Promise<Boolean>} True if the specified user ID is the owner of the event, false otherwise.
 */
export const isUserEventOwner = async (userId: number, eventId: number): Promise<boolean> => {
  return await existsEventById(eventId)
    .then(async (existsEvent) => {
      // Check if exists event with the specified ID
      if (existsEvent) {
        // Get event by ID
        return await getEventById(eventId)
          .then((event) => {
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
}

/**
 * Function to delete an event.
 * @param {number} eventId - ID of an event to delete.
 */
export const deleteEvent = async (eventId: number): Promise<void> => {
  // Delete event
  await eventDAO.deleteEventById(eventId)

  // Delete event assistances
  await deleteAssistancesOfEvent(eventId)
}

/**
 * Function to get all events where a user is the owner.
 * @param {number} ownerId - ID of an owner of the event.
 * @returns {Promise<EventWithId[]>} List of events where a user is the owner.
 */
export const getEventsByOwnerId = async (ownerId: number): Promise<EventWithId[]> => {
  return await eventDAO.getEventsByOwner(ownerId)
}

/**
 * Function to get all future events where a user is the owner.
 * @param {number} ownerId - ID of an owner of the event.
 * @returns {Promise<EventWithId[]>} List of future events where a user is the owner.
 */
export const getFutureEventsByOwnerId = async (ownerId: number): Promise<EventWithId[]> => {
  return await eventDAO.getFutureEventsByOwner(ownerId)
}

/**
 * Function to get all finished events where a user is the owner.
 * @param {number} ownerId - ID of an owner of the event.
 * @returns {Promise<EventWithId[]>} List of finished events where a user is the owner.
 */
export const getFinishedEventsByOwnerId = async (ownerId: number): Promise<EventWithId[]> => {
  return await eventDAO.getFinishedEventsByOwner(ownerId)
}

/**
 * Function to get all active events where a user is the owner.
 * @param {number} ownerId - ID of an owner of the event.
 * @returns {Promise<EventWithId[]>} List of active events where a user is the owner.
 */
export const getActiveEventsByOwnerId = async (ownerId: number): Promise<EventWithId[]> => {
  return await eventDAO.getActiveEventsByOwner(ownerId)
}

/**
 * Function to get all events where a user is attending along with the comment and rating given to them.
 * @param {number} userId - ID of a user.
 * @returns {Promise<object[]>} List of events with the comment and rating a user is attending to.
 */
export const getEventsAttendedByUserId = async (userId: number): Promise<object[]> => {
  return await eventDAO.getEventsAttendedByUserId(userId)
}

/**
 * Function to get all future events where a user is attending along with the comment and rating given to them.
 * @param {number} userId - ID of a user.
 * @returns {Promise<object[]>} List of future events with the comment and rating a user is attending to.
 */
export const getFutureEventsAttendedByUserId = async (userId: number): Promise<object[]> => {
  return await eventDAO.getFutureEventsAttendedByUserId(userId)
}

/**
 * Function to get all finished events where a user is attending along with the comment and rating given to them.
 * @param {number} userId - ID of a user.
 * @returns {Promise<object[]>} List of finished events with the comment and rating a user is attending to.
 */
export const getFinishedEventsAttendedByUserId = async (userId: number): Promise<object[]> => {
  return await eventDAO.getFinishedEventsAttendedByUserId(userId)
}

/**
 * Function to get all active events where a user is attending along with the comment and rating given to them.
 * @param {number} userId - ID of a user.
 * @returns {Promise<object[]>} List of active events with the comment and rating a user is attending to.
 */
export const getActiveEventsAttendedByUserId = async (userId: number): Promise<object[]> => {
  return await eventDAO.getActiveEventsAttendedByUserId(userId)
}

/**
 * Function to check whether an event has finished or not.
 * @param {number} eventId - ID of an event.
 * @returns {Promise<Boolean>} True if the event has finished, false otherwise.
 */
export const hasEventFinished = async (eventId: number): Promise<boolean> => {
  // Check if event exists
  return await existsEventById(eventId)
    .then(async (existsEvent) => {
      if (existsEvent) {
        // Event exists
        return await getEventById(eventId)
          .then((event) => {
            // Check if event has finished
            return toDate(event.end_date) < getCurrentDate()
          })
      } else {
        // Event does not exist
        return false
      }
    })
}

/**
 * Function to calculate the average rating received on all the events
 * created by a user.
 * @param {number} userId - ID of a user.
 * @returns {Promise<number>} Average rating.
 */
export const getAverageRatingOfEventsCreatedByUser = async (userId: number): Promise<number> => {
  return await eventDAO.getAverageRatingOfEventsCreatedByUser(userId)
}

/**
 * Function to get all future popular events.
 * @returns {Promise<EventWithId[]>} List of popular future events.
 */
export const getFuturePopularEvents = async (): Promise<EventWithId[]> => {
  return await eventDAO.getFuturePopularEvents()
}
