import { PublicUser, User, UserWithId } from '../models/user/user'
import { UserStatistics } from '../models/user/user_statistics'

import { UserDAO } from '../dao/user_dao'

import { deleteUserEvents, getAverageRatingOfEventsCreatedByUser, getEventsByOwnerId } from './event_controller'
import { deleteUserFriendships, getFriends, getFriendshipRequests } from './friendship_controller'
import { deleteUserAssistances, getAssistancesByUser } from './assistance_controller'
import { deleteUserMessages } from './message_controller'

import { isNumber, isObject, validateString, validateUser } from '../utils/validator'
import { encryptPassword } from '../utils/cypher'

const userDAO = new UserDAO()

/**
 * Function to get all the users by email address.
 * @param {string} email - Email address to search.
 * @returns {Promise<UserWithId[]>} List of users by email coincidence.
 */
export const getUsersByEmail = async (email: string = ''): Promise<UserWithId[]> => {
  return await userDAO.getUsersByEmail(email)
}

/**
 * Function to get a user by ID.
 * @param {number} id - ID to search.
 * @returns {Promise<UserWithId>} User with matching ID.
 */
export const getUserById = async (id: number): Promise<UserWithId> => {
  return await userDAO.getUserById(id).then((users) => users[0])
}

/**
 * Function to check if a user exists by email address.
 * @param {string} email - Email address of a user to check.
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
 * Function to check if a user exists by ID.
 * @param {number} id - ID of a user to check.
 * @returns {boolean} True if a user with the specified ID exists, false otherwise.
 */
export const existsUserById = async (id: number): Promise<boolean> => {
  if (isNumber(id)) {
    // Get user by id
    const user = await getUserById(id)

    // Check if user has data
    if (isObject(user) && user != null) {
      // Check if ID matches
      return user.id === id
    }
  }

  return false
}

/**
 * Function to create a user.
 * @param {User} user - User to create.
 */
export const createUser = async (user: Required<User>): Promise<void> => {
  if (validateUser(user, false).length === 0) {
    // Insert user
    await userDAO.insertUser(user)
  }
}

/**
 * Function to get all users.
 * @returns {Promise<PublicUser[]>} List of all users.
 */
export const getAllUsers = async (): Promise<PublicUser[]> => {
  return await userDAO.getAllUsers()
}

/**
 * Function to get all users whose name, last name or email matches with the text.
 * @param {string} text - Text to search.
 * @returns {Promise<PublicUser[]} List of all users that match with the search text.
 */
export const getUsersByTextSearch = async (text: string): Promise<PublicUser[]> => {
  return await userDAO.getUsersByTextSearch(text)
}

/**
 * Function to update the information of a user.
 * @param {number} id - ID of a user to update.
 * @param {User} user - User with the updated information.
 */
export const updateUserInformation = async (id: number, user: User): Promise<UserWithId> => {
  // Get user by ID with the existing information
  const existingUser = await getUserById(id)

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

  // Update user
  await userDAO.updateUserById(updatedUser)

  return updatedUser
}

/**
 * Function to delete a user and all the information related with it.
 * @param {number} userId - ID of a user to delete.
 */
export const deleteUser = async (userId: number): Promise<void> => {
  // Delete user
  await userDAO.deleteUserById(userId)

  // Delete all events where the delete user is the owner
  await deleteUserEvents(userId)

  // Delete all assistances created by the deleted user
  await deleteUserAssistances(userId)

  // Delete all the friendships related with the deleted user
  await deleteUserFriendships(userId)

  // Delete all the messages sent and received by the deleted user
  await deleteUserMessages(userId)
}

/**
 * Function to get all friends of a user.
 * @param {number} userId - ID of a user.
 * @returns {Promise<PublicUser[]>} List of friends of a user.
 */
export const getUserFriends = async (userId: number): Promise<PublicUser[]> => {
  return await userDAO.getUserFriends(userId)
}

/**
 * Function to get statistics of a user.
 * @param userId - ID of a user.
 * @returns {Promise<UserStatistics>} Statistics of a user.
 */
export const getUserStatistics = async (userId: number): Promise<UserStatistics> => {
  const averageRating = await getAverageRatingOfEventsCreatedByUser(userId)

  const stats: UserStatistics = {
    created_events_counter: await getEventsByOwnerId(userId).then((events) => events.length),
    events_average_rating: averageRating,
    friends_counter: await getFriends(userId).then((friends) => friends.length),
    received_pending_friend_requests_counter: await getFriendshipRequests(userId).then((friendRequests) => friendRequests.length),
    attended_events_counter: await getAssistancesByUser(userId).then((assistances) => assistances.length)
  }

  return stats
}
