import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { APIMessage } from '../models/enums/api_messages'
import { HttpStatusCode } from '../models/enums/http_status_code'
import { ErrorAPI } from '../models/error/error_api'

import { existsUserById } from '../controllers/user_controller'

import { getJWTPrivateKey } from '../utils/authentication'

const authenticationError = new ErrorAPI(
  APIMessage.ERROR_INVALID_AUTHENTICATION_JWT,
  HttpStatusCode.UNAUTHORIZED,
  {}
)

/**
 * Middleware to validate a JsonWebToken received from a HTTP request header.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
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
      const decodedJWT = JSON.parse(JSON.stringify(jwt.verify(token, getJWTPrivateKey())))

      // Check if exists the user owner of the JWT
      void Promise<boolean>.resolve(
        existsUserById(decodedJWT.id).then((userExists) => {
          // Check if exists a user with the ID from the received JWT
          if (userExists) {
            // TODO: Invalidate JWT if password has changed (Add password to JWT payload and compare password on authenticate)
            // Pass user ID to the next middleware
            res.locals.JWT_USER_ID = decodedJWT.id
            next()
          } else {
            next(authenticationError)
          }
        })
      )
    } catch (error) {
      next(authenticationError)
    }
  }
}
