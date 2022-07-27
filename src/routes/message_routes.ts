import express, { NextFunction, Request, Response } from 'express'

import { Message } from '../models/message/message'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseAllMessage, parseUserId } from '../middlewares/parser'

import { createMessage, getChat, getUserContacts } from '../controllers/message_controller'
import { existsUserById } from '../controllers/user_controller'

import { formatErrorSQL } from '../utils/database'

// Create a router for messages
const router = express.Router()

/**
 * Route that creates a message.
 * HTTP Method: POST
 * Endpoint: "/messages"
 */
router.post('/', authenticateJWT, parseAllMessage, async (_req: Request, res: Response, next: NextFunction) => {
  // Get parsed message
  const message: Message = res.locals.PARSED_MESSAGE

  // Create stacktrace
  const stacktrace: any = {
    _original: message
  }

  // Check if authenticated user is trying to send a message to itself
  if (message.senderUserId === message.receiverUserId) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_CANNOT_SEND_MESSAGE_ITSELF,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Check if exists message receiver user
    await existsUserById(message.receiverUserId)
      .then(async (existsReceiver) => {
        if (existsReceiver) {
          // Create message
          await createMessage(message)
            .then(() => {
              // Send response
              res.status(HttpStatusCode.CREATED).json({
                sender_user_id: message.senderUserId,
                receiver_user_id: message.receiverUserId,
                content: message.content,
                timestamp: message.timestamp
              })
            }).catch((error) => {
              // Add error thrown to stacktrace
              stacktrace.error_sql = formatErrorSQL(error)

              next(
                new ErrorAPI(
                  DatabaseMessage.ERROR_INSERTING_MESSAGE,
                  HttpStatusCode.INTERNAL_SERVER_ERROR,
                  stacktrace
                )
              )
            })
        } else {
          next(
            new ErrorAPI(
              APIMessage.ERROR_MESSAGE_RECEIVER_NOT_FOUND,
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
  }
})

/**
 * Route that gets all external users that have a chat with the authenticated user.
 * HTTP Method: GET
 * Endpoint: "/messages/users"
 */
router.get('/users', authenticateJWT, async (_req: Request, res: Response, next: NextFunction) => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: authenticatedUserId
    }
  }

  // Get all users that have a chat with the authenticated user
  await getUserContacts(authenticatedUserId)
    .then((users) => {
      res.status(HttpStatusCode.OK).json(users)
    }).catch((error) => {
      // Add thrown error to stacktrace
      stacktrace.error_sql = formatErrorSQL(error)

      next(
        new ErrorAPI(
          DatabaseMessage.ERROR_SELECTING_USER_CONTACTS,
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          stacktrace
        )
      )
    })
})

/**
 * Route that gets all messages exchanged between the authenticated user and
 * an external user.
 * HTTP Method: GET
 * Endpoint: "/messages/{user_id}"
 */
router.get('/:user_id', authenticateJWT, parseUserId, async (_req: Request, res: Response, next: NextFunction) => {
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

  // Check that the external user ID is not the authenticated user ID
  if (authenticatedUserId === externalUserId) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_CANNOT_GET_CHAT_WITH_ITSELF,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Check if external user exists
    await existsUserById(externalUserId)
      .then(async (existsExternalUser) => {
        if (existsExternalUser) {
          // Get messages exchanged between users
          await getChat(authenticatedUserId, externalUserId)
            .then((messages) => {
              res.status(HttpStatusCode.OK).json(messages)
            }).catch((error) => {
              // Add thrown error to stacktrace
              stacktrace.error_sql = formatErrorSQL(error)

              next(
                new ErrorAPI(
                  DatabaseMessage.ERROR_SELECTING_USERS_CHAT,
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
