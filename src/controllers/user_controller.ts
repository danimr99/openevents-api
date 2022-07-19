import { Request, Response, NextFunction } from 'express'

import { getMinimumPasswordLength } from '../constants'

import { User } from '../models/user/user'
import { ErrorAPI } from '../models/error/error_api'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { APIMessage } from '../models/enums/messages'

import { UserDAO } from '../dao/user_dao'

import { isNumber, isObject, validateString, validateUser } from '../utils/validator'

const userDAO = new UserDAO()

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
 * Function to check if a {@link User} exists by email address.
 * @param {string} email - Email address of the user to check.
 * @returns {boolean} True if a user with the specified email exists, false otherwise.
 */
export const existsUserByEmail = async (email: string = ''): Promise<boolean> => {
  if (validateString(email)) {
    // Get user by email address
    const usersList = await userDAO.getUsersByEmail(email)
    // const userFromDatabase = await userDAO.getUserByEmail(email)

    // Check if user has data
    if (isObject(usersList) && usersList.length > 0) {
      // Check if only exists a user
      if (usersList.length === 1) {
        // Check if email addresses matches
        return usersList[0].email === email
      }
    }
  }

  return false
}

/**
 * Function to check if a {@link User} exists by ID.
 * @param {number} id - ID of the user to check.
 * @returns {boolean} True if a user with the specified ID exists, false otherwise.
 */
export const existsUserByID = async (id: number): Promise<boolean> => {
  if (isNumber(id)) {
    // TODO: Get user by id on user dao
    return true
  }

  return false
}

/**
 * Function to create a {@link User}.
 * @param {User} user - User to create.
 */
export const createUser = async (user: Required<User>): Promise<void> => {
  if (validateUser(user, false).length === 0) {
    // Insert user into database
    await userDAO.insertUser(user)
  }
}
