-- 娃柜增加可见性：0公开 1仅自己可见
ALTER TABLE `cabinet` ADD COLUMN `visible` TINYINT NOT NULL DEFAULT 0 COMMENT '可见性:0公开,1仅自己可见' AFTER `name`;
