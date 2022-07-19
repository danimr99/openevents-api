import dotenv from 'dotenv'
import mysql from 'mysql2'

// Load environment variables from .env file
dotenv.config()

/**
 * Function that gets the database information from the .env configuration file
 * to establish a connection.
 * @returns {object} Database information to connect.
 */
export const getDatabaseInformation = (): object => {
  const database = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  }

  return database
}

/**
 * Database connection.
 */
export const databaseConnection = mysql.createConnection(getDatabaseInformation())
