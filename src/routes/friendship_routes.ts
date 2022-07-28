import express, { NextFunction, Request, Response } from 'express'

import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseUserId } from '../middlewares/parser'

import {
  acceptFriendRequest, createFriendRequest, deleteFriendRequest,
  getFriends, getFriendshipRequests
} from '../controllers/friendship_controller'
import { existsUserById } from '../controllers/user_controller'

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

/**
 * Route that creates a friend request between the authenticated user and an external user.
 * HTTP Method: POST
 * Endpoint: "/friendships/{user_id}"
 */
router.post('/:user_id', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Get the ID of the external user
  const externalUserId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: authenticatedUserId,
      external_user_id: externalUserId
    }
  }

  // Check if authenticated user is trying to send a friend request to itself
  if (authenticatedUserId === externalUserId) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_CANNOT_SEND_FRIEND_REQUEST_ITSELF,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Check if external user exists
    await existsUserById(externalUserId)
      .then(async (existsExternalUser) => {
        if (existsExternalUser) {
        // Create friend request
          await createFriendRequest(authenticatedUserId, externalUserId)
            .then((actionMessage) => {
              // Get the HTTP status code
              let httpStatusCode: HttpStatusCode = HttpStatusCode.OK

              if (actionMessage === APIMessage.FRIEND_REQUEST_SENT) {
                httpStatusCode = HttpStatusCode.CREATED
              }

              // Send response
              res.status(httpStatusCode).json({
                message: actionMessage,
                stacktrace
              })
            }).catch((error) => {
              // Add thrown error to stacktrace
              stacktrace.error_sql = formatErrorSQL(error)

              next(
                new ErrorAPI(
                  DatabaseMessage.ERROR_INSERTING_FRIEND_REQUEST,
                  HttpStatusCode.INTERNAL_SERVER_ERROR,
                  stacktrace
                )
              )
            })
        } else {
          next(
            new ErrorAPI(
              APIMessage.USER_NOT_FOUND,
              HttpStatusCode.NOT_FOUND,
              stacktrace
            )
          )
        }
      })
  }
})

/**
 * Route that accepts a friend request from external user to authenticated user.
 * HTTP Method: PUT
 * Endpoint: "/friendships/{user_id}"
 */
router.put('/:user_id', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Get the ID of the external user
  const externalUserId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: authenticatedUserId,
      external_user_id: externalUserId
    }
  }

  // Check if authenticated user is trying to accept a friend request from itself
  if (authenticatedUserId === externalUserId) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_CANNOT_ACCEPT_FRIEND_REQUEST_ITSELF,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Check if external user exists
    await existsUserById(externalUserId)
      .then(async (existsExternalUser) => {
        if (existsExternalUser) {
          // Accept friend request
          await acceptFriendRequest(authenticatedUserId, externalUserId)
            .then((actionMessage) => {
              // Get the HTTP status code
              let httpStatusCode: HttpStatusCode = HttpStatusCode.OK

              if (actionMessage === APIMessage.FRIEND_REQUEST_NOT_FOUND) {
                httpStatusCode = HttpStatusCode.NOT_FOUND
              }

              // Send response
              res.status(httpStatusCode).json({
                message: actionMessage,
                stacktrace
              })
            }).catch((error) => {
              // Add thrown error to stacktrace
              stacktrace.error_sql = formatErrorSQL(error)

              next(
                new ErrorAPI(
                  DatabaseMessage.ERROR_UPDATING_FRIEND_REQUEST,
                  HttpStatusCode.INTERNAL_SERVER_ERROR,
                  stacktrace
                )
              )
            })
        } else {
          next(
            new ErrorAPI(
              APIMessage.USER_NOT_FOUND,
              HttpStatusCode.NOT_FOUND,
              stacktrace
            )
          )
        }
      })
  }
})

/**
 * Route that deletes a friend request or friendship between external user and authenticated user.
 * HTTP Method: DELETE
 * Endpoint: "/friendships/{user_id}"
 */
router.delete('/:user_id', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Get the ID of the external user
  const externalUserId = res.locals.PARSED_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: authenticatedUserId,
      external_user_id: externalUserId
    }
  }

  // Check if authenticated user is trying to delete a friend request from itself
  if (authenticatedUserId === externalUserId) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_CANNOT_DELETE_FRIEND_REQUEST_ITSELF,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Check if external user exists
    await existsUserById(externalUserId)
      .then(async (existsExternalUser) => {
        if (existsExternalUser) {
          // Delete friendship or friend request
          await deleteFriendRequest(authenticatedUserId, externalUserId)
            .then((actionMessage) => {
              let httpStatusCode: HttpStatusCode = HttpStatusCode.OK

              if (actionMessage === APIMessage.FRIEND_REQUEST_NOT_FOUND) {
                httpStatusCode = HttpStatusCode.NOT_FOUND
              }
              // Send response
              res.status(httpStatusCode).json({
                message: actionMessage,
                stacktrace
              })
            }).catch((error) => {
              // Add thrown error to stacktrace
              stacktrace.error_sql = formatErrorSQL(error)

              next(
                new ErrorAPI(
                  DatabaseMessage.ERROR_DELETING_FRIEND_REQUEST,
                  HttpStatusCode.INTERNAL_SERVER_ERROR,
                  stacktrace
                )
              )
            })
        } else {
          next(
            new ErrorAPI(
              APIMessage.USER_NOT_FOUND,
              HttpStatusCode.NOT_FOUND,
              stacktrace
            )
          )
        }
      })
  }
})

export default router
