import { isEmailValid } from '@sideway/address'

import { getMaximumEventRatingValue, getMinimumEventRatingValue, getMinimumPasswordLength } from '../constants'

import { User, UserCredentials, UserKey } from '../models/user/user'
import { Event, EventKey } from '../models/event/event'
import { EventCategory } from '../models/event/event_category'
import { EventFormat } from '../models/event/event_format'
import { Message, MessageKey } from '../models/message/message'

import { compareDates } from './dates'

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
 * Function that checks if an {@link Event} is valid.
 * @param {Event} event - Event to check.
 * @param {Boolean} areFieldsOptional - Flag to indicate whether all event fields are required or not.
 * @returns {string[]} List of invalid event fields. If list is empty, event is valid.
 */
export const validateEvent = (event: Event, areFieldsOptional: boolean): string[] => {
  let invalidFields: string[] = []

  // Iterate through each key - value pair
  for (const [key, value] of Object.entries(event)) {
    // Fill the list of invalid fields if it is not for each value
    switch (key) {
      case 'title':
      case 'image_url':
      case 'link':
      case 'location':
      case 'description':
        if (!validateString(value)) invalidFields.push(key)
        break
      case 'max_attendees':
      case 'ticket_price':
        if (!isNumber(value)) invalidFields.push(key)
        break
      case 'format':
        if (!validateEnum(EventFormat, value)) invalidFields.push(key)
        break
      case 'category':
        if (!validateEnum(EventCategory, value)) invalidFields.push(key)
        break
      case 'start_date':
      case 'end_date':
        if (!isDate(value)) invalidFields.push(key)
    }
  }

  // Check if start date is previous to end date
  if (!compareDates(event.start_date, event.end_date)) {
    invalidFields.push('start_date')
  }

  // If event is online, no max_attendees required
  if (event.format === EventFormat.ONLINE) {
    // Delete max_attendees from the invalid fields list
    invalidFields = invalidFields.filter((field) => field !== 'max_attendees')
  }

  // If event is online, no location is required
  if (event.format === EventFormat.ONLINE) {
    // Delete location from the invalid fields list
    invalidFields = invalidFields.filter((field) => field !== 'location')
  }

  // If event is face to face, no link is required
  if (event.format === EventFormat.FACE_TO_FACE) {
    // Delete location from the invalid fields list
    invalidFields = invalidFields.filter((field) => field !== 'link')
  }

  // Check if event fields are optional
  if (areFieldsOptional) {
    // Filter invalid fields list to get only those incorrectly fulfilled
    invalidFields = invalidFields.filter((field: string) => {
      // Set field as an event property
      const property = field as EventKey

      // Check if value of the event property is fulfilled
      return !(event[property] === undefined)
    })
  }

  return invalidFields
}

/**
 * Function that validates if a value is part of an enumeration.
 * @param {any} enumType - Enumeration to check.
 * @param {any} value - Value to check.
 * @returns {Boolean} True if the value is part of an enumeration, false otherwise.
 */
export const validateEnum = (enumType: any, value: any): boolean => {
  return Object.values(enumType).includes(value)
}

/**
 * Function that checks if an event title and location are valid. Both fields are optional, it means
 * that none of both are marked as invalid if they do not have a value.
 * @param {string} title - Title to search.
 * @param {string} location - Location to search.
 * @returns {string[]} List of invalid fields. If list is empty, fields are valid.
 */
export const validateEventSearch = (title: string, location: string): string[] => {
  const invalidFields: string[] = []

  // Validate the title to search
  if (!isString(title)) {
    invalidFields.push('title')
  }

  // Validate the location to search
  if (!isString(location)) {
    invalidFields.push('location')
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

/**
 * Function that checks if a {@link Message} is valid.
 * @param {Event} message - Message to check.
 * @param {Boolean} areFieldsOptional - Flag to indicate whether all message fields are required or not.
 * @returns {string[]} List of invalid message fields. If list is empty, message is valid.
 */
export const validateMessage = (message: Message, areFieldsOptional: boolean): string[] => {
  let invalidFields: string[] = []

  // Iterate through each key - value pair
  for (const [key, value] of Object.entries(message)) {
    // Fill the list of invalid fields if it is not for each value
    switch (key) {
      case 'receiverUserId':
        if (!isNumber(value)) invalidFields.push(key)
        break
      case 'content':
        if (!validateString(value)) invalidFields.push(key)
        break
    }
  }

  // Check if event fields are optional
  if (areFieldsOptional) {
    // Filter invalid fields list to get only those incorrectly fulfilled
    invalidFields = invalidFields.filter((field: string) => {
      // Set field as an event property
      const property = field as MessageKey

      // Check if value of the event property is fulfilled
      return !(message[property] === undefined)
    })
  }

  return invalidFields
}
