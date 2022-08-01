import { Event, EventWithId } from '../models/event/event'
import { EventFormat } from '../models/event/event_format'

import { databaseConnection } from '../utils/database'

export class EventDAO {
  /**
   * Function to get all the future events from the database.
   * @returns {Promise<EventWithId[]>} List of all future events.
   */
  async getAllEvents (): Promise<EventWithId[]> {
    // Select all future events
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE start_date > NOW()'
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId[]
    })
  }

  /**
   * Function to insert a new event to the database.
   * @param {Event} event - User to add.
   */
  async insertEvent (event: Required<Event>): Promise<void> {
    let eventFormat: number

    // Get event format to insert
    switch (event.format) {
      case EventFormat.FACE_TO_FACE:
        eventFormat = 0
        break
      case EventFormat.ONLINE:
        eventFormat = 1
    }

    // Insert event
    await databaseConnection.promise().query(
      'INSERT INTO events (title, owner_id, creation_date, image_url, format, link, location, description, start_date,' +
        'end_date, max_attendees, ticket_price, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [event.title, event.owner_id, event.creation_date, event.image_url, eventFormat, event.link, event.location,
        event.description, event.start_date, event.end_date, event.max_attendees, event.ticket_price, event.category
      ]
    )
  }

  /**
   * Function to get an event by ID from the database.
   * @param {number} id - ID to search.
   * @returns {Promise<EventWithId>} Event with matching ID.
   */
  async getEventById (id: number): Promise<EventWithId> {
    // Select event by ID
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE id = ?',
      [id]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId
    })
  }

  /**
   * Function to get all events from the database that its title and
   * location contains the specified search parameters.
   * @param {string} title - Title to search.
   * @param {string} location - Location to search.
   * @returns {Promise<EventWithId[]>} List of events that matches with the search parameters.
   */
  async getEventsByCompleteSearch (title: string, location: string): Promise<EventWithId[]> {
    // Select events by title and/or location
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE title LIKE CONCAT(\'%\', ?, \'%\') AND location LIKE CONCAT(\'%\', ?, \'%\')',
      [title, location]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId[]
    })
  }

  /**
   * Function to get all events from the database that its title contains
   * the specified search parameters.
   * @param {string} title - Title to search.
   * @returns {Promise<EventWithId[]>} List of events that matches with the search parameters.
   */
  async getEventsByTitleSearch (title: string): Promise<EventWithId[]> {
    // Select events by title
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE title LIKE CONCAT(\'%\', ?, \'%\')',
      [title]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId[]
    })
  }

  /**
   * Function to get all events from the database that its location contains
   * the specified search parameters.
   * @param {string} location - Location to search.
   * @returns {Promise<EventWithId[]>} List of events that matches with the search parameters.
   */
  async getEventsByLocationSearch (location: string): Promise<EventWithId[]> {
    // Select events by location
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE location LIKE CONCAT(\'%\', ?, \'%\') ',
      [location]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId[]
    })
  }

  /**
   * Function to update an event from the database.
   * @param {UserWithId} event - Event to update.
   */
  async updateEventById (event: EventWithId): Promise<void> {
    let eventFormat: any

    // Get event format
    switch (event.format) {
      case EventFormat.FACE_TO_FACE:
        // Field has been modified to EventFormat.FACE_TO_FACE
        eventFormat = 0
        break
      case EventFormat.ONLINE:
        // Field has been modified to EventFormat.ONLINE
        eventFormat = 1
        break
      default:
        // Field has not been updated
        eventFormat = event.format
        break
    }

    // Update event
    await databaseConnection.promise().query(
      'UPDATE events SET title = ?, image_url = ?, format = ?, link = ?, location = ?, description = ?, start_date = ?, ' +
        'end_date = ?, max_attendees = ?, ticket_price = ?, category = ? WHERE id = ?',
      [event.title, event.image_url, eventFormat, event.link, event.location, event.description, event.start_date,
        event.end_date, event.max_attendees, event.ticket_price, event.category, event.id]
    )
  }

  /**
   * Function to delete an event by ID from the database.
   * @param {number} id - ID of the event to delete.
   */
  async deleteEventById (id: number): Promise<void> {
    // Delete event by ID
    await databaseConnection.promise().query(
      'DELETE FROM events WHERE id = ?',
      [id]
    )
  }

  /**
   * Function to get all events where a user is the owner
   * from the database.
   * @param {number} ownerId - ID of the owner to search.
   * @returns {Promise<EventWithId[]>} List of events where a user is the owner.
   */
  async getEventsByOwner (ownerId: number): Promise<EventWithId[]> {
    // Select events by owner
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE owner_id = ?',
      [ownerId]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId[]
    })
  }

  /**
   * Function to get all future events where a user is the owner
   * from the database.
   * @param {number} ownerId - ID of the owner to search.
   * @returns {Promise<EventWithId[]>} List of future events where a user is the owner.
   */
  async getFutureEventsByOwner (ownerId: number): Promise<EventWithId[]> {
    // Select future events by user
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE owner_id = ? AND start_date > NOW()',
      [ownerId]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId[]
    })
  }

  /**
   * Function to get all finished events where a user is the owner
   * from the database.
   * @param {number} ownerId - ID of the owner to search.
   * @returns {Promise<EventWithId[]>} List of finished events where a user is the owner.
   */
  async getFinishedEventsByOwner (ownerId: number): Promise<EventWithId[]> {
    // Select finished events by owner
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE owner_id = ? AND end_date < NOW()',
      [ownerId]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId[]
    })
  }

  /**
   * Function to get all active events where a user is the owner
   * from the database.
   * @param {number} ownerId - ID of the owner to search.
   * @returns {Promise<EventWithId[]>} List of active events where a user is the owner.
   */
  async getActiveEventsByOwner (ownerId: number): Promise<EventWithId[]> {
    // Select active events by owner
    return await databaseConnection.promise().query(
      'SELECT * FROM events WHERE owner_id = ? AND start_date < NOW() AND end_date > NOW()',
      [ownerId]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as EventWithId[]
    })
  }

  /**
   * Function to get all events where a user is attending along with the comment and rating given to them
   * from the database.
   * @param userId - ID of a user.
   * @returns {Promise<object[]>} List of events with the comment and rating a user is attending to.
   */
  async getEventsAttendedByUserId (userId: number): Promise<object[]> {
    // Select event information, comment and rating of events attended by a user
    return await databaseConnection.promise().query(
      'SELECT e.*, a.rating, a.comment FROM events AS e INNER JOIN assistances AS a ON e.id = a.event_id ' +
        'WHERE a.user_id = ?',
      [userId]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as object[]
    })
  }

  /**
   * Function to get all future events where a user is attending along with the comment and rating given to them
   * from the database.
   * @param userId - ID of a user.
   * @returns {Promise<object[]>} List of future events with the comment and rating a user is attending to.
   */
  async getFutureEventsAttendedByUserId (userId: number): Promise<object[]> {
    // Select event information, comment and rating of future events attended by a user
    return await databaseConnection.promise().query(
      'SELECT e.*, a.rating, a.comment FROM events AS e INNER JOIN assistances AS a ON e.id = a.event_id ' +
        'WHERE a.user_id = ? AND e.start_date > NOW()',
      [userId]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as object[]
    })
  }

  /**
   * Function to get all finished events where a user is attending along with the comment and rating given to them
   * from the database.
   * @param userId - ID of a user.
   * @returns {Promise<object[]>} List of finished events with the comment and rating a user is attending to.
   */
  async getFinishedEventsAttendedByUserId (userId: number): Promise<object[]> {
    // Select event information, comment and rating of finished events attended by a user
    return await databaseConnection.promise().query(
      'SELECT e.*, a.rating, a.comment FROM events AS e INNER JOIN assistances AS a ON e.id = a.event_id ' +
        'WHERE a.user_id = ? AND e.end_date < NOW()',
      [userId]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as object[]
    })
  }

  /**
   * Function to get all active events where a user is attending along with the comment and rating given to them
   * from the database.
   * @param userId - ID of a user.
   * @returns {Promise<object[]>} List of active events with the comment and rating a user is attending to.
   */
  async getActiveEventsAttendedByUserId (userId: number): Promise<object[]> {
    // Select event information, comment and rating of active events attended by a user
    return await databaseConnection.promise().query(
      'SELECT e.*, a.rating, a.comment FROM events AS e INNER JOIN assistances AS a ON e.id = a.event_id ' +
        'WHERE a.user_id = ? AND e.start_date < NOW() AND e.end_date > NOW()',
      [userId]
    ).then(([rows]) => {
      // Convert from database result object to list of events
      return JSON.parse(JSON.stringify(rows)) as object[]
    })
  }

  /**
   * Function to calculate the average rating received on all the events
   * created by a user from the database.
   * @param {number} userId - ID of a user.
   * @returns {Promise<number>} Average rating.
   */
  async getAverageRatingOfEventsCreatedByUser (userId: number): Promise<number> {
    let result: any

    // Query to database
    return await databaseConnection.promise().query(
      'SELECT ROUND(AVG(a.rating), 2) AS average_score FROM assistances AS a WHERE a.event_id IN ' +
        '(SELECT e.id FROM events AS e WHERE e.owner_id = ?) AND a.rating IS NOT NULL',
      [userId]
    ).then(([rows]) => {
      // Get result
      result = JSON.parse(JSON.stringify(rows))[0]

      // Return result or 0 if null
      return result.average_score === null ? 0 : result.average_score
    })
  }

  /**
   * Function to get all future popular events from the database.
   * @returns {Promise<EventWithId[]>} List of popular future events.
   */
  async getFuturePopularEvents (): Promise<EventWithId[]> {
    const popularEvents: EventWithId[] = []

    // Get average score for each event owner
    const ownersAverageScores: object[] = await databaseConnection.promise().query(
      'SELECT (AVG(a.rating)) AS average_score, e.owner_id FROM assistances AS a, events AS e, users AS u ' +
        'WHERE e.owner_id = u.id AND e.id = a.event_id AND e.end_date < NOW() GROUP BY e.owner_id ' +
          'ORDER BY average_score DESC'
    ).then(([rows]) => {
      // Convert from database result object to list of scores
      return JSON.parse(JSON.stringify(rows))
    })

    // Get all future events
    const futureEvents: EventWithId[] = await databaseConnection.promise().query(
      'SELECT * FROM events WHERE start_date > NOW()'
    ).then(([rows]) => {
      // Convert from database result object to event
      return JSON.parse(JSON.stringify(rows))
    })

    // Iterate through all future events
    futureEvents.forEach(event => {
      // Iterate through all owners average scores
      ownersAverageScores.forEach((owner: any) => {
        // If the owner has the highest average score
        if (event.owner_id === owner.owner_id) {
          // Add event to popular events list
          popularEvents.push(event)
        }
      })
    })

    return popularEvents
  }

  /**
   * Function to delete all events created by a user
   * from the database.
   * @param {number} userId - ID of a user.
   */
  async deleteUserEvents (userId: number): Promise<void> {
    // Delete events of an owner
    await databaseConnection.promise().query(
      'DELETE FROM events WHERE owner_id = ?',
      [userId]
    )
  }
}
