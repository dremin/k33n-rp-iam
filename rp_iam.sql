-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: fivem-mysql
-- Generation Time: Dec 21, 2019 at 04:03 AM
-- Server version: 10.4.6-MariaDB-1:10.4.6+maria~bionic
-- PHP Version: 7.2.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rp_iam`
--
CREATE DATABASE IF NOT EXISTS `rp_iam` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `rp_iam`;

-- --------------------------------------------------------

--
-- Table structure for table `accountability`
--

CREATE TABLE `accountability` (
  `id` int(11) NOT NULL,
  `steamid` varchar(30) NOT NULL,
  `date` datetime NOT NULL,
  `type` tinyint(4) NOT NULL,
  `reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` bigint(20) NOT NULL,
  `userId` int(11) NOT NULL,
  `userName` varchar(255) NOT NULL DEFAULT '',
  `isDonor` tinyint(1) NOT NULL DEFAULT 0,
  `form` int(11) NOT NULL,
  `charName` varchar(255) NOT NULL,
  `discordName` varchar(255) DEFAULT NULL,
  `steamHex` varchar(255) DEFAULT NULL,
  `data` mediumtext NOT NULL,
  `submitted` datetime NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `lastStatusChange` datetime DEFAULT NULL,
  `deniedReason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `forms`
--

CREATE TABLE `forms` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  `description` tinyint(1) NOT NULL DEFAULT 0,
  `neededGroup` int(20) DEFAULT NULL,
  `requireCad` tinyint(1) NOT NULL DEFAULT 0,
  `requireDiscord` tinyint(1) NOT NULL DEFAULT 0,
  `requireSteam` tinyint(1) NOT NULL DEFAULT 0,
  `ipsGroupToSet` int(20) DEFAULT NULL,
  `discordRole` varchar(18) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `votes`
--

CREATE TABLE `votes` (
  `appId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `upvote` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `whitelist`
--

CREATE TABLE `whitelist` (
  `steamid` varchar(30) NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `warns` int(11) NOT NULL DEFAULT 0,
  `banned` tinyint(1) NOT NULL DEFAULT 0,
  `userId` int(11) DEFAULT NULL,
  `userName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accountability`
--
ALTER TABLE `accountability`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `forms`
--
ALTER TABLE `forms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `votes`
--
ALTER TABLE `votes`
  ADD PRIMARY KEY (`appId`,`userId`);

--
-- Indexes for table `whitelist`
--
ALTER TABLE `whitelist`
  ADD PRIMARY KEY (`steamid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accountability`
--
ALTER TABLE `accountability`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `forms`
--
ALTER TABLE `forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
