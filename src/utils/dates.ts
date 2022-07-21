/**
 * Function to get the current date and time.
 * @returns {Date} Current date time.
 */
export const getCurrentDate = (): Date => {
  // Get current date time as UNIX timestamp
  const now = new Date().getTime()

  // Return current date time
  return new Date(now)
}

/**
 * Function an ISO 8601 string format to a date.
 * @param {any} iso - The ISO date to convert.
 * @returns {Date} Converted date.
 */
export const toDate = (iso: any): Date => {
  return new Date(iso)
}

/**
 * Function to convert a date to an ISO 8601 string format.
 * @param date - Date to convert.
 * @returns {string} Converted date in ISO 8601 string format.
 */
export const toISO = (date: any): string => {
  return new Date(date).toISOString()
}

/**
 * Function to check if a date is before another date.
 * @param {Date} beforeDate - The date to check.
 * @param {Date} afterDate - The date to check against.
 * @returns {Boolean} True if the date is before the other date, false otherwise.
 */
export const compareDates = (beforeDate: Date, afterDate: Date): boolean => {
  return beforeDate < afterDate
}
