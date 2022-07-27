import express, { NextFunction, Request, Response } from 'express'

import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'

import { getFriends, getFriendshipRequests } from '../controllers/friendship_controller'

import { formatErrorSQL } from '../utils/database'

// Create a router for friendships
const router = express.Router()

/**
 * Route that gets all the pending friendship requests of a user.
 * HTTP Method: GET
 * Endpoint: "/friendships/requests"
 */
router.get('/requests', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: authenticatedUserId
    }
  }

  // Get all friendship requests
  await getFriendshipRequests(authenticatedUserId)
    .then((friendRequests) => {
      // Send response
      res.status(HttpStatusCode.OK).json(friendRequests)
    }).catch((error) => {
      // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_SELECTING_FRIENDSHIP_REQUESTS,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that gets all the friends of a user.
 * HTTP Method: GET
 * Endpoint: "/friendships"
 */
router.get('/', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: authenticatedUserId
    }
  }

  // Get friends of the authenticated user
  await getFriends(authenticatedUserId)
    .then((friends) => {
      // Send response
      res.status(HttpStatusCode.OK).json(friends)
    }).catch((error) => {
    // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_SELECTING_FRIENDS,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

export default router
