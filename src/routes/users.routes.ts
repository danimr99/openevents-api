import express from 'express'

import { HttpStatusCode } from '../models/http_status_code'

import { parseAllUser } from '../controllers/users.controller'

// Create a router for users
const router = express.Router()

router.post('/', parseAllUser, (_req, res, _next) => {
  res.status(HttpStatusCode.OK).send('POST /users')
})

export default router
