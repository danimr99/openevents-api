import express, { Request, Response, NextFunction } from 'express'

import { Assistance } from '../models/assistance/assistance'
import { ErrorAPI } from '../models/error/error_api'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseAllEvent, parseEventId, parseEventSearch, parsePartialAssistance, parsePartialEvent, parseUserId } from '../middlewares/parser'

import {
  createEvent, deleteEvent, existsEventById, getAllEvents, getEventsById, getEventsBySearch,
  hasEventFinished,
  isUserEventOwner, updateEventInformation
} from '../controllers/event_controller'
import {
  createUserAssistanceForEvent, deleteUserAssistanceForEvent, existsAssistance, getEventAssistances, getUserAssistanceForEvent,
  updateAssistance
} from '../controllers/assistance_controller'
import { existsUserById } from '../controllers/user_controller'

import { formatErrorSQL } from '../utils/database'

// Create a router for events
const router = express.Router()

/**
 * Route that gets all the future events.
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
 * Route that creates an event.
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
 * Route that gets an event by ID.
 * HTTP Method: GET
 * Endpoint: "/events/{event_id}"
 */
router.get('/:event_id', authenticateJWT, parseEventId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get event ID from the URL path sent as parameter
  const eventId = res.locals.PARSED_EVENT_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      event_id: eventId
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

/**
 * Route that edits specified fields of the event with matching ID.
 * HTTP Method: PUT
 * Endpoint: "/events/{event_id}"
 */
router.put('/:event_id', authenticateJWT, parseEventId, parsePartialEvent, async (_req: Request, res: Response, next: NextFunction) => {
  // Get authenticated user ID
  const userId: number = res.locals.JWT_USER_ID

  // Get event ID from the URL path sent as parameter
  const eventId = res.locals.PARSED_EVENT_ID

  // Get parsed event
  const event = res.locals.PARSED_EVENT

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId,
      event_id: eventId,
      event: event
    }
  }

  // Check if event with the specified ID exists
  const existsEvent = await existsEventById(eventId)
    .catch((error) => {
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

  if (!(existsEvent ?? false)) {
    next(
      new ErrorAPI(
        APIMessage.EVENT_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        stacktrace
      )
    )
  } else {
    // Check if authenticated user ID is the owner of the event with the specified event ID
    const isOwner = await isUserEventOwner(userId, eventId)
      .catch((error) => {
        // Add thrown error to stacktrace
        stacktrace.error_sql = formatErrorSQL(error)

        next(
          new ErrorAPI(
            DatabaseMessage.ERROR_CHECKING_EVENT_OWNER,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            stacktrace
          )
        )
      })

    if (!(isOwner ?? false)) {
      next(
        new ErrorAPI(
          APIMessage.ERROR_USER_NOT_EVENT_OWNER,
          HttpStatusCode.FORBIDDEN,
          stacktrace
        )
      )
    } else {
      // Update event
      await updateEventInformation(eventId, event)
        .then((updatedEvent) => {
          // Send success response
          res.status(HttpStatusCode.OK).json(updatedEvent)
        }).catch((error) => {
          // Add thrown error to stacktrace
          stacktrace.error_sql = formatErrorSQL(error)

          next(
            new ErrorAPI(
              DatabaseMessage.ERROR_UPDATING_EVENT,
              HttpStatusCode.INTERNAL_SERVER_ERROR,
              stacktrace
            )
          )
        })
    }
  }
})

/**
 * Route that deletes an event with matching ID.
 * HTTP Method: DELETE
 * Endpoint: "/events/{event_id}"
 */
router.delete('/:event_id', authenticateJWT, parseEventId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get authenticated user ID
  const userId: number = res.locals.JWT_USER_ID

  // Get event ID from the URL path sent as parameter
  const eventId = res.locals.PARSED_EVENT_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId,
      event_id: eventId
    }
  }

  // Check if event with the specified ID exists
  const existsEvent = await existsEventById(eventId)
    .catch((error) => {
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

  if (!(existsEvent ?? false)) {
    next(
      new ErrorAPI(
        APIMessage.EVENT_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        stacktrace
      )
    )
  } else {
    // Check if authenticated user ID is the owner of the event with the specified event ID
    const isOwner = await isUserEventOwner(userId, eventId)
      .catch((error) => {
        // Add thrown error to stacktrace
        stacktrace.error_sql = formatErrorSQL(error)

        next(
          new ErrorAPI(
            DatabaseMessage.ERROR_CHECKING_EVENT_OWNER,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            stacktrace
          )
        )
      })

    if (!(isOwner ?? false)) {
      next(
        new ErrorAPI(
          APIMessage.ERROR_USER_NOT_EVENT_OWNER,
          HttpStatusCode.FORBIDDEN,
          stacktrace
        )
      )
    } else {
      // Delete event
      await deleteEvent(eventId)
        .then(() => {
          // Send response
          res.status(HttpStatusCode.OK).json({
            message: APIMessage.EVENT_DELETED
          })
        }).catch((error) => {
          // Add thrown error to stacktrace
          stacktrace.error_sql = formatErrorSQL(error)

          next(
            new ErrorAPI(
              DatabaseMessage.ERROR_DELETING_EVENT,
              HttpStatusCode.INTERNAL_SERVER_ERROR,
              stacktrace
            )
          )
        })
    }
  }
})

/**
 * Route that gets all assistances for event with matching ID.
 * HTTP Method: GET
 * Endpoint: "/events/{event_id}/assistances"
 */
router.get('/:event_id/assistances', authenticateJWT, parseEventId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get event ID from the URL path sent as parameter
  const eventId = res.locals.PARSED_EVENT_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      event_id: eventId
    }
  }

  // Check if event exists
  await existsEventById(eventId)
    .then(async (existsEvent) => {
      if (existsEvent) {
        // Event exists
        await getEventAssistances(eventId)
          .then((assistances) => {
            // Send response
            res.status(HttpStatusCode.OK).json(assistances)
          }).catch((error) => {
          // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_EVENT_ASSISTANCES,
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
})

/**
 * Route that creates an assistance of the authenticated user for event with matching ID.
 * HTTP Method: POST
 * Endpoint: "/events/{event_id}/assistances"
 */
router.post('/:event_id/assistances', authenticateJWT, parseEventId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get authenticated user ID
  const userId: number = res.locals.JWT_USER_ID

  // Get event ID from the URL path sent as parameter
  const eventId = res.locals.PARSED_EVENT_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId,
      event_id: eventId
    }
  }

  // Check if event exists
  await existsEventById(eventId)
    .then(async (existsEvent) => {
      if (existsEvent) {
        // Event exists
        await createUserAssistanceForEvent(userId, eventId)
          .then((actionMessage) => {
            // Get HTTP status code
            let httpStatusCode: HttpStatusCode = HttpStatusCode.CREATED

            if (actionMessage === APIMessage.ASSISTANCE_ALREADY_EXISTS) {
              httpStatusCode = HttpStatusCode.OK
            }

            // Send response
            res.status(httpStatusCode).json({
              message: actionMessage,
              stacktrace
            })
          })
          .catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_INSERTING_ASSISTANCE,
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
})

/**
 * Route that edits an assistance of the authenticated user for the event with matching ID.
 * HTTP Method: PUT
 * Endpoint: "/events/{event_id}/assistances"
 */
router.put('/:event_id/assistances', authenticateJWT, parseEventId, parsePartialAssistance, async (_req: Request, res: Response, next: NextFunction) => {
  // Get assistance from request body
  const assistance: Assistance = res.locals.PARSED_ASSISTANCE

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      assistance
    }
  }

  // Check if exists event
  await existsEventById(assistance.event_id)
    .then(async (existsEvent) => {
      if (existsEvent) {
      // Event exists
        await existsAssistance(assistance.user_id, assistance.event_id)
          .then(async (existsAssistance) => {
            if (existsAssistance) {
              // Assistance exists
              await hasEventFinished(assistance.event_id)
                .then(async (hasFinished) => {
                  if (hasFinished) {
                    // Event has finished
                    await updateAssistance(assistance)
                      .then((assistance) => {
                        // Send response
                        res.status(HttpStatusCode.OK).json(assistance)
                      })
                      .catch((error) => {
                        // Add thrown error to stacktrace
                        stacktrace.error_sql = formatErrorSQL(error)

                        next(
                          new ErrorAPI(
                            DatabaseMessage.ERROR_UPDATING_ASSISTANCE,
                            HttpStatusCode.INTERNAL_SERVER_ERROR,
                            stacktrace
                          )
                        )
                      })
                  } else {
                    // Event has not finished yet
                    next(
                      new ErrorAPI(
                        APIMessage.EVENT_NOT_FINISHED,
                        HttpStatusCode.FORBIDDEN,
                        stacktrace
                      )
                    )
                  }
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
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_CHECKING_ASSISTANCE,
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
})

/**
 * Route that deletes an assistance of the authenticated user for the event with matching ID.
 * HTTP Method: DELETE
 * Endpoint: "/events/{event_id}/assistances"
 */
router.delete('/:event_id/assistances', authenticateJWT, parseEventId, parsePartialAssistance, async (_req: Request, res: Response, next: NextFunction) => {
  // Get authenticated user ID
  const userId: number = res.locals.JWT_USER_ID

  // Get event ID from the URL path sent as parameter
  const eventId = res.locals.PARSED_EVENT_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId,
      event_id: eventId
    }
  }

  // Check if event exists
  await existsEventById(eventId)
    .then(async (existsEvent) => {
      if (existsEvent) {
        // Event exists
        await existsAssistance(userId, eventId)
          .then(async (existsAssistance) => {
            if (existsAssistance) {
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
})

/**
 * Route that gets an assistance of user with matching ID for event with matching ID.
 * HTTP Method: GET
 * Endpoint: "/events/{event_id}/assistances/{user_id}"
 */
router.get('/:event_id/assistances/:user_id', authenticateJWT, parseEventId, parseUserId,
  async (_req: Request, res: Response, next: NextFunction) => {
    // Get event ID from the URL path sent as parameter
    const eventId = res.locals.PARSED_EVENT_ID

    // Get user ID from the URL path sent as parameter
    const userId = res.locals.PARSED_USER_ID

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
          await existsEventById(eventId)
            .then(async (existsEvent) => {
              if (existsEvent) {
                // Event exists
                await getUserAssistanceForEvent(userId, eventId)
                  .then((assistances) => {
                    // Send response
                    res.status(HttpStatusCode.OK).json(assistances)
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
