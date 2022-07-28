import express, { NextFunction, Request, Response } from 'express'

import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseEventId, parseUserId } from '../middlewares/parser'

import { existsEventById } from '../controllers/event_controller'
import { existsUserById } from '../controllers/user_controller'
import { getUserAssistanceForEvent } from '../controllers/assistance_controller'

import { formatErrorSQL } from '../utils/database'

// Create a router for assistances
const router = express.Router()

/**
 * Route that gets an assistance of user with matching ID for an
 * event with matching ID.
 * HTTP Method: GET
 * Endpoint: "/assistances/{user_id}/{event_id}"
 */
router.get('/:user_id/:event_id', authenticateJWT, parseUserId, parseEventId,
  async (_req: Request, res: Response, next: NextFunction) => {
    // Get user ID from the URL path sent as parameter
    const userId = res.locals.PARSED_USER_ID

    // Get event ID from the URL path sent as parameter
    const eventId = res.locals.PARSED_EVENT_ID

    // Create stacktrace
    const stacktrace: any = {
      _original: {
        user_id: userId,
        event_id: eventId
      }
    }

    // Check if user exists
    await existsUserById(userId)
      .then(async (existsUser) => {
        if (existsUser) {
          // User exists
          // Check if event exists
          await existsEventById(eventId)
            .then(async (existsEvent) => {
              if (existsEvent) {
                // Event exists
                await getUserAssistanceForEvent(userId, eventId)
                  .then((assistances) => {
                    // Send response
                    res.status(HttpStatusCode.OK).json(assistances)
                  }).catch((error) => {
                    // Add thrown error to stacktrace
                    stacktrace.error_sql = formatErrorSQL(error)

                    next(
                      new ErrorAPI(
                        DatabaseMessage.ERROR_SELECTING_USER_ASSISTANCE_FOR_EVENT,
                        HttpStatusCode.INTERNAL_SERVER_ERROR,
                        stacktrace
                      )
                    )
                  })
              } else {
                // Event does not exist
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
                  DatabaseMessage.ERROR_CHECKING_EVENT_BY_ID,
                  HttpStatusCode.INTERNAL_SERVER_ERROR,
                  stacktrace
                )
              )
            })
        } else {
          // User does not exist
          next(
            new ErrorAPI(
              APIMessage.USER_NOT_FOUND,
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
            DatabaseMessage.ERROR_CHECKING_USER_BY_ID,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            stacktrace
          )
        )
      })
  })

export default router
