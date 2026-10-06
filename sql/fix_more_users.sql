-- ============================================================
-- 修复：kittyfan/stella 数据挂错账号（Jayus=4 / 123=5）
-- 1. 清理挂错数据 → 2. 重建用户(自增6/7) → 3. 柜子/娃娃/动态/评论/点赞/关注
-- ============================================================

-- 1. 清理挂错的数据
DELETE FROM favorite WHERE dynamic_id IN (7, 8);
DELETE FROM comment  WHERE dynamic_id IN (7, 8);
DELETE FROM dynamic WHERE id IN (7, 8);
DELETE FROM doll     WHERE id BETWEEN 16 AND 26;
DELETE FROM cabinet  WHERE id IN (4, 5, 6);
DELETE FROM follow   WHERE (follower_id = 4 AND followed_id = 2)
                    OR (follower_id = 2 AND followed_id = 4)
                    OR (follower_id = 5 AND followed_id = 3);

-- 2. 重建用户（自增 id：kittyfan=6, stella=7）
INSERT INTO `user` (`username`, `password`, `nickname`, `avatar`, `role`, `status`) VALUES
('kittyfan', '$2a$10$U2PMi.gC3fpt5ngb0Z8ztuhpRT/t2hP2wmpLBFdxlzOSWqFSoNVM2', '凯蒂猫控小K', '/uploads/avatars/avatar_kitty.jpg', 1, 1),
('stella',   '$2a$10$U2PMi.gC3fpt5ngb0Z8ztuhpRT/t2hP2wmpLBFdxlzOSWqFSoNVM2', '星黛露收藏家', '/uploads/avatars/avatar_stella.jpg', 1, 1);

-- 3. 娃柜（kittyfan=6 两个柜子 id 7,8；stella=7 一个柜子 id 9）
INSERT INTO `cabinet` (`user_id`, `name`, `created_at`) VALUES
(6, 'Hello Kitty 收藏', '2026-09-20 10:00:00'),
(6, '粉色限定',        '2026-09-28 15:30:00'),
(7, '星黛露小天地',    '2026-09-25 09:00:00');

-- 4. 娃娃（doll id 27 起；kittyfan 柜7 五只 + 柜8 一只；stella 柜9 五只）
INSERT INTO `doll` (`user_id`, `cabinet_id`, `name`, `type`, `image_url`, `buy_channel`, `description`, `price`, `visible`, `created_at`) VALUES
(6, 7, '经典粉蝴蝶结Kitty', '毛绒玩偶', '/uploads/dolls/kitty_01.jpg', '三丽鸥旗舰店', '粉粉的凯蒂猫，蝴蝶结上都是小心心，初恋款', 69.00, 0, '2026-09-20 10:30:00'),
(6, 7, '50周年纪念款', '毛绒玩偶', '/uploads/dolls/kitty_02.jpg', '三丽鸥旗舰店', '50周年特别版，全身粉色，收藏价值拉满', 129.00, 0, '2026-09-21 11:00:00'),
(6, 7, '坐姿粉裙Kitty', '毛绒玩偶', '/uploads/dolls/kitty_03.jpg', '娃娃机夹到的', '粉裙子坐姿款，娃娃机战利品，超得意', 45.00, 0, '2026-09-22 14:20:00'),
(6, 7, '蕾丝纱裙Kitty', '毛绒玩偶', '/uploads/dolls/kitty_04.jpg', '日本代购', '蕾丝裙摆配蝴蝶胸针，最华丽的一只', 159.00, 0, '2026-09-23 16:45:00'),
(6, 7, '花朵裙Kitty', '毛绒玩偶', '/uploads/dolls/kitty_05.jpg', '三丽鸥旗舰店', '裙子开满小花，温柔到冒泡', 89.00, 0, '2026-09-24 09:10:00'),
(6, 8, '粉上衣坐姿Kitty', '毛绒玩偶', '/uploads/dolls/kitty_06.jpg', '三丽鸥限定', '粉色上衣限定款，腮红特别粉嫩', 99.00, 0, '2026-09-29 13:00:00'),
(7, 9, '生日系列星黛露', '毛绒玩偶', '/uploads/dolls/stella_01.jpg', '上海迪士尼旗舰店', '生日系列，粉蝴蝶结+粉裙子，最甜的一只', 239.00, 0, '2026-09-25 09:30:00'),
(7, 9, '星黛露与达菲对兔', '毛绒玩偶', '/uploads/dolls/stella_02.jpg', '上海迪士尼代购', '和达菲一起收的，姐妹双兔', 328.00, 0, '2026-09-26 10:15:00'),
(7, 9, '青花系列星黛露', '毛绒玩偶', '/uploads/dolls/stella_03.jpg', '上海迪士尼旗舰店', '青花瓷配色，典雅高级款', 268.00, 0, '2026-09-27 15:40:00'),
(7, 9, '春日花朵星黛露', '毛绒玩偶', '/uploads/dolls/stella_04.jpg', '上海迪士尼旗舰店', '春日系列，手里捧着花，元气满满', 199.00, 0, '2026-09-28 12:00:00'),
(7, 9, '迷你挂件星黛露', '毛绒玩偶', '/uploads/dolls/stella_05.jpg', '上海迪士尼旗舰店', '挂包上的小宝贝，天天带出门', 59.00, 0, '2026-09-29 18:20:00');

-- 5. 动态（dynamic id 9,10；kittyfan 关联 doll 27，stella 关联 doll 32）
INSERT INTO `dynamic` (`user_id`, `content`, `images`, `doll_id`, `created_at`) VALUES
(6, 'Hello Kitty 家族集合啦！每一只都是心头好 🎀', '/uploads/dolls/kitty_01.jpg', 27, '2026-10-01 10:00:00'),
(7, '星黛露宝贝们，紫色是世界上最温柔的颜色 💜', '/uploads/dolls/stella_01.jpg', 32, '2026-10-02 19:30:00');

-- 6. 评论（动态 9,10）
INSERT INTO `comment` (`dynamic_id`, `user_id`, `content`, `created_at`) VALUES
(9, 2, 'Kitty 好可爱！想rua', '2026-10-01 10:20:00'),
(9, 3, '三丽鸥yyds，都是限定啊', '2026-10-01 11:05:00'),
(10, 2, '露露好乖～紫色真的温柔', '2026-10-02 19:50:00'),
(10, 3, '紫色控狂喜！青花那只好高级', '2026-10-02 20:30:00');

-- 7. 点赞（动态 9,10）
INSERT INTO `favorite` (`dynamic_id`, `user_id`, `created_at`) VALUES
(9, 2, '2026-10-01 10:15:00'),
(9, 3, '2026-10-01 11:00:00'),
(10, 2, '2026-10-02 19:45:00'),
(10, 3, '2026-10-02 20:10:00');

-- 8. 关注（kittyfan=6 与 dollfan=2 互关；stella=7 关注 catboy=3）
INSERT IGNORE INTO `follow` (`follower_id`, `followed_id`, `created_at`) VALUES
(6, 2, '2026-10-01 10:30:00'),
(2, 6, '2026-10-01 10:31:00'),
(7, 3, '2026-10-02 20:00:00');
