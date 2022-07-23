import { Request, Response, NextFunction } from 'express'

import { getMinimumPasswordLength } from '../constants'

import { User, UserCredentials } from '../models/user/user'
import { Event } from '../models/event/event'
import { EventFormat } from '../models/event/event_format'
import { EventCategory } from '../models/event/event_category'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'
import { APIMessage } from '../models/enums/api_messages'

import {
  isNumber, isObject, validateCredentials, validateEvent,
  validateEventSearch, validateUser
} from '../utils/validator'
import { getCurrentDate } from '../utils/dates'

/**
 * Middleware to parse all information fields of a {@link User}.
 * Uses {@link parseUser} to get a {@link User} from a request body and validate it.
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
 * Middleware to parse optional information fields of a {@link User}.
 * Uses {@link parseUser} to get a {@link User} from a request body and validate it.
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
 * Middleware to get and validate all the information required for a {@link User}
 * from the request body in JSON format. If any user field validation is unsuccessful,
 * an error is thrown to the error handler middleware. Uses a {@link Boolean} flag
 * to determine whether fields of a {@link User} are optional or required.
 * @see res.locals.optionalUserFields
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
 * Middleware to get and validate credentials required for a {@link User} to login
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

  // Validate user data
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
 * Middleware to get and validate a {@link User} ID from the URL path as a parameter.
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
 * Middleware to parse all information fields of an {@link Event}.
 * Uses {@link parseEvent} to get an {@link Event} from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parseAllEvent = (req: Request, res: Response, next: NextFunction): void => {
  // Set all user fields as required
  res.locals.optionalEventFields = false

  return parseEvent(req, res, next)
}

/**
 * Middleware to parse optional information fields of an {@link Event}.
 * Uses {@link parseEvent} to get an {@link Event} from a request body and validate it.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const parsePartialEvent = (req: Request, res: Response, next: NextFunction): void => {
  // Set all user fields as optional
  res.locals.optionalEventFields = true

  return parseEvent(req, res, next)
}

/**
 * Middleware to get and validate all the information required for an {@link Event}
 * from the request body in JSON format. If any event field validation is unsuccessful,
 * an error is thrown to the error handler middleware. Uses a {@link Boolean} flag
 * to determine whether fields of an {@link Event} are optional or required.
 * @see res.locals.optionalEventFields
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

  // Get all user data from request body
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

  // Add received user data to stacktrace
  stacktrace = {
    _original: event
  }

  // Validate user data
  const invalidFields: string[] = validateEvent(event, res.locals.optionalEventFields)

  // Check if exists invalid fields
  if (invalidFields.length > 0) {
    // Add each invalid user field to stacktrace
    stacktrace.invalid_fields = invalidFields.map(field => {
      let message

      const formats = Object.values(EventFormat).map((format) => format).toString()
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
        APIMessage.ERROR_INVALID_EVENTS_FIELDS,
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
 * Middleware to get and validate an {@link Event} ID from the URL path as a parameter.
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
    // Add each invalid user field to stacktrace
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
