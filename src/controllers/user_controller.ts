import { PublicUser, User, UserWithId } from '../models/user/user'

import { UserDAO } from '../dao/user_dao'

import { isNumber, isObject, validateString, validateUser } from '../utils/validator'
import { encryptPassword } from '../utils/cypher'

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
 * Function to get a {@link UserWithId} by ID.
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
export const existsUserById = async (id: number): Promise<boolean> => {
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

/**
 * Function to get all the {@link PublicUser}s from the database whose name,
 * last name or email matches with the text.
 * @param {string} text - Text to search.
 * @returns {Promise<PublicUser[]} List of all users without their password that
 * match with the search text.
 */
export const getUsersByTextSearch = async (text: string): Promise<PublicUser[]> => {
  return await userDAO.getUsersByTextSearch(text).then((result) => result)
}

/**
 * Function to update the information of a {@link User} on the database.
 * @param {number} id - ID of the user to update.
 * @param {User} user - User with the updated information.
 */
export const updateUserInformation = async (id: number, user: User): Promise<UserWithId> => {
  // Get user by ID with the existing information
  const existingUser = await getUsersById(id)
    .then((users) => {
      return users[0]
    })

  // Get the user fields that are not marked as updatable
  const notUpdatableFields = validateUser(user, false)

  // Set new values for the updated user
  const updatedUser: UserWithId = user as UserWithId
  updatedUser.id = existingUser.id
  updatedUser.password = validateString(user.password)
    ? await encryptPassword(user.password)
    : existingUser.password

  // Set old values to those fields that are not marked as updatable
  notUpdatableFields.forEach((field) => {
    switch (field) {
      case 'name':
        updatedUser.name = (existingUser).name
        break
      case 'last_name':
        updatedUser.last_name = (existingUser).last_name
        break
      case 'email':
        updatedUser.email = (existingUser).email
        break
      case 'password':
        updatedUser.password = (existingUser).password
        break
      case 'image_url':
        updatedUser.image_url = (existingUser).image_url
        break
    }
  })

  await userDAO.updateUserById(updatedUser)

  return updatedUser
}

/**
 * Fucntion to delete a {@link User} and all the information related with it
 * from the database.
 * @param {number} id - ID of the user to delete.
 */
export const deleteUser = async (id: number): Promise<void> => {
  await userDAO.deleteUserById(id)
  // TODO: Delete all events where the delete user is the owner
  // TODO: Delete all assistances created by the deleted user
  // TODO: Delete all the friendships related with the deleted user
  // TODO: Delete all the messages sent and received by the deleted user
}
