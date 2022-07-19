import express, { NextFunction, Request, Response } from 'express'

import { User } from '../models/user/user'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'

import { createUser, existsUserByEmail, parseAllUser } from '../controllers/user_controller'
import { APIMessage, DatabaseMessage } from '../models/enums/messages'

// Create a router for users
const router = express.Router()

/**
 * Route that creates a {@link User}.
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
      stacktrace.error_sql = error

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
        stacktrace.error_sql = error

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

export default router
