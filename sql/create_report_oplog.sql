-- 娃柜日记：举报表 + 管理员操作日志表（批②③）
-- 举报表：用户举报动态/评论/用户，管理员处理（忽略/删除内容/封禁用户）
CREATE TABLE IF NOT EXISTS `report` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '举报ID',
  `type`        VARCHAR(20)  NOT NULL COMMENT '举报类型: dynamic动态/comment评论/user用户',
  `target_id`   BIGINT       NOT NULL COMMENT '被举报对象ID',
  `reporter_id` BIGINT       NOT NULL COMMENT '举报人ID',
  `reason`      VARCHAR(200) DEFAULT NULL COMMENT '举报原因',
  `status`      INT          NOT NULL DEFAULT 0 COMMENT '0待处理 1已处理 2已忽略',
  `handled_by`  BIGINT       DEFAULT NULL COMMENT '处理人(管理员ID)',
  `handled_at`  DATETIME     DEFAULT NULL COMMENT '处理时间',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '举报时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_type_target` (`type`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表';

-- 管理员操作日志表：记录管理员在后台的每一次操作（封禁/删除/处理举报等）
CREATE TABLE IF NOT EXISTS `op_log` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_id`    BIGINT       NOT NULL COMMENT '操作管理员ID',
  `admin_name`  VARCHAR(50)  DEFAULT NULL COMMENT '管理员昵称',
  `action`      VARCHAR(50)  NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50)  DEFAULT NULL COMMENT '操作对象类型',
  `target_id`   BIGINT       DEFAULT NULL COMMENT '操作对象ID',
  `detail`      VARCHAR(300) DEFAULT NULL COMMENT '操作详情',
  `ip`          VARCHAR(50)  DEFAULT NULL COMMENT '操作IP',
  `result`      VARCHAR(20)  DEFAULT NULL COMMENT '操作结果: 成功/失败',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志表';
