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
  `parent_id` bigint unsigned NOT NULL DEFAULT '0',
  `name` varchar(255) COLLATE utf8mb4_0900_bin NOT NULL,
  `type` varchar(6) COLLATE utf8mb4_0900_bin NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `upd_status` varchar(10) COLLATE utf8mb4_0900_bin NOT NULL,
  `upd_token` varchar(36) COLLATE utf8mb4_0900_bin DEFAULT NULL,
  `is_delete` tinyint NOT NULL DEFAULT '0',
  `share_token` varchar(15) COLLATE utf8mb4_0900_bin DEFAULT NULL,
  `is_public` tinyint NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  `updated_at` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `share_token` (`share_token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ff`
--

LOCK TABLES `ff` WRITE;
/*!40000 ALTER TABLE `ff` DISABLE KEYS */;
INSERT INTO `ff` VALUES (3,0,'pic','folder',4,'done',NULL,0,NULL,0,1681534567733,1681534567733),(4,0,'migration.xlsx','file',4,'done',NULL,0,NULL,0,1681534634878,1681534634878),(5,3,'mountain','folder',4,'done',NULL,0,'Nx7VjsMa4ovGTxV',0,1681534673316,1681534673316),(6,3,'ocean','folder',4,'done',NULL,0,NULL,0,1681534680927,1681534680927),(7,5,'mountain1.jpg','file',4,'done',NULL,0,NULL,0,1681534693472,1681534693472),(8,5,'mountain2.jpg','file',4,'done',NULL,0,NULL,0,1681534694129,1681534694129),(9,5,'mountain3.jpg','file',4,'done',NULL,0,NULL,0,1681534694801,1681654147416),(10,6,'ocean1.jpg','file',4,'done',NULL,0,'2h4ZN5b1X53P66u',0,1681534716059,1681534716059),(11,6,'ocean2.jpg','file',4,'done',NULL,0,NULL,0,1681534716982,1681534716982),(12,3,'beach','folder',4,'done',NULL,0,NULL,0,1681534773293,1681534773293),(13,12,'beach1.jpg','file',4,'done',NULL,0,NULL,0,1681534773293,1681534773293),(14,12,'beach2.jpg','file',4,'done',NULL,0,NULL,0,1681534774116,1681534774116),(15,12,'beach3.jpg','file',4,'done',NULL,0,NULL,0,1681534775655,1681534775655),(18,0,'paper','folder',4,'done',NULL,1,NULL,0,1681535126248,1681538167348),(19,18,'Alcohol','folder',4,'done',NULL,1,NULL,0,1681535194934,1681538167348),(24,0,'note','folder',4,'done',NULL,0,'0UT2Nz1dOSZGsGo',1,1681535664916,1681535664916),(25,24,'test1.txt','file',4,'done',NULL,0,'VpvEtfBvjqQuKyK',0,1681535729065,1681641287856),(26,24,'test2.txt','file',4,'done',NULL,0,NULL,0,1681535729701,1681535729701),(27,24,'test3.txt','file',4,'done',NULL,0,NULL,0,1681535729946,1681661453278),(28,24,'linked-list','folder',4,'done',NULL,0,NULL,0,1681535865869,1681535865869),(29,28,'LinkedList.js','file',4,'done',NULL,0,NULL,0,1681535865869,1681653045311),(30,24,'deepcopy','folder',4,'done',NULL,0,NULL,0,1681535874033,1681535874033),(31,30,'lodash.js','file',4,'done',NULL,0,'ZSsolMdIST7NqOv',1,1681535874033,1681535874033),(32,30,'shallowCopy.js','file',4,'done',NULL,0,NULL,0,1681535874472,1681535874472),(33,24,'array','folder',4,'done',NULL,0,NULL,0,1681535880061,1681537475152),(34,33,'flat.js','file',4,'done',NULL,0,'jqw6WqqTQSvvygU',1,1681535880061,1681537475152),(35,33,'map.js','file',4,'done',NULL,0,NULL,0,1681535880302,1681537475152),(36,33,'slice.js','file',4,'done',NULL,0,NULL,0,1681535880534,1681537475152),(37,24,'b','folder',4,'done',NULL,1,NULL,0,1681537960632,1681537972323),(38,37,'abc.txt','file',4,'done',NULL,1,NULL,0,1681537960632,1681537972323),(39,37,'efg.txt','file',4,'done',NULL,1,NULL,0,1681537961086,1681537972323),(40,37,'bb','folder',4,'done',NULL,1,NULL,0,1681537961325,1681537972323),(41,40,'bb_abc.txt','file',4,'done',NULL,1,NULL,0,1681537961325,1681537972323),(42,40,'bb_edf.txt','file',4,'done',NULL,1,NULL,0,1681537961554,1681537972323),(43,40,'bbb','folder',4,'done',NULL,1,NULL,0,1681537961783,1681537972323),(44,43,'bbb_abc.txt','file',4,'done',NULL,1,NULL,0,1681537961783,1681537972323),(45,43,'bbb_edf.txt','file',4,'done',NULL,1,NULL,0,1681537962009,1681537972323),(46,0,'wallpaper-1252869.jpg','file',4,'done',NULL,0,NULL,0,1681538017689,1681538017689),(47,12,'beach4.jpg','file',4,'done',NULL,0,NULL,0,1681632776043,1681654084274),(48,12,'beach5.jpg','file',4,'done',NULL,0,NULL,0,1681632870200,1681654084274),(49,3,'galaxy','folder',4,'done',NULL,0,NULL,0,1681633089402,1681633089402),(50,49,'galaxy1.jpg','file',4,'done',NULL,0,NULL,0,1681633089402,1681633089402),(51,49,'galaxy2.jpg','file',4,'done',NULL,0,NULL,0,1681633090479,1681633090479),(52,24,'algorithm','folder',4,'done',NULL,0,NULL,0,1681634878407,1681634878407),(53,0,'doc','folder',4,'done',NULL,0,NULL,0,1681661507980,1681661507980),(54,53,'a.txt','file',4,'done',NULL,0,NULL,0,1681661545664,1681661545664),(55,53,'b.txt','file',4,'done',NULL,0,NULL,0,1681661546204,1681661546204),(56,53,'c.txt','file',4,'done',NULL,0,NULL,0,1681661583071,1681661803589);
/*!40000 ALTER TABLE `ff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ff_delete`
--

DROP TABLE IF EXISTS `ff_delete`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ff_delete` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ff_id` bigint unsigned NOT NULL,
  `deleted_at` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ff_id` (`ff_id`),
  CONSTRAINT `ff_delete_ibfk_1` FOREIGN KEY (`ff_id`) REFERENCES `ff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ff_delete`
--

LOCK TABLES `ff_delete` WRITE;
/*!40000 ALTER TABLE `ff_delete` DISABLE KEYS */;
INSERT INTO `ff_delete` VALUES (2,27,1681537087734),(3,34,1681537454657),(4,35,1681537454657),(5,36,1681537454657),(6,33,1681537454657),(7,25,1681537700209),(8,27,1681537728934),(9,38,1681537972323),(10,39,1681537972323),(11,41,1681537972323),(12,42,1681537972323),(13,44,1681537972323),(14,45,1681537972323),(15,43,1681537972323),(16,40,1681537972323),(17,37,1681537972323),(18,19,1681538167348),(19,18,1681538167348),(20,47,1681636517284),(21,48,1681636517284),(22,9,1681642327897),(23,56,1681661597032);
/*!40000 ALTER TABLE `ff_delete` ENABLE KEYS */;
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
  `is_current` tinyint NOT NULL,
  `updated_at` bigint NOT NULL,
  `operation` varchar(8) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ff_id` (`ff_id`),
  CONSTRAINT `file_ver_ibfk_1` FOREIGN KEY (`ff_id`) REFERENCES `ff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_ver`
--

LOCK TABLES `file_ver` WRITE;
/*!40000 ALTER TABLE `file_ver` DISABLE KEYS */;
INSERT INTO `file_ver` VALUES (1,4,1,10290,1,1681534634878,'added'),(2,7,1,55543,1,1681534693472,'added'),(3,8,1,255744,1,1681534694129,'added'),(4,9,1,118173,0,1681534694801,'added'),(5,10,1,227866,1,1681534716059,'added'),(6,11,1,157935,1,1681534716982,'added'),(7,13,1,238078,1,1681534773293,'added'),(8,14,1,782879,1,1681534774116,'added'),(9,15,1,225793,1,1681534775655,'added'),(14,25,1,152,0,1681535729065,'added'),(15,26,1,68,1,1681535729701,'added'),(16,27,1,42,0,1681535729946,'added'),(17,29,1,1733,0,1681535865869,'added'),(18,31,1,493,1,1681535874033,'added'),(19,32,1,181,1,1681535874472,'added'),(20,34,1,461,0,1681535880061,'added'),(21,35,1,3508,0,1681535880302,'added'),(22,36,1,181,0,1681535880534,'added'),(23,25,2,13,0,1681535976146,'updated'),(24,34,2,461,1,1681537475152,'restore'),(25,35,2,3508,1,1681537475152,'restore'),(26,36,2,181,1,1681537475152,'restore'),(27,25,3,28,0,1681537544953,'updated'),(28,25,4,43,0,1681537670200,'updated'),(29,27,2,42,0,1681537706281,'restore'),(30,25,5,43,0,1681537717811,'restore'),(31,38,1,3,1,1681537960632,'added'),(32,39,1,3,1,1681537961086,'added'),(33,41,1,3,1,1681537961325,'added'),(34,42,1,3,1,1681537961554,'added'),(35,44,1,3,1,1681537961783,'added'),(36,45,1,3,1,1681537962009,'added'),(37,46,1,7214054,1,1681538017689,'added'),(38,47,1,401955,0,1681632776043,'added'),(39,48,1,705049,0,1681632870200,'added'),(40,50,1,128489,1,1681633089402,'added'),(41,51,1,102520,1,1681633090479,'added'),(42,25,6,152,1,1681641287856,'restored'),(43,29,2,1754,0,1681652949096,'updated'),(44,29,3,1733,0,1681652964771,'restored'),(45,29,4,1754,1,1681653045311,'restored'),(46,47,2,401955,1,1681654084274,'restore'),(47,48,2,705049,1,1681654084274,'restore'),(48,9,2,118173,1,1681654147416,'restore'),(49,27,3,42,1,1681661453278,'added'),(50,54,1,7,1,1681661545664,'added'),(51,55,1,1,1,1681661546204,'added'),(52,56,1,5,0,1681661583071,'added'),(53,56,2,5,1,1681661803589,'restore');
/*!40000 ALTER TABLE `file_ver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `share_link_perm`
--

DROP TABLE IF EXISTS `share_link_perm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `share_link_perm` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ff_id` bigint unsigned NOT NULL,
  `has_access` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ff_id` (`ff_id`),
  KEY `has_access` (`has_access`),
  CONSTRAINT `share_link_perm_ibfk_1` FOREIGN KEY (`ff_id`) REFERENCES `ff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `share_link_perm_ibfk_2` FOREIGN KEY (`has_access`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `share_link_perm`
--

LOCK TABLES `share_link_perm` WRITE;
/*!40000 ALTER TABLE `share_link_perm` DISABLE KEYS */;
INSERT INTO `share_link_perm` VALUES (3,5,5),(4,5,6),(5,5,7),(7,10,6),(8,25,5);
/*!40000 ALTER TABLE `share_link_perm` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'noused','noused','noused',1,0,0,0,0),(3,'noused2','noused','noused',1,0,0,0,0),(4,'test1@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$6kDAwAYXXITkM8ycaSht6g$zMjD6AvHYxPkpWvKkIjS4IYh+4/hNa6iQsng0Qb8UMM','test',1,52428800,10631216,1681534202266,1681661597032),(5,'test2@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$pW5Vaw9HCtnb/5kH70mSJw$k3ykPUj9xvZnjjj6KWvN+ZyeV4P+1bIe2eHK17AAY3A','test2',1,52428800,0,1681546408477,1681546408477),(6,'test3@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$MhEipaHxArBv2kOXbw0ofQ$uQ92mAj71QmxhZk0xQsnIdFhK6uHZTrzsj1wlBgqM7c','test3',1,52428800,0,1681546415877,1681546415877),(7,'test4@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$xqPkl+raLcHZrzdIukrdOQ$jbm1zkXKCaKVMFfj63Fc1ZnC/rQJ8lZyWlmKZmpdhmA','test4',1,52428800,0,1681550931583,1681550931583),(8,'test5@gmail.com','$argon2id$v=19$m=65536,t=3,p=4$tEN3SJTJ0hvLREtjkwjMyA$Aem13iTq6pwY46qvFox/LpIGsV22ZlWm3tvPlTYMKuo','test5',1,52428800,0,1681551431456,1681551431456);
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

-- Dump completed on 2023-04-17 10:22:49
