import express, { NextFunction, Request, Response } from 'express'

import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseEventId, parseUserId } from '../middlewares/parser'

import { existsEventById, getEventById } from '../controllers/event_controller'
import { existsUserById } from '../controllers/user_controller'
import {
  deleteUserAssistanceForEvent, existsAssistance, getUserAssistanceForEvent
} from '../controllers/assistance_controller'

import { formatErrorSQL } from '../utils/database'

// Create a router for assistances
const router = express.Router()

/**
 * Route that gets an assistance of a user with matching ID for an
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

/**
 * Route that deletes an assistance of a user with matching ID for an
 * event with matching ID if the authenticated user is the owner of the
 * specified event.
 * HTTP Method: DELETE
 * Endpoint: "/assistances/{user_id}/{event_id}"
 */
router.delete('/:user_id/:event_id', authenticateJWT, parseUserId, parseEventId,
  async (_req: Request, res: Response, next: NextFunction) => {
    // Get authenticated user ID
    const authenticatedUserId: number = res.locals.JWT_USER_ID

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
                await getEventById(eventId)
                  .then(async (event) => {
                    // Check if authenticated user is the owner of the event
                    if (authenticatedUserId === event.owner_id) {
                      // Authenticated user is the event owner
                      await existsAssistance(userId, eventId)
                        .then(async (existsAssistance) => {
                          // Check if exists assistance
                          if (existsAssistance) {
                            // Assistance exists
                            await deleteUserAssistanceForEvent(userId, eventId)
                              .then(() => {
                                // Send response
                                res.status(HttpStatusCode.OK).json({
                                  message: APIMessage.ASSISTANCE_DELETED,
                                  stacktrace
                                })
                              }).catch((error) => {
                                // Add thrown error to stacktrace
                                stacktrace.error_sql = formatErrorSQL(error)

                                next(
                                  new ErrorAPI(
                                    DatabaseMessage.ERROR_DELETING_USER_ASSISTANCE_FOR_EVENT,
                                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                                    stacktrace
                                  )
                                )
                              })
                          } else {
                            // Assistance does not exist
                            next(
                              new ErrorAPI(
                                APIMessage.ASSISTANCE_NOT_FOUND,
                                HttpStatusCode.NOT_FOUND,
                                stacktrace
                              )
                            )
                          }
                        })
                    } else {
                      // Authenticated user is not the event owner
                      next(
                        new ErrorAPI(
                          APIMessage.ERROR_USER_NOT_EVENT_OWNER,
                          HttpStatusCode.FORBIDDEN,
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
