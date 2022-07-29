import { Event, EventWithId } from '../models/event/event'
import { EventFormat } from '../models/event/event_format'

import { databaseConnection } from '../utils/database'

export class EventDAO {
  /**
   * Function to get all the future {@link EventWithId} from the database.
   * @returns {Promise<EventWithId[]>} List of all events.
   */
  async getAllEvents (): Promise<EventWithId[]> {
    let result: EventWithId[]

    return await Promise<EventWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM events WHERE start_date > NOW()'
      ).then(([rows]) => {
        // Convert from database result object to user
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to insert a new {@link Event} to the database.
   * @param {Event} event - User to add into database.
   */
  async insertEvent (event: Required<Event>): Promise<any> {
    let eventFormat: number

    // Get event format to insert
    switch (event.format) {
      case EventFormat.FACE_TO_FACE:
        eventFormat = 0
        break
      case EventFormat.ONLINE:
        eventFormat = 1
    }

    return await Promise<any>.resolve(
      // Insert into database
      databaseConnection.promise().query(
        'INSERT INTO events (title, owner_id, creation_date, image_url, format, link, location, description, start_date,' +
          'end_date, max_attendees, ticket_price, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [event.title, event.owner_id, event.creation_date, event.image_url, eventFormat, event.link, event.location,
          event.description, event.start_date, event.end_date, event.max_attendees, event.ticket_price, event.category
        ]
      )
    )
  }

  /**
   * Function to get an {@link EventWithId} by ID from the database.
   * @param {number} id - ID to search.
   * @returns {Promise<EventWithId[]>} List of events with the specified ID.
   */
  async getEventById (id: number): Promise<EventWithId[]> {
    let result: EventWithId[]

    return await Promise<EventWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM events WHERE id = ?',
        [id]
      ).then(([rows]) => {
        // Convert from database result object to event
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get all the {@link EventWithId} from the database that its title and
   * location contains the specified search parameters.
   * @param {string} title - Title to search.
   * @param {string} location - Location to search.
   * @returns {Promise<EventWithId[]>} List of events that matches with the search parameters.
   */
  async getEventsByCompleteSearch (title: string, location: string): Promise<EventWithId[]> {
    let result: EventWithId[]

    return await Promise<EventWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM events WHERE title LIKE CONCAT(\'%\', ?, \'%\') AND location LIKE CONCAT(\'%\', ?, \'%\')',
        [title, location]
      ).then(([rows]) => {
        // Convert from database result object to event
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get all the {@link EventWithId} from the database that its title contains
   * the specified search parameters.
   * @param {string} title - Title to search.
   * @returns {Promise<EventWithId[]>} List of events that matches with the search parameters.
   */
  async getEventsByTitleSearch (title: string): Promise<EventWithId[]> {
    let result: EventWithId[]

    return await Promise<EventWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM events WHERE title LIKE CONCAT(\'%\', ?, \'%\')',
        [title]
      ).then(([rows]) => {
        // Convert from database result object to event
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get all the {@link EventWithId} from the database that its location contains
   * the specified search parameters.
   * @param {string} location - Location to search.
   * @returns {Promise<EventWithId[]>} List of events that matches with the search parameters.
   */
  async getEventsByLocationSearch (location: string): Promise<EventWithId[]> {
    let result: EventWithId[]

    return await Promise<EventWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM events WHERE location LIKE CONCAT(\'%\', ?, \'%\') ',
        [location]
      ).then(([rows]) => {
        // Convert from database result object to event
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to update an {@link EventWithId} from the database.
   * @param {UserWithId} event - Event to update from the database.
   */
  async updateEventById (event: EventWithId): Promise<any> {
    let eventFormat: any

    // Get event format to insert
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

    return await Promise<any>.resolve(
      // Update event on the database
      databaseConnection.promise().query(
        'UPDATE events SET title = ?, image_url = ?, format = ?, link = ?, location = ?, description = ?, start_date = ?, ' +
        'end_date = ?, max_attendees = ?, ticket_price = ?, category = ? WHERE id = ?',
        [event.title, event.image_url, eventFormat, event.link, event.location, event.description, event.start_date,
          event.end_date, event.max_attendees, event.ticket_price, event.category, event.id]
      )
    )
  }

  /**
   * Function to delete an {@link EventWithId} by ID from the database.
   * @param {number} id - ID of the event to delete.
   */
  async deleteEventById (id: number): Promise<any> {
    return await Promise<any>.resolve(
      // Delete event with the specified ID from the database
      databaseConnection.promise().query(
        'DELETE FROM events WHERE id = ?',
        [id]
      )
    )
  }

  /**
   * Function to get all {@link EventWithId} where a specified user is the owner
   * from the database.
   * @param {number} ownerId - ID of the owner of the event.
   * @returns {Promise<EventWithId[]>} List of events where the specified user is the owner.
   */
  async getEventsByOwner (ownerId: number): Promise<EventWithId[]> {
    let result: EventWithId[]

    return await Promise<EventWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM events WHERE owner_id = ?',
        [ownerId]
      ).then(([rows]) => {
        // Convert from database result object to event
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get all future {@link EventWithId} where a specified user is the owner
   * from the database.
   * @param {number} ownerId - ID of the owner of the event.
   * @returns {Promise<EventWithId[]>} List of future events where the specified user is the owner.
   */
  async getFutureEventsByOwner (ownerId: number): Promise<EventWithId[]> {
    let result: EventWithId[]

    return await Promise<EventWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM events WHERE owner_id = ? AND start_date > NOW()',
        [ownerId]
      ).then(([rows]) => {
        // Convert from database result object to event
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get all finished {@link EventWithId} where a specified user is the owner
   * from the database.
   * @param {number} ownerId - ID of the owner of the event.
   * @returns {Promise<EventWithId[]>} List of finished events where the specified user is the owner.
   */
  async getFinishedEventsByOwner (ownerId: number): Promise<EventWithId[]> {
    let result: EventWithId[]

    return await Promise<EventWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM events WHERE owner_id = ? AND start_date < NOW()',
        [ownerId]
      ).then(([rows]) => {
        // Convert from database result object to event
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }
}
