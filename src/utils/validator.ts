import { isEmailValid } from '@sideway/address'

import { getMaximumEventRatingValue, getMinimumEventRatingValue, getMinimumPasswordLength } from '../constants'

import { User, UserCredentials, UserKey } from '../models/user/user'

/**
 * Function that checks if a value is a {@link String}.
 * @param {any} string - String to check.
 * @returns {Boolean} True if the value is a string, false otherwise.
 */
export const isString = (string: any): boolean => {
  return typeof string === 'string' || string instanceof String
}

/**
 * Function that checks if a value is a {@link String}, if it is not empty
 * and if it does not only contain blank spaces.
 * @param {any} string - String to check.
 * @returns {Boolean} True if string is valid, false otherwise.
 */
export const validateString = (string: any): boolean => {
  // Check string type
  if (!isString(string)) return false

  // Check if string is not empty or if it only contains blank spaces
  if (string.length === 0 || string.trim().length === 0) return false

  return true
}

/**
 * Function that checks if a value is a {@link Number}.
 * @param {any} number - Value to check.
 * @returns {Boolean} True if the value is a number, false otherwise.
 */
export const isNumber = (number: any): boolean => {
  return !Number.isNaN(number) && (typeof number === 'number' || number instanceof Number)
}

/**
 * Function that checks if a value is a {@link Date}.
 * @param {any} date - Date to check.
 * @returns {Boolean} True if the date is valid, false otherwise.
 */
export const isDate = (date: any): boolean => {
  return Boolean(Date.parse(date))
}

/**
 * Function that checks if a value is an {@link Object}.
 * @param {any} object - Object to check.
 * @returns {Boolean} True if the value is an object, false otherwise.
 */
export const isObject = (object: any): boolean => {
  return typeof object === 'object' || object instanceof Object
}

/**
 * Function that checks if an email address is valid.
 * @param {any} email - Email address to check.
 * @returns {Boolean} True if the email address is valid, false otherwise.
 */
export const validateEmail = (email: any): boolean => {
  // Check if email is a string
  if (!validateString(email)) return false

  // Check if it is a valid email address
  return isEmailValid(email)
}

/**
 * Function that checks if a password is valid.
 * @param {any} password - Password to check.
 * @returns {Boolean} True if the password is valid, false otherwise.
 */
export const validatePassword = (password: any): boolean => {
  // Check if password is a string
  if (!validateString(password)) return false

  // Check if password is at least of the required length
  return password.length >= getMinimumPasswordLength()
}

/**
 * Function that checks if a {@link User} is valid.
 * @param {User} user - User to check.
 * @param {Boolean} areFieldsOptional - Flag to indicate whether all user fields are required or not.
 * @returns {string[]} List of invalid user fields. If list is empty, user is valid.
 */
export const validateUser = (user: User, areFieldsOptional: boolean): string[] => {
  let invalidFields: string[] = []

  // Iterate through each key - value pair
  for (const [key, value] of Object.entries(user)) {
    // Fill the list of invalid fields if it is not for each value
    switch (key) {
      case 'name':
      case 'last_name':
      case 'image_url':
        if (!validateString(value)) invalidFields.push(key)
        break
      case 'email':
        if (!validateEmail(value)) invalidFields.push(key)
        break
      case 'password':
        if (!validatePassword(value)) invalidFields.push(key)
        break
    }
  }

  // Check if user fields are optional
  if (areFieldsOptional) {
    // Filter invalid fields list to get only those incorrectly fulfilled
    invalidFields = invalidFields.filter((field: string) => {
      // Set field as a user property
      const property = field as UserKey

      // Check if value of the user property is fulfilled
      return !(user[property] === undefined)
    })
  }

  return invalidFields
}

/**
 * Function that checks if a {@link UserCredentials} is valid.
 * @param {UserCredentials} credentials - Credentials to check.
 * @returns {string[]} List of invalid credential fields. If list is empty, credentials are valid.
 */
export const validateCredentials = (credentials: UserCredentials): string[] => {
  const invalidFields: string[] = []

  // Iterate through each key - value pair
  for (const [key, value] of Object.entries(credentials)) {
    // Fill the list of invalid fields if it is not for each value
    switch (key) {
      case 'email':
        if (!validateEmail(value)) invalidFields.push(key)
        break
      case 'password':
        if (!validatePassword(value)) invalidFields.push(key)
        break
    }
  }

  return invalidFields
}

/**
 * Function that checks if an event rating is valid.
 * @param {any} rating - Event rating to check.
 * @returns {Boolean} True if the event rating is a number and it is between min and max values, false otherwise.
 */
export const validateEventRating = (rating: any): boolean => {
  // Check if it is a number
  if (!isNumber(rating)) return false

  // Get minimum and maximum event rating value
  const min = getMinimumEventRatingValue()
  const max = getMaximumEventRatingValue()

  // Check if number is between min and max ranges
  return rating >= min && rating <= max
}
