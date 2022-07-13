import express from 'express'
import dotenv from 'dotenv'

// Initialize an Express application
const app = express()

// Load environment variables from .env file
dotenv.config()

// Set the port to listen on
const configurationPort = Number(process.env.EXPRESS_PORT)
const port = !isNaN(configurationPort) ? configurationPort : 3000

// Middleware to parse the request body to JSON
app.use(express.json())

// Default route
app.get('/', (_req, res) => {
  res.send('Hello World')
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
