import express, { NextFunction, Request, Response } from 'express'

import { User, UserCredentials } from '../models/user/user'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { parseAllUser, parseCredentials } from '../middlewares/parser'

import { createUser, existsUserByEmail, getUsersByEmail } from '../controllers/user_controller'

import { checkPassword } from '../utils/cypher'
import { generateAuthenticationToken } from '../utils/authentication'
import { authenticateJWT } from '../middlewares/jwt_authentication'

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

/**
 * Route that authenticates a {@link User}.
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

router.get('/', authenticateJWT, (_req: Request, res: Response, _next: NextFunction) => {
  res.status(HttpStatusCode.OK).json({
    ok: 'Successful'
  })
})

export default router
