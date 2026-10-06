CREATE TABLE IF NOT EXISTS `message` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `sender_id`   BIGINT       NOT NULL COMMENT '发送者ID',
  `receiver_id` BIGINT       NOT NULL COMMENT '接收者ID',
  `content`     VARCHAR(500) NOT NULL COMMENT '消息内容',
  `is_read`     TINYINT      NOT NULL DEFAULT 0 COMMENT '0未读,1已读',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`),
  KEY `idx_pair` (`sender_id`, `receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信表';
