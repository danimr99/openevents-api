import express, { NextFunction, Request, Response } from 'express'

import { Message } from '../models/message/message'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'
import { DatabaseMessage } from '../models/enums/database_messages'

import { authenticateJWT } from '../middlewares/jwt_authentication'
import { parseAllMessage } from '../middlewares/parser'

import { createMessage } from '../controllers/message_controller'
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
})

export default router
