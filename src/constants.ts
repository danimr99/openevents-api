import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Default values
const DEFAULT_SERVER_PORT = 3000
const DEFAULT_MIN_PASSWORD_LENGTH = 8
const DEFAULT_MIN_EVENT_RATING = 0
const DEFAULT_MAX_EVENT_RATING = 10

/**
 * Function that gets the port to start server from the .env configuration file.
 * If an error occurs, assigns a default server port ({@link DEFAULT_SERVER_PORT}).
 * @returns {number} Server port to listen.
 */
export const getServerPort = (): number => {
  // Get server port from .env configuration file
  const port = Number(process.env.EXPRESS_PORT)

  return !Number.isNaN(port) ? port : DEFAULT_SERVER_PORT
}

/**
 * Function that gets the minimum password length from the .env configuration file.
 * If an error occurs, assigns a default password length ({@link DEFAULT_MIN_PASSWORD_LENGTH}).
 * @returns {number} Minimum password length.
 */
export const getMinimumPasswordLength = (): number => {
  // Get minimum password length from .env configuration file
  const passwordLength = Number(process.env.PASSWORD_MIN_LENGTH)

  return !Number.isNaN(passwordLength) ? passwordLength : DEFAULT_MIN_PASSWORD_LENGTH
}

/**
 * Function that gets the minimum event rating value from the .env configuration file.
 * If an error occurs, assigns a default minimum event rating value
 * ({@link DEFAULT_MIN_EVENT_RATING}).
 * @returns {number} Minimum event rating value.
 */
export const getMinimumEventRatingValue = (): number => {
  // Get minimum event rating value from .env configuration file
  const min = Number(process.env.EVENT_MIN_RATING)

  return !Number.isNaN(min) ? min : DEFAULT_MIN_EVENT_RATING
}

/**
 * Function that gets the maximum event rating value from the .env configuration file.
 * If an error occurs, assigns a default maximum event rating value
 * ({@link DEFAULT_MAX_EVENT_RATING}).
 * @returns {number} Maximum event rating value.
 */
export const getMaximumEventRatingValue = (): number => {
  // Get maximum event rating value from .env configuration file
  const max = Number(process.env.EVENT_MAX_RATING)

  return !Number.isNaN(max) ? max : DEFAULT_MAX_EVENT_RATING
}
