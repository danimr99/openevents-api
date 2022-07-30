import { PublicUser, User, UserWithId } from '../models/user/user'

import { databaseConnection } from '../utils/database'
import { encryptPassword } from '../utils/cypher'
import { FriendshipStatus } from '../models/friendship/friendship_status'

export class UserDAO {
  /**
   * Function to get a list of {@link User}s by email address from the database.
   * @param {string} email - Email address to search.
   * @returns {Promise<UserWithId[]>} List of users by email coincidence.
   */
  async getUsersByEmail (email: string): Promise<UserWithId[]> {
    let result: UserWithId[]

    return await Promise<UserWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM users WHERE email LIKE CONCAT(\'%\', ?, \'%\')',
        [email]
      ).then(([rows]) => {
        // Convert from database result object to user
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get a {@link User} by ID from the database.
   * @param {number} id - ID to search.
   * @returns {Promise<UserWithId[]>} List of users with the specified ID.
   */
  async getUserById (id: number): Promise<UserWithId[]> {
    let result: UserWithId[]

    return await Promise<UserWithId[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT * FROM users WHERE id = ?',
        [id]
      ).then(([rows]) => {
        // Convert from database result object to user
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to insert a new {@link User} to the database.
   * @param {User} user - User to add into database.
   */
  async insertUser (user: Required<User>): Promise<any> {
    // Encrypt user password
    const encryptedPassword = await encryptPassword(user.password)

    return await Promise<any>.resolve(
      // Insert into database
      databaseConnection.promise().query(
        'INSERT INTO users (name, last_name, email, password, image_url) VALUES (?, ?, ?, ?, ?)',
        [user.name, user.last_name, user.email, encryptedPassword, user.image_url]
      )
    )
  }

  /**
   * Function to get all the {@link PublicUser} from the database.
   * @returns {Promise<PublicUser[]>} List of all users without their password.
   */
  async getAllUsers (): Promise<PublicUser[]> {
    let result: PublicUser[]

    return await Promise<PublicUser[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT id, name, last_name, email, image_url FROM users'
      ).then(([rows]) => {
        // Convert from database result object to user
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to get all the {@link PublicUser} from the database that their name,
   * last_name or email match with the text to search.
   * @param {string} text - Text to search.
   * @returns {Promise<PublicUser[]} List of all users without their password that
   * match with the search text.
   */
  async getUsersByTextSearch (text: string): Promise<PublicUser[]> {
    let result: PublicUser[]

    return await Promise<PublicUser[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT id, name, last_name, email, image_url FROM users WHERE name LIKE CONCAT(\'%\', ?, \'%\') ' +
        'OR last_name LIKE CONCAT(\'%\', ?, \'%\') OR email LIKE CONCAT(\'%\', ?, \'%\')',
        [text, text, text]
      ).then(([rows]) => {
        // Convert from database result object to user
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }

  /**
   * Function to update a {@link UserWithId} from the database.
   * @param {UserWithId} user - User to update from the database.
   */
  async updateUserById (user: UserWithId): Promise<any> {
    return await Promise<any>.resolve(
      // Update user on the database
      databaseConnection.promise().query(
        'UPDATE users SET name = ?, last_name = ?, email = ?, password = ?, image_url = ? WHERE id = ?',
        [user.name, user.last_name, user.email, user.password, user.image_url, user.id]
      )
    )
  }

  /**
   * Function to delete a {@link UserWithId} by ID from the database.
   * @param {number} id - ID of the user to delete.
   */
  async deleteUserById (id: number): Promise<any> {
    return await Promise<any>.resolve(
      // Delete user with the specified ID from the database
      databaseConnection.promise().query(
        'DELETE FROM users WHERE id = ?',
        [id]
      )
    )
  }

  /**
   * Function to get all friends of a {@link User} from the database.
   * @param {number} userId - ID of the user.
   * @returns {Promise<PublicUser[]>} List of friends of the specified user.
   */
  async getUserFriends (userId: number): Promise<PublicUser[]> {
    let result: PublicUser[]

    return await Promise<PublicUser[]>.resolve(
      // Query to database
      databaseConnection.promise().query(
        'SELECT u.id, u.name, u.last_name, u.email, u.image_url FROM users AS u ' +
        'WHERE u.id = (SELECT user_id FROM friendships AS f WHERE f.friend_user_id = ? AND f.status = ?) ' +
        'OR u.id = (SELECT friend_user_id FROM friendships AS f2 WHERE f2.user_id = ? AND f2.status = ?)',
        [userId, FriendshipStatus.ACCEPTED, userId, FriendshipStatus.ACCEPTED]
      ).then(([rows]) => {
        // Convert from database result object to user
        result = JSON.parse(JSON.stringify(rows))
        return result
      })
    )
  }
}
