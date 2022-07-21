import { EventWithId } from '../models/event/event'
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
}
