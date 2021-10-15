SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `rp_iam` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `rp_iam`;

CREATE TABLE `applications` (
  `id` bigint(20) NOT NULL,
  `userId` varchar(18) NOT NULL,
  `userName` varchar(255) NOT NULL DEFAULT '',
  `isDonor` tinyint(1) NOT NULL DEFAULT 0,
  `form` int(11) NOT NULL,
  `charName` varchar(255) NOT NULL,
  `data` mediumtext NOT NULL,
  `submitted` datetime NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `lastStatusChange` datetime DEFAULT NULL,
  `deniedReason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `forms` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  `description` tinyint(1) NOT NULL DEFAULT 0,
  `neededRole` varchar(18) DEFAULT NULL,
  `discordRoleToSet` varchar(18) NOT NULL DEFAULT '0',
  `sendPairingCode` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `pairing` (
  `userId` varchar(18) NOT NULL,
  `pairingToken` varchar(255) NOT NULL,
  `identifier` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `votes` (
  `appId` int(11) NOT NULL,
  `userId` varchar(18) NOT NULL,
  `upvote` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `forms`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `pairing`
  ADD PRIMARY KEY (`userId`);

ALTER TABLE `votes`
  ADD PRIMARY KEY (`appId`,`userId`);


ALTER TABLE `applications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
