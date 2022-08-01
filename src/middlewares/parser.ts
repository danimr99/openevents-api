import { Request, Response, NextFunction } from 'express'

import { getMaximumEventRatingValue, getMinimumEventRatingValue, getMinimumPasswordLength } from '../constants'

import { User, UserCredentials } from '../models/user/user'
import { Event } from '../models/event/event'
import { EventFormat } from '../models/event/event_format'
import { EventCategory } from '../models/event/event_category'
import { Message } from '../models/message/message'
import { Assistance } from '../models/assistance/assistance'
import { AssistanceFormat } from '../models/assistance/assistance_format'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'

import {
  isNumber, isObject, validateAssistance, validateCredentials, validateEvent,
  validateEventSearch, validateMessage, validateUser
} from '../utils/validator'
import { getCurrentDate } from '../utils/dates'

/**
 * Middleware to parse all information fields of a user.
 * Uses {@link parseUser} to get a user from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseAllUser = (req: Request, res: Response, next: NextFunction): void => {
  // Set all user fields as required
  res.locals.optionalUserFields = false

  return parseUser(req, res, next)
}

/**
 * Middleware to parse optional information fields of a user.
 * Uses {@link parseUser} to get a user from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parsePartialUser = (req: Request, res: Response, next: NextFunction): void => {
  // Set all user fields as optional
  res.locals.optionalUserFields = true

  return parseUser(req, res, next)
}

/**
 * Middleware to get and validate all the information required for a user
 * from the request body in JSON format. If any user field validation is unsuccessful,
 * an error is thrown to the error handler middleware.
 *
 * Uses a {@link Boolean} flag to determine whether fields of a user
 * are optional or required.
 * @see res.locals.optionalUserFields
 *
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
const parseUser = (req: Request, res: Response, next: NextFunction): void => {
  let stacktrace: any = {}

  // Check if request body is not a JSON object
  if (!isObject(req.body)) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_REQUEST_BODY_FORMAT,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  }

  // Get all user data from request body
  const user: User = {
    name: req.body.name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
    image_url: req.body.image_url
  }

  // Add received user data to stacktrace
  stacktrace = {
    _original: user
  }

  // Validate user data
  const invalidFields: string[] = validateUser(user, res.locals.optionalUserFields)

  // Check if exists invalid fields
  if (invalidFields.length > 0) {
    // Add each invalid user field to stacktrace
    stacktrace.invalid_fields = invalidFields.map(field => {
      let message

      switch (field) {
        case 'name':
        case 'last_name':
        case 'image_url':
          message = APIMessage.ERROR_INVALID_STRING_FIELD
          break
        case 'email':
          message = APIMessage.ERROR_INVALID_EMAIL_FIELD
          break
        case 'password':
          message = `${APIMessage.ERROR_INVALID_PASSWORD_FIELD_I} ${getMinimumPasswordLength()} ${APIMessage.ERROR_INVALID_PASSWORD_FIELD_II}`
          break
      }

      return { field, message }
    })

    next(
      new ErrorAPI(
        APIMessage.ERROR_INVALID_USER_FIELDS,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Pass validated user to the next middleware
    res.locals.PARSED_USER = user
    next()
  }
}

/**
 * Middleware to get and validate credentials required for a user to login
 * from the request body in JSON format. If any credential field validation is unsuccessful,
 * an error is thrown to the error handler middleware.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseCredentials = (req: Request, res: Response, next: NextFunction): void => {
  let stacktrace: any = {}

  // Check if request body is not a JSON object
  if (!isObject(req.body)) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_REQUEST_BODY_FORMAT,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  }

  // Get credentials from request body
  const credentials: UserCredentials = {
    email: req.body.email,
    password: req.body.password
  }

  // Add received user data to stacktrace
  stacktrace = {
    _original: credentials
  }

  // Validate credentials
  const invalidFields: string[] = validateCredentials(credentials)

  // Check if exists invalid fields
  if (invalidFields.length > 0) {
    // Add each invalid user field to stacktrace
    stacktrace.invalid_fields = invalidFields.map(field => {
      let message

      switch (field) {
        case 'email':
          message = APIMessage.ERROR_INVALID_EMAIL_FIELD
          break
        case 'password':
          message = `${APIMessage.ERROR_INVALID_PASSWORD_FIELD_I} ${getMinimumPasswordLength()} ${APIMessage.ERROR_INVALID_PASSWORD_FIELD_II}`
          break
      }

      return { field, message }
    })

    next(
      new ErrorAPI(
        APIMessage.ERROR_INVALID_CREDENTIALS_FIELDS,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Pass validated credentials to the next middleware
    res.locals.PARSED_USER_CREDENTIALS = credentials
    next()
  }
}

/**
 * Middleware to get and validate a user ID from the URL path as a parameter.
 * If the ID is not a number, an error is thrown to the error handler middleware.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseUserId = (req: Request, res: Response, next: NextFunction): void => {
  // Get user ID from the URL path sent as parameter
  const userId = parseInt(req.params.user_id)

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      user_id: userId
    }
  }

  // Check if user ID is a number
  if (!isNumber(userId)) {
    // Set the user ID received
    stacktrace._original.user_id = req.params.user_id

    next(
      new ErrorAPI(
        APIMessage.INVALID_USER_ID,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  }

  // Pass validated user ID to the next middleware
  res.locals.PARSED_USER_ID = userId
  next()
}

/**
 * Middleware to parse all information fields of an event.
 * Uses {@link parseEvent} to get an event from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseAllEvent = (req: Request, res: Response, next: NextFunction): void => {
  // Set all event fields as required
  res.locals.optionalEventFields = false

  return parseEvent(req, res, next)
}

/**
 * Middleware to parse optional information fields of an event.
 * Uses {@link parseEvent} to get an event from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parsePartialEvent = (req: Request, res: Response, next: NextFunction): void => {
  // Set all event fields as optional
  res.locals.optionalEventFields = true

  return parseEvent(req, res, next)
}

/**
 * Middleware to get and validate all the information required for an event
 * from the request body in JSON format. If any event field validation is unsuccessful,
 * an error is thrown to the error handler middleware.
 *
 * Uses a {@link Boolean} flag to determine whether fields of an event are
 * optional or required.
 * @see res.locals.optionalEventFields
 *
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
const parseEvent = (req: Request, res: Response, next: NextFunction): void => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Create a stacktrace
  let stacktrace: any = {}

  // Check if request body is not a JSON object
  if (!isObject(req.body)) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_REQUEST_BODY_FORMAT,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  }

  // Get all event data from request body
  const event: Event = {
    title: req.body.title,
    owner_id: authenticatedUserId,
    creation_date: getCurrentDate(),
    image_url: req.body.image_url,
    format: req.body.format,
    link: req.body.link,
    location: req.body.location,
    description: req.body.description,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
    max_attendees: req.body.max_attendees,
    ticket_price: req.body.ticket_price,
    category: req.body.category
  }

  // Add received event data to stacktrace
  stacktrace = {
    _original: event
  }

  // Validate event data
  const invalidFields: string[] = validateEvent(event, res.locals.optionalEventFields)

  // Check if exists invalid fields
  if (invalidFields.length > 0) {
    // Add each invalid event field to stacktrace
    stacktrace.invalid_fields = invalidFields.map(field => {
      let message

      // Get list of valid event formats
      const formats = Object.values(EventFormat).map((format) => format).toString()

      // Get list of valid event categories
      const categories = Object.values(EventCategory).map((category) => category).toString()

      switch (field) {
        case 'title':
        case 'image_url':
        case 'link':
        case 'location':
        case 'description':
          message = APIMessage.ERROR_INVALID_STRING_FIELD
          break
        case 'max_attendees':
        case 'ticket_price':
          message = APIMessage.ERROR_INVALID_NUMBER_FIELD
          break
        case 'format':
          message = `${APIMessage.ERROR_INVALID_ENUM_FIELD} ${formats}`
          break
        case 'category':
          message = `${APIMessage.ERROR_INVALID_ENUM_FIELD} ${categories}`
          break
        case 'start_date':
          message = APIMessage.ERROR_INVALID_EVENT_START_DATE
          break
        case 'end_date':
          message = APIMessage.ERROR_INVALID_DATE
          break
      }

      return { field, message }
    })

    next(
      new ErrorAPI(
        APIMessage.ERROR_INVALID_EVENT_FIELDS,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Pass validated event to the next middleware
    res.locals.PARSED_EVENT = event
    next()
  }
}

/**
 * Middleware to get and validate an event ID from the URL path as a parameter.
 * If the ID is not a number, an error is thrown to the error handler middleware.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseEventId = (req: Request, res: Response, next: NextFunction): void => {
  // Get event ID from the URL path sent as parameter
  const eventId = parseInt(req.params.event_id)

  // Create stacktrace
  const stacktrace: any = {
    _original: {
      event_id: eventId
    }
  }

  // Check if event ID is a number
  if (!isNumber(eventId)) {
  // Set the event ID received
    stacktrace._original.event_id = req.params.event_id

    next(
      new ErrorAPI(
        APIMessage.INVALID_EVENT_ID,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  }

  // Pass validated event ID to the next middleware
  res.locals.PARSED_EVENT_ID = eventId
  next()
}

/**
 * Middleware to get and validate event search parameters from the URL path.
 * Title and location are optional fields but an error is thrown if any of both are
 * inserted and are of an invalid type.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseEventSearch = (req: Request, res: Response, next: NextFunction): void => {
  // Get event title and location to search from URL path sent as query
  const { title, location } = req.query

  // Set received data to error stacktrace
  const stacktrace: any = {
    _original: {
      title: title,
      location: location
    }
  }

  // Validate search data
  const invalidFields: string[] = validateEventSearch(title as string, location as string)

  // Check if exists invalid fields
  if (invalidFields.length > 0) {
    // Add each invalid search field to stacktrace
    stacktrace.invalid_fields = invalidFields.map(field => {
      let message

      switch (field) {
        case 'title':
        case 'location':
          message = APIMessage.ERROR_INVALID_STRING_FIELD
          break
      }

      return { field, message }
    })

    next(
      new ErrorAPI(
        APIMessage.ERROR_INVALID_EVENT_SEARCH_FIELDS,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Pass validated search data to the next middleware
    res.locals.PARSED_SEARCH_EVENT_TITLE = title
    res.locals.PARSED_SEARCH_EVENT_LOCATION = location
    next()
  }
}

/**
 * Middleware to parse all information fields of a message.
 * Uses {@link parseMessage} to get a message from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseAllMessage = (req: Request, res: Response, next: NextFunction): void => {
  // Set all message fields as required
  res.locals.optionalMessageFields = false

  return parseMessage(req, res, next)
}

/**
 * Middleware to parse optional information fields of a message.
 * Uses {@link parseMessage} to get a message from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parsePartialMessage = (req: Request, res: Response, next: NextFunction): void => {
  // Set all message fields as optional
  res.locals.optionalMessageFields = true

  return parseMessage(req, res, next)
}

/**
 * Middleware to get and validate all the information required for a message
 * from the request body in JSON format. If any message field validation is unsuccessful,
 * an error is thrown to the error handler middleware.
 *
 * Uses a {@link Boolean} flag to determine whether fields of a message are
 * optional or required.
 * @see res.locals.optionalMessageFields
 *
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
const parseMessage = (req: Request, res: Response, next: NextFunction): void => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Create a stacktrace
  let stacktrace: any = {}

  // Check if request body is not a JSON object
  if (!isObject(req.body)) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_REQUEST_BODY_FORMAT,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  }

  // Get all message data from request body
  const message: Message = {
    senderUserId: authenticatedUserId,
    receiverUserId: req.body.receiver_user_id,
    content: req.body.content,
    timestamp: getCurrentDate()
  }

  // Add received message data to stacktrace
  stacktrace = {
    _original: message
  }

  // Validate message data
  const invalidFields: string[] = validateMessage(message, res.locals.optionalMessageFields)

  // Check if exists invalid fields
  if (invalidFields.length > 0) {
    // Add each invalid message field to stacktrace
    stacktrace.invalid_fields = invalidFields.map(field => {
      let message

      switch (field) {
        case 'receiverUserId':
          field = 'receiver_user_id'
          message = APIMessage.ERROR_INVALID_NUMBER_FIELD
          break
        case 'content':
          message = APIMessage.ERROR_INVALID_STRING_FIELD
          break
      }

      return { field, message }
    })

    next(
      new ErrorAPI(
        APIMessage.ERROR_INVALID_MESSAGE_FIELDS,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Pass validated message to the next middleware
    res.locals.PARSED_MESSAGE = message
    next()
  }
}

/**
 * Middleware to parse all information fields of an assistance.
 * Uses {@link parseAssistance} to get an assistance from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseAllAssistance = (req: Request, res: Response, next: NextFunction): void => {
  // Set all assistance fields as required
  res.locals.optionalAssistanceFields = false

  return parseAssistance(req, res, next)
}

/**
 * Middleware to parse optional information fields of an assistance.
 * Uses {@link parseAssistance} to get an assistance from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const createPartialAssistance = (req: Request, res: Response, next: NextFunction): void => {
  // Set all assistance fields as optional
  res.locals.optionalAssistanceFields = true

  // Set assistance action
  res.locals.assistanceAction = 'create'

  return parseAssistance(req, res, next)
}

/**
 * Middleware to parse optional information fields of an assistance.
 * Uses {@link parseAssistance} to get an assistance from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const editPartialAssistance = (req: Request, res: Response, next: NextFunction): void => {
  // Set all assistance fields as optional
  res.locals.optionalAssistanceFields = true

  // Set assistance action
  res.locals.assistanceAction = 'edit'

  return parseAssistance(req, res, next)
}

/**
 * Middleware to parse optional information fields of an assistance.
 * Uses {@link parseAssistance} to get an assistance from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const deletePartialAssistance = (req: Request, res: Response, next: NextFunction): void => {
  // Set all assistance fields as optional
  res.locals.optionalAssistanceFields = true

  // Set assistance action
  res.locals.assistanceAction = 'delete'

  return parseAssistance(req, res, next)
}

/**
 * Middleware to get and validate all the information required for an assistance
 * from the request body in JSON format. If any assistance field validation is unsuccessful,
 * an error is thrown to the error handler middleware.
 *
 * Uses a {@link Boolean} flag to determine whether fields of an assistance
 * are optional or required.
 * @see res.locals.optionalAssistanceFields
 *
 * Uses a {@link string} flag to determine whether assistance format field is required or optional.
 * @see res.locals.assistanceAction
 *
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
const parseAssistance = (req: Request, res: Response, next: NextFunction): void => {
  // Get the ID of the authenticated user
  const authenticatedUserId = res.locals.JWT_USER_ID

  // Get event ID from the URL path sent as parameter
  const eventId = res.locals.PARSED_EVENT_ID

  // Create a stacktrace
  let stacktrace: any = {}

  // Check if request body is not a JSON object
  if (!isObject(req.body)) {
    next(
      new ErrorAPI(
        APIMessage.ERROR_REQUEST_BODY_FORMAT,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  }

  // Get all assistance data from request body
  const assistance: Assistance = {
    user_id: authenticatedUserId,
    event_id: eventId,
    format: req.body.format,
    comment: req.body.comment,
    rating: req.body.rating
  }

  // Add received assistance data to stacktrace
  stacktrace = {
    _original: assistance
  }

  // Validate assistance data
  let invalidFields: string[] = validateAssistance(assistance, res.locals.optionalAssistanceFields)

  // Get assistance action
  const assistanceAction: string = res.locals.assistanceAction

  // Format field is only required on create an assistance
  invalidFields = invalidFields.filter(field => {
    return assistanceAction === 'create' && field === 'format'
  })

  // Check if exists invalid fields
  if (invalidFields.length > 0) {
    // Add each invalid assistance field to stacktrace
    stacktrace.invalid_fields = invalidFields.map(field => {
      let message

      // Get list of valid assistance formats
      const formats = Object.values(AssistanceFormat).map((format) => format).toString()

      switch (field) {
        case 'format':
          message = `${APIMessage.ERROR_INVALID_ENUM_FIELD} ${formats}`
          break
        case 'comment':
          message = APIMessage.ERROR_INVALID_STRING_FIELD
          break
        case 'rating':
          message = `${APIMessage.ERROR_INVALID_EVENT_RATING_I} ${getMinimumEventRatingValue()} ${APIMessage.ERROR_INVALID_EVENT_RATING_II} ${getMaximumEventRatingValue()}`
          break
      }

      return { field, message }
    })

    next(
      new ErrorAPI(
        APIMessage.ERROR_INVALID_ASSISTANCE_FIELDS,
        HttpStatusCode.BAD_REQUEST,
        stacktrace
      )
    )
  } else {
    // Pass validated assistance to the next middleware
    res.locals.PARSED_ASSISTANCE = assistance
    next()
  }
}
