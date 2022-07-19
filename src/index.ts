import express, { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import helmet from 'helmet'

import { getServerPort } from './constants'

import { ErrorAPI } from './models/error/error_api'
import { HttpStatusCode } from './models/enums/http_status_code'

import userRouter from './routes/user_routes'
import eventRouter from './routes/event_routes'
import assistanceRouter from './routes/assistance_routes'
import messageRouter from './routes/message_routes'
import friendshipRouter from './routes/friendship_routes'

import { errorHandler } from './middlewares/error_handler'

// Initialize an Express application
const app = express()

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
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
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
