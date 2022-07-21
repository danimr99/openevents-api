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
}
