-- ============================================================
-- 修复：动态补图片 + 修正娃娃关联 + 补评论
-- ============================================================

-- 1. 动态补图片字段（images 用对应娃娃的图片）
UPDATE `dynamic` SET `images` = '/uploads/dolls/melody_01.jpg' WHERE `id` = 3;
UPDATE `dynamic` SET `images` = '/uploads/dolls/melody_02.jpg' WHERE `id` = 4;

-- 2. 修正错误的娃娃关联（此前 5、6 关联错了）
UPDATE `dynamic` SET `doll_id` = 11, `images` = '/uploads/dolls/shinchan_02.jpg' WHERE `id` = 5;
UPDATE `dynamic` SET `doll_id` = 13, `images` = '/uploads/dolls/shinchan_04.jpg' WHERE `id` = 6;

-- 3. 补充评论（每条动态都有互动）
INSERT INTO `comment` (`dynamic_id`, `user_id`, `content`) VALUES
(3, 3, '同款我也有，握爪！'),
(4, 3, '求链接！草莓蝴蝶结太可爱了'),
(5, 2, '睡衣款可爱晕了，头上还有绒球'),
(5, 2, '哈哈这睡帽也太还原了吧'),
(6, 2, '可动关节摆姿太帅了，C位实至名归');
