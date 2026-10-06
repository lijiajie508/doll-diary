-- 娃柜表（多柜子）
CREATE TABLE IF NOT EXISTS `cabinet` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '娃柜ID',
  `user_id`     BIGINT      NOT NULL COMMENT '所属用户ID',
  `name`        VARCHAR(50) NOT NULL COMMENT '娃柜名称',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='娃柜表';

-- doll 表加所属娃柜字段
ALTER TABLE `doll` ADD COLUMN `cabinet_id` BIGINT NULL COMMENT '所属娃柜ID' AFTER `user_id`;

-- 给已有娃娃的用户建默认柜子，并把现有娃娃归入默认柜
INSERT INTO `cabinet` (`user_id`, `name`)
SELECT DISTINCT `user_id`, '默认柜子'
FROM `doll`
WHERE `user_id` NOT IN (SELECT DISTINCT `user_id` FROM `cabinet`);

UPDATE `doll` d
JOIN `cabinet` c ON c.user_id = d.user_id AND c.name = '默认柜子'
SET d.cabinet_id = c.id
WHERE d.cabinet_id IS NULL;
