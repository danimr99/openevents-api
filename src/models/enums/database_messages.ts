export enum DatabaseMessage {
  ERROR_CHECKING_USER_BY_EMAIL = 'An error has occurred while checking if exists a user with the same email address on the database',
  ERROR_INSERTING_USER = 'An error has occurred while inserting a new user on the database',
  ERROR_SELECTING_ALL_USERS = 'An error has occurred while fetching all the users from the database',
  ERROR_SELECTING_USER_BY_ID = 'An error has occurred while fetching a user by ID from the database',
  ERROR_SELECTING_USERS_BY_TEXT = 'An error has occurred while fetching users by text from the database',
  ERROR_UPDATING_USER = 'An error has occurred while updating a user from the database',
  ERROR_DELETING_USER = 'An error has occurred while deleting a user from the database',
  ERROR_SELECTING_ALL_EVENTS = 'An error has occurred while fetching all the events from the database',
  ERROR_INSERTING_EVENT = 'An error has occurred while inserting an event to the database'
}
