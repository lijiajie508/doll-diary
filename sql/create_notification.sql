CREATE TABLE IF NOT EXISTS `notification` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `user_id`     BIGINT      NOT NULL COMMENT '接收者ID',
  `type`        VARCHAR(20) NOT NULL COMMENT '类型:follow/like/comment',
  `actor_id`    BIGINT      NOT NULL COMMENT '触发者ID',
  `dynamic_id`  BIGINT      DEFAULT NULL COMMENT '关联动态ID(可空)',
  `is_read`     TINYINT     NOT NULL DEFAULT 0 COMMENT '0未读,1已读',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';
