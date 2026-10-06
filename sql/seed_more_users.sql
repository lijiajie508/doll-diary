-- ============================================================
-- 娃柜日记 新增用户与数据（HelloKitty / 星黛露）
-- 用户: kittyfan(id=4) / stella(id=5)，密码均 123456
-- 注意: 仅执行一次；重复执行 user 会被忽略，但动态/娃娃会重复
-- ============================================================

-- 1. 新用户（密码 BCrypt: 123456）
INSERT IGNORE INTO `user` (`id`, `username`, `password`, `nickname`, `avatar`, `role`, `status`) VALUES
(4, 'kittyfan', '$2a$10$U2PMi.gC3fpt5ngb0Z8ztuhpRT/t2hP2wmpLBFdxlzOSWqFSoNVM2', '凯蒂猫控小K', '/uploads/avatars/avatar_kitty.jpg', 1, 1),
(5, 'stella',  '$2a$10$U2PMi.gC3fpt5ngb0Z8ztuhpRT/t2hP2wmpLBFdxlzOSWqFSoNVM2', '星黛露收藏家', '/uploads/avatars/avatar_stella.jpg', 1, 1);

-- 2. 娃柜（kittyfan 2个柜子，stella 1个柜子）
INSERT INTO `cabinet` (`user_id`, `name`, `created_at`) VALUES
(4, 'Hello Kitty 收藏', '2026-09-20 10:00:00'),
(4, '粉色限定',        '2026-09-28 15:30:00'),
(5, '星黛露小天地',    '2026-09-25 09:00:00');

-- 3. 娃娃（kittyfan: 柜3 五只 + 柜4 一只；stella: 柜5 五只）
INSERT INTO `doll` (`user_id`, `cabinet_id`, `name`, `type`, `image_url`, `buy_channel`, `description`, `price`, `visible`, `created_at`) VALUES
(4, 3, '经典粉蝴蝶结Kitty', '毛绒玩偶', '/uploads/dolls/kitty_01.jpg', '三丽鸥旗舰店', '粉粉的凯蒂猫，蝴蝶结上都是小心心，初恋款', 69.00, 0, '2026-09-20 10:30:00'),
(4, 3, '50周年纪念款', '毛绒玩偶', '/uploads/dolls/kitty_02.jpg', '三丽鸥旗舰店', '50周年特别版，全身粉色，收藏价值拉满', 129.00, 0, '2026-09-21 11:00:00'),
(4, 3, '坐姿粉裙Kitty', '毛绒玩偶', '/uploads/dolls/kitty_03.jpg', '娃娃机夹到的', '粉裙子坐姿款，娃娃机战利品，超得意', 45.00, 0, '2026-09-22 14:20:00'),
(4, 3, '蕾丝纱裙Kitty', '毛绒玩偶', '/uploads/dolls/kitty_04.jpg', '日本代购', '蕾丝裙摆配蝴蝶胸针，最华丽的一只', 159.00, 0, '2026-09-23 16:45:00'),
(4, 3, '花朵裙Kitty', '毛绒玩偶', '/uploads/dolls/kitty_05.jpg', '三丽鸥旗舰店', '裙子开满小花，温柔到冒泡', 89.00, 0, '2026-09-24 09:10:00'),
(4, 4, '粉上衣坐姿Kitty', '毛绒玩偶', '/uploads/dolls/kitty_06.jpg', '三丽鸥限定', '粉色上衣限定款，腮红特别粉嫩', 99.00, 0, '2026-09-29 13:00:00'),
(5, 5, '生日系列星黛露', '毛绒玩偶', '/uploads/dolls/stella_01.jpg', '上海迪士尼旗舰店', '生日系列，粉蝴蝶结+粉裙子，最甜的一只', 239.00, 0, '2026-09-25 09:30:00'),
(5, 5, '星黛露与达菲对兔', '毛绒玩偶', '/uploads/dolls/stella_02.jpg', '上海迪士尼代购', '和达菲一起收的，姐妹双兔', 328.00, 0, '2026-09-26 10:15:00'),
(5, 5, '青花系列星黛露', '毛绒玩偶', '/uploads/dolls/stella_03.jpg', '上海迪士尼旗舰店', '青花瓷配色，典雅高级款', 268.00, 0, '2026-09-27 15:40:00'),
(5, 5, '春日花朵星黛露', '毛绒玩偶', '/uploads/dolls/stella_04.jpg', '上海迪士尼旗舰店', '春日系列，手里捧着花，元气满满', 199.00, 0, '2026-09-28 12:00:00'),
(5, 5, '迷你挂件星黛露', '毛绒玩偶', '/uploads/dolls/stella_05.jpg', '上海迪士尼旗舰店', '挂包上的小宝贝，天天带出门', 59.00, 0, '2026-09-29 18:20:00');

-- 4. 动态（新用户各一条，带图）
INSERT INTO `dynamic` (`user_id`, `content`, `images`, `doll_id`, `created_at`) VALUES
(4, 'Hello Kitty 家族集合啦！每一只都是心头好 🎀', '/uploads/dolls/kitty_01.jpg', 16, '2026-10-01 10:00:00'),
(5, '星黛露宝贝们，紫色是世界上最温柔的颜色 💜', '/uploads/dolls/stella_01.jpg', 22, '2026-10-02 19:30:00');

-- 5. 评论（动态7、8）
INSERT INTO `comment` (`dynamic_id`, `user_id`, `content`, `created_at`) VALUES
(7, 2, 'Kitty 好可爱！想rua', '2026-10-01 10:20:00'),
(7, 3, '三丽鸥yyds，都是限定啊', '2026-10-01 11:05:00'),
(8, 2, '露露好乖～紫色真的温柔', '2026-10-02 19:50:00'),
(8, 3, '紫色控狂喜！青花那只好高级', '2026-10-02 20:30:00');

-- 6. 点赞
INSERT INTO `favorite` (`dynamic_id`, `user_id`, `created_at`) VALUES
(7, 2, '2026-10-01 10:15:00'),
(7, 3, '2026-10-01 11:00:00'),
(8, 2, '2026-10-02 19:45:00'),
(8, 3, '2026-10-02 20:10:00');

-- 7. 关注
INSERT IGNORE INTO `follow` (`follower_id`, `followed_id`, `created_at`) VALUES
(4, 2, '2026-10-01 10:30:00'),
(2, 4, '2026-10-01 10:31:00'),
(5, 3, '2026-10-02 20:00:00');
