import express, { Request, Response, NextFunction } from 'express'

import { ErrorAPI } from '../models/error/error_api'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseAllEvent } from '../middlewares/parser'

import { createEvent, getAllEvents } from '../controllers/event_controller'

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

export default router
