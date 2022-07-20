import { NextFunction, Request, Response } from 'express'

import { ErrorAPI } from '../models/error/error_api'
import { HttpStatusCode } from '../models/enums/http_status_code'

import { isNumber } from '../utils/validator'

/**
 * Middleware to handle errors and send a response to the client.
 * @param {ErrorAPI} error - ErrorAPI object.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const errorHandler = (error: ErrorAPI, _req: Request, res: Response, _next: NextFunction): void => {
  // Set response status code
  const httpStatusCode: number = isNumber(error.httpStatusCode)
    ? error.httpStatusCode
    : HttpStatusCode.INTERNAL_SERVER_ERROR

  // Format JSON response
  const jsonResponse = Object.entries(error.stacktrace).length === 0
    ? {
        error: error.message,
        http_status_code: httpStatusCode
      }
    : {
        error: error.message,
        http_status_code: httpStatusCode,
        stacktrace: error.stacktrace
      }

  // Send error response
  res.status(httpStatusCode).json(jsonResponse)
}
