import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import helmet from 'helmet'

import { ErrorAPI } from './models/error_api'
import { HttpStatusCode } from './models/http_status_code'
import { getServerPort } from './constants'

import userRouter from './routes/users.routes'
import eventRouter from './routes/events.routes'
import assistanceRouter from './routes/assistances.routes'
import messageRouter from './routes/messages.routes'
import friendshipRouter from './routes/friendships.routes'

import { errorHandler } from './middlewares/error_handler'

// Initialize an Express application
const app = express()

// Load environment variables from .env file
dotenv.config()

// Set the port to listen on
const port = getServerPort()

// Middlewares
app.use(morgan('tiny'))
app.use(helmet())

// Middleware to parse the request body to JSON
app.use(express.json())

// Routes
app.use('/users', userRouter)
app.use('/events', eventRouter)
app.use('/assistances', assistanceRouter)
app.use('/messages', messageRouter)
app.use('/friendships', friendshipRouter)

// Default endpoint for unknown requests
app.all('*', (req, _res, next) => {
  const stacktrace = {
    http_method: req.method,
    endpoint: req.originalUrl
  }

  next(
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
