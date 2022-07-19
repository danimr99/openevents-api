import bcrypt from 'bcrypt'

/**
 * Function that encrypts a password.
 * @param {string} password - Password to encrypt.
 * @returns {Promise<string>} Hash of the encrypted password.
 */
export const encryptPassword = async (password: string = ''): Promise<string> => {
  const salt = await bcrypt.genSalt()

  return await Promise<string>.resolve(
    bcrypt.hash(password, salt)
  )
}

/**
 * Function that compares a password with a password hash and determines whether a
 * password is the same or not.
 * @param {string} password - Password to compare.
 * @param {string} hash - Password hash to compare.
 * @returns {Promise<boolean>} True if the password and the password hash matches, false otherwise.
 */
export const checkPassword = async (password: string, hash: string): Promise<boolean> => {
  return await Promise<boolean>.resolve(
    bcrypt.compare(password, hash)
  )
}
