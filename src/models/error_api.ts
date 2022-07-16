import { HttpStatusCode } from './http_status_code'

export class ErrorAPI extends Error {
  httpStatusCode: HttpStatusCode
  stacktrace: Object

  constructor (message: string, httpStatusCode: HttpStatusCode, stacktrace: Object) {
    super(message)

    this.httpStatusCode = httpStatusCode
    this.stacktrace = stacktrace
    Error.captureStackTrace(this)
  }
}
