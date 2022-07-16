import { Request, Response, NextFunction } from 'express'

import { getMinimumPasswordLength } from '../constants'

import { User } from '../models/user'
import { ErrorAPI } from '../models/error_api'
import { HttpStatusCode } from '../models/http_status_code'

import { validateUser } from '../utils/validator'

export const parseAllUser = (req: Request, res: Response, next: NextFunction): void => {
  // Set all user fields as required
  res.locals.optionalUserFields = false

  return parseUser(req, res, next)
}

export const parsePartialUser = (req: Request, res: Response, next: NextFunction): void => {
  // Set all user fields as required
  res.locals.optionalUserFields = true

  return parseUser(req, res, next)
}

/**
 * Middleware to get and validate all the information required for a {@link User}}
 * from the request body in JSON format. If any user field validation is unsuccessful, an error is thrown
 * to the error handler middleware.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
const parseUser = (req: Request, res: Response, next: NextFunction): void => {
  let stacktrace: any = {}

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
          message = 'Must be a non-empty string'
          break
        case 'email':
          message = 'Invalid email address'
          break
        case 'password':
          message = `Must be a non-empty string of at least ${getMinimumPasswordLength()} characters long`
          break
      }

      return { field, message }
    })

    next(
      new ErrorAPI(
        'All user information must be properly fulfilled',
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
