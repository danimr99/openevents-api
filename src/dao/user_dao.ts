import { User } from '../models/user/user'
import { encryptPassword } from '../utils/cypher'

import { databaseConnection } from '../utils/database'

export class UserDAO {
  /**
   * Function to get a list of {@link User}s by email address from the database.
   * @param email - Email address to search.
   * @returns {Promise<User[]>} List of users.
   */
  async getUsersByEmail (email: string): Promise<User[]> {
    let result: User[]

    return await Promise<User[]>.resolve(
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
}
