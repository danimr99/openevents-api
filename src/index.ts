import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import helmet from 'helmet'

import { errorHandler } from './middlewares/error_handler'
import { ErrorAPI } from './models/error_api'
import { HttpStatusCode } from './models/http_status_code'

// Initialize an Express application
const app = express()

// Load environment variables from .env file
dotenv.config()

// Set the port to listen on
const configurationPort = Number(process.env.EXPRESS_PORT)
const port = !Number.isNaN(configurationPort) ? configurationPort : 3000

// Middlewares
app.use(morgan('tiny'))
app.use(helmet())

// Middleware to parse the request body to JSON
app.use(express.json())

// Default endpoint for unknown requests
app.all('*', (req, _res, next) => {
  const stacktrace = {
    http_method: req.method,
    url: req.originalUrl
  }

  return next(
    new ErrorAPI(
      'Requested endpoint does not exist on the API',
      HttpStatusCode.NOT_FOUND,
      stacktrace
    )
  )
})

// Error handler middleware
app.use(errorHandler)

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
