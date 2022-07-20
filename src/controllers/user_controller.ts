import { PublicUser, User, UserWithId } from '../models/user/user'

import { UserDAO } from '../dao/user_dao'

import { isNumber, isObject, validateString, validateUser } from '../utils/validator'

const userDAO = new UserDAO()

/**
 * Function to get all the users by email address.
 * @param {string} email - Email address to search.
 * @returns {Promise<UserWithId[]>} List of users by email coincidence.
 */
export const getUsersByEmail = async (email: string = ''): Promise<UserWithId[]> => {
  return await userDAO.getUsersByEmail(email).then((result) => result)
}

/**
 * Function to get all the users by ID.
 * @param {number} id - ID to search.
 * @returns {Promise<UserWithId[]>} List of users by ID.
 */
export const getUsersById = async (id: number): Promise<UserWithId[]> => {
  return await userDAO.getUserById(id).then((result) => result)
}

/**
 * Function to check if a {@link User} exists by email address.
 * @param {string} email - Email address of the user to check.
 * @returns {boolean} True if a user with the specified email exists, false otherwise.
 */
export const existsUserByEmail = async (email: string = ''): Promise<boolean> => {
  if (validateString(email)) {
    // Get user by email address
    const usersList = await getUsersByEmail(email)

    // Check if user has data
    if (isObject(usersList) && usersList.length > 0) {
      // Check if only exists a user
      if (usersList.length === 1) {
        // Check if email addresses matches
        return usersList[0].email === email
      }
    }
  }

  return false
}

/**
 * Function to check if a {@link User} exists by ID.
 * @param {number} id - ID of the user to check.
 * @returns {boolean} True if a user with the specified ID exists, false otherwise.
 */
export const existsUserByID = async (id: number): Promise<boolean> => {
  if (isNumber(id)) {
    // Get user by id
    const usersList = await getUsersById(id)

    // Check if user has data
    if (isObject(usersList) && usersList.length > 0) {
      // Check if ID matches
      return usersList[0].id === id
    }
  }

  return false
}

/**
 * Function to create a {@link User}.
 * @param {User} user - User to create.
 */
export const createUser = async (user: Required<User>): Promise<void> => {
  if (validateUser(user, false).length === 0) {
    // Insert user into database
    await userDAO.insertUser(user)
  }
}

/**
 * Function to get all the {@link PublicUser}s from the database.
 * @returns {Promise<PublicUser[]>} List of all the users without their password.
 */
export const getAllUsers = async (): Promise<PublicUser[]> => {
  return await userDAO.getAllUsers().then((result) => result)
}
