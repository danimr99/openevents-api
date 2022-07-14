import { HttpStatusCode } from './http_status_code'

export class ErrorAPI extends Error {
  readonly status: HttpStatusCode
  readonly stacktrace: any

  constructor (message: string, status: HttpStatusCode, stacktrace: Object) {
    super(message)

    this.status = status
    this.stacktrace = stacktrace
    Error.captureStackTrace(this)
  }
}
