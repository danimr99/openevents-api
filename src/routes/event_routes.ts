import express, { Request, Response, NextFunction } from 'express'

import { ErrorAPI } from '../models/error/error_api'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'

import { getAllEvents } from '../controllers/event_controller'

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

export default router
