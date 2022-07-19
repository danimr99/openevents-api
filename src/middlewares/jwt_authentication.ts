import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'

import { getJWTPrivateKey } from '../utils/authentication'
import { isObject } from '../utils/validator'

import { getUserById } from '../controllers/user_controller'

const authenticationError = new ErrorAPI(
  'Invalid authentication token or not registered user',
  HttpStatusCode.UNAUTHORIZED,
  {}
)

/**
 * Middleware to validate a JsonWebToken received from a HTTP request header.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Check if exists authentication JWT on HTTP request header
  if (req.headers.authorization == null || req.headers.authorization === undefined) {
    next(authenticationError)
  } else {
    // Get Bearer authorization token from HTTP request header
    const token = req.headers.authorization.split(' ')[1]

    // Check if exists a token on the HTTP request header
    if (token.length === 0) next(authenticationError)

    try {
      // Verify token and get payload
      const decoded = JSON.parse(JSON.stringify(jwt.verify(token, getJWTPrivateKey())))

      // Get the user who is the owner of the access token
      await getUserById(decoded.id).then((user) => {
        // Check if exists a user with the ID from the received JWT
        if (!isObject(user)) next(authenticationError)

        // Pass user ID to the next middleware
        res.locals.PARSED_USER_CREDENTIALS = user.id
        next()
      })
    } catch (error) {
      next(authenticationError)
    }
  }
}
