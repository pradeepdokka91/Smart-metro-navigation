-- MySQL dump 10.13  Distrib 9.7.1, for macos26.4 (arm64)
--
-- Host: localhost    Database: metro_db
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '20bfcb54-7e89-11f1-ae38-6b0dfccc08c3:1-37';

--
-- Table structure for table `connections`
--

DROP TABLE IF EXISTS `connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `connections` (
  `connection_id` bigint NOT NULL AUTO_INCREMENT,
  `source_station_id` bigint NOT NULL,
  `destination_station_id` bigint NOT NULL,
  `distance` double DEFAULT NULL,
  `travel_time` int DEFAULT NULL,
  `fare` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`connection_id`),
  UNIQUE KEY `unique_connection` (`source_station_id`,`destination_station_id`),
  KEY `destination_station_id` (`destination_station_id`),
  KEY `idx_source_destination` (`source_station_id`,`destination_station_id`),
  CONSTRAINT `connections_ibfk_1` FOREIGN KEY (`source_station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  CONSTRAINT `connections_ibfk_2` FOREIGN KEY (`destination_station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `connections`
--

LOCK TABLES `connections` WRITE;
/*!40000 ALTER TABLE `connections` DISABLE KEYS */;
/*!40000 ALTER TABLE `connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favourite_routes`
--

DROP TABLE IF EXISTS `favourite_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favourite_routes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `source_station` varchar(100) DEFAULT NULL,
  `destination_station` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_favourite` (`user_id`,`source_station`,`destination_station`),
  CONSTRAINT `favourite_routes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favourite_routes`
--

LOCK TABLES `favourite_routes` WRITE;
/*!40000 ALTER TABLE `favourite_routes` DISABLE KEYS */;
/*!40000 ALTER TABLE `favourite_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journeys`
--

DROP TABLE IF EXISTS `journeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journeys` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `start_station` varchar(255) NOT NULL,
  `destination_station` varchar(255) NOT NULL,
  `priority` varchar(50) NOT NULL,
  `route` text NOT NULL,
  `travel_time` int NOT NULL,
  `fare` int NOT NULL,
  `changes` int NOT NULL,
  `delay_minutes` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_journeys_user` (`user_id`),
  CONSTRAINT `fk_journeys_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journeys`
--

LOCK TABLES `journeys` WRITE;
/*!40000 ALTER TABLE `journeys` DISABLE KEYS */;
/*!40000 ALTER TABLE `journeys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_otps`
--

DROP TABLE IF EXISTS `password_reset_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` bigint NOT NULL,
  `attempts` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_otps`
--

LOCK TABLES `password_reset_otps` WRITE;
/*!40000 ALTER TABLE `password_reset_otps` DISABLE KEYS */;
INSERT INTO `password_reset_otps` VALUES (3,'harshithdshine611@gmail.com','4675bc877227fa38a015bbad84e113bcdf6268da3bcdbb1d65ba29bdce17a783',1784368891540,0,'2026-07-18 09:51:31');
/*!40000 ALTER TABLE `password_reset_otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `search_history`
--

DROP TABLE IF EXISTS `search_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `search_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `source_station` varchar(100) DEFAULT NULL,
  `destination_station` varchar(100) DEFAULT NULL,
  `search_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_search` (`user_id`,`search_date`),
  CONSTRAINT `search_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `search_history`
--

LOCK TABLES `search_history` WRITE;
/*!40000 ALTER TABLE `search_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `search_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stations`
--

DROP TABLE IF EXISTS `stations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stations` (
  `station_id` bigint NOT NULL AUTO_INCREMENT,
  `station_name` varchar(100) NOT NULL,
  `metro_line` varchar(50) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`station_id`),
  UNIQUE KEY `station_name` (`station_name`),
  KEY `idx_station_name` (`station_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stations`
--

LOCK TABLES `stations` WRITE;
/*!40000 ALTER TABLE `stations` DISABLE KEYS */;
INSERT INTO `stations` VALUES (1,'Airport','Red Line',28.5556,77.1,'2026-07-13 07:06:48','2026-07-13 07:06:48'),(2,'Central Plaza','Red Line',28.6139,77.209,'2026-07-13 07:06:48','2026-07-13 07:06:48'),(3,'City Mall','Blue Line',28.619,77.21,'2026-07-13 07:06:48','2026-07-13 07:06:48'),(4,'Tech Park','Blue Line',28.63,77.22,'2026-07-13 07:06:48','2026-07-13 07:06:48'),(5,'Railway Station','Green Line',28.64,77.23,'2026-07-13 07:06:48','2026-07-13 07:06:48'),(6,'Bus Terminal','Green Line',28.65,77.24,'2026-07-13 07:06:48','2026-07-13 07:06:48');
/*!40000 ALTER TABLE `stations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_code` varchar(50) NOT NULL,
  `user_id` bigint NOT NULL,
  `passenger_name` varchar(255) NOT NULL,
  `travel_date` date NOT NULL,
  `coach_preference` varchar(100) NOT NULL,
  `start_station` varchar(255) NOT NULL,
  `destination_station` varchar(255) NOT NULL,
  `priority` varchar(50) NOT NULL,
  `route` text NOT NULL,
  `travel_time` int NOT NULL,
  `fare` int NOT NULL,
  `changes` int NOT NULL,
  `status` varchar(50) DEFAULT 'Booked',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_code` (`booking_code`),
  KEY `fk_tickets_user` (`user_id`),
  CONSTRAINT `fk_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('USER','ADMIN') DEFAULT 'USER',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@metro.com',NULL,'$2a$10$YourHashedPassword','ADMIN','2026-07-13 07:06:48','2026-07-13 07:06:48'),(3,'lakshmi','dokkalakshmi50@gmail.com',NULL,'92a59e2900986b0b4af2db80949a5822:a60841996fff2ce89e15f37c7b58e34f5b620d4eb743a4b14c7f7aa2faeb98f3076888f13ab53f8c580f6dc6f5d8b835181cbfbd80760435772e91cb579beb43','USER','2026-07-18 09:26:43','2026-07-18 09:44:10'),(4,'Pradeepteja','pradeepdokka91@gmail.com',NULL,'1b38bad1a4751ed88724553b80cb0cdd:70079f66b25ca9b40ad9034978f89b399724bbb31a32191e4c668836d9ea15471861a20982a29d796a89ff44f58086504d5372cdff031a1f5ba40164b345c8d9','USER','2026-07-18 09:45:29','2026-07-18 09:45:29'),(5,'Harshith','harshithdshine611@gmail.com',NULL,'e86d892fbfa754f5c936061efa6bec89:1b948381d425ce1ee4e72bf5e15bf52066423208c3ef60b502581ba9baa68ad0ac61324aeb95314864ab1b9bc9b8935e5f4a6e5d1ea249877459e3834084d391','USER','2026-07-18 09:51:08','2026-07-18 09:51:08');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-19  4:49:29
