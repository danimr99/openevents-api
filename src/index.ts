import express from 'express'

// Initialize an express application
const app = express()

// Set the port to listen on
const PORT = 3000

// Middleware to parse the request body to JSON
app.use(express.json())

// Default route
app.get('/', (_req, res) => {
  res.send('Hello World')
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
