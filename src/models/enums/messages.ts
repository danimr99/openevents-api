export enum APIMessage {
  ERROR_REQUEST_BODY_FORMAT = 'Data from the request body must be a valid JSON',
  ERROR_INVALID_STRING_FIELD = 'Must be a non-empty string',
  ERROR_INVALID_PASSWORD_FIELD_I = 'Must be a non-empty string of at least',
  ERROR_INVALID_PASSWORD_FIELD_II = 'characters long',
  ERROR_INVALID_EMAIL_FIELD = 'Must be a valid email address',
  ERROR_USER_EMAIL_ALREADY_EXISTS = 'Already exists a user with the same email address',
  ERROR_INVALID_USER_FIELDS = 'All user information must be properly fulfilled'
}

export enum DatabaseMessage {
  ERROR_CHECKING_USER_BY_EMAIL = 'An error has occurred while checking if exists a user with the same email address on the database',
  ERROR_INSERTING_USER = 'An error has occurred while inserting a new user on the database'
}
