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

  // Send error response
  res.status(httpStatusCode).json({
    error: error.message,
    http_status_code: httpStatusCode,
    stacktrace: error.stacktrace
  })
}
