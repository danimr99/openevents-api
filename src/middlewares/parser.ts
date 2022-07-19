import { Request, Response, NextFunction } from 'express'

import { getMinimumPasswordLength } from '../constants'

import { User, UserCredentials } from '../models/user/user'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { APIMessage } from '../models/enums/api_messages'
import { ErrorAPI } from '../models/error/error_api'

import { isObject, validateCredentials, validateUser } from '../utils/validator'

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
 * Middleware to get and validate all the information required for a {@link User}}
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
 * Middleware to get and validate credentials required for a {@link User}} to login
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
    // Pass validated user to the next middleware
    res.locals.PARSED_USER_CREDENTIALS = credentials
    next()
  }
}
