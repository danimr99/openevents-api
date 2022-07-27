SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `openevents`
--

CREATE DATABASE IF NOT EXISTS openevents;
USE openevents;

-- --------------------------------------------------------

--
-- Table: `assistances`
--

CREATE TABLE IF NOT EXISTS `assistances` (
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `comment` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `events`
--

CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `format` int(11) NOT NULL DEFAULT 0 COMMENT '0: FACE-TO-FACE\n1: ONLINE\n',
  `link` varchar(300) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `max_attendees` int(11) DEFAULT 0,
  `ticket_price` decimal(6,2) DEFAULT 0,
  `category` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `friendships`
--

CREATE TABLE IF NOT EXISTS `friendships` (
  `user_id` int(11) NOT NULL,
  `friend_user_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0: REQUESTED\n1: ACCEPTED\n2: REJECTED'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `messages`
--

CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL,
  `content` varchar(500) NOT NULL,
  `sender_user_id` int(11) NOT NULL,
  `receiver_user_id` int(11) NOT NULL,
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table: `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `last_name` varchar(200) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `password` varchar(300) DEFAULT NULL,
  `image_url` varchar(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes of the table: `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes of the table: `friends`
--
ALTER TABLE `friendships`
  ADD PRIMARY KEY (`user_id`,`friend_user_id`);

--
-- Indexes of the table: `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes of the table: `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_UNIQUE` (`email`);

--
-- AUTO_INCREMENT of the table: `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT of the table: `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT of the table: `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;