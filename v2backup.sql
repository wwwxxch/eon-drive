-- MySQL dump 10.13  Distrib 8.0.32, for Win64 (x86_64)
--
-- Host: localhost    Database: eondrive
-- ------------------------------------------------------
-- Server version	8.0.32

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

--
-- Table structure for table `ff`
--

DROP TABLE IF EXISTS `ff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ff` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(6) NOT NULL,
  `up_status` varchar(10) NOT NULL,
  `token` varchar(36) DEFAULT NULL,
  `is_delete` tinyint NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  `updated_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ff`
--

LOCK TABLES `ff` WRITE;
/*!40000 ALTER TABLE `ff` DISABLE KEYS */;
INSERT INTO `ff` VALUES (1,'test1.txt','file','done',NULL,0,1681293798573,1681294011037),(2,'test2.txt','file','done',NULL,0,1681293798999,1681293798999),(3,'test3.txt','file','done',NULL,0,1681293799197,1681294131295),(4,'pic','folder','done',NULL,0,1681293819964,1681293819964),(5,'mountain','folder','done',NULL,0,1681293819964,1681293819964),(6,'mountain1.jpg','file','done',NULL,0,1681293819964,1681293819964),(7,'mountain2.jpg','file','done',NULL,0,1681293820489,1681293820489),(8,'mountain3.jpg','file','done',NULL,0,1681293820997,1681293820997),(9,'galaxy','folder','done',NULL,0,1681293833311,1681293833311),(10,'galaxy1.jpg','file','done',NULL,0,1681293849277,1681293849277),(11,'galaxy2.jpg','file','done',NULL,0,1681293849808,1681293849808),(12,'galaxy3.jpg','file','done',NULL,0,1681293850054,1681293850054),(13,'galaxy4.jpg','file','done',NULL,1,1681293850469,1681312783196),(14,'tobedeleted','folder','done',NULL,1,1681294255170,1681294663188),(15,'test1.docx','file','done',NULL,1,1681294266143,1681294553745),(16,'test1.txt','file','done',NULL,1,1681294656333,1681294663188),(17,'note','folder','done',NULL,0,1681309367794,1681309367794),(18,'20230401lecture','folder','done',NULL,0,1681309426701,1681309426701),(19,'temp.txt','file','done',NULL,0,1681309474879,1681309544466),(20,'talk1.txt','file','done',NULL,0,1681309519135,1681311655682),(21,'talk2.txt','file','done',NULL,1,1681309519556,1681312705755),(22,'ocean','folder','done',NULL,0,1681312720358,1681312720358),(23,'ocean1.jpg','file','done',NULL,0,1681312742800,1681312742800),(24,'ocean2.jpg','file','done',NULL,0,1681312743801,1681312743801),(25,'a','folder','done',NULL,1,1681312798778,1681312824668),(26,'test3.txt','file','done',NULL,1,1681312798778,1681312824668),(27,'test4.txt','file','done',NULL,1,1681312799225,1681312824668);
/*!40000 ALTER TABLE `ff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file_ver`
--

DROP TABLE IF EXISTS `file_ver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_ver` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ff_id` bigint unsigned NOT NULL,
  `ver` bigint unsigned NOT NULL,
  `size` bigint unsigned NOT NULL,
  `updated_at` bigint NOT NULL,
  `is_current` tinyint NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `operation` varchar(7) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ff_id` (`ff_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `file_ver_ibfk_1` FOREIGN KEY (`ff_id`) REFERENCES `ff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `file_ver_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_ver`
--

LOCK TABLES `file_ver` WRITE;
/*!40000 ALTER TABLE `file_ver` DISABLE KEYS */;
INSERT INTO `file_ver` VALUES (1,1,1,121,1681293798573,0,1,'create'),(2,2,1,68,1681293798999,1,1,'create'),(3,3,1,27,1681294051808,0,1,'delete'),(4,6,1,55543,1681293819964,1,1,'create'),(5,7,1,255744,1681293820489,1,1,'create'),(6,8,1,118173,1681293820997,1,1,'create'),(7,10,1,128489,1681293849277,1,1,'create'),(8,11,1,102520,1681293849808,1,1,'create'),(9,12,1,172595,1681293850054,1,1,'create'),(10,13,1,204823,1681312783196,1,1,'delete'),(11,1,2,137,1681294011037,1,1,'update'),(12,3,2,42,1681294131295,1,1,'update'),(13,15,1,12319,1681294553745,1,1,'delete'),(14,16,1,137,1681294663188,1,1,'delete'),(15,19,1,3,1681309474879,0,1,'create'),(16,20,1,0,1681309519135,0,1,'create'),(17,21,1,0,1681312705755,1,1,'delete'),(18,19,2,8,1681309544466,1,1,'update'),(19,20,2,5,1681311635660,0,1,'update'),(20,20,3,21,1681311655682,1,1,'update'),(21,23,1,227866,1681312742800,1,1,'create'),(22,24,1,157935,1681312743801,1,1,'create'),(23,26,1,20,1681312824668,1,1,'delete'),(24,27,1,5,1681312824668,1,1,'delete');
/*!40000 ALTER TABLE `file_ver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hier`
--

DROP TABLE IF EXISTS `hier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hier` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ff_id` bigint unsigned NOT NULL,
  `parent_id` bigint unsigned NOT NULL DEFAULT '0',
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ff_id` (`ff_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `hier_ibfk_1` FOREIGN KEY (`ff_id`) REFERENCES `ff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hier_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hier`
--

LOCK TABLES `hier` WRITE;
/*!40000 ALTER TABLE `hier` DISABLE KEYS */;
INSERT INTO `hier` VALUES (1,1,0,1),(2,2,0,1),(3,3,0,1),(4,4,0,1),(5,5,4,1),(6,6,5,1),(7,7,5,1),(8,8,5,1),(9,9,4,1),(10,10,9,1),(11,11,9,1),(12,12,9,1),(13,13,9,1),(14,14,4,1),(15,15,14,1),(16,16,14,1),(17,17,0,1),(18,18,17,1),(19,19,17,1),(20,20,18,1),(21,21,18,1),(22,22,4,1),(23,23,22,1),(24,24,22,1),(25,25,0,1),(26,26,25,1),(27,27,25,1);
/*!40000 ALTER TABLE `hier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perm`
--

DROP TABLE IF EXISTS `perm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perm` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ff_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `auth` varchar(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ff_id` (`ff_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `perm_ibfk_1` FOREIGN KEY (`ff_id`) REFERENCES `ff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `perm_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perm`
--

LOCK TABLES `perm` WRITE;
/*!40000 ALTER TABLE `perm` DISABLE KEYS */;
INSERT INTO `perm` VALUES (1,1,1,'owner'),(2,2,1,'owner'),(3,3,1,'owner'),(4,4,1,'owner'),(5,5,1,'owner'),(6,6,1,'owner'),(7,7,1,'owner'),(8,8,1,'owner'),(9,9,1,'owner'),(10,10,1,'owner'),(11,11,1,'owner'),(12,12,1,'owner'),(13,13,1,'owner'),(14,14,1,'owner'),(15,15,1,'owner'),(16,16,1,'owner'),(17,17,1,'owner'),(18,18,1,'owner'),(19,19,1,'owner'),(20,20,1,'owner'),(21,21,1,'owner'),(22,22,1,'owner'),(23,23,1,'owner'),(24,24,1,'owner'),(25,25,1,'owner'),(26,26,1,'owner'),(27,27,1,'owner');
/*!40000 ALTER TABLE `perm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `share_link`
--

DROP TABLE IF EXISTS `share_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `share_link` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ff_id` bigint unsigned NOT NULL,
  `short_url` varchar(15) COLLATE utf8mb4_0900_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `short_url` (`short_url`),
  KEY `ff_id` (`ff_id`),
  CONSTRAINT `share_link_ibfk_1` FOREIGN KEY (`ff_id`) REFERENCES `ff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `share_link`
--

LOCK TABLES `share_link` WRITE;
/*!40000 ALTER TABLE `share_link` DISABLE KEYS */;
/*!40000 ALTER TABLE `share_link` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_0900_bin NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_0900_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_0900_bin NOT NULL,
  `plan` tinyint unsigned NOT NULL,
  `allocated` bigint unsigned NOT NULL,
  `used` bigint unsigned NOT NULL,
  `created_at` bigint NOT NULL,
  `updated_at` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'test1@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$e/g+kN40Vwhixh3LdoRGwA$ZMvjSm2P+BDrJJQLF+QGtv3wEf95knEVMuy3BoBmq+Y','test1',1,52428800,1219141,1681293685860,1681312824668);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-04-12 23:34:23
