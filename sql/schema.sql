-- ============================================================
-- 娃柜日记（娃柜日记）建表脚本
-- 数据库：MySQL 8
-- 运行方式：新建数据库 doll_share，编码 utf8mb4，然后执行本文件
-- ============================================================

CREATE DATABASE IF NOT EXISTS doll_share DEFAULT CHARACTER SET utf8mb4;
USE doll_share;

-- ----------------------------
-- 1. 用户表
-- role: 1=普通用户, 2=管理员
-- ----------------------------
CREATE TABLE `user` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`    VARCHAR(50)  NOT NULL COMMENT '用户名(登录用)',
  `password`    VARCHAR(100) NOT NULL COMMENT '密码(实际应存BCrypt加密)',
  `nickname`    VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
  `avatar`      VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `role`        TINYINT      NOT NULL DEFAULT 1 COMMENT '角色:1用户,2管理员',
  `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态:1正常,0封禁',
  `intro`       VARCHAR(200) DEFAULT NULL COMMENT '个人简介',
  `bg_image`    VARCHAR(255) DEFAULT NULL COMMENT '主页背景图URL',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ----------------------------
-- 2. 动态表（首页信息流，类似朋友圈）
-- ----------------------------
CREATE TABLE `dynamic` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '动态ID',
  `user_id`     BIGINT       NOT NULL COMMENT '发布者ID',
  `content`     VARCHAR(500) DEFAULT NULL COMMENT '文案',
  `images`      VARCHAR(1000) DEFAULT NULL COMMENT '图片URL,多张用逗号分隔',
  `doll_id`     BIGINT       DEFAULT NULL COMMENT '关联的柜中娃娃ID(可空)',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态表';

-- ----------------------------
-- 3. 展示柜娃娃表（个人收藏/购入的娃娃）
-- ----------------------------
CREATE TABLE `doll` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '娃娃ID',
  `user_id`     BIGINT       NOT NULL COMMENT '所属用户ID',
  `cabinet_id`  BIGINT       DEFAULT NULL COMMENT '所属娃柜ID',
  `name`        VARCHAR(50)  NOT NULL COMMENT '娃娃名字',
  `type`        VARCHAR(30)  DEFAULT NULL COMMENT '种类(如BJD/棉花娃/毛绒)',
  `image_url`   VARCHAR(255) DEFAULT NULL COMMENT '娃娃图片URL',
  `buy_channel` VARCHAR(100) DEFAULT NULL COMMENT '购入渠道',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '介绍/故事',
  `price`       DECIMAL(10,2) DEFAULT NULL COMMENT '价格(元)',
  `visible`     TINYINT      NOT NULL DEFAULT 0 COMMENT '可见性:0公开,1仅自己可见',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='展示柜娃娃表';

-- ----------------------------
-- 3.1 娃柜表（一个用户可以建多个柜子）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `cabinet` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '娃柜ID',
  `user_id`     BIGINT      NOT NULL COMMENT '所属用户ID',
  `name`        VARCHAR(50) NOT NULL COMMENT '娃柜名称',
  `visible`     TINYINT     NOT NULL DEFAULT 0 COMMENT '可见性:0公开,1仅自己可见',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='娃柜表';

-- ----------------------------
-- 4. 评论表
-- ----------------------------
CREATE TABLE `comment` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `dynamic_id`  BIGINT       NOT NULL COMMENT '所属动态ID',
  `user_id`     BIGINT       NOT NULL COMMENT '评论者ID',
  `content`     VARCHAR(300) NOT NULL COMMENT '评论内容',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
  PRIMARY KEY (`id`),
  KEY `idx_dynamic` (`dynamic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- ----------------------------
-- 5. 点赞表（赞动态）
-- ----------------------------
CREATE TABLE `favorite` (
  `id`          BIGINT   NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `dynamic_id`  BIGINT   NOT NULL COMMENT '动态ID',
  `user_id`     BIGINT   NOT NULL COMMENT '点赞用户ID',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dy_user` (`dynamic_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞表';

-- ----------------------------
-- 6. 关注表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `follow` (
  `id`          BIGINT   NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `follower_id` BIGINT   NOT NULL COMMENT '关注者ID',
  `followed_id` BIGINT   NOT NULL COMMENT '被关注者ID',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follower_followed` (`follower_id`, `followed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关注表';

-- ----------------------------
-- 7. 通知表（被关注/点赞/评论提醒）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `notification` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id`     BIGINT       NOT NULL COMMENT '接收者ID',
  `actor_id`    BIGINT       DEFAULT NULL COMMENT '触发者ID',
  `type`        VARCHAR(20)  NOT NULL COMMENT '类型:follow/like/comment',
  `target_id`   BIGINT       DEFAULT NULL COMMENT '关联对象ID(动态/评论等)',
  `content`     VARCHAR(300) DEFAULT NULL COMMENT '通知文案',
  `is_read`     TINYINT      NOT NULL DEFAULT 0 COMMENT '是否已读:0未读,1已读',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';

-- ----------------------------
-- 8. 私信表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `message` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `from_id`     BIGINT       NOT NULL COMMENT '发送者ID',
  `to_id`       BIGINT       NOT NULL COMMENT '接收者ID',
  `content`     VARCHAR(500) NOT NULL COMMENT '内容',
  `is_read`     TINYINT      NOT NULL DEFAULT 0 COMMENT '是否已读:0未读,1已读',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '时间',
  PRIMARY KEY (`id`),
  KEY `idx_from_to` (`from_id`, `to_id`),
  KEY `idx_to` (`to_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信表';

-- ----------------------------
-- 测试数据（密码均为 123456，已用BCrypt加密）
-- 注意：如果是从旧版本升级，请重新执行本脚本或删除旧用户重新注册
-- ----------------------------
INSERT INTO `user` (`username`, `password`, `nickname`, `role`) VALUES
('admin', '$2a$10$U2PMi.gC3fpt5ngb0Z8ztuhpRT/t2hP2wmpLBFdxlzOSWqFSoNVM2', '管理员', 2),
('dollfan', '$2a$10$U2PMi.gC3fpt5ngb0Z8ztuhpRT/t2hP2wmpLBFdxlzOSWqFSoNVM2', '娃娃控小美', 1),
('catboy', '$2a$10$U2PMi.gC3fpt5ngb0Z8ztuhpRT/t2hP2wmpLBFdxlzOSWqFSoNVM2', '棉花娃收藏家', 1);

INSERT INTO `doll` (`user_id`, `name`, `type`, `buy_channel`, `description`) VALUES
(2, '奶糖', '棉花娃娃', '娃衣店', '我的第一只娃娃，超软'),
(2, '小野', 'BJD', '官店', '六分娃，气质高冷'),
(3, '团子', '毛绒玩偶', '线下店', '陪睡必备');

INSERT INTO `dynamic` (`user_id`, `content`, `doll_id`) VALUES
(2, '今天新入的奶糖，太可爱了！', 1),
(3, '团子出门散步啦', 3);
