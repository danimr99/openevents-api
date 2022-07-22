import express, { Request, Response, NextFunction } from 'express'

import { ErrorAPI } from '../models/error/error_api'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseAllEvent, parseEventID, parseEventSearch } from '../middlewares/parser'

import { createEvent, getAllEvents, getEventsById, getEventsBySearch } from '../controllers/event_controller'

import { formatErrorSQL } from '../utils/database'

// Create a router for events
const router = express.Router()

/**
 * Route that gets all the {@link EventWithId}.
 * HTTP Method: GET
 * Endpoint: "/events"
 */
router.get('/', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
// Get all future events from database
  await getAllEvents()
    .then((events) => {
      res.status(HttpStatusCode.OK).json(events)
    }).catch((error) => {
      // Create stacktrace
      const stacktrace: any = {
        error_sql: formatErrorSQL(error)
      }

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_SELECTING_ALL_EVENTS,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that creates an {@link Event}.
 * HTTP Method: POST
 * Endpoint: "/events"
 */
router.post('/', authenticateJWT, parseAllEvent, async (_req: Request, res: Response, next: NextFunction) => {
  // Get parsed event
  const event = res.locals.PARSED_EVENT

  // Create stacktrace
  const stacktrace: any = {
    _original: event
  }

  // Create event
  await createEvent(event)
    .then(() => {
      // Send response
      res.status(HttpStatusCode.CREATED).json(event)
    }).catch((error) => {
      // Add error thrown to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_INSERTING_EVENT,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that searches events with a title or location
 * matching the value of the query parameter.
 * HTTP Method: GET
 * Endpoint: "/users/search"
 */
router.get('/search', authenticateJWT, parseEventSearch, async (_req: Request, res: Response, next: NextFunction) => {
  // Get validated event title and location to search
  const title = res.locals.PARSED_SEARCH_EVENT_TITLE
  const location = res.locals.PARSED_SEARCH_EVENT_LOCATION

  // Set received data to error stacktrace
  const stacktrace: any = {
    _original: {
      title: title,
      location: location
    }
  }

  // Get events by search
  await getEventsBySearch(title, location)
    .then((events) => {
      // Send response
      res.status(HttpStatusCode.OK).json(events)
    }).catch((error) => {
    // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_SELECTING_EVENTS_BY_SEARCH,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that gets an {@link EventWithId} by ID.
 * HTTP Method: GET
 * Endpoint: "/events/{event_id}"
 */
router.get('/:event_id', authenticateJWT, parseEventID, async (_req: Request, res: Response, next: NextFunction) => {
  // Get event ID from the URL path sent as parameter
  const eventId = res.locals.PARSED_EVENT_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: eventId
    }
  }

  // Get event by ID
  await getEventsById(eventId)
    .then((events) => {
    // Check if exists event by ID
      if (events.length === 1) {
        const event = events[0]

        // Send response
        res.status(HttpStatusCode.OK).json(event)
      } else {
        // Event not found or does not exist
        next(
          new ErrorAPI(
            APIMessage.EVENT_NOT_FOUND,
            HttpStatusCode.NOT_FOUND,
            stacktrace
          )
        )
      }
    }).catch((error) => {
      // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_SELECTING_EVENT_BY_ID,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

export default router
