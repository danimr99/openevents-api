import { NextFunction, Request, Response } from 'express'
import { ErrorAPI } from '../models/error_api'
import { HttpStatusCode } from '../models/http_status_code'

/**
 * Middleware to handle errors and send a response to the client.
 * @param error - ErrorAPI object.
 * @param req - Request object.
 * @param res - Response object.
 * @param next - Next middleware.
 * @returns void.
*/
export const errorHandler = (error: ErrorAPI, _req: Request, res: Response, _next: NextFunction): void => {
  // Set response status code
  const status = !Number.isNaN(error.status) ? error.status : HttpStatusCode.INTERNAL_SERVER_ERROR

  // Send error response
  res.header('Content-Type', 'application/json')
  res.status(status).send({
    status: error.status,
    error: error.message,
    stacktrace: error.stacktrace
  })
}
