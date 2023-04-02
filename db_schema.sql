-- CREATE TABLE files (
--   file_id INT AUTO_INCREMENT PRIMARY KEY,
--   user_id INT,
--   file_name VARCHAR(255),
--   file_size BIGINT,
--   file_type VARCHAR(255),
--   file_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   file_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   file_hash VARCHAR(255),
--   chunk_order INT,
--   chunk_hash VARCHAR(255)
-- );

CREATE TABLE file (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  size BIGINT UNSIGNED , 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
);


-- CREATE TABLE server_file_journal (
--   id BIGINT UNSIGNED,
--   filename varchar(255),
--   casepath varchar(255),
--   latest tinyint(1),
--   ns_id int(10) UNSIGNED,
--   PRIMARY KEY (id)
-- );


