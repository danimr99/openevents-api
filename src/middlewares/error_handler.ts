import { NextFunction, Request, Response } from 'express'

import { ErrorAPI } from '../models/error/error_api'
import { HttpStatusCode } from '../models/enums/http_status_code'

import { isNumber, isObject } from '../utils/validator'

/**
 * Middleware to handle errors and send a response to the client.
 * @param {ErrorAPI} error - ErrorAPI object.
 * @param {Request} req - Request object.
 * @param {Response} res - Response object.
 * @param {NextFunction} next - Next middleware.
 */
export const errorHandler = (error: ErrorAPI, _req: Request, res: Response, _next: NextFunction): void => {
  let jsonResponse: object
  let httpStatusCode: number

  // Check if stacktrace from the error exists and is a valid JSON object
  if (isObject(error.stacktrace) && Object.entries(error.stacktrace).length !== 0) {
    // Error has been caused by the API
    // Set response status code
    httpStatusCode = isNumber(error.httpStatusCode)
      ? error.httpStatusCode
      : HttpStatusCode.INTERNAL_SERVER_ERROR

    // Format JSON response
    jsonResponse = {
      error: error.message,
      http_status_code: httpStatusCode,
      stacktrace: error.stacktrace
    }
  } else {
    // Error has been caused by the request
    // Set response status code
    httpStatusCode = isNumber(error.httpStatusCode)
      ? error.httpStatusCode
      : HttpStatusCode.BAD_REQUEST

    // Format JSON response
    jsonResponse = {
      error: error.message,
      http_status_code: httpStatusCode
    }
  }

  // Send error response
  res.status(httpStatusCode).json(jsonResponse)
}
