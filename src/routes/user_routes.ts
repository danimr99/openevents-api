import express, { NextFunction, Request, Response } from 'express'

import { User, UserCredentials } from '../models/user/user'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseAllUser, parsePartialUser, parseCredentials, parseUserId } from '../middlewares/parser'

import {
  createUser, deleteUser, existsUserByEmail, existsUserById, getAllUsers, getUserFriends, getUsersByEmail, getUserById,
  getUsersByTextSearch, getUserStatistics, updateUserInformation
} from '../controllers/user_controller'
import {
  getActiveEventsAttendedByUserId, getActiveEventsByOwnerId, getEventsAttendedByUserId,
  getEventsByOwnerId, getFinishedEventsAttendedByUserId, getFinishedEventsByOwnerId,
  getFutureEventsAttendedByUserId, getFutureEventsByOwnerId
} from '../controllers/event_controller'

import { checkPassword } from '../utils/cypher'
import { generateAuthenticationToken } from '../utils/authentication'
import { formatErrorSQL } from '../utils/database'
import { validateString } from '../utils/validator'

// Create a router for users
const router = express.Router()

/**
 * Route that creates a user.
 * HTTP Method: POST
 * Endpoint: "/users"
 */
router.post('/', parseAllUser, async (_req: Request, res: Response, next: NextFunction) => {
  // Get parsed user
  const user: User = res.locals.PARSED_USER

  // Create stacktrace
  const stacktrace: any = {
    _original: user
  }

  // Get list of users with the same email address
  const exists = await existsUserByEmail(user.email)
    .then((result) => result)
    .catch((error) => {
      // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_CHECKING_USER_BY_EMAIL,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })

  // Check if exists a user with the same email address
  if (exists ?? false) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_USER_EMAIL_ALREADY_EXISTS,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Register new user
    await createUser(user)
      .then(() => {
        // Delete password field for the response
        const displayableUser: Partial<User> = user
        delete displayableUser.password

        // Send success response
        res.status(HttpStatusCode.CREATED).json(displayableUser)
      }).catch((error) => {
        // Add thrown error to stacktrace
        stacktrace.error_sql = formatErrorSQL(error)

        next(
          new ErrorAPI(
            DatabaseMessage.ERROR_INSERTING_USER,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            stacktrace
          )
        )
      })
  }
})

/**
 * Route that authenticates a user.
 * HTTP Method: POST
 * Endpoint: "/users/login"
 */
router.post('/login', parseCredentials, async (_req: Request, res: Response, next: NextFunction) => {
  // Get parsed user credentials
  const credentials: UserCredentials = res.locals.PARSED_USER_CREDENTIALS

  // Create stacktrace
  const stacktrace: any = {
    _original: credentials
  }

  // Get list of users with the same email address
  const users = await getUsersByEmail(credentials.email)

  // Check if only exists a user with the specified email addres
  if (users.length === 1) {
    // Get password hash from the database
    const userPasswordHash = users[0].password

    // Validate specified password for the user queried from database
    const validPassword = await checkPassword(credentials.password, userPasswordHash)

    // Check if password is valid
    if (validPassword) {
      // Generate an authentication token
      const authenticationToken = generateAuthenticationToken(users[0])

      // Send response
      res.status(HttpStatusCode.OK).json({
        bearer_token: authenticationToken
      })
    } else {
      // Invalid credentials
      next(
        new ErrorAPI(
          APIMessage.INVALID_CREDENTIALS,
          HttpStatusCode.BAD_REQUEST,
          stacktrace
        )
      )
    }
  } else if (users.length === 0) {
    // User does not exist
    next(
      new ErrorAPI(
        APIMessage.INVALID_CREDENTIALS,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Exists multiple users with the same email address
    next(
      new ErrorAPI(
        APIMessage.ERROR_MULTIPLE_USERS_SAME_EMAIL,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        stacktrace
      )
    )
  }
})

/**
 * Route that gets all users.
 * HTTP Method: GET
 * Endpoint: "/users"
 */
router.get('/', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  // Get all users from database
  await getAllUsers()
    .then((users) => {
      res.status(HttpStatusCode.OK).json(users)
    }).catch((error) => {
      // Create stacktrace
      const stacktrace: any = {
        error_sql: formatErrorSQL(error)
      }

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_SELECTING_ALL_USERS,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that searches users with a name, last name or email
 * matching the value of the query parameters.
 * HTTP Method: GET
 * Endpoint: "/users/search"
 */
router.get('/search', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  // Get text to search from URL path sent as query
  const { text } = req.query

  // Set received data to error stacktrace
  const stacktrace: any = {
    _original: {
      text: text
    }
  }

  // Check if the text is valid
  if (!validateString(text)) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_INVALID_STRING_FIELD,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  }

  // Get all users matching the value of the query parameter
  await getUsersByTextSearch(text as string)
    .then((users) => {
      // Send response
      res.status(HttpStatusCode.OK).json(users)
    }).catch((error) => {
      // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_SELECTING_USERS_BY_TEXT,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that gets a user by ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}"
 */
router.get('/:user_id', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Get user by ID
  await getUserById(userId)
    .then((user) => {
    // Check if exists user by ID
      if (user != null) {
        // Send response
        res.status(HttpStatusCode.OK).json(user)
      } else {
        // User not found or does not exist
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
          DatabaseMessage.ERROR_SELECTING_USER_BY_ID,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that gets statistics of a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/statistics"
 */
router.get('/:user_id/statistics', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if user exists
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getUserStatistics(userId)
          .then((stats) => {
            // Send response
            res.status(HttpStatusCode.OK).json(stats)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_USER_STATS,
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
 * Route that edits specified fields of the authenticated user.
 * HTTP Method: PUT
 * Endpoint: "/users"
 */
router.put('/', authenticateJWT, parsePartialUser, async (_req: Request, res: Response, next: NextFunction) => {
  // Get authenticated user ID
  const userId: number = res.locals.JWT_USER_ID

  // Get parsed user
  const user: User = res.locals.PARSED_USER

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId,
      fields: user
    }
  }

  // Update user information
  await updateUserInformation(userId, user)
    .then((updatedUser) => {
      // Send success response
      res.status(HttpStatusCode.OK).json(updatedUser)
    }).catch((error) => {
      // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_UPDATING_USER,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that deletes the authenticated user.
 * HTTP Method: DELETE
 * Endpoint: "/users"
 */
router.delete('/', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  // Get authenticated user ID
  const userId: number = res.locals.JWT_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Delete user
  await deleteUser(userId)
    .then(() => {
      // Send response
      res.status(HttpStatusCode.OK).json({
        message: APIMessage.USER_DELETED
      })
    }).catch((error) => {
      // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_DELETING_USER,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that gets all events created by a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/events"
 */
router.get('/:user_id/events', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getEventsByOwnerId(userId)
          .then((events) => {
          // Send response
            res.status(HttpStatusCode.OK).json(events)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_EVENTS_CREATED_BY_USER,
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
 * Route that gets all future events created by a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/events/future"
 */
router.get('/:user_id/events/future', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getFutureEventsByOwnerId(userId)
          .then((events) => {
          // Send response
            res.status(HttpStatusCode.OK).json(events)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_FUTURE_EVENTS_CREATED_BY_USER,
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
 * Route that gets all finished events created by a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/events/finished"
 */
router.get('/:user_id/events/finished', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getFinishedEventsByOwnerId(userId)
          .then((events) => {
          // Send response
            res.status(HttpStatusCode.OK).json(events)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_FINISHED_EVENTS_CREATED_BY_USER,
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
 * Route that gets all active events created by a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/events/active"
 */
router.get('/:user_id/events/active', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getActiveEventsByOwnerId(userId)
          .then((events) => {
          // Send response
            res.status(HttpStatusCode.OK).json(events)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_ACTIVE_EVENTS_CREATED_BY_USER,
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
 * Route that gets all events with an assistance of a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/assistances"
 */
router.get('/:user_id/assistances', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
// Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getEventsAttendedByUserId(userId)
          .then((assistances) => {
          // Send response
            res.status(HttpStatusCode.OK).json(assistances)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_EVENTS_AND_ASSISTANCES_USER,
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
 * Route that gets all future events with an assistance of a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/assistances/future"
 */
router.get('/:user_id/assistances/future', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getFutureEventsAttendedByUserId(userId)
          .then((assistances) => {
            // Send response
            res.status(HttpStatusCode.OK).json(assistances)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_FUTURE_EVENTS_AND_ASSISTANCES_USER,
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
 * Route that gets all finished events with an assistance of a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/assistances/finished"
 */
router.get('/:user_id/assistances/finished', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getFinishedEventsAttendedByUserId(userId)
          .then((assistances) => {
            // Send response
            res.status(HttpStatusCode.OK).json(assistances)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_FINISHED_EVENTS_AND_ASSISTANCES_USER,
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
 * Route that gets all active events with an assistance of a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/assistances/active"
 */
router.get('/:user_id/assistances/active', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getActiveEventsAttendedByUserId(userId)
          .then((assistances) => {
            // Send response
            res.status(HttpStatusCode.OK).json(assistances)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_ACTIVE_EVENTS_AND_ASSISTANCES_USER,
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
 * Route that gets all friends of a user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/friends"
 */
router.get('/:user_id/friends', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get user ID from the URL path sent as parameter
  const userId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if exists user with matching ID
  await existsUserById(userId)
    .then(async (existsUser) => {
      if (existsUser) {
        // User exists
        await getUserFriends(userId)
          .then((friends) => {
            // Send response
            res.status(HttpStatusCode.OK).json(friends)
          }).catch((error) => {
            // Add thrown error to stacktrace
            stacktrace.error_sql = formatErrorSQL(error)

            next(
              new ErrorAPI(
                DatabaseMessage.ERROR_SELECTING_USER_FRIENDS,
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
