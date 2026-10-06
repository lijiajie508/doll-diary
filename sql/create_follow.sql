CREATE TABLE IF NOT EXISTS `follow` (
  `id`          BIGINT   NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `follower_id` BIGINT   NOT NULL COMMENT '关注者ID',
  `followed_id` BIGINT   NOT NULL COMMENT '被关注者ID',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follower_followed` (`follower_id`, `followed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关注表';

SHOW TABLES LIKE 'follow';
DESCRIBE `follow`;
