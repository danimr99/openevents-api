import { HttpStatusCode } from '../enums/http_status_code'

export class ErrorAPI extends Error {
  public httpStatusCode: HttpStatusCode
  public stacktrace: Object

  constructor (message: string, httpStatusCode: HttpStatusCode, stacktrace: Object) {
    super(message)

    this.httpStatusCode = httpStatusCode
    this.stacktrace = stacktrace
    Error.captureStackTrace(this)
  }
}
