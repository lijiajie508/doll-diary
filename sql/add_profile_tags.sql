-- 第一批：个人资料 + 话题标签 字段
ALTER TABLE `user` ADD COLUMN `intro` VARCHAR(200) DEFAULT NULL COMMENT '个人简介' AFTER `avatar`;
ALTER TABLE `user` ADD COLUMN `bg_image` VARCHAR(255) DEFAULT NULL COMMENT '主页背景图URL' AFTER `intro`;
ALTER TABLE `dynamic` ADD COLUMN `tags` VARCHAR(255) DEFAULT NULL COMMENT '话题标签,逗号分隔' AFTER `doll_id`;
