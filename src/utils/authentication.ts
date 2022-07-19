import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

import { UserWithId } from '../models/user/user'
import { validateString } from './validator'

const DEFAULT_JWT_PRIVATE_KEY = 'DEFAULT_PRIVATE_KEY'

// Load environment variables from .env file
dotenv.config()

/**
 * Function to get the private key to generate authentication
 * tokens from the .env configuration file.
 * @returns {string} Private key to generate authentication tokens.
 */
export const getJWTPrivateKey = (): string => {
  return validateString(process.env.JWT_KEY) ? process.env.JWT_KEY as string : DEFAULT_JWT_PRIVATE_KEY
}

/**
 * Function to generate a JsonWebToken for a {@link User}.
 * @param {UserWithId} user - User to generate the token.
 * @returns {string} JsonWebToken generated for the user.
 */
export const generateAuthenticationToken = (user: UserWithId): string => {
  return jwt.sign({ id: user.id }, getJWTPrivateKey())
}
