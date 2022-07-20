export enum APIMessage {
  ERROR_REQUEST_BODY_FORMAT = 'Data from the request body must be a valid JSON',
  ERROR_INVALID_AUTHENTICATION_JWT = 'Invalid authentication token or not registered user',
  ERROR_INVALID_STRING_FIELD = 'Must be a non-empty string',
  ERROR_INVALID_PASSWORD_FIELD_I = 'Must be a non-empty string of at least',
  ERROR_INVALID_PASSWORD_FIELD_II = 'characters long',
  ERROR_INVALID_EMAIL_FIELD = 'Must be a valid email address',
  ERROR_USER_EMAIL_ALREADY_EXISTS = 'Already exists a user with the same email address',
  ERROR_INVALID_USER_FIELDS = 'All user information must be properly fulfilled',
  ERROR_INVALID_CREDENTIALS_FIELDS = 'Credential fields must be properly fulfilled',
  ERROR_MULTIPLE_USERS_SAME_EMAIL = 'Erroneously exist multiple users with the same email address',
  INVALID_CREDENTIALS = 'Invalid email address or password',
  INVALID_USER_ID = 'Invalid user ID',
  USER_NOT_FOUND = 'User does not exist or was not found'
}
