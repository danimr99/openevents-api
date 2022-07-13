import express from 'express'
import dotenv from 'dotenv'

// Initialize an Express application
const app = express()

// Load environment variables from .env file
dotenv.config()

// Middleware to parse the request body to JSON
app.use(express.json())

// Default route
app.get('/', (_req, res) => {
  res.send('Hello World')
})

// Start the server
app.listen(process.env.EXPRESS_PORT, () => {
  console.log(`Server running on http://localhost:${process.env.EXPRESS_PORT}`)
})
