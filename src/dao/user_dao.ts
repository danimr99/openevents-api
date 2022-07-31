import { PublicUser, User, UserWithId } from '../models/user/user'
import { FriendshipStatus } from '../models/friendship/friendship_status'

import { databaseConnection } from '../utils/database'
import { encryptPassword } from '../utils/cypher'

export class UserDAO {
  /**
   * Function to get a list of users by email address from the database.
   * @param {string} email - Email address to search.
   * @returns {Promise<UserWithId[]>} List of users by email coincidence.
   */
  async getUsersByEmail (email: string): Promise<UserWithId[]> {
    // Select users by email
    return await databaseConnection.promise().query(
      'SELECT * FROM users WHERE email LIKE CONCAT(\'%\', ?, \'%\')',
      [email]
    ).then(([rows]) => {
      // Convert from database result object to list of users
      return JSON.parse(JSON.stringify(rows)) as UserWithId[]
    })
  }

  /**
   * Function to get a user by ID from the database.
   * @param {number} id - ID of a user to search.
   * @returns {Promise<UserWithId>} User with matching ID.
   */
  async getUserById (id: number): Promise<UserWithId> {
    // Select user by ID
    return await databaseConnection.promise().query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    ).then(([rows]) => {
      // Convert from database result object to list of users
      return JSON.parse(JSON.stringify(rows)) as UserWithId
    })
  }

  /**
   * Function to insert a new user to the database.
   * @param {User} user - User to add.
   */
  async insertUser (user: Required<User>): Promise<void> {
    // Encrypt user password
    const encryptedPassword = await encryptPassword(user.password)

    // Insert user
    await databaseConnection.promise().query(
      'INSERT INTO users (name, last_name, email, password, image_url) VALUES (?, ?, ?, ?, ?)',
      [user.name, user.last_name, user.email, encryptedPassword, user.image_url]
    )
  }

  /**
   * Function to get all users from the database.
   * @returns {Promise<PublicUser[]>} List of all users.
   */
  async getAllUsers (): Promise<PublicUser[]> {
    // Select all users
    return await databaseConnection.promise().query(
      'SELECT id, name, last_name, email, image_url FROM users'
    ).then(([rows]) => {
      // Convert from database result object to list of users
      return JSON.parse(JSON.stringify(rows)) as PublicUser[]
    })
  }

  /**
   * Function to get all users from the database that their name,
   * last_name or email match with a text to search.
   * @param {string} text - Text to search.
   * @returns {Promise<PublicUser[]} List of all users that match with the search text.
   */
  async getUsersByTextSearch (text: string): Promise<PublicUser[]> {
    // Select users by text
    return await databaseConnection.promise().query(
      'SELECT id, name, last_name, email, image_url FROM users WHERE name LIKE CONCAT(\'%\', ?, \'%\') ' +
        'OR last_name LIKE CONCAT(\'%\', ?, \'%\') OR email LIKE CONCAT(\'%\', ?, \'%\')',
      [text, text, text]
    ).then(([rows]) => {
      // Convert from database result object to list of users
      return JSON.parse(JSON.stringify(rows)) as PublicUser[]
    })
  }

  /**
   * Function to update a user from the database.
   * @param {UserWithId} user - User to update.
   */
  async updateUserById (user: UserWithId): Promise<void> {
    // Update user
    await databaseConnection.promise().query(
      'UPDATE users SET name = ?, last_name = ?, email = ?, password = ?, image_url = ? WHERE id = ?',
      [user.name, user.last_name, user.email, user.password, user.image_url, user.id]
    )
  }

  /**
   * Function to delete a user by ID from the database.
   * @param {number} id - ID of a user to delete.
   */
  async deleteUserById (id: number): Promise<void> {
    // Delete user
    await databaseConnection.promise().query(
      'DELETE FROM users WHERE id = ?',
      [id]
    )
  }

  /**
   * Function to get all friends of a user from the database.
   * @param {number} userId - ID of a user.
   * @returns {Promise<PublicUser[]>} List of friends of a user.
   */
  async getUserFriends (userId: number): Promise<PublicUser[]> {
    // Select friends of a user
    return await databaseConnection.promise().query(
      'SELECT u.id, u.name, u.last_name, u.email, u.image_url FROM users AS u ' +
          'WHERE u.id = (SELECT user_id FROM friendships AS f WHERE f.friend_user_id = ? AND f.status = ?) ' +
            'OR u.id = (SELECT friend_user_id FROM friendships AS f2 WHERE f2.user_id = ? AND f2.status = ?)',
      [userId, FriendshipStatus.ACCEPTED, userId, FriendshipStatus.ACCEPTED]
    ).then(([rows]) => {
      // Convert from database result object to list of users
      return JSON.parse(JSON.stringify(rows)) as PublicUser[]
    })
  }
}
